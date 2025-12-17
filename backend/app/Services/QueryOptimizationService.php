<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class QueryOptimizationService
{
    protected $cacheService;

    public function __construct(CacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * Get courses with optimized eager loading
     * Solves N+1 query problem by loading all related data in 2-3 queries instead of N+1
     */
    public function getCoursesWithRelations($userId, $includeInactive = false)
    {
        $cacheKey = "user:{$userId}:courses:" . ($includeInactive ? 'all' : 'active');

        return $this->cacheService->remember($cacheKey, CacheService::CACHE_MEDIUM, function () use ($userId, $includeInactive) {
            $query = DB::table('courses')
                ->select([
                    'courses.*',
                    DB::raw('COUNT(DISTINCT lessons.id) as lessons_count'),
                    DB::raw('COUNT(DISTINCT course_enrollments.id) as students_count'),
                    'categories.name as category_name',
                    'categories.icon as category_icon'
                ])
                ->leftJoin('lessons', 'courses.id', '=', 'lessons.course_id')
                ->leftJoin('course_enrollments', 'courses.id', '=', 'course_enrollments.course_id')
                ->leftJoin('categories', 'courses.category_id', '=', 'categories.id')
                ->where('courses.user_id', $userId);

            if (!$includeInactive) {
                $query->where('courses.active', true);
            }

            return $query->groupBy([
                    'courses.id',
                    'courses.user_id',
                    'courses.category_id',
                    'courses.title',
                    'courses.description',
                    'courses.image',
                    'courses.active',
                    'courses.created_at',
                    'courses.updated_at',
                    'categories.name',
                    'categories.icon'
                ])
                ->orderBy('courses.created_at', 'desc')
                ->get();
        });
    }

    /**
     * Get projects with team members and task counts
     * Uses JOIN instead of multiple queries
     */
    public function getProjectsWithStats($userId)
    {
        return $this->cacheService->rememberUser('projects_stats', $userId, CacheService::CACHE_MEDIUM, function () use ($userId) {
            return DB::table('projects')
                ->select([
                    'projects.*',
                    DB::raw('COUNT(DISTINCT tasks.id) as total_tasks'),
                    DB::raw('COUNT(DISTINCT CASE WHEN tasks.status = "completed" THEN tasks.id END) as completed_tasks'),
                    DB::raw('COUNT(DISTINCT CASE WHEN tasks.status = "in_progress" THEN tasks.id END) as in_progress_tasks'),
                    DB::raw('COUNT(DISTINCT team_members.id) as team_members_count'),
                    DB::raw('GROUP_CONCAT(DISTINCT CONCAT(users.name, ":", users.avatar) SEPARATOR ",") as team_members_data')
                ])
                ->leftJoin('tasks', 'projects.id', '=', 'tasks.project_id')
                ->leftJoin('team_members', 'projects.team_id', '=', 'team_members.team_id')
                ->leftJoin('users', 'team_members.user_id', '=', 'users.id')
                ->where('projects.user_id', $userId)
                ->groupBy([
                    'projects.id',
                    'projects.user_id',
                    'projects.team_id',
                    'projects.title',
                    'projects.description',
                    'projects.status',
                    'projects.start_date',
                    'projects.end_date',
                    'projects.progress',
                    'projects.created_at',
                    'projects.updated_at'
                ])
                ->orderBy('projects.created_at', 'desc')
                ->get()
                ->map(function ($project) {
                    // Parse team members data
                    if ($project->team_members_data) {
                        $members = explode(',', $project->team_members_data);
                        $project->team_members = collect($members)->map(function ($member) {
                            list($name, $avatar) = explode(':', $member);
                            return ['name' => $name, 'avatar' => $avatar];
                        });
                    } else {
                        $project->team_members = [];
                    }
                    unset($project->team_members_data);

                    // Calculate completion percentage
                    $project->completion_rate = $project->total_tasks > 0
                        ? round(($project->completed_tasks / $project->total_tasks) * 100, 2)
                        : 0;

                    return $project;
                });
        });
    }

    /**
     * Get tasks with all related data in a single optimized query
     */
    public function getTasksWithDetails($projectId = null, $userId = null)
    {
        $cacheKey = $projectId
            ? "project:{$projectId}:tasks_details"
            : "user:{$userId}:tasks_details";

        return $this->cacheService->remember($cacheKey, CacheService::CACHE_SHORT, function () use ($projectId, $userId) {
            $query = DB::table('tasks')
                ->select([
                    'tasks.*',
                    'projects.title as project_title',
                    'projects.status as project_status',
                    'assigned_user.name as assigned_to_name',
                    'assigned_user.avatar as assigned_to_avatar',
                    'creator.name as created_by_name',
                    DB::raw('COUNT(DISTINCT task_comments.id) as comments_count'),
                    DB::raw('COUNT(DISTINCT task_attachments.id) as attachments_count'),
                    DB::raw('COUNT(DISTINCT subtasks.id) as subtasks_count'),
                    DB::raw('COUNT(DISTINCT CASE WHEN subtasks.completed = 1 THEN subtasks.id END) as completed_subtasks_count')
                ])
                ->leftJoin('projects', 'tasks.project_id', '=', 'projects.id')
                ->leftJoin('users as assigned_user', 'tasks.assigned_to', '=', 'assigned_user.id')
                ->leftJoin('users as creator', 'tasks.user_id', '=', 'creator.id')
                ->leftJoin('task_comments', 'tasks.id', '=', 'task_comments.task_id')
                ->leftJoin('task_attachments', 'tasks.id', '=', 'task_attachments.task_id')
                ->leftJoin('subtasks', 'tasks.id', '=', 'subtasks.task_id');

            if ($projectId) {
                $query->where('tasks.project_id', $projectId);
            }

            if ($userId) {
                $query->where(function ($q) use ($userId) {
                    $q->where('tasks.user_id', $userId)
                      ->orWhere('tasks.assigned_to', $userId);
                });
            }

            return $query->groupBy([
                    'tasks.id',
                    'tasks.project_id',
                    'tasks.user_id',
                    'tasks.assigned_to',
                    'tasks.title',
                    'tasks.description',
                    'tasks.status',
                    'tasks.priority',
                    'tasks.due_date',
                    'tasks.completed_at',
                    'tasks.created_at',
                    'tasks.updated_at',
                    'projects.title',
                    'projects.status',
                    'assigned_user.name',
                    'assigned_user.avatar',
                    'creator.name'
                ])
                ->orderBy('tasks.priority', 'desc')
                ->orderBy('tasks.due_date', 'asc')
                ->get()
                ->map(function ($task) {
                    // Calculate subtasks completion rate
                    $task->subtasks_completion_rate = $task->subtasks_count > 0
                        ? round(($task->completed_subtasks_count / $task->subtasks_count) * 100, 2)
                        : 0;

                    return $task;
                });
        });
    }

    /**
     * Get dashboard statistics with a single optimized query
     */
    public function getDashboardStats($userId)
    {
        return $this->cacheService->rememberUser('dashboard_stats', $userId, CacheService::CACHE_SHORT, function () use ($userId) {
            // Get all stats in parallel using subqueries
            $stats = DB::table('users')
                ->select([
                    DB::raw('(SELECT COUNT(*) FROM projects WHERE user_id = ?) as total_projects', [$userId]),
                    DB::raw('(SELECT COUNT(*) FROM projects WHERE user_id = ? AND status = "in_progress") as active_projects', [$userId]),
                    DB::raw('(SELECT COUNT(*) FROM tasks WHERE user_id = ? OR assigned_to = ?) as total_tasks', [$userId, $userId]),
                    DB::raw('(SELECT COUNT(*) FROM tasks WHERE (user_id = ? OR assigned_to = ?) AND status = "completed") as completed_tasks', [$userId, $userId]),
                    DB::raw('(SELECT COUNT(*) FROM tasks WHERE (user_id = ? OR assigned_to = ?) AND status = "in_progress") as in_progress_tasks', [$userId, $userId]),
                    DB::raw('(SELECT COUNT(*) FROM tasks WHERE assigned_to = ? AND due_date < NOW() AND status != "completed") as overdue_tasks', [$userId]),
                    DB::raw('(SELECT COUNT(*) FROM courses WHERE user_id = ? AND active = 1) as active_courses', [$userId]),
                    DB::raw('(SELECT COUNT(DISTINCT course_enrollments.id) FROM course_enrollments JOIN courses ON courses.id = course_enrollments.course_id WHERE courses.user_id = ?) as total_students', [$userId]),
                    DB::raw('(SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read_at IS NULL) as unread_notifications', [$userId]),
                    DB::raw('(SELECT COUNT(DISTINCT team_members.team_id) FROM team_members WHERE user_id = ?) as teams_count', [$userId])
                ])
                ->first();

            // Calculate completion rates
            $stats->tasks_completion_rate = $stats->total_tasks > 0
                ? round(($stats->completed_tasks / $stats->total_tasks) * 100, 2)
                : 0;

            return $stats;
        });
    }

    /**
     * Get notifications with sender info in one query
     */
    public function getNotificationsWithDetails($userId, $limit = 20, $unreadOnly = false)
    {
        $cacheKey = "user:{$userId}:notifications:" . ($unreadOnly ? 'unread' : 'all') . ":{$limit}";

        return $this->cacheService->remember($cacheKey, CacheService::CACHE_SHORT, function () use ($userId, $limit, $unreadOnly) {
            $query = DB::table('notifications')
                ->select([
                    'notifications.*',
                    'users.name as sender_name',
                    'users.avatar as sender_avatar',
                    'users.email as sender_email'
                ])
                ->leftJoin('users', 'notifications.data->sender_id', '=', 'users.id')
                ->where('notifications.user_id', $userId);

            if ($unreadOnly) {
                $query->whereNull('notifications.read_at');
            }

            return $query->orderBy('notifications.created_at', 'desc')
                ->limit($limit)
                ->get();
        });
    }

    /**
     * Batch update to reduce multiple UPDATE queries to one
     */
    public function batchUpdateTaskStatus(array $taskIds, string $status)
    {
        // Clear cache for affected tasks
        foreach ($taskIds as $taskId) {
            $this->cacheService->forget("task:{$taskId}");
        }

        // Single UPDATE query for all tasks
        return DB::table('tasks')
            ->whereIn('id', $taskIds)
            ->update([
                'status' => $status,
                'updated_at' => now(),
                'completed_at' => $status === 'completed' ? now() : null
            ]);
    }

    /**
     * Batch insert for better performance
     */
    public function batchInsertNotifications(array $notifications)
    {
        // Prepare all notifications with timestamps
        $preparedNotifications = collect($notifications)->map(function ($notification) {
            return array_merge($notification, [
                'id' => \Illuminate\Support\Str::uuid(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        })->toArray();

        // Single INSERT query for all notifications
        return DB::table('notifications')->insert($preparedNotifications);
    }

    /**
     * Clear all query caches for a user
     */
    public function clearUserCache($userId)
    {
        $patterns = [
            "user:{$userId}:*",
            "project:*:tasks_details",
            "task:*"
        ];

        foreach ($patterns as $pattern) {
            $this->cacheService->forget($pattern);
        }
    }

    /**
     * Get query execution statistics (for debugging)
     */
    public function enableQueryLog()
    {
        DB::enableQueryLog();
    }

    public function getQueryLog()
    {
        return DB::getQueryLog();
    }

    public function getSlowQueries($threshold = 100) // threshold in milliseconds
    {
        return collect(DB::getQueryLog())->filter(function ($query) use ($threshold) {
            return $query['time'] > $threshold;
        });
    }
}
