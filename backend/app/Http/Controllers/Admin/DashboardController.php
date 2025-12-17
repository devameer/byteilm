<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonVideo;
use App\Models\Payment;
use App\Models\Project;
use App\Models\Subscription;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $totalUsers = User::count();
        $activeUsersToday = User::whereDate('last_login_at', Carbon::today())->count();
        $newUsersThisMonth = User::where('created_at', '>=', Carbon::now()->startOfMonth())->count();

        $completedPayments = Payment::query()->where('status', 'completed');
        $totalRevenue = (clone $completedPayments)->sum('amount');
        $monthlyRevenue = (clone $completedPayments)
            ->whereBetween('created_at', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])
            ->sum('amount');

        $activeSubscriptions = Subscription::whereIn('status', ['active', 'trialing'])->count();
        $trialUsers = Subscription::where('status', 'trialing')->count();

        $conversionRate = $totalUsers > 0
            ? round(($activeSubscriptions / $totalUsers) * 100, 2)
            : 0;

        $recentCancellations = Subscription::where('status', 'canceled')
            ->where('updated_at', '>=', Carbon::now()->subDays(30))
            ->count();

        $churnRate = $activeSubscriptions > 0
            ? round(($recentCancellations / $activeSubscriptions) * 100, 2)
            : 0;

        $mrr = Subscription::with('plan')
            ->whereIn('status', ['active', 'trialing'])
            ->get()
            ->sum(function ($subscription) {
                if (!$subscription->plan) {
                    return 0;
                }

                return match ($subscription->plan->billing_period) {
                    'monthly' => $subscription->plan->price,
                    'yearly' => $subscription->plan->price / 12,
                    'lifetime' => 0,
                    default => 0,
                };
            });

        $dailyActiveUsers = User::where('last_login_at', '>=', Carbon::now()->startOfDay())->count();
        $weeklyActiveUsers = User::where('last_login_at', '>=', Carbon::now()->subDays(7))->count();
        $monthlyActiveUsers = User::where('last_login_at', '>=', Carbon::now()->subDays(30))->count();

        $engagement = [
            'daily_active_users' => $dailyActiveUsers,
            'weekly_active_users' => $weeklyActiveUsers,
            'monthly_active_users' => $monthlyActiveUsers,
            'avg_session_duration' => __('غير متوفر'),
        ];

        $contentStats = [
            'total_courses' => Course::withoutGlobalScope('user')->count(),
            'total_lessons' => Lesson::withoutGlobalScope('user')->count(),
            'total_videos' => LessonVideo::withoutGlobalScope('user')->count(),
            'total_projects' => Project::withoutGlobalScope('user')->count(),
            'storage_used_gb' => round(LessonVideo::withoutGlobalScope('user')->sum('file_size') / pow(1024, 3), 2),
        ];

        $mostActiveUsers = Task::withoutGlobalScope('user')
            ->select('user_id', DB::raw('count(*) as tasks_count'))
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->orderByDesc('tasks_count')
            ->with('user')
            ->limit(5)
            ->get();

        $topContentCreators = Course::withoutGlobalScope('user')
            ->select('user_id', DB::raw('count(*) as courses_count'))
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->orderByDesc('courses_count')
            ->with('user')
            ->limit(5)
            ->get();

        $newestUsers = User::latest()->limit(5)->get();

        $metrics = [
            'total_users' => $totalUsers,
            'active_users_today' => $activeUsersToday,
            'new_users_this_month' => $newUsersThisMonth,
            'total_revenue' => $totalRevenue,
            'monthly_revenue' => $monthlyRevenue,
            'mrr' => round($mrr, 2),
            'active_subscriptions' => $activeSubscriptions,
            'trial_users' => $trialUsers,
            'conversion_rate' => $conversionRate,
            'churn_rate' => $churnRate,
        ];

        $months = collect(range(0, 5))
            ->map(fn($offset) => Carbon::now()->subMonths($offset)->startOfMonth())
            ->reverse()
            ->values();

        $growthChart = [
            'labels' => $months->map(fn(Carbon $date) => $date->format('M Y')),
            'data' => $months->map(function (Carbon $date) {
                return User::whereBetween('created_at', [$date, (clone $date)->endOfMonth()])->count();
            }),
        ];

        $revenueChart = [
            'labels' => $months->map(fn(Carbon $date) => $date->format('M Y')),
            'data' => $months->map(function (Carbon $date) {
                return Payment::where('status', 'completed')
                    ->whereBetween('created_at', [$date, (clone $date)->endOfMonth()])
                    ->sum('amount');
            }),
        ];

        return view('admin.dashboard.index', [
            'metrics' => $metrics,
            'engagement' => $engagement,
            'contentStats' => $contentStats,
            'growthChart' => $growthChart,
            'revenueChart' => $revenueChart,
            'mostActiveUsers' => $mostActiveUsers,
            'topContentCreators' => $topContentCreators,
            'newestUsers' => $newestUsers,
        ]);
    }
}
