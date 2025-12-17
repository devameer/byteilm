<?php

namespace App\Services;

use App\Models\User;
use App\Models\Task;
use App\Models\Project;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TimeTrackingReportService
{
    protected $cacheService;

    public function __construct(CacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * Generate Time Tracking Report
     */
    public function generateTimeTrackingReport(User $user, $startDate, $endDate)
    {
        $cacheKey = "time_tracking_report:{$user->id}:{$startDate}:{$endDate}";

        return $this->cacheService->remember($cacheKey, CacheService::CACHE_MEDIUM, function () use ($user, $startDate, $endDate) {
            // Get tasks with time tracking
            $tasks = Task::where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('assigned_to', $user->id);
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

            $totalTimeSpent = $this->calculateTotalTime($tasks);
            $totalEstimatedTime = $tasks->sum('estimated_time') ?? 0;

            return [
                'summary' => [
                    'total_time_spent' => [
                        'minutes' => $totalTimeSpent,
                        'hours' => round($totalTimeSpent / 60, 2),
                        'days' => round($totalTimeSpent / 1440, 2),
                        'formatted' => $this->formatMinutes($totalTimeSpent)
                    ],
                    'total_estimated_time' => [
                        'minutes' => $totalEstimatedTime,
                        'hours' => round($totalEstimatedTime / 60, 2),
                        'formatted' => $this->formatMinutes($totalEstimatedTime)
                    ],
                    'accuracy' => $this->calculateAccuracy($totalTimeSpent, $totalEstimatedTime),
                    'average_daily_time' => $this->getAverageDailyTime($totalTimeSpent, $startDate, $endDate),
                    'billable_hours' => $this->getBillableHours($tasks),
                    'period' => [
                        'start' => $startDate,
                        'end' => $endDate,
                        'days' => Carbon::parse($startDate)->diffInDays($endDate) + 1
                    ]
                ],
                'time_by_project' => $this->getTimeByProject($tasks),
                'time_by_task' => $this->getTimeByTask($tasks),
                'time_by_priority' => $this->getTimeByPriority($tasks),
                'daily_breakdown' => $this->getDailyTimeBreakdown($user, $startDate, $endDate),
                'weekly_breakdown' => $this->getWeeklyTimeBreakdown($user, $startDate, $endDate),
                'time_wasters' => $this->identifyTimeWasters($tasks),
                'efficiency_metrics' => $this->getEfficiencyMetrics($tasks),
                'peak_productivity_hours' => $this->getPeakProductivityHours($user, $startDate, $endDate)
            ];
        });
    }

    /**
     * Calculate total time spent on tasks
     */
    protected function calculateTotalTime($tasks)
    {
        $total = 0;

        foreach ($tasks as $task) {
            if ($task->time_spent) {
                $total += $task->time_spent;
            } elseif ($task->completed_at && $task->created_at) {
                // Estimate based on completion time if time_spent is not tracked
                $total += Carbon::parse($task->created_at)->diffInMinutes($task->completed_at);
            }
        }

        return $total;
    }

    /**
     * Calculate estimation accuracy
     */
    protected function calculateAccuracy($actual, $estimated)
    {
        if ($estimated === 0) {
            return null;
        }

        $accuracy = (1 - abs($actual - $estimated) / $estimated) * 100;

        return [
            'percentage' => round(max(0, $accuracy), 2),
            'variance' => round($actual - $estimated),
            'variance_percentage' => round((($actual - $estimated) / $estimated) * 100, 2),
            'status' => $this->getAccuracyStatus($accuracy)
        ];
    }

    /**
     * Get average daily time
     */
    protected function getAverageDailyTime($totalMinutes, $startDate, $endDate)
    {
        $days = Carbon::parse($startDate)->diffInDays($endDate) + 1;
        $avgMinutes = $days > 0 ? $totalMinutes / $days : 0;

        return [
            'minutes' => round($avgMinutes),
            'hours' => round($avgMinutes / 60, 2),
            'formatted' => $this->formatMinutes($avgMinutes)
        ];
    }

    /**
     * Get billable hours
     */
    protected function getBillableHours($tasks)
    {
        // Assuming billable tasks are marked or all tasks are billable
        $billableTasks = $tasks->where('is_billable', true);

        if ($billableTasks->isEmpty()) {
            $billableTasks = $tasks; // Default: all tasks billable
        }

        $billableTime = $this->calculateTotalTime($billableTasks);

        return [
            'minutes' => $billableTime,
            'hours' => round($billableTime / 60, 2),
            'formatted' => $this->formatMinutes($billableTime),
            'percentage' => $tasks->count() > 0
                ? round(($billableTasks->count() / $tasks->count()) * 100, 2)
                : 0
        ];
    }

    /**
     * Get time distribution by project
     */
    protected function getTimeByProject($tasks)
    {
        $projectTime = [];

        foreach ($tasks as $task) {
            if (!$task->project_id) {
                continue;
            }

            if (!isset($projectTime[$task->project_id])) {
                $projectTime[$task->project_id] = [
                    'project_id' => $task->project_id,
                    'project_name' => $task->project->title ?? 'Unknown',
                    'time_spent' => 0,
                    'estimated_time' => 0,
                    'task_count' => 0
                ];
            }

            $timeSpent = $task->time_spent ?? 0;
            if ($timeSpent === 0 && $task->completed_at && $task->created_at) {
                $timeSpent = Carbon::parse($task->created_at)->diffInMinutes($task->completed_at);
            }

            $projectTime[$task->project_id]['time_spent'] += $timeSpent;
            $projectTime[$task->project_id]['estimated_time'] += $task->estimated_time ?? 0;
            $projectTime[$task->project_id]['task_count']++;
        }

        // Calculate percentages and format
        $totalTime = array_sum(array_column($projectTime, 'time_spent'));

        foreach ($projectTime as &$project) {
            $project['percentage'] = $totalTime > 0
                ? round(($project['time_spent'] / $totalTime) * 100, 2)
                : 0;
            $project['time_spent_formatted'] = $this->formatMinutes($project['time_spent']);
            $project['estimated_time_formatted'] = $this->formatMinutes($project['estimated_time']);
            $project['variance'] = $project['time_spent'] - $project['estimated_time'];
        }

        return array_values($projectTime);
    }

    /**
     * Get top time-consuming tasks
     */
    protected function getTimeByTask($tasks)
    {
        return $tasks->map(function ($task) {
            $timeSpent = $task->time_spent ?? 0;

            if ($timeSpent === 0 && $task->completed_at && $task->created_at) {
                $timeSpent = Carbon::parse($task->created_at)->diffInMinutes($task->completed_at);
            }

            return [
                'task_id' => $task->id,
                'title' => $task->title,
                'project' => $task->project->title ?? null,
                'priority' => $task->priority,
                'status' => $task->status,
                'time_spent' => $timeSpent,
                'time_spent_formatted' => $this->formatMinutes($timeSpent),
                'estimated_time' => $task->estimated_time ?? 0,
                'estimated_time_formatted' => $this->formatMinutes($task->estimated_time ?? 0),
                'variance' => $timeSpent - ($task->estimated_time ?? 0),
                'efficiency' => $this->calculateTaskEfficiency($timeSpent, $task->estimated_time ?? 0)
            ];
        })
        ->sortByDesc('time_spent')
        ->take(20)
        ->values();
    }

    /**
     * Get time distribution by priority
     */
    protected function getTimeByPriority($tasks)
    {
        $distribution = [
            'high' => 0,
            'medium' => 0,
            'low' => 0,
        ];

        foreach ($tasks as $task) {
            $timeSpent = $task->time_spent ?? 0;

            if ($timeSpent === 0 && $task->completed_at && $task->created_at) {
                $timeSpent = Carbon::parse($task->created_at)->diffInMinutes($task->completed_at);
            }

            $priority = $task->priority ?? 'medium';
            $distribution[$priority] += $timeSpent;
        }

        $totalTime = array_sum($distribution);

        return [
            'high' => [
                'minutes' => $distribution['high'],
                'hours' => round($distribution['high'] / 60, 2),
                'percentage' => $totalTime > 0
                    ? round(($distribution['high'] / $totalTime) * 100, 2)
                    : 0,
                'formatted' => $this->formatMinutes($distribution['high'])
            ],
            'medium' => [
                'minutes' => $distribution['medium'],
                'hours' => round($distribution['medium'] / 60, 2),
                'percentage' => $totalTime > 0
                    ? round(($distribution['medium'] / $totalTime) * 100, 2)
                    : 0,
                'formatted' => $this->formatMinutes($distribution['medium'])
            ],
            'low' => [
                'minutes' => $distribution['low'],
                'hours' => round($distribution['low'] / 60, 2),
                'percentage' => $totalTime > 0
                    ? round(($distribution['low'] / $totalTime) * 100, 2)
                    : 0,
                'formatted' => $this->formatMinutes($distribution['low'])
            ]
        ];
    }

    /**
     * Get daily time breakdown
     */
    protected function getDailyTimeBreakdown(User $user, $startDate, $endDate)
    {
        $breakdown = [];
        $currentDate = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        while ($currentDate <= $end) {
            $dayTasks = Task::where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('assigned_to', $user->id);
            })
            ->whereDate('completed_at', $currentDate)
            ->get();

            $timeSpent = $this->calculateTotalTime($dayTasks);

            $breakdown[] = [
                'date' => $currentDate->format('Y-m-d'),
                'day_name' => $currentDate->format('l'),
                'time_spent' => $timeSpent,
                'time_spent_formatted' => $this->formatMinutes($timeSpent),
                'hours' => round($timeSpent / 60, 2),
                'tasks_completed' => $dayTasks->where('status', 'completed')->count()
            ];

            $currentDate->addDay();
        }

        return $breakdown;
    }

    /**
     * Get weekly time breakdown
     */
    protected function getWeeklyTimeBreakdown(User $user, $startDate, $endDate)
    {
        return DB::table('tasks')
            ->select(
                DB::raw('YEARWEEK(completed_at) as week'),
                DB::raw('SUM(time_spent) as total_time'),
                DB::raw('COUNT(*) as tasks_completed')
            )
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('assigned_to', $user->id);
            })
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->groupBy(DB::raw('YEARWEEK(completed_at)'))
            ->orderBy('week')
            ->get()
            ->map(function ($item) {
                return [
                    'week' => $item->week,
                    'time_spent' => $item->total_time ?? 0,
                    'time_spent_formatted' => $this->formatMinutes($item->total_time ?? 0),
                    'hours' => round(($item->total_time ?? 0) / 60, 2),
                    'tasks_completed' => $item->tasks_completed,
                    'avg_time_per_task' => $item->tasks_completed > 0
                        ? round(($item->total_time ?? 0) / $item->tasks_completed, 2)
                        : 0
                ];
            });
    }

    /**
     * Identify potential time wasters
     */
    protected function identifyTimeWasters($tasks)
    {
        $wasters = [];

        // Tasks that took much longer than estimated
        $overestimated = $tasks->filter(function ($task) {
            if (!$task->estimated_time || $task->estimated_time === 0) {
                return false;
            }

            $timeSpent = $task->time_spent ?? 0;
            if ($timeSpent === 0 && $task->completed_at && $task->created_at) {
                $timeSpent = Carbon::parse($task->created_at)->diffInMinutes($task->completed_at);
            }

            return $timeSpent > ($task->estimated_time * 2); // Took 2x longer
        });

        if ($overestimated->isNotEmpty()) {
            $wasters[] = [
                'type' => 'overestimated_tasks',
                'count' => $overestimated->count(),
                'description' => 'مهام استغرقت وقتاً أطول من المتوقع بكثير',
                'tasks' => $overestimated->map(function ($task) {
                    $timeSpent = $task->time_spent ?? Carbon::parse($task->created_at)->diffInMinutes($task->completed_at);
                    return [
                        'title' => $task->title,
                        'estimated' => $this->formatMinutes($task->estimated_time),
                        'actual' => $this->formatMinutes($timeSpent),
                        'variance' => $this->formatMinutes($timeSpent - $task->estimated_time)
                    ];
                })->take(5)->values()
            ];
        }

        // Low priority tasks consuming too much time
        $lowPriorityTime = $tasks->where('priority', 'low')->sum('time_spent') ?? 0;
        $totalTime = $this->calculateTotalTime($tasks);

        if ($totalTime > 0 && ($lowPriorityTime / $totalTime) > 0.3) { // More than 30%
            $wasters[] = [
                'type' => 'low_priority_focus',
                'percentage' => round(($lowPriorityTime / $totalTime) * 100, 2),
                'description' => 'قضاء وقت كثير على مهام منخفضة الأولوية',
                'recommendation' => 'ركز أكثر على المهام ذات الأولوية العالية'
            ];
        }

        return $wasters;
    }

    /**
     * Get efficiency metrics
     */
    protected function getEfficiencyMetrics($tasks)
    {
        $completedTasks = $tasks->where('status', 'completed');

        if ($completedTasks->isEmpty()) {
            return [
                'overall_efficiency' => 0,
                'on_time_delivery' => 0,
                'estimation_accuracy' => 0,
                'productivity_score' => 0
            ];
        }

        // Tasks completed within estimated time
        $onTimeTasks = $completedTasks->filter(function ($task) {
            if (!$task->estimated_time || $task->estimated_time === 0) {
                return true; // No estimate = assume on time
            }

            $timeSpent = $task->time_spent ?? 0;
            if ($timeSpent === 0 && $task->completed_at && $task->created_at) {
                $timeSpent = Carbon::parse($task->created_at)->diffInMinutes($task->completed_at);
            }

            return $timeSpent <= ($task->estimated_time * 1.2); // Within 20% margin
        });

        $onTimeRate = round(($onTimeTasks->count() / $completedTasks->count()) * 100, 2);

        // Estimation accuracy
        $tasksWithEstimates = $completedTasks->filter(fn($task) => $task->estimated_time > 0);
        $accuracySum = 0;

        foreach ($tasksWithEstimates as $task) {
            $timeSpent = $task->time_spent ?? Carbon::parse($task->created_at)->diffInMinutes($task->completed_at);
            $accuracy = 1 - abs($timeSpent - $task->estimated_time) / $task->estimated_time;
            $accuracySum += max(0, $accuracy);
        }

        $avgAccuracy = $tasksWithEstimates->count() > 0
            ? round(($accuracySum / $tasksWithEstimates->count()) * 100, 2)
            : 0;

        // Overall efficiency score
        $efficiencyScore = round(($onTimeRate + $avgAccuracy) / 2, 2);

        return [
            'overall_efficiency' => $efficiencyScore,
            'on_time_delivery' => $onTimeRate,
            'estimation_accuracy' => $avgAccuracy,
            'productivity_score' => $this->calculateProductivityScore($tasks, $completedTasks),
            'status' => $this->getEfficiencyStatus($efficiencyScore)
        ];
    }

    /**
     * Get peak productivity hours
     */
    protected function getPeakProductivityHours(User $user, $startDate, $endDate)
    {
        // This would require hourly tracking
        // Simplified version using completion times

        $hourlyDistribution = array_fill(0, 24, 0);

        $tasks = Task::where(function ($query) use ($user) {
            $query->where('user_id', $user->id)
                  ->orWhere('assigned_to', $user->id);
        })
        ->where('status', 'completed')
        ->whereBetween('completed_at', [$startDate, $endDate])
        ->get();

        foreach ($tasks as $task) {
            if ($task->completed_at) {
                $hour = Carbon::parse($task->completed_at)->hour;
                $hourlyDistribution[$hour]++;
            }
        }

        // Find peak hours
        arsort($hourlyDistribution);
        $peakHours = array_slice($hourlyDistribution, 0, 3, true);

        return [
            'hourly_distribution' => $hourlyDistribution,
            'peak_hours' => array_map(function ($hour, $count) {
                return [
                    'hour' => $hour,
                    'time_range' => sprintf('%02d:00 - %02d:00', $hour, ($hour + 1) % 24),
                    'tasks_completed' => $count
                ];
            }, array_keys($peakHours), $peakHours),
            'recommendation' => $this->getPeakHoursRecommendation(array_keys($peakHours))
        ];
    }

    /**
     * Helper functions
     */

    protected function formatMinutes($minutes)
    {
        if ($minutes < 60) {
            return round($minutes) . ' دقيقة';
        } elseif ($minutes < 1440) {
            $hours = floor($minutes / 60);
            $mins = $minutes % 60;
            return $hours . ' ساعة' . ($mins > 0 ? ' و ' . round($mins) . ' دقيقة' : '');
        } else {
            $days = floor($minutes / 1440);
            $hours = floor(($minutes % 1440) / 60);
            return $days . ' يوم' . ($hours > 0 ? ' و ' . $hours . ' ساعة' : '');
        }
    }

    protected function getAccuracyStatus($accuracy)
    {
        if ($accuracy >= 90) return 'excellent';
        if ($accuracy >= 75) return 'good';
        if ($accuracy >= 60) return 'fair';
        return 'needs_improvement';
    }

    protected function calculateTaskEfficiency($actual, $estimated)
    {
        if ($estimated === 0) return null;

        $efficiency = ($estimated / $actual) * 100;
        return round(min(200, max(0, $efficiency)), 2); // Cap at 200%
    }

    protected function calculateProductivityScore($allTasks, $completedTasks)
    {
        if ($allTasks->isEmpty()) return 0;

        $completionRate = ($completedTasks->count() / $allTasks->count()) * 100;
        return round($completionRate, 2);
    }

    protected function getEfficiencyStatus($score)
    {
        if ($score >= 90) return 'excellent';
        if ($score >= 75) return 'good';
        if ($score >= 60) return 'average';
        return 'needs_improvement';
    }

    protected function getPeakHoursRecommendation($peakHours)
    {
        $hours = array_values($peakHours);
        $timeRanges = array_map(function ($h) {
            return sprintf('%02d:00 - %02d:00', $h, ($h + 1) % 24);
        }, $hours);

        return 'أنت أكثر إنتاجية في الساعات: ' . implode(', ', $timeRanges) .
               '. حاول جدولة مهامك الأهم في هذه الأوقات.';
    }
}
