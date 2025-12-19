<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanApiController extends Controller
{
    /**
     * Display a listing of active plans (public endpoint)
     * GET /api/plans
     */
    public function index()
    {
        $plans = Plan::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('price')
            ->get()
            ->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'display_name' => $plan->display_name,
                    'description' => $plan->description,
                    'price' => $plan->price,
                    'currency' => $plan->currency,
                    'billing_period' => $plan->billing_period,
                    'features' => $plan->features ?? [],
                    'limits' => [
                        // Basic resources
                        'max_projects' => $plan->limits['max_projects'] ?? -1,
                        'max_courses' => $plan->limits['max_courses'] ?? -1,
                        'max_storage_gb' => $plan->limits['max_storage_gb'] ?? -1,

                        // AI features
                        'max_ai_requests_per_month' => $plan->limits['max_ai_requests_per_month'] ?? -1,
                        'max_quiz_generations_per_month' => $plan->limits['max_quiz_generations_per_month'] ?? -1,
                        'max_video_transcriptions_per_month' => $plan->limits['max_video_transcriptions_per_month'] ?? -1,
                        'max_video_analyses_per_month' => $plan->limits['max_video_analyses_per_month'] ?? -1,
                        'max_ai_chat_messages_per_month' => $plan->limits['max_ai_chat_messages_per_month'] ?? -1,
                        'max_text_translations_per_month' => $plan->limits['max_text_translations_per_month'] ?? -1,
                        'max_text_summarizations_per_month' => $plan->limits['max_text_summarizations_per_month'] ?? -1,
                        'max_videos_per_month' => $plan->limits['max_videos_per_month'] ?? -1,

                        // External APIs
                        'can_use_assemblyai' => $plan->limits['can_use_assemblyai'] ?? false,
                        'can_use_google_calendar' => $plan->limits['can_use_google_calendar'] ?? false,
                    ],
                    'is_popular' => $plan->name === 'pro', // Mark Pro plan as popular
                    'sort_order' => $plan->sort_order,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $plans
        ]);
    }

    /**
     * Display the specified plan
     * GET /api/plans/{id}
     */
    public function show($id)
    {
        $plan = Plan::query()
            ->where('is_active', true)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $plan->id,
                'name' => $plan->name,
                'display_name' => $plan->display_name,
                'description' => $plan->description,
                'price' => $plan->price,
                'currency' => $plan->currency,
                'billing_period' => $plan->billing_period,
                'features' => $plan->features ?? [],
                'limits' => $plan->limits ?? [],
                'is_popular' => $plan->name === 'pro',
            ]
        ]);
    }

    /**
     * Get plans comparison data
     * GET /api/plans/compare
     */
    public function compare()
    {
        $plans = Plan::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('price')
            ->get();

        // Extract all unique features across all plans
        $allFeatures = collect();
        foreach ($plans as $plan) {
            if ($plan->features) {
                $allFeatures = $allFeatures->merge($plan->features);
            }
        }
        $allFeatures = $allFeatures->unique()->values();

        // Build comparison matrix
        $comparison = [
            'features' => $allFeatures,
            'plans' => $plans->map(function ($plan) use ($allFeatures) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'display_name' => $plan->display_name,
                    'price' => $plan->price,
                    'currency' => $plan->currency,
                    'billing_period' => $plan->billing_period,
                    'feature_availability' => $allFeatures->map(function ($feature) use ($plan) {
                        return in_array($feature, $plan->features ?? []);
                    }),
                    'is_popular' => $plan->name === 'pro',
                ];
            })
        ];

        return response()->json([
            'success' => true,
            'data' => $comparison
        ]);
    }
}
