<?php

namespace App\Services\Analytics;

use App\Models\Lesson;
use App\Models\Payment;
use App\Models\Project;
use App\Models\Prompt;
use App\Models\Subscription;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

class PlatformAnalytics
{
    public function summarySnapshot(): array
    {
        $now = Carbon::now();
        $thirtyDaysAgo = $now->copy()->subDays(30);
        $previousWindowStart = $thirtyDaysAgo->copy()->subDays(30);

        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $activeSubscriptions = Subscription::whereIn('status', ['active', 'trialing'])->count();
        $completedLessons = Lesson::where('completed', true)->count();
        $completedTasks = Task::where('status', 'completed')->count();

        $newUsersCurrent = User::whereBetween('created_at', [$thirtyDaysAgo, $now])->count();
        $newUsersPrevious = User::whereBetween('created_at', [$previousWindowStart, $thirtyDaysAgo])->count();

        $activeSubscriptionsCurrent = Subscription::whereIn('status', ['active', 'trialing'])
            ->whereBetween('starts_at', [$thirtyDaysAgo, $now])
            ->count();

        $activeSubscriptionsPrevious = Subscription::whereIn('status', ['active', 'trialing'])
            ->whereBetween('starts_at', [$previousWindowStart, $thirtyDaysAgo])
            ->count();

        $totalLessons = Lesson::count();
        $totalTasks = Task::count();

        return [
            [
                'label' => __('إجمالي المستخدمين'),
                'value' => $totalUsers,
                'delta' => $this->percentageDelta($newUsersCurrent, $newUsersPrevious),
            ],
            [
                'label' => __('المستخدمون النشطون'),
                'value' => $activeUsers,
                'delta' => $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 2) : 0,
            ],
            [
                'label' => __('اشتراكات فعّالة'),
                'value' => $activeSubscriptions,
                'delta' => $this->percentageDelta($activeSubscriptionsCurrent, $activeSubscriptionsPrevious),
            ],
            [
                'label' => __('دروس مكتملة'),
                'value' => $completedLessons,
                'delta' => $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 2) : 0,
            ],
            [
                'label' => __('مهام منجزة'),
                'value' => $completedTasks,
                'delta' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 2) : 0,
            ],
        ];
    }

    public function monthlyNewUsers(int $months = 6): Collection
    {
        $startPeriod = Carbon::now()->startOfMonth()->subMonths($months - 1);

        return User::query()
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as period')
            ->selectRaw('COUNT(*) as total')
            ->where('created_at', '>=', $startPeriod)
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(function ($row) {
                $label = Carbon::createFromFormat('Y-m', $row->period)->translatedFormat('M Y');

                return [
                    'label' => $label,
                    'value' => (int) $row->total,
                ];
            });
    }

    public function revenueTrend(int $months = 6): Collection
    {
        $startPeriod = Carbon::now()->startOfMonth()->subMonths($months - 1);

        return Payment::query()
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as period')
            ->selectRaw('SUM(amount) as revenue')
            ->where('status', 'completed')
            ->where('created_at', '>=', $startPeriod)
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(function ($row) {
                $label = Carbon::createFromFormat('Y-m', $row->period)->translatedFormat('M Y');

                return [
                    'label' => $label,
                    'value' => (float) $row->revenue,
                ];
            });
    }

    public function conversionFunnel(Carbon $from, Carbon $to): array
    {
        $signups = User::whereBetween('created_at', [$from, $to])->count();

        $trialStarts = Subscription::query()
            ->whereBetween('starts_at', [$from, $to])
            ->where(function ($query) {
                $query->where('status', 'trialing')
                    ->orWhereNotNull('trial_ends_at');
            })
            ->count();

        $paidConversions = Payment::query()
            ->where('status', 'completed')
            ->whereBetween('created_at', [$from, $to])
            ->distinct('user_id')
            ->count('user_id');

        return [
            [
                'label' => __('التسجيلات الجديدة'),
                'value' => $signups,
                'rate' => 100,
            ],
            [
                'label' => __('بدء الفترة التجريبية'),
                'value' => $trialStarts,
                'rate' => $signups > 0 ? round(($trialStarts / $signups) * 100, 2) : 0,
            ],
            [
                'label' => __('تحويلات مدفوعة'),
                'value' => $paidConversions,
                'rate' => $trialStarts > 0 ? round(($paidConversions / max($trialStarts, 1)) * 100, 2) : 0,
            ],
        ];
    }

    public function churnMetrics(): array
    {
        $now = Carbon::now();
        $window = $now->copy()->subDays(30);

        $recentCancellations = Subscription::query()
            ->where('status', 'canceled')
            ->whereBetween('updated_at', [$window, $now])
            ->count();

        $activeLastMonth = Subscription::query()
            ->whereIn('status', ['active', 'trialing'])
            ->whereBetween('starts_at', [
                $now->copy()->subMonths(1)->startOfMonth(),
                $now->copy()->subMonths(1)->endOfMonth(),
            ])
            ->count();

        $activeThisMonth = Subscription::query()
            ->whereIn('status', ['active', 'trialing'])
            ->whereBetween('starts_at', [
                $now->copy()->startOfMonth(),
                $now->copy()->endOfMonth(),
            ])
            ->count();

        $retentionRate = $activeLastMonth > 0
            ? round(($activeThisMonth / $activeLastMonth) * 100, 2)
            : 0;

        return [
            'recent_cancellations' => $recentCancellations,
            'retention_rate' => $retentionRate,
        ];
    }

    public function engagementBreakdown(): array
    {
        $totalLessons = Lesson::count();
        $completedLessons = Lesson::where('completed', true)->count();
        $totalTasks = Task::count();
        $completedTasks = Task::where('status', 'completed')->count();
        $activeUsers = max(User::where('is_active', true)->count(), 1);

        $averagePromptUsage = round(Prompt::count() / $activeUsers, 2);
        $averageProjects = round(Project::count() / $activeUsers, 2);

        return [
            [
                'label' => __('معدل إكمال الدروس'),
                'value' => $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 2) : 0,
                'suffix' => '%',
            ],
            [
                'label' => __('معدل إنجاز المهام'),
                'value' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 2) : 0,
                'suffix' => '%',
            ],
            [
                'label' => __('متوسط الطلبات الذكية لكل مستخدم نشط'),
                'value' => $averagePromptUsage,
            ],
            [
                'label' => __('متوسط المشاريع لكل مستخدم نشط'),
                'value' => $averageProjects,
            ],
        ];
    }

    public function dailyActiveUsers(int $days = 14): array
    {
        $period = CarbonPeriod::create(
            Carbon::now()->subDays($days - 1)->startOfDay(),
            Carbon::now()->endOfDay()
        );

        $usage = User::query()
            ->selectRaw('DATE(last_login_at) as activity_date')
            ->selectRaw('COUNT(*) as total')
            ->whereNotNull('last_login_at')
            ->whereBetween('last_login_at', [$period->getStartDate(), $period->getEndDate()])
            ->groupBy('activity_date')
            ->pluck('total', 'activity_date');

        return collect($period)->map(function (Carbon $date) use ($usage) {
            $key = $date->toDateString();

            return [
                'label' => $date->translatedFormat('d M'),
                'value' => (int) ($usage[$key] ?? 0),
            ];
        })->values()->all();
    }

    public function cohortRetention(int $months = 6): array
    {
        $startPeriod = Carbon::now()->startOfMonth()->subMonths($months - 1);

        $cohortTotals = User::query()
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as cohort_key')
            ->selectRaw('COUNT(*) as total')
            ->where('created_at', '>=', $startPeriod)
            ->groupBy('cohort_key')
            ->orderBy('cohort_key')
            ->pluck('total', 'cohort_key');

        if ($cohortTotals->isEmpty()) {
            return [];
        }

        $retained = Subscription::query()
            ->join('users', 'subscriptions.user_id', '=', 'users.id')
            ->where('users.created_at', '>=', $startPeriod)
            ->whereIn('subscriptions.status', ['active', 'trialing'])
            ->selectRaw('DATE_FORMAT(users.created_at, "%Y-%m") as cohort_key')
            ->selectRaw('COUNT(DISTINCT subscriptions.user_id) as retained')
            ->groupBy('cohort_key')
            ->orderBy('cohort_key')
            ->pluck('retained', 'cohort_key');

        return $cohortTotals->map(function (int $total, string $key) use ($retained) {
            $retainedCount = (int) ($retained[$key] ?? 0);
            $cohortLabel = Carbon::createFromFormat('Y-m', $key)->translatedFormat('M Y');

            return [
                'label' => $cohortLabel,
                'total' => $total,
                'retained' => $retainedCount,
                'retention_rate' => $total > 0 ? round(($retainedCount / $total) * 100, 2) : 0,
            ];
        })->values()->all();
    }

    public function exportReport(Carbon $from, Carbon $to): array
    {
        return [
            'generated_at' => Carbon::now()->toDateTimeString(),
            'range' => [$from->toDateString(), $to->toDateString()],
            'summary' => $this->summarySnapshot(),
            'conversion_funnel' => $this->conversionFunnel($from, $to),
            'engagement' => $this->engagementBreakdown(),
            'cohorts' => $this->cohortRetention(),
            'daily_active_users' => $this->dailyActiveUsers(),
            'revenue_trend' => $this->revenueTrend(),
            'new_users' => $this->monthlyNewUsers(),
            'churn' => $this->churnMetrics(),
        ];
    }

    protected function percentageDelta(int|float $current, int|float $previous): float
    {
        if ($previous === 0) {
            return $current > 0 ? 100 : 0;
        }

        return round((($current - $previous) / $previous) * 100, 2);
    }
}
