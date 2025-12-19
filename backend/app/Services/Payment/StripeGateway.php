<?php

namespace App\Services\Payment;

use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Stripe\Checkout\Session;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Stripe;
use Stripe\Webhook;

class StripeGateway implements PaymentGatewayInterface
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function getName(): string
    {
        return 'stripe';
    }

    public function isConfigured(): bool
    {
        return !empty(config('services.stripe.key')) && !empty(config('services.stripe.secret'));
    }

    public function createCheckoutSession(Plan $plan, User $user, array $options = []): array
    {
        if (!$this->isConfigured()) {
            throw new \RuntimeException('Stripe is not configured. Please set STRIPE_KEY and STRIPE_SECRET in your .env file.');
        }

        try {
            $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));

            // Determine billing mode based on plan
            $mode = $plan->billing_period === 'lifetime' ? 'payment' : 'subscription';

            // Build line items
            $lineItems = [
                [
                    'price_data' => [
                        'currency' => strtolower($plan->currency ?? 'usd'),
                        'unit_amount' => (int) ($plan->price * 100), // Convert to cents
                        'product_data' => [
                            'name' => $plan->display_name ?? $plan->name,
                            'description' => $plan->description ?? "Subscription to {$plan->name} plan",
                        ],
                    ],
                    'quantity' => 1,
                ],
            ];

            // Add recurring settings for subscriptions
            if ($mode === 'subscription') {
                $lineItems[0]['price_data']['recurring'] = [
                    'interval' => $plan->billing_period === 'yearly' ? 'year' : 'month',
                    'interval_count' => 1,
                ];
            }

            $sessionData = [
                'payment_method_types' => ['card'],
                'mode' => $mode,
                'line_items' => $lineItems,
                'success_url' => $frontendUrl . '/payment/success?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => $frontendUrl . '/payment/cancel',
                'client_reference_id' => $user->id,
                'customer_email' => $user->email,
                'metadata' => [
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                    'plan_name' => $plan->name,
                ],
            ];

            // Add trial period if plan has trial
            if ($mode === 'subscription' && !empty($options['trial_days'])) {
                $sessionData['subscription_data'] = [
                    'trial_period_days' => $options['trial_days'],
                ];
            }

            $session = Session::create($sessionData);

            return [
                'success' => true,
                'session_id' => $session->id,
                'checkout_url' => $session->url,
                'gateway' => $this->getName(),
            ];
        } catch (ApiErrorException $e) {
            Log::error('Stripe checkout session creation failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'plan_id' => $plan->id,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'gateway' => $this->getName(),
            ];
        }
    }

    public function processPayment(array $data): array
    {
        // For Stripe, we use Checkout Sessions instead of direct payment processing
        // This method is not typically used for Stripe as payments are handled via webhooks
        return [
            'success' => false,
            'error' => 'Direct payment processing is not supported for Stripe. Use checkout sessions instead.',
            'gateway' => $this->getName(),
        ];
    }

    public function handleWebhook(string $payload, ?string $signature = null): array
    {
        $webhookSecret = config('services.stripe.webhook_secret');

        if (empty($webhookSecret)) {
            Log::warning('Stripe webhook secret not configured');
            return [
                'success' => false,
                'error' => 'Webhook secret not configured',
            ];
        }

        try {
            $event = Webhook::constructEvent($payload, $signature, $webhookSecret);
        } catch (SignatureVerificationException $e) {
            Log::error('Stripe webhook signature verification failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => 'Invalid signature',
            ];
        } catch (\Exception $e) {
            Log::error('Stripe webhook parsing failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => 'Invalid payload',
            ];
        }

        Log::info('Stripe webhook received', ['type' => $event->type]);

        switch ($event->type) {
            case 'checkout.session.completed':
                return $this->handleCheckoutCompleted($event->data->object);

            case 'customer.subscription.updated':
                return $this->handleSubscriptionUpdated($event->data->object);

            case 'customer.subscription.deleted':
                return $this->handleSubscriptionDeleted($event->data->object);

            case 'invoice.payment_failed':
                return $this->handlePaymentFailed($event->data->object);

            default:
                Log::info('Unhandled Stripe webhook event', ['type' => $event->type]);
                return [
                    'success' => true,
                    'message' => 'Event received but not processed',
                    'event_type' => $event->type,
                ];
        }
    }

    protected function handleCheckoutCompleted($session): array
    {
        $userId = $session->metadata->user_id ?? $session->client_reference_id;
        $planId = $session->metadata->plan_id ?? null;

        if (!$userId || !$planId) {
            Log::error('Missing user_id or plan_id in checkout session', [
                'session_id' => $session->id,
            ]);
            return ['success' => false, 'error' => 'Missing metadata'];
        }

        $user = User::find($userId);
        $plan = Plan::find($planId);

        if (!$user || !$plan) {
            Log::error('User or Plan not found', [
                'user_id' => $userId,
                'plan_id' => $planId,
            ]);
            return ['success' => false, 'error' => 'User or Plan not found'];
        }

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
            'lifetime' => now()->addYears(100), // Effectively lifetime
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
        Payment::create([
            'user_id' => $user->id,
            'subscription_id' => $subscription->id,
            'amount' => $session->amount_total / 100, // Convert from cents
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

        Log::info('Stripe checkout completed successfully', [
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'subscription_id' => $subscription->id,
        ]);

        return [
            'success' => true,
            'subscription_id' => $subscription->id,
            'user_id' => $user->id,
        ];
    }

    protected function handleSubscriptionUpdated($subscription): array
    {
        // Find subscription by Stripe subscription ID in payment metadata
        $payment = Payment::whereJsonContains('metadata->stripe_subscription_id', $subscription->id)
            ->latest()
            ->first();

        if (!$payment || !$payment->subscription) {
            Log::warning('Subscription not found for update', [
                'stripe_subscription_id' => $subscription->id,
            ]);
            return ['success' => false, 'error' => 'Subscription not found'];
        }

        $localSubscription = $payment->subscription;

        // Map Stripe status to local status
        $statusMap = [
            'active' => 'active',
            'trialing' => 'trialing',
            'past_due' => 'active', // Still active but payment failed
            'canceled' => 'canceled',
            'unpaid' => 'expired',
        ];

        $newStatus = $statusMap[$subscription->status] ?? 'active';

        $localSubscription->update([
            'status' => $newStatus,
            'ends_at' => isset($subscription->current_period_end)
                ? \Carbon\Carbon::createFromTimestamp($subscription->current_period_end)
                : $localSubscription->ends_at,
        ]);

        if ($subscription->status === 'canceled' && $subscription->canceled_at) {
            $localSubscription->update([
                'canceled_at' => \Carbon\Carbon::createFromTimestamp($subscription->canceled_at),
            ]);
        }

        return ['success' => true, 'subscription_id' => $localSubscription->id];
    }

    protected function handleSubscriptionDeleted($subscription): array
    {
        $payment = Payment::whereJsonContains('metadata->stripe_subscription_id', $subscription->id)
            ->latest()
            ->first();

        if (!$payment || !$payment->subscription) {
            return ['success' => false, 'error' => 'Subscription not found'];
        }

        $payment->subscription->update([
            'status' => 'canceled',
            'canceled_at' => now(),
        ]);

        return ['success' => true, 'subscription_id' => $payment->subscription->id];
    }

    protected function handlePaymentFailed($invoice): array
    {
        Log::warning('Stripe payment failed', [
            'invoice_id' => $invoice->id,
            'customer' => $invoice->customer,
        ]);

        // Could send notification to user here
        return ['success' => true, 'message' => 'Payment failure recorded'];
    }

    public function refund(string $transactionId, ?float $amount = null): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'error' => 'Stripe is not configured',
            ];
        }

        try {
            $refundData = ['payment_intent' => $transactionId];

            if ($amount !== null) {
                $refundData['amount'] = (int) ($amount * 100);
            }

            $refund = \Stripe\Refund::create($refundData);

            // Update payment status
            $payment = Payment::where('transaction_id', $transactionId)->first();
            if ($payment) {
                $payment->update(['status' => 'refunded']);
            }

            return [
                'success' => true,
                'refund_id' => $refund->id,
                'amount' => $refund->amount / 100,
            ];
        } catch (ApiErrorException $e) {
            Log::error('Stripe refund failed', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
