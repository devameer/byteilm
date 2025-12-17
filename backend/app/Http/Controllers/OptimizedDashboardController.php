<?php

namespace App\Http\Controllers;

use App\Services\QueryOptimizationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OptimizedDashboardController extends Controller
{
    protected $queryOptimization;

    public function __construct(QueryOptimizationService $queryOptimization)
    {
        $this->queryOptimization = $queryOptimization;
    }

    /**
     * Get dashboard statistics (optimized)
     * Single query instead of multiple queries
     */
    public function getStats(Request $request)
    {
        $userId = Auth::id();

        $stats = $this->queryOptimization->getDashboardStats($userId);

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get user's courses with all related data (optimized)
     * 2-3 queries instead of N+1 queries
     */
    public function getCourses(Request $request)
    {
        $userId = Auth::id();
        $includeInactive = $request->boolean('include_inactive', false);

        $courses = $this->queryOptimization->getCoursesWithRelations($userId, $includeInactive);

        return response()->json([
            'success' => true,
            'data' => $courses
        ]);
    }

    /**
     * Get projects with team members and statistics (optimized)
     * Uses JOIN instead of multiple queries
     */
    public function getProjects(Request $request)
    {
        $userId = Auth::id();

        $projects = $this->queryOptimization->getProjectsWithStats($userId);

        return response()->json([
            'success' => true,
            'data' => $projects
        ]);
    }

    /**
     * Get tasks with all details (optimized)
     * Single complex query instead of multiple queries
     */
    public function getTasks(Request $request)
    {
        $userId = Auth::id();
        $projectId = $request->input('project_id');

        $tasks = $this->queryOptimization->getTasksWithDetails($projectId, $userId);

        return response()->json([
            'success' => true,
            'data' => $tasks
        ]);
    }

    /**
     * Get notifications with sender details (optimized)
     */
    public function getNotifications(Request $request)
    {
        $userId = Auth::id();
        $limit = $request->input('limit', 20);
        $unreadOnly = $request->boolean('unread_only', false);

        $notifications = $this->queryOptimization->getNotificationsWithDetails($userId, $limit, $unreadOnly);

        return response()->json([
            'success' => true,
            'data' => $notifications
        ]);
    }

    /**
     * Batch update task status (optimized)
     * Single UPDATE instead of multiple UPDATEs
     */
    public function batchUpdateTasks(Request $request)
    {
        $request->validate([
            'task_ids' => 'required|array',
            'task_ids.*' => 'required|integer|exists:tasks,id',
            'status' => 'required|in:pending,in_progress,completed,cancelled'
        ]);

        $affected = $this->queryOptimization->batchUpdateTaskStatus(
            $request->task_ids,
            $request->status
        );

        return response()->json([
            'success' => true,
            'message' => "تم تحديث {$affected} مهمة بنجاح",
            'affected' => $affected
        ]);
    }

    /**
     * Clear user cache
     */
    public function clearCache(Request $request)
    {
        $userId = Auth::id();

        $this->queryOptimization->clearUserCache($userId);

        return response()->json([
            'success' => true,
            'message' => 'تم مسح الكاش بنجاح'
        ]);
    }

    /**
     * Get slow queries (for debugging - admin only)
     */
    public function getSlowQueries(Request $request)
    {
        // Enable query log
        $this->queryOptimization->enableQueryLog();

        // Simulate some operations
        $userId = Auth::id();
        $this->queryOptimization->getDashboardStats($userId);
        $this->queryOptimization->getCoursesWithRelations($userId);
        $this->queryOptimization->getProjectsWithStats($userId);

        // Get slow queries
        $threshold = $request->input('threshold', 100); // milliseconds
        $slowQueries = $this->queryOptimization->getSlowQueries($threshold);

        return response()->json([
            'success' => true,
            'threshold' => $threshold . 'ms',
            'slow_queries_count' => $slowQueries->count(),
            'queries' => $slowQueries
        ]);
    }
}
