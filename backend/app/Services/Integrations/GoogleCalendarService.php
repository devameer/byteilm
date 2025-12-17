<?php

namespace App\Services\Integrations;

use App\Models\Task;
use App\Models\Project;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class GoogleCalendarService extends BaseIntegrationService
{
    protected $baseUrl = 'https://www.googleapis.com/calendar/v3';

    /**
     * Authenticate with Google Calendar
     */
    public function authenticate(array $credentials)
    {
        // Exchange authorization code for tokens
        $response = Http::post('https://oauth2.googleapis.com/token', [
            'code' => $credentials['code'],
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'redirect_uri' => config('services.google.redirect'),
            'grant_type' => 'authorization_code'
        ]);

        if ($response->successful()) {
            $data = $response->json();

            $this->updateAccessToken(
                $data['access_token'],
                $data['refresh_token'] ?? null,
                now()->addSeconds($data['expires_in'])
            );

            return $data;
        }

        throw new \Exception('Failed to authenticate with Google Calendar');
    }

    /**
     * Refresh access token
     */
    public function refreshToken()
    {
        if (!$this->integration->refresh_token) {
            throw new \Exception('No refresh token available');
        }

        $response = Http::post('https://oauth2.googleapis.com/token', [
            'refresh_token' => $this->integration->refresh_token,
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'grant_type' => 'refresh_token'
        ]);

        if ($response->successful()) {
            $data = $response->json();

            $this->updateAccessToken(
                $data['access_token'],
                $data['refresh_token'] ?? $this->integration->refresh_token,
                now()->addSeconds($data['expires_in'])
            );

            return $data;
        }

        throw new \Exception('Failed to refresh Google Calendar token');
    }

    /**
     * Test connection
     */
    public function testConnection()
    {
        $calendarId = $this->getSetting('calendar_id', 'primary');

        $response = $this->makeRequest(
            'get',
            "{$this->baseUrl}/calendars/{$calendarId}",
            [],
            $this->getAuthHeaders(),
            'test_connection'
        );

        return [
            'calendar_name' => $response['summary'] ?? 'Primary Calendar',
            'calendar_id' => $response['id'] ?? $calendarId,
            'timezone' => $response['timeZone'] ?? 'UTC'
        ];
    }

    /**
     * Sync tasks and projects to Google Calendar
     */
    public function sync()
    {
        $userId = $this->integration->user_id;
        $calendarId = $this->getSetting('calendar_id', 'primary');

        $results = [
            'tasks_synced' => 0,
            'projects_synced' => 0,
            'events_created' => 0,
            'events_updated' => 0,
            'errors' => []
        ];

        // Sync tasks with deadlines
        if ($this->getSetting('sync_tasks', true)) {
            $tasks = Task::where('user_id', $userId)
                ->whereNotNull('deadline')
                ->where('status', '!=', 'completed')
                ->get();

            foreach ($tasks as $task) {
                try {
                    $this->syncTaskToCalendar($task, $calendarId);
                    $results['tasks_synced']++;
                    $results['events_created']++;
                } catch (\Exception $e) {
                    $results['errors'][] = "Task {$task->id}: {$e->getMessage()}";
                }
            }
        }

        // Sync projects
        if ($this->getSetting('sync_projects', true)) {
            $projects = Project::where('user_id', $userId)
                ->whereNotNull('deadline')
                ->where('status', '!=', 'completed')
                ->get();

            foreach ($projects as $project) {
                try {
                    $this->syncProjectToCalendar($project, $calendarId);
                    $results['projects_synced']++;
                    $results['events_created']++;
                } catch (\Exception $e) {
                    $results['errors'][] = "Project {$project->id}: {$e->getMessage()}";
                }
            }
        }

        $this->markSynced();

        return $results;
    }

    /**
     * Sync single task to calendar
     */
    public function syncTaskToCalendar(Task $task, $calendarId = 'primary')
    {
        $eventData = [
            'summary' => $task->title,
            'description' => $task->description ?? '',
            'start' => [
                'dateTime' => Carbon::parse($task->deadline)->toIso8601String(),
                'timeZone' => 'UTC'
            ],
            'end' => [
                'dateTime' => Carbon::parse($task->deadline)->addHour()->toIso8601String(),
                'timeZone' => 'UTC'
            ],
            'reminders' => [
                'useDefault' => false,
                'overrides' => [
                    ['method' => 'popup', 'minutes' => 30]
                ]
            ],
            'extendedProperties' => [
                'private' => [
                    'task_id' => $task->id,
                    'source' => 'plan_app'
                ]
            ]
        ];

        // Add priority color
        if ($task->priority) {
            $colorMap = [
                'high' => '11', // Red
                'medium' => '5', // Yellow
                'low' => '2'  // Green
            ];
            $eventData['colorId'] = $colorMap[$task->priority] ?? '1';
        }

        // Check if event already exists
        $existingEventId = $this->getTaskEventId($task);

        if ($existingEventId) {
            // Update existing event
            return $this->updateEvent($calendarId, $existingEventId, $eventData);
        } else {
            // Create new event
            $event = $this->createEvent($calendarId, $eventData);

            // Store event ID in task metadata
            $metadata = $task->metadata ?? [];
            $metadata['google_calendar_event_id'] = $event['id'];
            $task->update(['metadata' => $metadata]);

            return $event;
        }
    }

    /**
     * Sync single project to calendar
     */
    public function syncProjectToCalendar(Project $project, $calendarId = 'primary')
    {
        $eventData = [
            'summary' => "📁 {$project->name}",
            'description' => $project->description ?? '',
            'start' => [
                'dateTime' => Carbon::parse($project->deadline)->toIso8601String(),
                'timeZone' => 'UTC'
            ],
            'end' => [
                'dateTime' => Carbon::parse($project->deadline)->addHours(2)->toIso8601String(),
                'timeZone' => 'UTC'
            ],
            'colorId' => '9', // Blue for projects
            'extendedProperties' => [
                'private' => [
                    'project_id' => $project->id,
                    'source' => 'plan_app'
                ]
            ]
        ];

        // Check if event already exists
        $existingEventId = $this->getProjectEventId($project);

        if ($existingEventId) {
            return $this->updateEvent($calendarId, $existingEventId, $eventData);
        } else {
            $event = $this->createEvent($calendarId, $eventData);

            // Store event ID in project metadata
            $metadata = $project->metadata ?? [];
            $metadata['google_calendar_event_id'] = $event['id'];
            $project->update(['metadata' => $metadata]);

            return $event;
        }
    }

    /**
     * Create calendar event
     */
    public function createEvent($calendarId, array $eventData)
    {
        return $this->makeRequest(
            'post',
            "{$this->baseUrl}/calendars/{$calendarId}/events",
            $eventData,
            $this->getAuthHeaders(),
            'create_event'
        );
    }

    /**
     * Update calendar event
     */
    public function updateEvent($calendarId, $eventId, array $eventData)
    {
        return $this->makeRequest(
            'put',
            "{$this->baseUrl}/calendars/{$calendarId}/events/{$eventId}",
            $eventData,
            $this->getAuthHeaders(),
            'update_event'
        );
    }

    /**
     * Delete calendar event
     */
    public function deleteEvent($calendarId, $eventId)
    {
        return $this->makeRequest(
            'delete',
            "{$this->baseUrl}/calendars/{$calendarId}/events/{$eventId}",
            [],
            $this->getAuthHeaders(),
            'delete_event'
        );
    }

    /**
     * Delete task event from calendar
     */
    public function deleteTaskEvent(Task $task, $calendarId = 'primary')
    {
        $eventId = $this->getTaskEventId($task);

        if ($eventId) {
            $this->deleteEvent($calendarId, $eventId);

            // Remove event ID from metadata
            $metadata = $task->metadata ?? [];
            unset($metadata['google_calendar_event_id']);
            $task->update(['metadata' => $metadata]);

            return true;
        }

        return false;
    }

    /**
     * Get task event ID from metadata
     */
    protected function getTaskEventId(Task $task)
    {
        return $task->metadata['google_calendar_event_id'] ?? null;
    }

    /**
     * Get project event ID from metadata
     */
    protected function getProjectEventId(Project $project)
    {
        return $project->metadata['google_calendar_event_id'] ?? null;
    }

    /**
     * Get HTTP client
     */
    protected function getClient()
    {
        return Http::withHeaders($this->getAuthHeaders());
    }

    /**
     * List calendars
     */
    public function listCalendars()
    {
        $response = $this->makeRequest(
            'get',
            "{$this->baseUrl}/users/me/calendarList",
            [],
            $this->getAuthHeaders(),
            'list_calendars'
        );

        return $response['items'] ?? [];
    }

    /**
     * Get upcoming events
     */
    public function getUpcomingEvents($calendarId = 'primary', $maxResults = 10)
    {
        $response = $this->makeRequest(
            'get',
            "{$this->baseUrl}/calendars/{$calendarId}/events?" . http_build_query([
                'timeMin' => now()->toIso8601String(),
                'maxResults' => $maxResults,
                'singleEvents' => true,
                'orderBy' => 'startTime'
            ]),
            [],
            $this->getAuthHeaders(),
            'get_upcoming_events'
        );

        return $response['items'] ?? [];
    }
}
