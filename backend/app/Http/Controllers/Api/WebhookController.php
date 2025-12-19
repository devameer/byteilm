<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Payment\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Handle Stripe webhooks.
     * 
     * POST /api/webhooks/stripe
     */
    public function stripe(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature');

        if (!$signature) {
            Log::warning('Stripe webhook received without signature');
            return response()->json(['error' => 'Missing signature'], 400);
        }

        try {
            $gateway = $this->paymentService->gateway('stripe');
            $result = $gateway->handleWebhook($payload, $signature);

            if (!$result['success']) {
                Log::error('Stripe webhook processing failed', $result);
                return response()->json(['error' => $result['error'] ?? 'Processing failed'], 400);
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Stripe webhook exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }
}
