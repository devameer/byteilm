<?php

namespace App\Services\Payment;

use InvalidArgumentException;

/**
 * Payment Service Factory
 * 
 * Creates and returns the appropriate payment gateway based on configuration or request.
 */
class PaymentService
{
    protected array $gateways = [];

    public function __construct()
    {
        // Register available gateways
        $this->gateways = [
            'stripe' => StripeGateway::class,
            'test' => TestGateway::class,
        ];
    }

    /**
     * Get a payment gateway instance by name.
     */
    public function gateway(string $name): PaymentGatewayInterface
    {
        $name = strtolower($name);

        if (!isset($this->gateways[$name])) {
            throw new InvalidArgumentException("Payment gateway '{$name}' is not supported.");
        }

        return app($this->gateways[$name]);
    }

    /**
     * Get the default payment gateway.
     * Returns Stripe if configured, otherwise falls back to Test gateway.
     */
    public function getDefaultGateway(): PaymentGatewayInterface
    {
        $stripeGateway = $this->gateway('stripe');

        if ($stripeGateway->isConfigured()) {
            return $stripeGateway;
        }

        // Fallback to test gateway
        return $this->gateway('test');
    }

    /**
     * Get all available gateways.
     */
    public function getAvailableGateways(): array
    {
        $available = [];

        foreach ($this->gateways as $name => $class) {
            $gateway = $this->gateway($name);
            $available[] = [
                'name' => $name,
                'display_name' => ucfirst($name),
                'is_configured' => $gateway->isConfigured(),
            ];
        }

        return $available;
    }

    /**
     * Check if a gateway is available and configured.
     */
    public function isGatewayAvailable(string $name): bool
    {
        try {
            $gateway = $this->gateway($name);
            return $gateway->isConfigured();
        } catch (InvalidArgumentException $e) {
            return false;
        }
    }
}
