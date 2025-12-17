<?php

namespace App\Services\Integrations;

use App\Models\Integration;
use App\Models\IntegrationLog;
use Illuminate\Support\Facades\Http;

abstract class BaseIntegrationService
{
    protected Integration $integration;
    protected $client;

    public function __construct(Integration $integration)
    {
        $this->integration = $integration;
        $this->client = $this->getClient();
    }

    /**
     * Authenticate with the service
     */
    abstract public function authenticate(array $credentials);

    /**
     * Refresh access token
     */
    abstract public function refreshToken();

    /**
     * Test connection
     */
    abstract public function testConnection();

    /**
     * Sync data
     */
    abstract public function sync();

    /**
     * Get HTTP client instance
     */
    abstract protected function getClient();

    /**
     * Log integration action
     */
    protected function log(
        string $action,
        string $status,
        string $message = null,
        array $requestData = null,
        array $responseData = null,
        array $errorDetails = null,
        int $durationMs = 0
    ) {
        return IntegrationLog::create([
            'integration_id' => $this->integration->id,
            'action' => $action,
            'status' => $status,
            'message' => $message,
            'request_data' => $requestData,
            'response_data' => $responseData,
            'error_details' => $errorDetails,
            'duration_ms' => $durationMs
        ]);
    }

    /**
     * Check if token is expired
     */
    protected function isTokenExpired(): bool
    {
        return $this->integration->isTokenExpired();
    }

    /**
     * Check if token needs refresh
     */
    protected function needsTokenRefresh(): bool
    {
        return $this->integration->needsTokenRefresh();
    }

    /**
     * Handle API request with error handling and logging
     */
    protected function makeRequest(
        string $method,
        string $url,
        array $data = [],
        array $headers = [],
        string $action = 'api_request'
    ) {
        $startTime = microtime(true);

        try {
            // Check and refresh token if needed
            if ($this->needsTokenRefresh()) {
                $this->refreshToken();
            }

            // Make request
            $response = Http::withHeaders($headers)
                ->$method($url, $data);

            $duration = round((microtime(true) - $startTime) * 1000);

            if ($response->successful()) {
                $this->log(
                    $action,
                    'success',
                    'Request successful',
                    ['method' => $method, 'url' => $url, 'data' => $data],
                    $response->json(),
                    null,
                    $duration
                );

                return $response->json();
            } else {
                $this->log(
                    $action,
                    'failed',
                    'Request failed',
                    ['method' => $method, 'url' => $url, 'data' => $data],
                    null,
                    [
                        'status' => $response->status(),
                        'error' => $response->body()
                    ],
                    $duration
                );

                throw new \Exception("API request failed: " . $response->body());
            }
        } catch (\Exception $e) {
            $duration = round((microtime(true) - $startTime) * 1000);

            $this->log(
                $action,
                'failed',
                'Request exception',
                ['method' => $method, 'url' => $url, 'data' => $data],
                null,
                [
                    'error' => $e->getMessage(),
                    'code' => $e->getCode()
                ],
                $duration
            );

            $this->integration->recordError($e->getMessage());

            throw $e;
        }
    }

    /**
     * Get setting value
     */
    protected function getSetting(string $key, $default = null)
    {
        return $this->integration->settings[$key] ?? $default;
    }

    /**
     * Update setting value
     */
    protected function updateSetting(string $key, $value)
    {
        $settings = $this->integration->settings ?? [];
        $settings[$key] = $value;

        $this->integration->update(['settings' => $settings]);
    }

    /**
     * Update access token
     */
    protected function updateAccessToken(string $accessToken, string $refreshToken = null, $expiresAt = null)
    {
        $data = ['access_token' => $accessToken];

        if ($refreshToken) {
            $data['refresh_token'] = $refreshToken;
        }

        if ($expiresAt) {
            $data['token_expires_at'] = $expiresAt;
        }

        $this->integration->update($data);
    }

    /**
     * Mark integration as synced
     */
    protected function markSynced()
    {
        $this->integration->markSynced();
    }

    /**
     * Get authorization headers
     */
    protected function getAuthHeaders(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->integration->access_token,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json'
        ];
    }
}
