<?php

namespace App\Services\Integrations;

use App\Models\Task;
use App\Models\Project;
use Illuminate\Support\Facades\Http;

class DiscordService extends BaseIntegrationService
{
    /**
     * Authenticate with Discord (Webhook-based, no OAuth needed)
     */
    public function authenticate(array $credentials)
    {
        // Discord webhook doesn't require OAuth
        // Just validate the webhook URL
        if (!isset($credentials['webhook_url'])) {
            throw new \Exception('Webhook URL is required');
        }

        $webhookUrl = $credentials['webhook_url'];

        // Validate webhook format
        if (!preg_match('/^https:\/\/discord\.com\/api\/webhooks\/\d+\/.+$/', $webhookUrl)) {
            throw new \Exception('Invalid Discord webhook URL');
        }

        // Store webhook URL in settings
        $this->updateSetting('webhook_url', $webhookUrl);

        // Test webhook
        $this->testWebhook($webhookUrl);

        return [
            'webhook_url' => $webhookUrl,
            'authenticated' => true
        ];
    }

    /**
     * Refresh token (not needed for webhooks)
     */
    public function refreshToken()
    {
        // Webhooks don't need token refresh
        return true;
    }

    /**
     * Test connection
     */
    public function testConnection()
    {
        $webhookUrl = $this->getSetting('webhook_url');

        if (!$webhookUrl) {
            throw new \Exception('No webhook URL configured');
        }

        return $this->testWebhook($webhookUrl);
    }

    /**
     * Test webhook
     */
    protected function testWebhook($webhookUrl)
    {
        $response = Http::post($webhookUrl, [
            'content' => '✅ اختبار الاتصال بـ Discord ناجح!',
            'embeds' => [
                [
                    'title' => 'تم ربط التكامل بنجاح',
                    'description' => 'سيتم إرسال إشعارات المهام والمشاريع إلى هذه القناة',
                    'color' => 5814783, // Blue
                    'timestamp' => now()->toIso8601String()
                ]
            ]
        ]);

        if ($response->successful()) {
            $this->log(
                'test_webhook',
                'success',
                'Webhook test successful'
            );

            return [
                'status' => 'success',
                'message' => 'Webhook is working'
            ];
        }

        throw new \Exception('Webhook test failed');
    }

    /**
     * Sync - Send daily digest
     */
    public function sync()
    {
        $userId = $this->integration->user_id;
        $webhookUrl = $this->getSetting('webhook_url');

        if (!$webhookUrl) {
            throw new \Exception('No webhook URL configured');
        }

        $digest = $this->generateDailyDigest($userId);

        $this->sendWebhook($webhookUrl, $digest);

        $this->markSynced();

        return [
            'message_sent' => true,
            'webhook_url' => $webhookUrl
        ];
    }

    /**
     * Send webhook message
     */
    public function sendWebhook($webhookUrl, array $data)
    {
        $startTime = microtime(true);

        try {
            $response = Http::post($webhookUrl, $data);

            $duration = round((microtime(true) - $startTime) * 1000);

            if ($response->successful() || $response->status() === 204) {
                $this->log(
                    'send_webhook',
                    'success',
                    'Webhook sent successfully',
                    $data,
                    null,
                    null,
                    $duration
                );

                return true;
            }

            throw new \Exception('Webhook failed: ' . $response->body());
        } catch (\Exception $e) {
            $duration = round((microtime(true) - $startTime) * 1000);

            $this->log(
                'send_webhook',
                'failed',
                'Webhook failed',
                $data,
                null,
                ['error' => $e->getMessage()],
                $duration
            );

            throw $e;
        }
    }

    /**
     * Send task notification
     */
    public function sendTaskNotification(Task $task, $action = 'created')
    {
        $webhookUrl = $this->getSetting('webhook_url');

        if (!$webhookUrl) {
            throw new \Exception('No webhook URL configured');
        }

        $colors = [
            'created' => 3066993,   // Green
            'updated' => 3447003,   // Blue
            'completed' => 2067276, // Dark Green
            'deleted' => 15158332   // Red
        ];

        $actionText = [
            'created' => '✨ تم إنشاء مهمة جديدة',
            'updated' => '📝 تم تحديث مهمة',
            'completed' => '✅ تم إكمال مهمة',
            'deleted' => '🗑️ تم حذف مهمة'
        ][$action] ?? 'مهمة';

        $embed = [
            'title' => $task->title,
            'description' => $task->description ?? 'لا يوجد وصف',
            'color' => $colors[$action] ?? 9807270,
            'timestamp' => now()->toIso8601String(),
            'footer' => [
                'text' => $actionText
            ],
            'fields' => []
        ];

        if ($task->priority) {
            $priorityEmoji = [
                'high' => '🔴',
                'medium' => '🟡',
                'low' => '🟢'
            ][$task->priority] ?? '⚪';

            $embed['fields'][] = [
                'name' => 'الأولوية',
                'value' => "{$priorityEmoji} {$task->priority}",
                'inline' => true
            ];
        }

        if ($task->status) {
            $statusEmoji = [
                'pending' => '⏳',
                'in_progress' => '🔄',
                'completed' => '✅',
                'cancelled' => '❌'
            ][$task->status] ?? '📌';

            $embed['fields'][] = [
                'name' => 'الحالة',
                'value' => "{$statusEmoji} {$task->status}",
                'inline' => true
            ];
        }

        if ($task->deadline) {
            $embed['fields'][] = [
                'name' => 'الموعد النهائي',
                'value' => $task->deadline->format('Y-m-d H:i'),
                'inline' => true
            ];
        }

        if ($task->user) {
            $embed['author'] = [
                'name' => $task->user->name,
                'icon_url' => $task->user->avatar ?? 'https://cdn.discordapp.com/embed/avatars/0.png'
            ];
        }

        return $this->sendWebhook($webhookUrl, [
            'content' => $actionText,
            'embeds' => [$embed]
        ]);
    }

