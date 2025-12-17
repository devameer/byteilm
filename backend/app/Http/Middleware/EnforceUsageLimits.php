<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceUsageLimits
{
    /**
     * Handle an incoming request to enforce plan usage limits.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $resource  The resource type to check (projects, courses, storage, ai_requests)
     */
    public function handle(Request $request, Closure $next, string $resource): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        // Get user's active subscription
        $subscription = $user->subscriptions()
            ->where('status', 'active')
            ->latest()
            ->first();

        if (!$subscription || !$subscription->plan) {
            return response()->json([
                'error' => 'No active subscription found',
                'message' => 'يرجى الاشتراك في إحدى الخطط للمتابعة'
            ], 403);
        }

        $plan = $subscription->plan;
        $limits = $plan->limits ?? [];
        $usage = $user->usage ?: $user->getOrCreateUsage();

        // Check specific resource limits
        switch ($resource) {
            case 'projects':
                $limit = $limits['max_projects'] ?? -1;
                $current = $usage?->projects_count ?? 0;
                break;

            case 'courses':
                $limit = $limits['max_courses'] ?? -1;
                $current = $usage?->courses_count ?? 0;
                break;

            case 'storage':
                $limitInGb = $limits['max_storage_gb'] ?? null;
                $limit = $limits['max_storage_mb'] ?? ($limitInGb !== null ? $limitInGb * 1024 : -1);
                $current = $usage?->storage_used_mb ?? 0;
                break;

            case 'ai_requests':
                $limit = $limits['max_ai_requests_per_month'] ?? $limits['max_ai_requests_monthly'] ?? -1;
                $current = $usage?->ai_requests_this_month ?? 0;
                break;

            default:
                return $next($request);
        }

        // -1 means unlimited
        if ($limit === -1) {
            return $next($request);
        }

        // Check if limit is reached
        if ($current >= $limit) {
            return response()->json([
                'error' => 'Usage limit reached',
                'message' => $this->getLimitMessage($resource, $limit),
                'resource' => $resource,
                'current' => $current,
                'limit' => $limit,
                'percentage' => round(($current / $limit) * 100, 1),
                'upgrade_url' => route('plans.index'),
                'can_upgrade' => true,
                'plan_name' => $plan->display_name ?? $plan->name
            ], 403);
        }

        return $next($request);
    }

    /**
     * Get localized limit message
     */
    private function getLimitMessage(string $resource, int $limit): string
    {
        $messages = [
            'projects' => "لقد وصلت إلى الحد الأقصى للمشاريع ({$limit}). قم بالترقية لإنشاء المزيد.",
            'courses' => "لقد وصلت إلى الحد الأقصى للدورات ({$limit}). قم بالترقية لإنشاء المزيد.",
            'storage' => "لقد وصلت إلى الحد الأقصى للتخزين ({$limit} ميجابايت). قم بالترقية للحصول على مساحة أكبر.",
            'ai_requests' => "لقد وصلت إلى الحد الأقصى لطلبات الذكاء الاصطناعي ({$limit}) هذا الشهر. قم بالترقية للمزيد.",
        ];

        return $messages[$resource] ?? 'Usage limit reached. Please upgrade your plan.';
    }
}
