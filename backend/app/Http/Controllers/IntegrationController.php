<?php

namespace App\Http\Controllers;

use App\Models\Integration;
use App\Models\IntegrationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IntegrationController extends Controller
{
    /**
     * Get all user integrations
     * GET /api/integrations
     */
    public function index()
    {
        $user = Auth::user();

        $integrations = Integration::forUser($user->id)
            ->with('logs')
            ->withCount('logs')
            ->get()
            ->map(function ($integration) {
                return [
                    'id' => $integration->id,
                    'provider' => $integration->provider,
                    'provider_name' => $integration->provider_name,
                    'provider_icon' => $integration->provider_icon,
                    'provider_user_id' => $integration->provider_user_id,
                    'is_active' => $integration->is_active,
                    'auto_sync' => $integration->auto_sync,
                    'last_sync_at' => $integration->last_sync_at,
                    'settings' => $integration->settings,
                    'error_count' => $integration->error_count,
                    'last_error' => $integration->last_error,
                    'logs_count' => $integration->logs_count,
                    'created_at' => $integration->created_at
                ];
            });

        // Get available integrations
        $available = $this->getAvailableIntegrations();
        $connectedProviders = $integrations->pluck('provider')->toArray();

        $availableIntegrations = collect($available)->filter(function ($integration) use ($connectedProviders) {
            return !in_array($integration['provider'], $connectedProviders);
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'connected' => $integrations,
                'available' => $availableIntegrations
            ]
        ]);
    }

    /**
     * Get single integration
     * GET /api/integrations/{id}
     */
    public function show($id)
    {
        $user = Auth::user();
        $integration = Integration::forUser($user->id)->findOrFail($id);

        $recentLogs = IntegrationLog::forIntegration($integration->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'integration' => $integration,
                'recent_logs' => $recentLogs
            ]
        ]);
    }

    /**
     * Get integration by provider
     * GET /api/integrations/provider/{provider}
     */
    public function getByProvider($provider)
    {
        $user = Auth::user();
        $integration = Integration::forUser($user->id)
            ->provider($provider)
            ->first();

        if (!$integration) {
            return response()->json([
                'success' => false,
                'message' => 'Integration not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $integration
        ]);
    }

    /**
     * Connect new integration (OAuth callback)
     * POST /api/integrations/connect
     */
    public function connect(Request $request)
    {
        $request->validate([
            'provider' => 'required|in:google_calendar,slack,discord,trello,notion,github',
            'access_token' => 'required|string',
            'refresh_token' => 'nullable|string',
            'token_expires_at' => 'nullable|date',
            'provider_user_id' => 'nullable|string',
            'settings' => 'nullable|array'
        ]);

        $user = Auth::user();

        // Check if integration already exists
        $existingIntegration = Integration::forUser($user->id)
            ->provider($request->provider)
            ->first();

        if ($existingIntegration) {
            return response()->json([
                'success' => false,
                'message' => 'التكامل موجود بالفعل'
            ], 400);
        }

        $integration = Integration::create([
            'user_id' => $user->id,
            'provider' => $request->provider,
            'provider_user_id' => $request->provider_user_id,
            'access_token' => $request->access_token,
            'refresh_token' => $request->refresh_token,
            'token_expires_at' => $request->token_expires_at,
            'settings' => $request->settings ?? [],
            'auto_sync' => $request->auto_sync ?? false,
            'is_active' => true,
            'error_count' => 0
        ]);

        // Log connection
        IntegrationLog::create([
            'integration_id' => $integration->id,
            'action' => 'connect',
            'status' => 'success',
            'message' => 'Integration connected successfully'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم ربط التكامل بنجاح',
            'data' => $integration
        ], 201);
    }

    /**
     * Update integration settings
     * PUT /api/integrations/{id}
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $integration = Integration::forUser($user->id)->findOrFail($id);

        $request->validate([
            'auto_sync' => 'boolean',
            'is_active' => 'boolean',
            'settings' => 'array'
        ]);

        $integration->update($request->only(['auto_sync', 'is_active', 'settings']));

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث إعدادات التكامل بنجاح',
            'data' => $integration->fresh()
        ]);
    }

    /**
     * Disconnect integration
     * DELETE /api/integrations/{id}
     */
    public function disconnect($id)
    {
        $user = Auth::user();
        $integration = Integration::forUser($user->id)->findOrFail($id);

        // Log disconnection
        IntegrationLog::create([
            'integration_id' => $integration->id,
            'action' => 'disconnect',
            'status' => 'success',
            'message' => 'Integration disconnected'
        ]);

        $integration->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم فصل التكامل بنجاح'
        ]);
    }

    /**
     * Test integration connection
     * POST /api/integrations/{id}/test
     */
    public function testConnection($id)
    {
        $user = Auth::user();
        $integration = Integration::forUser($user->id)->findOrFail($id);

        $startTime = microtime(true);

        try {
            // Get service for provider
            $service = $this->getIntegrationService($integration);
            $result = $service->testConnection();

            $duration = round((microtime(true) - $startTime) * 1000);

            // Log test
            IntegrationLog::create([
                'integration_id' => $integration->id,
                'action' => 'test_connection',
                'status' => 'success',
                'message' => 'Connection test successful',
                'response_data' => $result,
                'duration_ms' => $duration
            ]);

            return response()->json([
                'success' => true,
                'message' => 'الاتصال يعمل بنجاح',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            $duration = round((microtime(true) - $startTime) * 1000);

            // Log error
            IntegrationLog::create([
                'integration_id' => $integration->id,
                'action' => 'test_connection',
                'status' => 'failed',
                'message' => 'Connection test failed',
                'error_details' => [
                    'error' => $e->getMessage(),
                    'code' => $e->getCode()
                ],
                'duration_ms' => $duration
            ]);

            $integration->recordError($e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'فشل اختبار الاتصال: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Manually trigger sync
     * POST /api/integrations/{id}/sync
     */
    public function sync($id)
    {
        $user = Auth::user();
        $integration = Integration::forUser($user->id)->findOrFail($id);

        if (!$integration->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'التكامل غير نشط'
            ], 400);
        }

        $startTime = microtime(true);

        try {
            // Get service for provider
            $service = $this->getIntegrationService($integration);
            $result = $service->sync();

            $duration = round((microtime(true) - $startTime) * 1000);

            // Log sync
            IntegrationLog::create([
                'integration_id' => $integration->id,
                'action' => 'sync',
                'status' => 'success',
                'message' => 'Sync completed successfully',
                'response_data' => $result,
                'duration_ms' => $duration
            ]);

            $integration->markSynced();

            return response()->json([
                'success' => true,
                'message' => 'تمت المزامنة بنجاح',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            $duration = round((microtime(true) - $startTime) * 1000);

            // Log error
            IntegrationLog::create([
                'integration_id' => $integration->id,
                'action' => 'sync',
                'status' => 'failed',
                'message' => 'Sync failed',
                'error_details' => [
                    'error' => $e->getMessage(),
                    'code' => $e->getCode()
                ],
                'duration_ms' => $duration
            ]);

            $integration->recordError($e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'فشلت المزامنة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get integration logs
     * GET /api/integrations/{id}/logs
     */
    public function getLogs($id, Request $request)
    {
        $user = Auth::user();
        $integration = Integration::forUser($user->id)->findOrFail($id);

        $query = IntegrationLog::forIntegration($integration->id);

        // Filter by status
        if ($request->has('status')) {
            if ($request->status === 'success') {
                $query->success();
            } elseif ($request->status === 'failed') {
                $query->failed();
            }
        }

        // Filter by action
        if ($request->has('action')) {
            $query->action($request->action);
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    /**
     * Get integration statistics
     * GET /api/integrations/{id}/statistics
     */
    public function getStatistics($id)
    {
        $user = Auth::user();
        $integration = Integration::forUser($user->id)->findOrFail($id);

        $logs = IntegrationLog::forIntegration($integration->id)->get();

        $statistics = [
            'total_requests' => $logs->count(),
            'successful_requests' => $logs->where('status', 'success')->count(),
            'failed_requests' => $logs->where('status', 'failed')->count(),
            'success_rate' => $logs->count() > 0
                ? round(($logs->where('status', 'success')->count() / $logs->count()) * 100, 2)
                : 0,
            'average_duration' => $logs->avg('duration_ms') ?? 0,
            'last_sync' => $integration->last_sync_at,
            'error_count' => $integration->error_count,
            'last_error' => $integration->last_error,
            'actions_breakdown' => $logs->groupBy('action')->map(function ($group) {
                return [
                    'total' => $group->count(),
                    'success' => $group->where('status', 'success')->count(),
                    'failed' => $group->where('status', 'failed')->count()
                ];
            })
        ];

        return response()->json([
            'success' => true,
            'data' => $statistics
        ]);
    }

    /**
     * Get OAuth authorization URL
     * GET /api/integrations/auth/{provider}
     */
    public function getAuthUrl($provider)
    {
        $authUrls = [
            'google_calendar' => $this->getGoogleAuthUrl(),
            'slack' => $this->getSlackAuthUrl(),
            'trello' => $this->getTrelloAuthUrl(),
            'notion' => $this->getNotionAuthUrl(),
            'github' => $this->getGitHubAuthUrl()
        ];

        if (!isset($authUrls[$provider])) {
            return response()->json([
                'success' => false,
                'message' => 'Provider not supported'
            ], 400);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'auth_url' => $authUrls[$provider]
            ]
        ]);
    }

    /**
     * Helper: Get available integrations
     */
    protected function getAvailableIntegrations()
    {
        return [
            [
                'provider' => 'google_calendar',
                'name' => 'Google Calendar',
                'icon' => '📅',
                'description' => 'مزامنة المهام والمواعيد مع Google Calendar',
                'features' => ['Auto-sync tasks', 'Create events', 'Update deadlines']
            ],
            [
                'provider' => 'slack',
                'name' => 'Slack',
                'icon' => '💬',
                'description' => 'استقبال إشعارات المهام في Slack',
                'features' => ['Task notifications', 'Daily digest', 'Team updates']
            ],
            [
                'provider' => 'discord',
                'name' => 'Discord',
                'icon' => '🎮',
                'description' => 'إشعارات Discord للمهام والمشاريع',
                'features' => ['Webhook notifications', 'Rich embeds', 'Team collaboration']
            ],
            [
                'provider' => 'trello',
                'name' => 'Trello',
                'icon' => '📋',
                'description' => 'مزامنة المهام مع لوحات Trello',
                'features' => ['Sync tasks', 'Create cards', 'Update boards']
            ],
            [
                'provider' => 'notion',
                'name' => 'Notion',
                'icon' => '📝',
                'description' => 'تصدير المشاريع إلى Notion',
                'features' => ['Export projects', 'Sync databases', 'Update pages']
            ],
            [
                'provider' => 'github',
                'name' => 'GitHub',
                'icon' => '🐙',
                'description' => 'ربط المهام مع GitHub Issues',
                'features' => ['Sync issues', 'Track commits', 'PR notifications']
            ]
        ];
    }

    /**
     * Helper: Get integration service instance
     */
    protected function getIntegrationService(Integration $integration)
    {
        $serviceMap = [
            'google_calendar' => \App\Services\Integrations\GoogleCalendarService::class,
            'slack' => \App\Services\Integrations\SlackService::class,
            'discord' => \App\Services\Integrations\DiscordService::class,
            'trello' => \App\Services\Integrations\TrelloService::class,
            'notion' => \App\Services\Integrations\NotionService::class,
            'github' => \App\Services\Integrations\GitHubService::class
        ];

        $serviceClass = $serviceMap[$integration->provider] ?? null;

        if (!$serviceClass || !class_exists($serviceClass)) {
            throw new \Exception("Service not implemented for provider: {$integration->provider}");
        }

        return new $serviceClass($integration);
    }

    /**
     * OAuth URL helpers
     */
    protected function getGoogleAuthUrl()
    {
        $clientId = config('services.google.client_id');
        $redirectUri = config('services.google.redirect');
        $scopes = 'https://www.googleapis.com/auth/calendar';

        return "https://accounts.google.com/o/oauth2/v2/auth?" . http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => $scopes,
            'access_type' => 'offline',
            'prompt' => 'consent'
        ]);
    }

    protected function getSlackAuthUrl()
    {
        $clientId = config('services.slack.client_id');
        $redirectUri = config('services.slack.redirect');
        $scopes = 'chat:write,chat:write.public,users:read';

        return "https://slack.com/oauth/v2/authorize?" . http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'scope' => $scopes
        ]);
    }

    protected function getTrelloAuthUrl()
    {
        $apiKey = config('services.trello.api_key');
        $returnUrl = config('services.trello.redirect');
        $appName = config('app.name');

        return "https://trello.com/1/authorize?" . http_build_query([
            'key' => $apiKey,
            'name' => $appName,
            'expiration' => 'never',
            'response_type' => 'token',
            'return_url' => $returnUrl,
            'scope' => 'read,write'
        ]);
    }

    protected function getNotionAuthUrl()
    {
        $clientId = config('services.notion.client_id');
        $redirectUri = config('services.notion.redirect');

        return "https://api.notion.com/v1/oauth/authorize?" . http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code'
        ]);
    }

    protected function getGitHubAuthUrl()
    {
        $clientId = config('services.github.client_id');
        $redirectUri = config('services.github.redirect');
        $scopes = 'repo,read:user';

        return "https://github.com/login/oauth/authorize?" . http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'scope' => $scopes
        ]);
    }
}