    /**
     * Send project notification
     */
    public function sendProjectNotification(Project $project, $action = 'created')
    {
        $webhookUrl = $this->getSetting('webhook_url');

        if (!$webhookUrl) {
            throw new \Exception('No webhook URL configured');
        }

        $colors = [
            'created' => 3066993,
            'updated' => 3447003,
            'completed' => 2067276,
            'deleted' => 15158332
        ];

        $actionText = [
            'created' => '📁 تم إنشاء مشروع جديد',
            'updated' => '📝 تم تحديث مشروع',
            'completed' => '✅ تم إكمال مشروع',
            'deleted' => '🗑️ تم حذف مشروع'
        ][$action] ?? 'مشروع';

        $embed = [
            'title' => $project->name,
            'description' => $project->description ?? 'لا يوجد وصف',
            'color' => $colors[$action] ?? 9807270,
            'timestamp' => now()->toIso8601String(),
            'footer' => [
                'text' => $actionText
            ],
            'fields' => []
        ];

        if ($project->status) {
            $statusEmoji = [
                'planning' => '📋',
                'in_progress' => '🔄',
                'completed' => '✅',
                'on_hold' => '⏸️'
            ][$project->status] ?? '📌';

            $embed['fields'][] = [
                'name' => 'الحالة',
                'value' => "{$statusEmoji} {$project->status}",
                'inline' => true
            ];
        }

        if ($project->deadline) {
            $embed['fields'][] = [
                'name' => 'الموعد النهائي',
                'value' => $project->deadline->format('Y-m-d H:i'),
                'inline' => true
            ];
        }

        if ($project->user) {
            $embed['author'] = [
                'name' => $project->user->name,
                'icon_url' => $project->user->avatar ?? 'https://cdn.discordapp.com/embed/avatars/0.png'
            ];
        }

        return $this->sendWebhook($webhookUrl, [
            'content' => $actionText,
            'embeds' => [$embed]
        ]);
    }

    /**
     * Generate daily digest
     */
    protected function generateDailyDigest($userId)
    {
        $tasks = Task::where('user_id', $userId)
            ->where('status', '!=', 'completed')
            ->get();

        $todayTasks = $tasks->filter(function ($task) {
            return $task->deadline && $task->deadline->isToday();
        });

        $overdueTasks = $tasks->filter(function ($task) {
            return $task->deadline && $task->deadline->isPast();
        });

        $embed = [
            'title' => '📊 ملخص يومي',
            'description' => 'إليك ملخص مهامك لهذا اليوم',
            'color' => 3447003, // Blue
            'timestamp' => now()->toIso8601String(),
            'fields' => [
                [
                    'name' => '📅 مهام اليوم',
                    'value' => $todayTasks->count() . ' مهمة',
                    'inline' => true
                ],
                [
                    'name' => '⚠️ مهام متأخرة',
                    'value' => $overdueTasks->count() . ' مهمة',
                    'inline' => true
                ],
                [
                    'name' => '📋 إجمالي المهام النشطة',
                    'value' => $tasks->count() . ' مهمة',
                    'inline' => true
                ]
            ]
        ];

        if ($todayTasks->count() > 0) {
            $tasksList = $todayTasks->take(5)->map(function ($task) {
                $priorityEmoji = [
                    'high' => '🔴',
                    'medium' => '🟡',
                    'low' => '🟢'
                ][$task->priority] ?? '⚪';

                return "• {$priorityEmoji} {$task->title}";
            })->implode("\n");

            $embed['fields'][] = [
                'name' => 'مهام اليوم',
                'value' => $tasksList ?: 'لا توجد مهام',
                'inline' => false
            ];
        }

        if ($overdueTasks->count() > 0) {
            $overdueList = $overdueTasks->take(5)->map(function ($task) {
                return "• ⚠️ {$task->title}";
            })->implode("\n");

            $embed['fields'][] = [
                'name' => 'مهام متأخرة',
                'value' => $overdueList ?: 'لا توجد مهام متأخرة',
                'inline' => false
            ];
        }

        return [
            'content' => '📊 **ملخص يومي**',
            'embeds' => [$embed]
        ];
    }

    /**
     * Send rich notification
     */
    public function sendRichNotification($title, $description, $fields = [], $color = 3447003)
    {
        $webhookUrl = $this->getSetting('webhook_url');

        if (!$webhookUrl) {
            throw new \Exception('No webhook URL configured');
        }

        $embed = [
            'title' => $title,
            'description' => $description,
            'color' => $color,
            'timestamp' => now()->toIso8601String(),
            'fields' => $fields
        ];

        return $this->sendWebhook($webhookUrl, [
            'embeds' => [$embed]
        ]);
    }

    /**
     * Get HTTP client
     */
    protected function getClient()
    {
        return Http::withHeaders([
            'Content-Type' => 'application/json'
        ]);
    }
}
