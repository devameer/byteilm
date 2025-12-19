<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SubscriptionApiController extends Controller
{
    /**
     * Get user's current active subscription.
     * 
     * GET /api/user/subscription
     */
    public function current(): JsonResponse
    {
        $user = Auth::user();

        $subscription = $user->subscription()
            ->with('plan')
            ->first();

        if (!$subscription) {
            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'No active subscription',
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $subscription->id,
                'plan' => [
                    'id' => $subscription->plan->id,
                    'name' => $subscription->plan->name,
                    'display_name' => $subscription->plan->display_name,
                    'price' => $subscription->plan->price,
                    'currency' => $subscription->plan->currency,
                    'billing_period' => $subscription->plan->billing_period,
                    'features' => $subscription->plan->features,
                    'limits' => $subscription->plan->limits,
                ],
                'status' => $subscription->status,
                'starts_at' => $subscription->starts_at?->toIso8601String(),
                'ends_at' => $subscription->ends_at?->toIso8601String(),
                'trial_ends_at' => $subscription->trial_ends_at?->toIso8601String(),
                'canceled_at' => $subscription->canceled_at?->toIso8601String(),
                'is_on_trial' => $subscription->status === 'trialing',
                'is_canceled' => $subscription->status === 'canceled',
                'is_active' => in_array($subscription->status, ['active', 'trialing']),
                'days_remaining' => $subscription->ends_at
                    ? max(0, now()->diffInDays($subscription->ends_at, false))
                    : null,
            ],
        ]);
    }

    /**
     * Get user's subscription history.
     * 
     * GET /api/user/subscription/history
     */
    public function history(): JsonResponse
    {
        $user = Auth::user();

        $subscriptions = Subscription::where('user_id', $user->id)
            ->with('plan')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($subscription) {
                return [
                    'id' => $subscription->id,
                    'plan' => [
                        'id' => $subscription->plan->id,
                        'name' => $subscription->plan->name,
                        'display_name' => $subscription->plan->display_name,
                    ],
                    'status' => $subscription->status,
                    'starts_at' => $subscription->starts_at?->toIso8601String(),
                    'ends_at' => $subscription->ends_at?->toIso8601String(),
                    'canceled_at' => $subscription->canceled_at?->toIso8601String(),
                    'created_at' => $subscription->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $subscriptions,
        ]);
    }

    /**
     * Get user's payment history.
     * 
     * GET /api/user/payments
     */
    public function payments(): JsonResponse
    {
        $user = Auth::user();

        $payments = Payment::where('user_id', $user->id)
            ->with('subscription.plan')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                    'status' => $payment->status,
                    'payment_method' => $payment->payment_method,
                    'payment_gateway' => $payment->payment_gateway,
                    'transaction_id' => $payment->transaction_id,
                    'plan' => $payment->subscription?->plan ? [
                        'name' => $payment->subscription->plan->display_name ?? $payment->subscription->plan->name,
                    ] : null,
                    'created_at' => $payment->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    /**
     * Cancel the current subscription.
     * 
     * POST /api/user/subscription/cancel
     */
    public function cancel(Request $request): JsonResponse
    {
        $user = Auth::user();

        $subscription = $user->subscription()->first();

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'No active subscription to cancel',
            ], 404);
        }

        if ($subscription->status === 'canceled') {
            return response()->json([
                'success' => false,
                'message' => 'Subscription is already canceled',
            ], 400);
        }

        // Cancel the subscription
        $subscription->update([
            'status' => 'canceled',
            'canceled_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subscription canceled successfully. You will retain access until ' .
                ($subscription->ends_at ? $subscription->ends_at->format('M d, Y') : 'the end of your billing period'),
            'data' => [
                'ends_at' => $subscription->ends_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Resume a canceled subscription.
     * 
     * POST /api/user/subscription/resume
     */
    public function resume(): JsonResponse
    {
        $user = Auth::user();

        $subscription = Subscription::where('user_id', $user->id)
            ->where('status', 'canceled')
            ->whereNotNull('ends_at')
            ->where('ends_at', '>', now())
            ->first();

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'No canceled subscription available to resume',
            ], 404);
        }

        // Resume the subscription
        $subscription->update([
            'status' => 'active',
            'canceled_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subscription resumed successfully',
            'data' => [
                'subscription_id' => $subscription->id,
                'status' => 'active',
            ],
        ]);
    }
}
