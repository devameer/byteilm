<?php

namespace App\Services;

use App\Models\Team;
use App\Models\Task;
use App\Models\Project;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TeamReportService
{
    protected $cacheService;

    public function __construct(CacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * Generate Team Performance Report
     */
    public function generateTeamPerformanceReport(Team $team, $startDate, $endDate)
    {
        $cacheKey = "team_report:{$team->id}:{$startDate}:{$endDate}";

        return $this->cacheService->remember($cacheKey, CacheService::CACHE_MEDIUM, function () use ($team, $startDate, $endDate) {
            $members = $team->members()->with('user')->get();
            $memberIds = $members->pluck('user_id')->toArray();

            // Get team projects
            $projects = Project::where('team_id', $team->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            // Get team tasks
            $tasks = Task::whereIn('assigned_to', $memberIds)
                ->orWhereIn('user_id', $memberIds)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            $completedTasks = $tasks->where('status', 'completed');

            return [
                'summary' => [
                    'team_name' => $team->name,
                    'total_members' => $members->count(),
                    'active_members' => $this->getActiveMembers($members, $startDate, $endDate)->count(),
                    'total_projects' => $projects->count(),
                    'active_projects' => $projects->where('status', 'in_progress')->count(),
                    'total_tasks' => $tasks->count(),
                    'completed_tasks' => $completedTasks->count(),
                    'completion_rate' => $tasks->count() > 0
                        ? round(($completedTasks->count() / $tasks->count()) * 100, 2)
                        : 0,
                    'period' => [
                        'start' => $startDate,
                        'end' => $endDate
                    ]
                ],
                'member_performance' => $this->getMemberPerformance($members, $startDate, $endDate),
                'project_breakdown' => $this->getProjectBreakdown($projects),
                'collaboration_metrics' => $this->getCollaborationMetrics($team, $startDate, $endDate),
                'workload_distribution' => $this->getWorkloadDistribution($members, $tasks),
                'top_performers' => $this->getTopPerformers($members, $startDate, $endDate),
                'team_velocity' => $this->getTeamVelocity($team, $startDate, $endDate)
            ];
        });
    }

    /**
     * Get active members (who completed at least one task)
     */
    protected function getActiveMembers($members, $startDate, $endDate)
    {
        return $members->filter(function ($member) use ($startDate, $endDate) {
            return Task::where(function ($query) use ($member) {
                $query->where('user_id', $member->user_id)
                      ->orWhere('assigned_to', $member->user_id);
            })
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->exists();
        });
    }

    /**
     * Get performance metrics for each member
     */
    protected function getMemberPerformance($members, $startDate, $endDate)
    {
        return $members->map(function ($member) use ($startDate, $endDate) {
            $tasks = Task::where(function ($query) use ($member) {
                $query->where('user_id', $member->user_id)
                      ->orWhere('assigned_to', $member->user_id);
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

            $completedTasks = $tasks->where('status', 'completed');
            $overdueTasks = $tasks->where('status', '!=', 'completed')
                                  ->where('due_date', '<', now());

            $completionRate = $tasks->count() > 0
                ? round(($completedTasks->count() / $tasks->count()) * 100, 2)
                : 0;

            return [
                'user_id' => $member->user_id,
                'name' => $member->user->name,
                'email' => $member->user->email,
                'avatar' => $member->user->avatar,
                'role' => $member->role,
                'metrics' => [
                    'total_tasks' => $tasks->count(),
                    'completed_tasks' => $completedTasks->count(),
                    'in_progress_tasks' => $tasks->where('status', 'in_progress')->count(),
                    'pending_tasks' => $tasks->where('status', 'pending')->count(),
                    'overdue_tasks' => $overdueTasks->count(),
                    'completion_rate' => $completionRate,
                    'average_completion_time' => $this->calculateAvgCompletionTime($completedTasks),
                ],
                'performance_score' => $this->calculateMemberScore($tasks, $completedTasks, $overdueTasks),
                'status' => $this->getMemberStatus($completionRate, $overdueTasks->count())
            ];
        })->sortByDesc('performance_score')->values();
    }

    /**
     * Get project breakdown
     */
    protected function getProjectBreakdown($projects)
    {
        return $projects->map(function ($project) {
            $tasks = Task::where('project_id', $project->id)->get();
            $completedTasks = $tasks->where('status', 'completed');

            return [
                'id' => $project->id,
                'title' => $project->title,
                'status' => $project->status,
                'progress' => $project->progress,
                'total_tasks' => $tasks->count(),
                'completed_tasks' => $completedTasks->count(),
                'completion_rate' => $tasks->count() > 0
                    ? round(($completedTasks->count() / $tasks->count()) * 100, 2)
                    : 0,
                'start_date' => $project->start_date,
                'end_date' => $project->end_date,
                'is_on_track' => $this->isProjectOnTrack($project, $tasks, $completedTasks)
            ];
        });
    }

    /**
     * Get collaboration metrics
     */
    protected function getCollaborationMetrics(Team $team, $startDate, $endDate)
    {
        $members = $team->members;
        $memberIds = $members->pluck('user_id')->toArray();

        // Tasks assigned to others (collaboration indicator)
        $collaborativeTasks = Task::whereIn('user_id', $memberIds)
            ->whereIn('assigned_to', $memberIds)
            ->where('user_id', '!=', DB::raw('assigned_to'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        // Comments on tasks (interaction)
        $taskComments = DB::table('task_comments')
            ->whereIn('user_id', $memberIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        // Shared projects
        $sharedProjects = Project::where('team_id', $team->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        $allTasks = Task::whereIn('assigned_to', $memberIds)
            ->orWhereIn('user_id', $memberIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        return [
            'collaborative_tasks' => $collaborativeTasks,
            'collaboration_rate' => $allTasks > 0
                ? round(($collaborativeTasks / $allTasks) * 100, 2)
                : 0,
            'total_comments' => $taskComments,
            'comments_per_member' => $members->count() > 0
                ? round($taskComments / $members->count(), 2)
                : 0,
            'shared_projects' => $sharedProjects,
            'collaboration_score' => $this->calculateCollaborationScore(
                $collaborativeTasks,
                $taskComments,
                $members->count()
            )
        ];
    }

    /**
     * Get workload distribution
     */
    protected function getWorkloadDistribution($members, $tasks)
    {
        $distribution = $members->map(function ($member) use ($tasks) {
            $memberTasks = $tasks->where('assigned_to', $member->user_id);

            return [
                'user_id' => $member->user_id,
                'name' => $member->user->name,
                'task_count' => $memberTasks->count(),
                'percentage' => $tasks->count() > 0
                    ? round(($memberTasks->count() / $tasks->count()) * 100, 2)
                    : 0
            ];
        })->sortByDesc('task_count')->values();

        // Check if workload is balanced
        $taskCounts = $distribution->pluck('task_count')->filter()->toArray();
        $avgTasks = count($taskCounts) > 0 ? array_sum($taskCounts) / count($taskCounts) : 0;
        $maxDeviation = 0;

        foreach ($taskCounts as $count) {
            $deviation = abs($count - $avgTasks);
            if ($deviation > $maxDeviation) {
                $maxDeviation = $deviation;
            }
        }

        $isBalanced = $avgTasks > 0 ? ($maxDeviation / $avgTasks) < 0.3 : true;

        return [
            'distribution' => $distribution,
            'is_balanced' => $isBalanced,
            'balance_score' => $avgTasks > 0
                ? round((1 - ($maxDeviation / $avgTasks)) * 100, 2)
                : 100,
            'recommendations' => $this->getWorkloadRecommendations($distribution, $isBalanced)
        ];
    }

    /**
     * Get top performers
     */
    protected function getTopPerformers($members, $startDate, $endDate)
    {
        $performance = $this->getMemberPerformance($members, $startDate, $endDate);

        return [
            'top_performer' => $performance->first(),
            'most_tasks_completed' => $performance->sortByDesc('metrics.completed_tasks')->first(),
            'best_completion_rate' => $performance->sortByDesc('metrics.completion_rate')->first(),
            'fastest_average_time' => $performance->sortBy('metrics.average_completion_time.minutes')->first()
        ];
    }

    /**
     * Get team velocity (tasks completed per week)
     */
    protected function getTeamVelocity(Team $team, $startDate, $endDate)
    {
        $memberIds = $team->members->pluck('user_id')->toArray();

        $velocity = DB::table('tasks')
            ->select(
                DB::raw('YEARWEEK(completed_at) as week'),
                DB::raw('COUNT(*) as tasks_completed')
            )
            ->whereIn('assigned_to', $memberIds)
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->groupBy(DB::raw('YEARWEEK(completed_at)'))
            ->orderBy('week')
            ->get();

        $avgVelocity = $velocity->count() > 0
            ? round($velocity->avg('tasks_completed'), 2)
            : 0;

        return [
            'weekly_velocity' => $velocity,
            'average_velocity' => $avgVelocity,
            'trend' => $this->getVelocityTrend($velocity),
            'prediction' => $this->predictNextWeekVelocity($velocity)
        ];
    }

    /**
     * Calculate member performance score
     */
    protected function calculateMemberScore($allTasks, $completedTasks, $overdueTasks)
    {
        if ($allTasks->isEmpty()) {
            return 0;
        }

        $score = 0;

        // Completion rate (60 points)
        $completionRate = ($completedTasks->count() / $allTasks->count());
        $score += $completionRate * 60;

        // On-time delivery (40 points)
        $onTimeRate = $completedTasks->count() > 0
            ? max(0, ($completedTasks->count() - $overdueTasks->count()) / $completedTasks->count())
            : 0;
        $score += $onTimeRate * 40;

        return round(min(100, max(0, $score)), 2);
    }

    /**
     * Calculate average completion time
     */
    protected function calculateAvgCompletionTime($completedTasks)
    {
        if ($completedTasks->isEmpty()) {
            return null;
        }

        $totalTime = 0;
        $count = 0;

        foreach ($completedTasks as $task) {
            if ($task->completed_at && $task->created_at) {
                $totalTime += Carbon::parse($task->created_at)->diffInMinutes($task->completed_at);
                $count++;
            }
        }

        if ($count === 0) {
            return null;
        }

        $avgMinutes = $totalTime / $count;

        return [
            'minutes' => round($avgMinutes),
            'hours' => round($avgMinutes / 60, 2),
            'days' => round($avgMinutes / 1440, 2)
        ];
    }

    /**
     * Get member status based on performance
     */
    protected function getMemberStatus($completionRate, $overdueCount)
    {
        if ($completionRate >= 90 && $overdueCount === 0) {
            return 'excellent';
        } elseif ($completionRate >= 75 && $overdueCount <= 2) {
            return 'good';
        } elseif ($completionRate >= 50) {
            return 'average';
        } else {
            return 'needs_improvement';
        }
    }

    /**
     * Check if project is on track
     */
    protected function isProjectOnTrack($project, $tasks, $completedTasks)
    {
        if (!$project->end_date || $tasks->isEmpty()) {
            return null;
        }

        $today = now();
        $startDate = Carbon::parse($project->start_date ?? $project->created_at);
        $endDate = Carbon::parse($project->end_date);

        $totalDays = $startDate->diffInDays($endDate);
        $elapsedDays = $startDate->diffInDays($today);

        $expectedProgress = $totalDays > 0 ? ($elapsedDays / $totalDays) * 100 : 0;
        $actualProgress = ($completedTasks->count() / $tasks->count()) * 100;

        return $actualProgress >= ($expectedProgress - 10); // 10% tolerance
    }

    /**
     * Calculate collaboration score
     */
    protected function calculateCollaborationScore($collaborativeTasks, $comments, $memberCount)
    {
        $score = 0;

        // Collaborative tasks (50 points)
        $score += min(50, $collaborativeTasks * 2);

        // Comments/interactions (30 points)
        $score += min(30, $comments * 0.5);

        // Team size bonus (20 points)
        $score += min(20, $memberCount * 4);

        return round(min(100, $score), 2);
    }

    /**
     * Get workload recommendations
     */
    protected function getWorkloadRecommendations($distribution, $isBalanced)
    {
        if ($isBalanced) {
            return ['الحمل موزع بشكل جيد بين أعضاء الفريق'];
        }

        $recommendations = [];
        $avgTasks = $distribution->avg('task_count');

        $overloaded = $distribution->filter(function ($member) use ($avgTasks) {
            return $member['task_count'] > ($avgTasks * 1.3);
        });

        $underutilized = $distribution->filter(function ($member) use ($avgTasks) {
            return $member['task_count'] < ($avgTasks * 0.7) && $member['task_count'] > 0;
        });

        if ($overloaded->isNotEmpty()) {
            $recommendations[] = 'يوجد أعضاء محملون بمهام كثيرة: ' . $overloaded->pluck('name')->join(', ');
        }

        if ($underutilized->isNotEmpty()) {
            $recommendations[] = 'يمكن توزيع مهام إضافية على: ' . $underutilized->pluck('name')->join(', ');
        }

        return $recommendations;
    }

    /**
     * Get velocity trend
     */
    protected function getVelocityTrend($velocity)
    {
        if ($velocity->count() < 2) {
            return 'stable';
        }

        $recent = $velocity->slice(-3)->avg('tasks_completed');
        $previous = $velocity->slice(-6, 3)->avg('tasks_completed');

        if ($recent > $previous * 1.1) {
            return 'increasing';
        } elseif ($recent < $previous * 0.9) {
            return 'decreasing';
        } else {
            return 'stable';
        }
    }

    /**
     * Predict next week velocity
     */
    protected function predictNextWeekVelocity($velocity)
    {
        if ($velocity->isEmpty()) {
            return 0;
        }

        // Simple moving average of last 3 weeks
        $recentWeeks = $velocity->slice(-3);
        return round($recentWeeks->avg('tasks_completed'), 2);
    }
}
