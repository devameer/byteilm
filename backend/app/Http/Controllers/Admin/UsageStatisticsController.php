<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserUsage;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UsageStatisticsController extends Controller
{
    /**
     * Display usage statistics dashboard
     */
    public function index(Request $request)
    {
        // Get top users by AI usage
        $topAiUsers = UserUsage::query()
            ->with('user')
            ->orderByDesc('ai_requests_this_month')
            ->limit(10)
            ->get();

        // Get overall statistics
        $totalStats = [
            'total_ai_requests_this_month' => UserUsage::sum('ai_requests_this_month'),
            'total_quiz_generations_this_month' => UserUsage::sum('quiz_generations_this_month'),
            'total_video_transcriptions_this_month' => UserUsage::sum('video_transcriptions_this_month'),
            'total_text_translations_this_month' => UserUsage::sum('text_translations_this_month'),
            'total_storage_used_mb' => UserUsage::sum('storage_used_mb'),
            'total_videos_uploaded_this_month' => UserUsage::sum('videos_uploaded_this_month'),

            // External API usage
            'total_gemini_calls_this_month' => UserUsage::sum('gemini_api_calls_this_month'),
            'total_assemblyai_requests_this_month' => UserUsage::sum('assemblyai_requests_this_month'),
        ];

        // Get usage by plan
        $usageByPlan = Plan::query()
            ->withCount([
                'subscriptions as active_users' => function ($query) {
                    $query->where('status', 'active');
                }
            ])
            ->with(['subscriptions' => function ($query) {
                $query->where('status', 'active')
                    ->with('user.usage');
            }])
            ->get()
            ->map(function ($plan) {
                $activeSubscriptions = $plan->subscriptions->where('status', 'active');

                $totalAiRequests = $activeSubscriptions->sum(function ($sub) {
                    return $sub->user->usage->ai_requests_this_month ?? 0;
                });

                $totalStorage = $activeSubscriptions->sum(function ($sub) {
                    return $sub->user->usage->storage_used_mb ?? 0;
                });

                return [
                    'plan_name' => $plan->display_name ?? $plan->name,
                    'active_users' => $plan->active_users,
                    'total_ai_requests' => $totalAiRequests,
                    'total_storage_mb' => $totalStorage,
                    'avg_ai_requests_per_user' => $plan->active_users > 0 ? round($totalAiRequests / $plan->active_users, 2) : 0,
                ];
            });

        // Get users approaching limits
        $usersNearLimit = User::query()
            ->with(['usage', 'subscriptions' => function ($query) {
                $query->where('status', 'active')->with('plan');
            }])
            ->whereHas('subscriptions', function ($query) {
                $query->where('status', 'active');
            })
            ->get()
            ->filter(function ($user) {
                $subscription = $user->subscriptions->where('status', 'active')->first();
                if (!$subscription || !$subscription->plan) {
                    return false;
                }

                $limits = $subscription->plan->limits ?? [];
                $usage = $user->usage;

                if (!$usage) {
                    return false;
                }

                $aiLimit = $limits['max_ai_requests_per_month'] ?? -1;
                if ($aiLimit !== -1) {
                    $percentage = ($usage->ai_requests_this_month / $aiLimit) * 100;
                    if ($percentage >= 80) {
                        return true;
                    }
                }

                return false;
            })
            ->take(10);

        return view('admin.usage.index', compact(
            'topAiUsers',
            'totalStats',
            'usageByPlan',
            'usersNearLimit'
        ));
    }

    /**
     * Show detailed usage for a specific user
     */
    public function show(User $user)
    {
        $usage = $user->usage ?: $user->getOrCreateUsage();
        $subscription = $user->subscriptions()
            ->where('status', 'active')
            ->with('plan')
            ->first();

        $limits = $subscription?->plan?->limits ?? [];

        return view('admin.usage.show', compact('user', 'usage', 'subscription', 'limits'));
    }
}
