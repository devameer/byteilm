<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Services\Payment\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CheckoutApiController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Get available payment gateways.
     * 
     * GET /api/checkout/gateways
     */
    public function gateways(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->paymentService->getAvailableGateways(),
        ]);
    }

    /**
     * Create a checkout session for a plan.
     * 
     * POST /api/checkout/create-session
     */
    public function createSession(Request $request): JsonResponse
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'gateway' => 'nullable|string|in:stripe,test',
        ]);

        $plan = Plan::findOrFail($request->plan_id);
        $user = Auth::user();

        // Get the requested gateway or default
        $gatewayName = $request->gateway ?? 'stripe';

        try {
            $gateway = $this->paymentService->gateway($gatewayName);

            if (!$gateway->isConfigured()) {
                // Fall back to test gateway if requested gateway is not configured
                $gateway = $this->paymentService->gateway('test');
                $gatewayName = 'test';
            }

            $result = $gateway->createCheckoutSession($plan, $user, [
                'trial_days' => $request->trial_days ?? null,
            ]);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['error'] ?? 'Failed to create checkout session',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);

        } catch (\Exception $e) {
            Log::error('Checkout session creation failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'plan_id' => $plan->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create checkout session',
            ], 500);
        }
    }

    /**
     * Process a payment (for test gateway or inline payments).
     * 
     * POST /api/checkout/process
     */
    public function processPayment(Request $request): JsonResponse
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'gateway' => 'required|string|in:test',
            'card_number' => 'required|string|min:13|max:19',
            'card_expiry' => 'required|string', // MM/YY format
            'card_cvc' => 'required|string|min:3|max:4',
            'session_id' => 'nullable|string',
        ]);

        $user = Auth::user();

        try {
            $gateway = $this->paymentService->gateway($request->gateway);

            $result = $gateway->processPayment([
                'user_id' => $user->id,
                'plan_id' => $request->plan_id,
                'card_number' => $request->card_number,
                'card_expiry' => $request->card_expiry,
                'card_cvc' => $request->card_cvc,
                'session_id' => $request->session_id,
            ]);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['error'] ?? 'Payment failed',
                    'error_code' => $result['error_code'] ?? null,
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => $result['message'] ?? 'Payment successful',
                'data' => [
                    'transaction_id' => $result['transaction_id'],
                    'subscription_id' => $result['subscription_id'],
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Payment processing failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'plan_id' => $request->plan_id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment processing failed',
            ], 500);
        }
    }

    /**
     * Verify a payment session (for Stripe return).
     *
     * GET /api/checkout/verify/{sessionId}
     */
    public function verifySession(string $sessionId): JsonResponse
    {
        $user = Auth::user();

        // Check if user has an active subscription that was just created
        $subscription = $user->subscription()
            ->with('plan')
            ->first();

        if ($subscription) {
            return response()->json([
                'success' => true,
                'message' => 'Payment successful',
                'data' => [
                    'subscription' => [
                        'id' => $subscription->id,
                        'plan' => [
                            'id' => $subscription->plan->id,
                            'name' => $subscription->plan->display_name ?? $subscription->plan->name,
                        ],
                        'status' => $subscription->status,
                        'starts_at' => $subscription->starts_at?->toIso8601String(),
                        'ends_at' => $subscription->ends_at?->toIso8601String(),
                    ],
                ],
            ]);
        }

        // FALLBACK for development: Process the session manually if webhook hasn't arrived
        try {
            $gateway = $this->paymentService->gateway('stripe');

            if ($gateway->isConfigured()) {
                \Stripe\Stripe::setApiKey(config('services.stripe.secret'));
                $session = \Stripe\Checkout\Session::retrieve($sessionId);

                if ($session->payment_status === 'paid' && $session->metadata->user_id == $user->id) {
                    // Process the payment manually
                    $planId = $session->metadata->plan_id;
                    $plan = Plan::find($planId);

                    if ($plan) {
                        // Cancel any existing active subscription
                        \App\Models\Subscription::where('user_id', $user->id)
                            ->whereIn('status', ['active', 'trialing'])
                            ->update([
                                'status' => 'canceled',
                                'canceled_at' => now(),
                            ]);

                        // Calculate subscription dates
                        $startsAt = now();
                        $endsAt = match ($plan->billing_period) {
                            'monthly' => now()->addMonth(),
                            'yearly' => now()->addYear(),
                            'lifetime' => now()->addYears(100),
                            default => now()->addMonth(),
                        };

                        // Create new subscription
                        $subscription = \App\Models\Subscription::create([
                            'user_id' => $user->id,
                            'plan_id' => $plan->id,
                            'status' => 'active',
                            'starts_at' => $startsAt,
                            'ends_at' => $endsAt,
                        ]);

                        // Create payment record
                        \App\Models\Payment::create([
                            'user_id' => $user->id,
                            'subscription_id' => $subscription->id,
                            'amount' => $session->amount_total / 100,
                            'currency' => strtoupper($session->currency),
                            'payment_method' => 'card',
                            'payment_gateway' => 'stripe',
                            'transaction_id' => $session->payment_intent ?? $session->subscription ?? $session->id,
                            'status' => 'completed',
                            'metadata' => [
                                'stripe_session_id' => $session->id,
                                'stripe_customer_id' => $session->customer,
                                'stripe_subscription_id' => $session->subscription,
                            ],
                        ]);

                        Log::info('Manual checkout processing (webhook fallback)', [
                            'user_id' => $user->id,
                            'plan_id' => $plan->id,
                            'subscription_id' => $subscription->id,
                        ]);

                        return response()->json([
                            'success' => true,
                            'message' => 'Payment successful',
                            'data' => [
                                'subscription' => [
                                    'id' => $subscription->id,
                                    'plan' => [
                                        'id' => $subscription->plan->id,
                                        'name' => $subscription->plan->display_name ?? $subscription->plan->name,
                                    ],
                                    'status' => $subscription->status,
                                    'starts_at' => $subscription->starts_at?->toIso8601String(),
                                    'ends_at' => $subscription->ends_at?->toIso8601String(),
                                ],
                            ],
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Manual session verification failed', [
                'error' => $e->getMessage(),
                'session_id' => $sessionId,
            ]);
        }

        // Session might not be processed yet (webhook pending)
        return response()->json([
            'success' => true,
            'message' => 'Payment is being processed. Please wait.',
            'data' => [
                'status' => 'pending',
            ],
        ]);
    }
}
