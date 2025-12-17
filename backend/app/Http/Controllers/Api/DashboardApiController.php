<?php

namespace App\Http\Controllers\Api;

use App\Events\UserUsageShouldUpdate;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Project;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardApiController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $user = auth()->user();

        if ($user) {
            event(new UserUsageShouldUpdate($user->id));
        }

        $coursesBase = Course::query();
        $lessonsBase = Lesson::query();
        $projectsBase = Project::query();
        $tasksBase = Task::query();

        $restrictToUser = $user && (!$user->isAdmin());

        if ($restrictToUser) {
            $coursesBase->where('user_id', $user->id);
            $lessonsBase->where('user_id', $user->id);
            $projectsBase->where('user_id', $user->id);
            $tasksBase->where('user_id', $user->id);
        }

        $totalCourses = (clone $coursesBase)->count();
        $completedCourses = (clone $coursesBase)->where('completed', true)->count();
        $inProgressCourses = (clone $coursesBase)
            ->where('completed', false)
            ->whereHas('lessons', fn($query) => $query->where('completed', true))
            ->count();
        $notStartedCourses = max($totalCourses - $completedCourses - $inProgressCourses, 0);

        $totalLessons = (clone $lessonsBase)->count();
        $lessonsCompletedBase = (clone $lessonsBase)->where('completed', true);
        $completedLessons = (clone $lessonsCompletedBase)->count();
        $pendingLessons = max($totalLessons - $completedLessons, 0);
        $overallProgress = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 2) : 0;

        $totalTimeSpent = (clone $lessonsCompletedBase)
            ->get()
            ->sum(function ($lesson) {
                preg_match('/(\d+)/', $lesson->duration ?? '0', $matches);
                return isset($matches[1]) ? (int) $matches[1] : 0;
            });

        $topCourses = (clone $coursesBase)
            ->withCount([
                'lessons as total_lessons',
                'lessons as completed_lessons' => fn($query) => $query->where('completed', true),
            ])
            ->get()
            ->map(function ($course) {
                $course->progress = $course->total_lessons > 0
                    ? round(($course->completed_lessons / $course->total_lessons) * 100, 2)
                    : 0;
                return $course;
            })
            ->sortByDesc('progress')
            ->take(5)
            ->values()
            ->map(fn($course) => [
                'id' => $course->id,
                'name' => $course->name,
                'progress' => $course->progress,
            ]);

        $dailyCompletions = (clone $lessonsCompletedBase)
            ->where('completed_at', '>=', Carbon::now()->subDays(7))
            ->selectRaw('DATE(completed_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $last7Days = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $count = $dailyCompletions[$date]->count ?? 0;
            $last7Days->push([
                'label' => Carbon::parse($date)->format('M d'),
                'count' => (int) $count,
            ]);
        }

        $weeklyCompletions = (clone $lessonsCompletedBase)
            ->where('completed_at', '>=', Carbon::now()->subWeeks(4))
            ->selectRaw('YEARWEEK(completed_at) as week, COUNT(*) as count')
            ->groupBy('week')
            ->orderBy('week')
            ->get()
            ->keyBy('week');

        $last4Weeks = collect();
        for ($i = 3; $i >= 0; $i--) {
            $weekStart = Carbon::now()->subWeeks($i)->startOfWeek();
            $weekNumber = $weekStart->format('oW');
            $count = $weeklyCompletions[$weekNumber]->count ?? 0;
            $last4Weeks->push([
                'label' => 'أسبوع ' . (4 - $i),
                'count' => (int) $count,
            ]);
        }

        $upcomingLessons = (clone $lessonsBase)->with('course')
            ->whereNotNull('scheduled_date')
            ->where('scheduled_date', '>=', Carbon::today())
            ->where('completed', false)
            ->orderBy('scheduled_date')
            ->take(5)
            ->get()
            ->map(fn($lesson) => [
                'id' => $lesson->id,
                'name' => $lesson->name,
                'scheduled_date' => optional($lesson->scheduled_date)->format('Y-m-d'),
                'scheduled_date_human' => optional($lesson->scheduled_date)->format('M d'),
                'course' => $lesson->course ? [
                    'id' => $lesson->course->id,
                    'name' => $lesson->course->name,
                ] : null,
            ]);

        $totalTasks = (clone $tasksBase)->count();
        $totalLessonsInTasks = (clone $tasksBase)->lessons()->count();
        $totalRegularTasks = (clone $tasksBase)->regularTasks()->count();
        $completedTasks = (clone $tasksBase)->where('status', 'completed')->count();
        $pendingTasks = (clone $tasksBase)->where('status', 'pending')->count();
        $inProgressTasks = (clone $tasksBase)->where('status', 'in_progress')->count();
        $overdueTasks = (clone $tasksBase)->overdue()->count();
        $todayTasks = (clone $tasksBase)->whereDate('scheduled_date', Carbon::today())
            ->where('status', '!=', 'completed')
            ->count();

        $totalProjects = (clone $projectsBase)->count();
        $activeProjects = (clone $projectsBase)->where('status', 'active')->count();
        $userStreak = $user?->streak;
        $badges = $user ? $user->badges()->orderByDesc('earned_at')->get()->map(fn($badge) => [
            'id' => $badge->id,
            'name' => $badge->badge_name,
            'description' => $badge->badge_description,
            'icon' => $badge->badge_icon,
            'earned_at' => $badge->earned_at?->toDateTimeString(),
            'earned_at_human' => $badge->earned_at?->format('M d'),
        ]) : collect();

        $last30DaysStreak = collect();
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $hasActivity = (clone $lessonsCompletedBase)
                ->whereDate('completed_at', $date)
                ->exists();

            $last30DaysStreak->push([
                'label' => $date->format('M d'),
                'active' => $hasActivity ? 1 : 0,
            ]);
        }

        $usagePayload = null;

        if ($user) {
            $usageRecord = $user->getOrCreateUsage()->fresh();

            $subscription = $user->subscriptions()
                ->whereIn('status', ['active', 'trialing'])
                ->latest()
                ->first();

            $plan = $subscription?->plan;
            $limits = $plan?->limits ?? [];

            $projectsLimit = $limits['max_projects'] ?? -1;
            $coursesLimit = $limits['max_courses'] ?? -1;
            $lessonsLimit = $limits['max_lessons'] ?? -1;
            $storageLimitMb = $limits['max_storage_mb']
                ?? (($limits['max_storage_gb'] ?? null) !== null ? $limits['max_storage_gb'] * 1024 : -1);
            $aiRequestLimit = $limits['max_ai_requests_per_month']
                ?? $limits['max_ai_requests_monthly']
                ?? -1;

            $usagePayload = [
                'projects' => [
                    'used' => $usageRecord->projects_count,
                    'limit' => $projectsLimit,
                ],
                'courses' => [
                    'used' => $usageRecord->courses_count,
                    'limit' => $coursesLimit,
                ],
                'lessons' => [
                    'used' => $usageRecord->lessons_count,
                    'limit' => $lessonsLimit,
                ],
                'storage' => [
                    'used_mb' => $usageRecord->storage_used_mb,
                    'limit_mb' => $storageLimitMb,
                ],
                'ai_requests' => [
                    'used' => $usageRecord->ai_requests_this_month,
                    'limit' => $aiRequestLimit,
                ],
                'plan' => $plan ? [
                    'id' => $plan->id,
                    'name' => $plan->display_name ?? $plan->name,
                ] : null,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'courses' => [
                        'total' => $totalCourses,
                        'completed' => $completedCourses,
                        'in_progress' => $inProgressCourses,
                        'not_started' => $notStartedCourses,
                    ],
                    'lessons' => [
                        'total' => $totalLessons,
                        'completed' => $completedLessons,
                        'pending' => $pendingLessons,
                        'overall_progress' => $overallProgress,
                    ],
                    'time_spent_hours' => $totalTimeSpent,
                    'tasks' => [
                        'total' => $totalTasks,
                        'lessons' => $totalLessonsInTasks,
                        'regular' => $totalRegularTasks,
                        'completed' => $completedTasks,
                        'pending' => $pendingTasks,
                        'in_progress' => $inProgressTasks,
                        'overdue' => $overdueTasks,
                        'today' => $todayTasks,
                    ],
                    'projects' => [
                        'total' => $totalProjects,
                        'active' => $activeProjects,
                    ],
                ],
                'streak' => [
                    'user' => $userStreak ? [
                        'current' => $userStreak->current_streak,
                        'longest' => $userStreak->longest_streak,
                        'total_days_active' => $userStreak->total_days_active,
                    ] : null,
                    'at_risk' => $userStreak ? $userStreak->isAtRisk() : false,
                    'broken' => $userStreak ? $userStreak->isBroken() : false,
                ],
                'top_courses' => $topCourses,
                'upcoming_lessons' => $upcomingLessons,
                'charts' => [
                    'daily' => $last7Days,
                    'weekly' => $last4Weeks,
                    'streak' => $last30DaysStreak,
                ],
                'badges' => $badges,
                'usage' => $usagePayload,
            ],
        ]);
    }
}
