<?php

namespace App\Services\Integrations;

use App\Models\Task;
use App\Models\Project;
use Illuminate\Support\Facades\Http;

class SlackService extends BaseIntegrationService
{
    protected $baseUrl = 'https://slack.com/api';

    /**
     * Authenticate with Slack
     */
    public function authenticate(array $credentials)
    {
        // Exchange authorization code for tokens
        $response = Http::asForm()->post("{$this->baseUrl}/oauth.v2.access", [
            'code' => $credentials['code'],
            'client_id' => config('services.slack.client_id'),
            'client_secret' => config('services.slack.client_secret'),
            'redirect_uri' => config('services.slack.redirect')
        ]);

        if ($response->successful()) {
            $data = $response->json();

            if ($data['ok']) {
                $this->updateAccessToken($data['access_token']);

                // Store additional data
                $this->updateSetting('team_id', $data['team']['id']);
                $this->updateSetting('team_name', $data['team']['name']);
                $this->updateSetting('channel', $data['incoming_webhook']['channel'] ?? null);
                $this->updateSetting('channel_id', $data['incoming_webhook']['channel_id'] ?? null);

                return $data;
            }
        }

        throw new \Exception('Failed to authenticate with Slack');
    }

    /**
     * Refresh access token (Slack tokens don't expire)
     */
    public function refreshToken()
    {
        // Slack tokens don't expire
        return true;
    }

    /**
     * Test connection
     */
    public function testConnection()
    {
        $response = $this->makeRequest(
            'post',
            "{$this->baseUrl}/auth.test",
            [],
            $this->getAuthHeaders(),
            'test_connection'
        );

        if ($response['ok']) {
            return [
                'team' => $response['team'],
                'user' => $response['user'],
                'user_id' => $response['user_id']
            ];
        }

        throw new \Exception('Slack connection test failed');
    }

    /**
     * Sync - Send daily digest
     */
    public function sync()
    {
        $userId = $this->integration->user_id;
        $channel = $this->getSetting('channel_id');

        if (!$channel) {
            throw new \Exception('No Slack channel configured');
        }

        $digest = $this->generateDailyDigest($userId);

        $this->sendMessage($channel, $digest);

        $this->markSynced();

        return [
            'message_sent' => true,
            'channel' => $channel
        ];
    }

    /**
     * Send message to Slack channel
     */
    public function sendMessage($channel, $message, array $blocks = null)
    {
        $payload = [
            'channel' => $channel,
            'text' => $message
        ];

        if ($blocks) {
            $payload['blocks'] = $blocks;
        }

        return $this->makeRequest(
            'post',
            "{$this->baseUrl}/chat.postMessage",
            $payload,
            $this->getAuthHeaders(),
            'send_message'
        );
    }

    /**
     * Send task notification
     */
    public function sendTaskNotification(Task $task, $action = 'created')
    {
        $channel = $this->getSetting('channel_id');

        if (!$channel) {
            throw new \Exception('No Slack channel configured');
        }

        $color = [
            'created' => '#36a64f', // Green
            'updated' => '#2196F3', // Blue
            'completed' => '#4CAF50', // Green
            'deleted' => '#f44336'  // Red
        ][$action] ?? '#808080';

        $actionText = [
            'created' => 'تم إنشاء مهمة جديدة',
            'updated' => 'تم تحديث مهمة',
            'completed' => 'تم إكمال مهمة',
            'deleted' => 'تم حذف مهمة'
        ][$action] ?? 'مهمة';

        $blocks = [
            [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*{$actionText}*\n\n*{$task->title}*"
                ]
            ]
        ];

        if ($task->description) {
            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => $task->description
                ]
            ];
        }

        $fields = [];

        if ($task->priority) {
            $priorityEmoji = [
                'high' => '🔴',
                'medium' => '🟡',
                'low' => '🟢'
            ][$task->priority] ?? '';

            $fields[] = [
                'type' => 'mrkdwn',
                'text' => "*الأولوية:*\n{$priorityEmoji} {$task->priority}"
            ];
        }

        if ($task->deadline) {
            $fields[] = [
                'type' => 'mrkdwn',
                'text' => "*الموعد النهائي:*\n{$task->deadline}"
            ];
        }

        if (!empty($fields)) {
            $blocks[] = [
                'type' => 'section',
                'fields' => $fields
            ];
        }

        return $this->sendMessage($channel, $actionText, $blocks);
    }

    /**
     * Send project notification
     */
    public function sendProjectNotification(Project $project, $action = 'created')
    {
        $channel = $this->getSetting('channel_id');

        if (!$channel) {
            throw new \Exception('No Slack channel configured');
        }

        $actionText = [
            'created' => '📁 تم إنشاء مشروع جديد',
            'updated' => '📝 تم تحديث مشروع',
            'completed' => '✅ تم إكمال مشروع',
            'deleted' => '🗑️ تم حذف مشروع'
        ][$action] ?? 'مشروع';

        $blocks = [
            [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*{$actionText}*\n\n*{$project->name}*"
                ]
            ]
        ];

        if ($project->description) {
            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => $project->description
                ]
            ];
        }

        $fields = [];

        if ($project->status) {
            $fields[] = [
                'type' => 'mrkdwn',
                'text' => "*الحالة:*\n{$project->status}"
            ];
        }

        if ($project->deadline) {
            $fields[] = [
                'type' => 'mrkdwn',
                'text' => "*الموعد النهائي:*\n{$project->deadline}"
            ];
        }

        if (!empty($fields)) {
            $blocks[] = [
                'type' => 'section',
                'fields' => $fields
            ];
        }

        return $this->sendMessage($channel, $actionText, $blocks);
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

        $blocks = [
            [
                'type' => 'header',
                'text' => [
                    'type' => 'plain_text',
                    'text' => '📊 ملخص يومي'
                ]
            ],
            [
                'type' => 'section',
                'fields' => [
                    [
                        'type' => 'mrkdwn',
                        'text' => "*مهام اليوم:*\n{$todayTasks->count()}"
                    ],
                    [
                        'type' => 'mrkdwn',
                        'text' => "*مهام متأخرة:*\n{$overdueTasks->count()}"
                    ],
                    [
                        'type' => 'mrkdwn',
                        'text' => "*إجمالي المهام النشطة:*\n{$tasks->count()}"
                    ]
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

            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*مهام اليوم:*\n{$tasksList}"
                ]
            ];
        }

        if ($overdueTasks->count() > 0) {
            $overdueList = $overdueTasks->take(5)->map(function ($task) {
                return "• ⚠️ {$task->title}";
            })->implode("\n");

            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*مهام متأخرة:*\n{$overdueList}"
                ]
            ];
        }

        return [
            'text' => '📊 ملخص يومي',
            'blocks' => $blocks
        ];
    }

    /**
     * List channels
     */
    public function listChannels()
    {
        $response = $this->makeRequest(
            'get',
            "{$this->baseUrl}/conversations.list",
            ['types' => 'public_channel,private_channel'],
            $this->getAuthHeaders(),
            'list_channels'
        );

        if ($response['ok']) {
            return $response['channels'];
        }

        return [];
    }

    /**
     * Get HTTP client
     */
    protected function getClient()
    {
        return Http::withHeaders($this->getAuthHeaders());
    }

    /**
     * Get authorization headers
     */
    protected function getAuthHeaders(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->integration->access_token,
            'Content-Type' => 'application/json'
        ];
    }
}
