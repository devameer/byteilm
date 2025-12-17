<?php

namespace App\Services;

use App\Models\Goal;
use App\Models\User;
use App\Models\Team;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GoalService
{
    protected $cacheService;

    public function __construct(CacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * Create a new goal
     */
    public function createGoal(User $user, array $data)
    {
        $goal = Goal::create([
            'user_id' => $user->id,
            'team_id' => $data['team_id'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'] ?? 'personal',
            'category' => $data['category'] ?? 'custom',
            'metric_type' => $data['metric_type'],
            'target_value' => $data['target_value'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'reward_points' => $data['reward_points'] ?? 0,
            'reward_badge' => $data['reward_badge'] ?? null,
            'reward_description' => $data['reward_description'] ?? null,
            'reminders_enabled' => $data['reminders_enabled'] ?? true,
            'reminder_frequency' => $data['reminder_frequency'] ?? 'weekly',
            'milestones' => $data['milestones'] ?? [25, 50, 75, 100],
            'visibility' => $data['visibility'] ?? 'private'
        ]);

        // Add collaborators if team goal
        if ($goal->type === 'team' && isset($data['collaborators'])) {
            foreach ($data['collaborators'] as $collaboratorId) {
                $goal->collaborators()->create([
                    'user_id' => $collaboratorId,
                    'contribution' => 0
                ]);
            }
        }

        return $goal->load(['user', 'team', 'collaborators.user']);
    }

    /**
     * Update goal
     */
    public function updateGoal(Goal $goal, array $data)
    {
        $goal->update($data);

        // Update collaborators if provided
        if (isset($data['collaborators'])) {
            $goal->collaborators()->delete();

            foreach ($data['collaborators'] as $collaboratorId) {
                $goal->collaborators()->create([
                    'user_id' => $collaboratorId,
                    'contribution' => 0
                ]);
            }
        }

        return $goal->load(['user', 'team', 'collaborators.user']);
    }

    /**
     * Delete goal
     */
    public function deleteGoal(Goal $goal)
    {
        return $goal->delete();
    }

    /**
     * Get user goals
     */
    public function getUserGoals(User $user, array $filters = [])
    {
        $query = Goal::forUser($user->id)
            ->with(['user', 'team', 'collaborators.user', 'progress']);

        // Apply filters
        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get team goals
     */
    public function getTeamGoals(Team $team)
    {
        return Goal::where('team_id', $team->id)
            ->with(['user', 'team', 'collaborators.user', 'progress'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Update goal progress
     */
    public function updateProgress(Goal $goal, int $value, string $note = null)
    {
        $goal->updateProgress($value, $note);

        // Check and award rewards if completed
        if ($goal->status === 'completed') {
            $goal->awardRewards();
        }

        return $goal->fresh(['progress', 'user']);
    }

    /**
     * Increment goal progress
     */
    public function incrementProgress(Goal $goal, int $amount = 1, string $note = null)
    {
        $goal->incrementProgress($amount, $note);

        // Check and award rewards if completed
        if ($goal->status === 'completed') {
            $goal->awardRewards();
        }

        return $goal->fresh(['progress', 'user']);
    }

    /**
     * Get goal statistics
     */
    public function getGoalStatistics(User $user)
    {
        $cacheKey = "goal_stats:{$user->id}";

        return $this->cacheService->remember($cacheKey, CacheService::CACHE_MEDIUM, function () use ($user) {
            $goals = Goal::forUser($user->id)->get();

            return [
                'total_goals' => $goals->count(),
                'active_goals' => $goals->where('status', 'active')->count(),
                'completed_goals' => $goals->where('status', 'completed')->count(),
                'failed_goals' => $goals->where('status', 'failed')->count(),
                'completion_rate' => $goals->count() > 0
                    ? round(($goals->where('status', 'completed')->count() / $goals->count()) * 100, 2)
                    : 0,
                'average_progress' => $goals->where('status', 'active')->avg('progress_percentage') ?? 0,
                'overdue_goals' => $goals->filter(fn($g) => $g->is_overdue)->count(),
                'on_track_goals' => $goals->filter(fn($g) => $g->isOnTrack() && $g->status === 'active')->count(),
                'total_points_earned' => $goals->where('status', 'completed')->sum('reward_points'),
                'by_category' => $this->getGoalsByCategory($goals),
                'by_type' => [
                    'personal' => $goals->where('type', 'personal')->count(),
                    'team' => $goals->where('type', 'team')->count()
                ],
                'upcoming_deadlines' => $this->getUpcomingDeadlines($goals)
            ];
        });
    }

    /**
     * Get goals by category
     */
    protected function getGoalsByCategory($goals)
    {
        return [
            'tasks' => $goals->where('category', 'tasks')->count(),
            'projects' => $goals->where('category', 'projects')->count(),
            'courses' => $goals->where('category', 'courses')->count(),
            'learning' => $goals->where('category', 'learning')->count(),
            'productivity' => $goals->where('category', 'productivity')->count(),
            'custom' => $goals->where('category', 'custom')->count()
        ];
    }

    /**
     * Get upcoming deadlines
     */
    protected function getUpcomingDeadlines($goals)
    {
        return $goals->where('status', 'active')
            ->sortBy(fn($g) => Carbon::parse($g->end_date))
            ->take(5)
            ->map(function ($goal) {
                return [
                    'id' => $goal->id,
                    'title' => $goal->title,
                    'end_date' => $goal->end_date,
                    'days_remaining' => $goal->days_remaining,
                    'progress_percentage' => $goal->progress_percentage
                ];
            })
            ->values();
    }

    /**
     * Send reminders for goals that need it
     */
    public function sendReminders()
    {
        $goals = Goal::active()
            ->where('reminders_enabled', true)
            ->get();

        $sent = 0;

        foreach ($goals as $goal) {
            if ($goal->sendReminder()) {
                $sent++;
            }
        }

        return $sent;
    }

    /**
     * Auto-update goals based on user activity
     */
    public function autoUpdateGoalsForUser(User $user, string $metricType, int $value)
    {
        $goals = Goal::forUser($user->id)
            ->active()
            ->where('metric_type', $metricType)
            ->get();

        foreach ($goals as $goal) {
            $this->incrementProgress($goal, $value, 'Auto-updated from user activity');
        }

        return $goals->count();
    }

    /**
     * Get suggested goals for user
     */
    public function getSuggestedGoals(User $user)
    {
        $suggestions = [];

        // Suggest based on user activity
        $tasksCount = $user->tasks()->count();
        $coursesCount = $user->courseEnrollments()->count();
        $projectsCount = $user->projects()->count();

        // Suggest tasks goal
        if ($tasksCount > 0) {
            $suggestions[] = [
                'title' => 'أكمل 50 مهمة',
                'category' => 'tasks',
                'metric_type' => 'tasks_completed',
                'target_value' => 50,
                'description' => 'تحدى نفسك لإكمال 50 مهمة هذا الشهر',
                'reward_points' => 500,
                'reward_badge' => 'Task Master'
            ];
        }

        // Suggest learning goal
        if ($coursesCount > 0) {
            $suggestions[] = [
                'title' => 'أكمل 3 دورات تعليمية',
                'category' => 'learning',
                'metric_type' => 'courses_completed',
                'target_value' => 3,
                'description' => 'واصل رحلة التعلم',
                'reward_points' => 1000,
                'reward_badge' => 'Lifelong Learner'
            ];
        }

        // Suggest productivity goal
        $suggestions[] = [
            'title' => 'حافظ على streak لمدة 30 يوم',
            'category' => 'productivity',
            'metric_type' => 'daily_streak',
            'target_value' => 30,
            'description' => 'كن منتجاً كل يوم لمدة شهر',
            'reward_points' => 1500,
            'reward_badge' => '30 Day Streak'
        ];

        return $suggestions;
    }

    /**
     * Get leaderboard
     */
    public function getLeaderboard($type = 'all', $limit = 10)
    {
        $query = DB::table('goals')
            ->select(
                'user_id',
                DB::raw('COUNT(*) as total_goals'),
                DB::raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completed_goals'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN reward_points ELSE 0 END) as total_points')
            )
            ->groupBy('user_id');

        if ($type !== 'all') {
            $query->where('type', $type);
        }

        $leaderboard = $query->orderBy('total_points', 'desc')
            ->limit($limit)
            ->get();

        // Load user details
        $userIds = $leaderboard->pluck('user_id')->toArray();
        $users = User::whereIn('id', $userIds)->get()->keyBy('id');

        return $leaderboard->map(function ($item) use ($users) {
            $user = $users[$item->user_id] ?? null;

            return [
                'user_id' => $item->user_id,
                'name' => $user->name ?? 'Unknown',
                'avatar' => $user->avatar ?? null,
                'total_goals' => $item->total_goals,
                'completed_goals' => $item->completed_goals,
                'completion_rate' => $item->total_goals > 0
                    ? round(($item->completed_goals / $item->total_goals) * 100, 2)
                    : 0,
                'total_points' => $item->total_points
            ];
        });
    }

    /**
     * Mark goal as failed if overdue
     */
    public function markOverdueGoalsAsFailed()
    {
        $goals = Goal::overdue()->get();

        foreach ($goals as $goal) {
            $goal->update(['status' => 'failed']);
        }

        return $goals->count();
    }
}
