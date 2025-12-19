<?php

namespace App\Services\Payment;

use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Test Payment Gateway for development and testing.
 * 
 * Test Card Numbers:
 * - 4242424242424242 - Success
 * - 4000000000000002 - Decline
 * - 4000000000000069 - Expired card
 * - 4000000000000127 - CVC check fail
 */
class TestGateway implements PaymentGatewayInterface
{
    // Test card patterns
    private const TEST_CARDS = [
        '4242424242424242' => ['status' => 'success', 'message' => 'Payment successful'],
        '4000000000000002' => ['status' => 'declined', 'message' => 'Card was declined'],
        '4000000000000069' => ['status' => 'expired', 'message' => 'Card has expired'],
        '4000000000000127' => ['status' => 'cvc_fail', 'message' => 'CVC check failed'],
        '4000000000000119' => ['status' => 'processing_error', 'message' => 'Processing error'],
    ];

    public function getName(): string
    {
        return 'test';
    }

    public function isConfigured(): bool
    {
        // Test gateway is always configured
        return true;
    }

    public function createCheckoutSession(Plan $plan, User $user, array $options = []): array
    {
        // Generate a fake session ID
        $sessionId = 'test_cs_' . Str::random(24);

        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));

        Log::info('Test gateway checkout session created', [
            'session_id' => $sessionId,
            'user_id' => $user->id,
            'plan_id' => $plan->id,
        ]);

        return [
            'success' => true,
            'session_id' => $sessionId,
            // For test gateway, we redirect to our own checkout page
            'checkout_url' => $frontendUrl . '/checkout/' . $plan->id . '?gateway=test&session_id=' . $sessionId,
            'gateway' => $this->getName(),
            'plan' => [
                'id' => $plan->id,
                'name' => $plan->display_name ?? $plan->name,
                'price' => $plan->price,
                'currency' => $plan->currency,
                'billing_period' => $plan->billing_period,
            ],
        ];
    }

    public function processPayment(array $data): array
    {
        $cardNumber = preg_replace('/\s+/', '', $data['card_number'] ?? '');
        $planId = $data['plan_id'] ?? null;
        $userId = $data['user_id'] ?? null;
        $sessionId = $data['session_id'] ?? 'test_pi_' . Str::random(24);

        // Validate required fields
        if (!$planId || !$userId) {
            return [
                'success' => false,
                'error' => 'Missing required fields: plan_id or user_id',
                'gateway' => $this->getName(),
            ];
        }

        // Find user and plan
        $user = User::find($userId);
        $plan = Plan::find($planId);

        if (!$user || !$plan) {
            return [
                'success' => false,
                'error' => 'User or Plan not found',
                'gateway' => $this->getName(),
            ];
        }

        // Check test card pattern
        $cardResult = self::TEST_CARDS[$cardNumber] ?? null;

        // Default: accept any card starting with 4242
        if ($cardResult === null) {
            if (str_starts_with($cardNumber, '4242')) {
                $cardResult = ['status' => 'success', 'message' => 'Payment successful'];
            } else {
                $cardResult = ['status' => 'success', 'message' => 'Payment successful'];
            }
        }

        if ($cardResult['status'] !== 'success') {
            Log::info('Test gateway payment declined', [
                'card' => substr($cardNumber, 0, 4) . '****' . substr($cardNumber, -4),
                'reason' => $cardResult['status'],
            ]);

            return [
                'success' => false,
                'error' => $cardResult['message'],
                'error_code' => $cardResult['status'],
                'gateway' => $this->getName(),
            ];
        }

        // Payment successful - create subscription and payment
        $transactionId = 'test_pi_' . Str::random(24);

        // Cancel any existing active subscription
        Subscription::where('user_id', $user->id)
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
        $subscription = Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
        ]);

        // Create payment record
        $payment = Payment::create([
            'user_id' => $user->id,
            'subscription_id' => $subscription->id,
            'amount' => $plan->price,
            'currency' => $plan->currency ?? 'USD',
            'payment_method' => 'card',
            'payment_gateway' => 'test',
            'transaction_id' => $transactionId,
            'status' => 'completed',
            'metadata' => [
                'test_session_id' => $sessionId,
                'card_last_four' => substr($cardNumber, -4),
                'test_mode' => true,
            ],
        ]);

        Log::info('Test gateway payment successful', [
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'subscription_id' => $subscription->id,
            'transaction_id' => $transactionId,
        ]);

        return [
            'success' => true,
            'transaction_id' => $transactionId,
            'subscription_id' => $subscription->id,
            'payment_id' => $payment->id,
            'message' => 'Payment successful! Your subscription is now active.',
            'gateway' => $this->getName(),
        ];
    }

    public function handleWebhook(string $payload, ?string $signature = null): array
    {
        // Test gateway doesn't use webhooks - payments are processed directly
        return [
            'success' => true,
            'message' => 'Test gateway does not use webhooks',
        ];
    }

    public function refund(string $transactionId, ?float $amount = null): array
    {
        // Find the payment
        $payment = Payment::where('transaction_id', $transactionId)->first();

        if (!$payment) {
            return [
                'success' => false,
                'error' => 'Payment not found',
                'gateway' => $this->getName(),
            ];
        }

        // Update payment status
        $payment->update(['status' => 'refunded']);

        $refundId = 'test_re_' . Str::random(24);

        Log::info('Test gateway refund processed', [
            'transaction_id' => $transactionId,
            'refund_id' => $refundId,
            'amount' => $amount ?? $payment->amount,
        ]);

        return [
            'success' => true,
            'refund_id' => $refundId,
            'amount' => $amount ?? $payment->amount,
            'gateway' => $this->getName(),
        ];
    }
}
