<?php

namespace App\Services;

use App\Models\User;
use App\Models\Task;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProductivityReportService
{
    protected $cacheService;

    public function __construct(CacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * Generate Personal Productivity Report
     */
    public function generatePersonalProductivityReport(User $user, $startDate, $endDate)
    {
        $cacheKey = "productivity_report:{$user->id}:{$startDate}:{$endDate}";

        return $this->cacheService->remember($cacheKey, CacheService::CACHE_MEDIUM, function () use ($user, $startDate, $endDate) {
            // Get all tasks in date range
            $tasks = Task::where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('assigned_to', $user->id);
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

            $completedTasks = $tasks->where('status', 'completed');
            $overdueTasks = $tasks->where('status', '!=', 'completed')
                                  ->where('due_date', '<', now());

            return [
                'summary' => [
                    'total_tasks' => $tasks->count(),
                    'completed_tasks' => $completedTasks->count(),
                    'in_progress_tasks' => $tasks->where('status', 'in_progress')->count(),
                    'pending_tasks' => $tasks->where('status', 'pending')->count(),
                    'overdue_tasks' => $overdueTasks->count(),
                    'completion_rate' => $tasks->count() > 0
                        ? round(($completedTasks->count() / $tasks->count()) * 100, 2)
                        : 0,
                    'average_completion_time' => $this->calculateAverageCompletionTime($completedTasks),
                    'period' => [
                        'start' => $startDate,
                        'end' => $endDate,
                        'days' => Carbon::parse($startDate)->diffInDays($endDate) + 1
                    ]
                ],
                'daily_breakdown' => $this->getDailyBreakdown($user, $startDate, $endDate),
                'priority_distribution' => $this->getPriorityDistribution($tasks),
                'productivity_trend' => $this->getProductivityTrend($user, $startDate, $endDate),
                'achievements' => $this->getAchievements($user, $startDate, $endDate),
                'most_productive_days' => $this->getMostProductiveDays($user, $startDate, $endDate),
                'performance_score' => $this->calculatePerformanceScore($tasks, $completedTasks, $overdueTasks)
            ];
        });
    }

    /**
     * Calculate average time to complete tasks
     */
    protected function calculateAverageCompletionTime($completedTasks)
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

        $averageMinutes = $totalTime / $count;

        return [
            'minutes' => round($averageMinutes),
            'hours' => round($averageMinutes / 60, 2),
            'days' => round($averageMinutes / 1440, 2),
            'formatted' => $this->formatMinutes($averageMinutes)
        ];
    }

    /**
     * Get daily breakdown of tasks
     */
    protected function getDailyBreakdown(User $user, $startDate, $endDate)
    {
        $breakdown = DB::table('tasks')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as total'),
                DB::raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completed'),
                DB::raw('COUNT(CASE WHEN status = "in_progress" THEN 1 END) as in_progress'),
                DB::raw('COUNT(CASE WHEN status = "pending" THEN 1 END) as pending')
            )
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('assigned_to', $user->id);
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                $item->completion_rate = $item->total > 0
                    ? round(($item->completed / $item->total) * 100, 2)
                    : 0;
                return $item;
            });

        return $breakdown;
    }

    /**
     * Get priority distribution
     */
    protected function getPriorityDistribution($tasks)
    {
        $distribution = [
            'high' => $tasks->where('priority', 'high')->count(),
            'medium' => $tasks->where('priority', 'medium')->count(),
            'low' => $tasks->where('priority', 'low')->count(),
        ];

        $total = array_sum($distribution);

        return [
            'counts' => $distribution,
            'percentages' => [
                'high' => $total > 0 ? round(($distribution['high'] / $total) * 100, 2) : 0,
                'medium' => $total > 0 ? round(($distribution['medium'] / $total) * 100, 2) : 0,
                'low' => $total > 0 ? round(($distribution['low'] / $total) * 100, 2) : 0,
            ]
        ];
    }

    /**
     * Get productivity trend (weekly)
     */
    protected function getProductivityTrend(User $user, $startDate, $endDate)
    {
        $trend = DB::table('tasks')
            ->select(
                DB::raw('YEARWEEK(created_at) as week'),
                DB::raw('COUNT(*) as total_tasks'),
                DB::raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completed_tasks')
            )
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('assigned_to', $user->id);
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('YEARWEEK(created_at)'))
            ->orderBy('week')
            ->get()
            ->map(function ($item) {
                $item->completion_rate = $item->total_tasks > 0
                    ? round(($item->completed_tasks / $item->total_tasks) * 100, 2)
                    : 0;
                return $item;
            });

        return $trend;
    }

    /**
     * Get achievements and milestones
     */
    protected function getAchievements(User $user, $startDate, $endDate)
    {
        $achievements = [];

        $completedTasks = Task::where(function ($query) use ($user) {
            $query->where('user_id', $user->id)
                  ->orWhere('assigned_to', $user->id);
        })
        ->where('status', 'completed')
        ->whereBetween('completed_at', [$startDate, $endDate])
        ->count();

        // Task milestones
        if ($completedTasks >= 100) {
            $achievements[] = [
                'type' => 'milestone',
                'title' => 'Century Maker',
                'description' => 'أكملت 100+ مهمة',
                'icon' => '🏆',
                'unlocked_at' => now()
            ];
        } elseif ($completedTasks >= 50) {
            $achievements[] = [
                'type' => 'milestone',
                'title' => 'Half Century',
                'description' => 'أكملت 50+ مهمة',
                'icon' => '🎯',
                'unlocked_at' => now()
            ];
        } elseif ($completedTasks >= 10) {
            $achievements[] = [
                'type' => 'milestone',
                'title' => 'Getting Started',
                'description' => 'أكملت 10+ مهام',
                'icon' => '⭐',
                'unlocked_at' => now()
            ];
        }

        // Streak achievement
        $streak = $this->calculateStreak($user);
        if ($streak >= 30) {
            $achievements[] = [
                'type' => 'streak',
                'title' => 'Monthly Streak',
                'description' => 'حافظت على نشاطك لمدة 30 يوم متواصل',
                'icon' => '🔥',
                'streak_days' => $streak
            ];
        } elseif ($streak >= 7) {
            $achievements[] = [
                'type' => 'streak',
                'title' => 'Weekly Streak',
                'description' => 'حافظت على نشاطك لمدة أسبوع',
                'icon' => '⚡',
                'streak_days' => $streak
            ];
        }

        // Completion rate achievement
        $completionRate = $this->getCompletionRate($user, $startDate, $endDate);
        if ($completionRate >= 90) {
            $achievements[] = [
                'type' => 'performance',
                'title' => 'Perfectionist',
                'description' => 'معدل إنجاز 90%+',
                'icon' => '💎',
                'completion_rate' => $completionRate
            ];
        } elseif ($completionRate >= 75) {
            $achievements[] = [
                'type' => 'performance',
                'title' => 'High Achiever',
                'description' => 'معدل إنجاز 75%+',
                'icon' => '🌟',
                'completion_rate' => $completionRate
            ];
        }

        return $achievements;
    }

    /**
     * Get most productive days
     */
    protected function getMostProductiveDays(User $user, $startDate, $endDate)
    {
        return DB::table('tasks')
            ->select(
                DB::raw('DATE(completed_at) as date'),
                DB::raw('DAYNAME(completed_at) as day_name'),
                DB::raw('COUNT(*) as tasks_completed')
            )
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('assigned_to', $user->id);
            })
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(completed_at)'), DB::raw('DAYNAME(completed_at)'))
            ->orderBy('tasks_completed', 'desc')
            ->limit(5)
            ->get();
    }

    /**
     * Calculate performance score (0-100)
     */
    protected function calculatePerformanceScore($allTasks, $completedTasks, $overdueTasks)
    {
        if ($allTasks->isEmpty()) {
            return 0;
        }

        $score = 0;

        // Completion rate (50 points)
        $completionRate = ($completedTasks->count() / $allTasks->count());
        $score += $completionRate * 50;

        // On-time completion (30 points)
        $onTimeRate = $completedTasks->count() > 0
            ? ($completedTasks->count() - $overdueTasks->count()) / $completedTasks->count()
            : 0;
        $score += max(0, $onTimeRate) * 30;

        // Task quantity (20 points)
        $taskScore = min(20, ($allTasks->count() / 10) * 20);
        $score += $taskScore;

        return round(min(100, max(0, $score)), 2);
    }

    /**
     * Calculate current streak
     */
    protected function calculateStreak(User $user)
    {
        $streak = 0;
        $currentDate = now();

        while (true) {
            $hasActivity = Task::where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('assigned_to', $user->id);
            })
            ->whereDate('completed_at', $currentDate)
            ->exists();

            if (!$hasActivity) {
                break;
            }

            $streak++;
            $currentDate = $currentDate->subDay();

            // Limit to 365 days
            if ($streak >= 365) {
                break;
            }
        }

        return $streak;
    }

    /**
     * Get completion rate for period
     */
    protected function getCompletionRate(User $user, $startDate, $endDate)
    {
        $tasks = Task::where(function ($query) use ($user) {
            $query->where('user_id', $user->id)
                  ->orWhere('assigned_to', $user->id);
        })
        ->whereBetween('created_at', [$startDate, $endDate])
        ->get();

        if ($tasks->isEmpty()) {
            return 0;
        }

        $completed = $tasks->where('status', 'completed')->count();
        return round(($completed / $tasks->count()) * 100, 2);
    }

    /**
     * Format minutes to human readable
     */
    protected function formatMinutes($minutes)
    {
        if ($minutes < 60) {
            return round($minutes) . ' دقيقة';
        } elseif ($minutes < 1440) {
            $hours = floor($minutes / 60);
            $mins = $minutes % 60;
            return $hours . ' ساعة و ' . round($mins) . ' دقيقة';
        } else {
            $days = floor($minutes / 1440);
            $hours = floor(($minutes % 1440) / 60);
            return $days . ' يوم و ' . $hours . ' ساعة';
        }
    }

    /**
     * Export report to PDF
     */
    public function exportToPDF($reportData, $user)
    {
        $pdf = \PDF::loadView('reports.productivity-pdf', [
            'report' => $reportData,
            'user' => $user,
            'generated_at' => now()
        ]);

        return $pdf->download('productivity-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Export report to Excel
     */
    public function exportToExcel($reportData, $user)
    {
        return \Excel::download(
            new \App\Exports\ProductivityReportExport($reportData, $user),
            'productivity-report-' . now()->format('Y-m-d') . '.xlsx'
        );
    }
}
