<?php

namespace App\Services\Payment;

use App\Models\Plan;
use App\Models\User;

interface PaymentGatewayInterface
{
    /**
     * Get the gateway identifier name.
     */
    public function getName(): string;

    /**
     * Create a checkout session for a plan.
     *
     * @param Plan $plan The plan to subscribe to
     * @param User $user The user making the purchase
     * @param array $options Additional options
     * @return array Session data including session_id and checkout_url
     */
    public function createCheckoutSession(Plan $plan, User $user, array $options = []): array;

    /**
     * Process a payment (for inline/test payments).
     *
     * @param array $data Payment data including card details
     * @return array Payment result including success status and transaction_id
     */
    public function processPayment(array $data): array;

    /**
     * Handle webhook payload from the payment provider.
     *
     * @param string $payload Raw webhook payload
     * @param string|null $signature Webhook signature for verification
     * @return array Processed webhook data
     */
    public function handleWebhook(string $payload, ?string $signature = null): array;

    /**
     * Process a refund for a payment.
     *
     * @param string $transactionId The original transaction ID
     * @param float|null $amount Amount to refund (null for full refund)
     * @return array Refund result
     */
    public function refund(string $transactionId, ?float $amount = null): array;

    /**
     * Check if the gateway is properly configured and ready to use.
     */
    public function isConfigured(): bool;
}
