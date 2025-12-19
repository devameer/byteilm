<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UsageController extends Controller
{
    /**
     * Get comprehensive usage statistics for the authenticated user
     * GET /api/usage/dashboard
     */
    public function dashboard(Request $request)
    {
        $user = Auth::user();
        $usage = $user->usage ?: $user->getOrCreateUsage();

        // Reset if needed before collecting stats
        $usage->resetIfNeeded();

        // Get active subscription
        $subscription = $user->subscriptions()
            ->where('status', 'active')
            ->with('plan')
            ->latest()
            ->first();

        if (!$subscription || !$subscription->plan) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد اشتراك نشط',
                'error' => 'no_active_subscription'
            ], 403);
        }

        $plan = $subscription->plan;
        $limits = $plan->limits ?? [];

        // Build comprehensive dashboard data
        $dashboard = [
            'subscription' => [
                'plan_name' => $plan->display_name ?? $plan->name,
                'plan_price' => $plan->price,
                'billing_period' => $plan->billing_period,
                'status' => $subscription->status,
                'starts_at' => $subscription->starts_at,
                'ends_at' => $subscription->ends_at,
            ],

            'usage' => [
                // Basic Resources
                'projects' => [
                    'current' => $usage->projects_count,
                    'limit' => $limits['max_projects'] ?? -1,
                    'percentage' => $this->calculatePercentage($usage->projects_count, $limits['max_projects'] ?? -1),
                    'label' => 'المشاريع',
                    'is_unlimited' => ($limits['max_projects'] ?? -1) === -1,
                ],
                'courses' => [
                    'current' => $usage->courses_count,
                    'limit' => $limits['max_courses'] ?? -1,
                    'percentage' => $this->calculatePercentage($usage->courses_count, $limits['max_courses'] ?? -1),
                    'label' => 'الدورات',
                    'is_unlimited' => ($limits['max_courses'] ?? -1) === -1,
                ],
                'storage' => [
                    'current' => $usage->storage_used_mb,
                    'limit' => $limits['max_storage_mb'] ?? -1,
                    'percentage' => $this->calculatePercentage($usage->storage_used_mb, $limits['max_storage_mb'] ?? -1),
                    'label' => 'التخزين (MB)',
                    'formatted_current' => $this->formatBytes($usage->storage_used_mb * 1024 * 1024),
                    'formatted_limit' => ($limits['max_storage_mb'] ?? -1) === -1 ? 'غير محدود' : $this->formatBytes(($limits['max_storage_mb'] ?? 0) * 1024 * 1024),
                    'is_unlimited' => ($limits['max_storage_mb'] ?? -1) === -1,
                ],

                // AI Operations (This Month)
                'ai_requests' => [
                    'current' => $usage->ai_requests_this_month,
                    'limit' => $limits['max_ai_requests_per_month'] ?? -1,
                    'percentage' => $this->calculatePercentage($usage->ai_requests_this_month, $limits['max_ai_requests_per_month'] ?? -1),
                    'label' => 'طلبات الذكاء الاصطناعي (هذا الشهر)',
                    'total_all_time' => $usage->total_ai_requests,
                    'is_unlimited' => ($limits['max_ai_requests_per_month'] ?? -1) === -1,
                ],
                'quiz_generations' => [
                    'current' => $usage->quiz_generations_this_month,
                    'limit' => $limits['max_quiz_generations_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1,
                    'percentage' => $this->calculatePercentage($usage->quiz_generations_this_month, $limits['max_quiz_generations_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1),
                    'label' => 'إنشاء اختبارات (هذا الشهر)',
                    'total_all_time' => $usage->total_quiz_generations,
                    'is_unlimited' => ($limits['max_quiz_generations_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1) === -1,
                ],
                'video_transcriptions' => [
                    'current' => $usage->video_transcriptions_this_month,
                    'limit' => $limits['max_video_transcriptions_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1,
                    'percentage' => $this->calculatePercentage($usage->video_transcriptions_this_month, $limits['max_video_transcriptions_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1),
                    'label' => 'تحويل فيديو لنص (هذا الشهر)',
                    'total_all_time' => $usage->total_transcriptions,
                    'is_unlimited' => ($limits['max_video_transcriptions_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1) === -1,
                ],
                'video_analyses' => [
                    'current' => $usage->video_analyses_this_month,
                    'limit' => $limits['max_video_analyses_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1,
                    'percentage' => $this->calculatePercentage($usage->video_analyses_this_month, $limits['max_video_analyses_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1),
                    'label' => 'تحليل فيديو (هذا الشهر)',
                    'is_unlimited' => ($limits['max_video_analyses_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1) === -1,
                ],
                'ai_chat_messages' => [
                    'current' => $usage->ai_chat_messages_this_month,
                    'limit' => $limits['max_ai_chat_messages_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1,
                    'percentage' => $this->calculatePercentage($usage->ai_chat_messages_this_month, $limits['max_ai_chat_messages_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1),
                    'label' => 'رسائل الذكاء الاصطناعي (هذا الشهر)',
                    'is_unlimited' => ($limits['max_ai_chat_messages_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1) === -1,
                ],
                'text_translations' => [
                    'current' => $usage->text_translations_this_month,
                    'limit' => $limits['max_text_translations_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1,
                    'percentage' => $this->calculatePercentage($usage->text_translations_this_month, $limits['max_text_translations_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1),
                    'label' => 'ترجمة نصوص (هذا الشهر)',
                    'is_unlimited' => ($limits['max_text_translations_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1) === -1,
                ],
                'text_summarizations' => [
                    'current' => $usage->text_summarizations_this_month,
                    'limit' => $limits['max_text_summarizations_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1,
                    'percentage' => $this->calculatePercentage($usage->text_summarizations_this_month, $limits['max_text_summarizations_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1),
                    'label' => 'تلخيص نصوص (هذا الشهر)',
                    'is_unlimited' => ($limits['max_text_summarizations_per_month'] ?? $limits['max_ai_requests_per_month'] ?? -1) === -1,
                ],
                'videos_uploaded' => [
                    'current' => $usage->videos_uploaded_this_month,
                    'limit' => $limits['max_videos_per_month'] ?? -1,
                    'percentage' => $this->calculatePercentage($usage->videos_uploaded_this_month, $limits['max_videos_per_month'] ?? -1),
                    'label' => 'رفع فيديوهات (هذا الشهر)',
                    'total_all_time' => $usage->total_videos,
                    'is_unlimited' => ($limits['max_videos_per_month'] ?? -1) === -1,
                ],
            ],

            'external_apis' => [
                'gemini' => [
                    'current' => $usage->gemini_api_calls_this_month,
                    'label' => 'Gemini API Calls (هذا الشهر)',
                ],
                'assemblyai' => [
                    'current' => $usage->assemblyai_requests_this_month,
                    'label' => 'AssemblyAI Requests (هذا الشهر)',
                    'available' => $limits['can_use_assemblyai'] ?? false,
                ],
            ],

            'reset_info' => [
                'last_reset' => $usage->last_reset_at,
                'next_reset' => $usage->last_reset_at?->addMonth(),
                'days_until_reset' => $usage->last_reset_at ? now()->diffInDays($usage->last_reset_at->addMonth(), false) : null,
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $dashboard
        ]);
    }

    /**
     * Get simple usage summary
     * GET /api/usage/summary
     */
    public function summary(Request $request)
    {
        $user = Auth::user();
        $usage = $user->usage ?: $user->getOrCreateUsage();
        $usage->resetIfNeeded();

        $subscription = $user->subscriptions()
            ->where('status', 'active')
            ->with('plan')
            ->latest()
            ->first();

        if (!$subscription || !$subscription->plan) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد اشتراك نشط'
            ], 403);
        }

        $limits = $subscription->plan->limits ?? [];

        return response()->json([
            'success' => true,
            'data' => [
                'plan_name' => $subscription->plan->display_name ?? $subscription->plan->name,
                'ai_requests' => [
                    'current' => $usage->ai_requests_this_month,
                    'limit' => $limits['max_ai_requests_per_month'] ?? -1,
                ],
                'storage' => [
                    'current_mb' => $usage->storage_used_mb,
                    'limit_mb' => $limits['max_storage_mb'] ?? -1,
                ],
                'projects' => [
                    'current' => $usage->projects_count,
                    'limit' => $limits['max_projects'] ?? -1,
                ],
                'courses' => [
                    'current' => $usage->courses_count,
                    'limit' => $limits['max_courses'] ?? -1,
                ],
            ]
        ]);
    }

    /**
     * Calculate usage percentage
     */
    private function calculatePercentage($current, $limit): float
    {
        if ($limit === -1) {
            return 0; // Unlimited
        }

        if ($limit === 0) {
            return 100; // No limit means 100% used
        }

        return round(($current / $limit) * 100, 2);
    }

    /**
     * Format bytes to human-readable format
     */
    private function formatBytes($bytes, $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
