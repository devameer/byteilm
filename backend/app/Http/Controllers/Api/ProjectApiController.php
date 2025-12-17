<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectApiController extends Controller
{
    public function __construct()
    {
        $this->middleware('usage.limit:projects')->only(['store']);
    }

    /**
     * Get all projects
     */
    public function index(Request $request)
    {
        $query = Project::with(['tasks' => function ($taskQuery) {
            $taskQuery->orderBy('scheduled_date')->orderBy('order');
        }])->withCount('tasks');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search
        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        $projects = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => ProjectResource::collection($projects),
        ]);
    }

    /**
     * Get single project
     */
    public function show($id)
    {
        $project = Project::with(['tasks' => function($query) {
            $query->orderBy('scheduled_date')->orderBy('order');
        }])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new ProjectResource($project),
        ]);
    }

    /**
     * Create new project
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,completed,on_hold,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'progress' => 'nullable|integer|min:0|max:100',
            'color' => 'nullable|string|max:20',
        ]);

        $project = Project::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'priority' => $validated['priority'] ?? 'medium',
            'start_date' => $validated['start_date'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'progress' => $validated['progress'] ?? 0,
            'color' => $validated['color'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء المشروع بنجاح',
            'data' => new ProjectResource($project),
        ], 201);
    }

    /**
     * Update project
     */
    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,completed,on_hold,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'progress' => 'nullable|integer|min:0|max:100',
            'color' => 'nullable|string|max:20',
        ]);

        $project->fill($validated);

        if ($project->status === 'completed') {
            $project->completed_at = $project->completed_at ?? now();
            $project->progress = 100;
        } elseif (array_key_exists('status', $validated) && $validated['status'] !== 'completed') {
            $project->completed_at = null;
        }

        $project->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث المشروع بنجاح',
            'data' => new ProjectResource($project),
        ]);
    }

    /**
     * Delete project
     */
    public function destroy($id)
    {
        $project = Project::findOrFail($id);
        $project->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المشروع بنجاح',
        ]);
    }

    /**
     * Toggle project status
     */
    public function toggleStatus($id)
    {
        $project = Project::findOrFail($id);

        if ($project->status === 'completed') {
            $project->status = 'active';
            $project->completed_at = null;
            $project->progress = min($project->progress, 99);
        } else {
            $project->status = 'completed';
            $project->completed_at = now();
            $project->progress = 100;
        }

        $project->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تغيير حالة المشروع',
            'data' => new ProjectResource($project),
        ]);
    }

    /**
     * Update project progress
     */
    public function updateProgress(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $validated = $request->validate([
            'progress' => 'required|integer|min:0|max:100',
        ]);

        $project->progress = $validated['progress'];

        if ($project->progress >= 100) {
            $project->status = 'completed';
            $project->completed_at = now();
        }

        $project->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث تقدم المشروع',
            'data' => new ProjectResource($project),
        ]);
    }

    /**
     * Get project statistics
     */
    public function statistics($id)
    {
        $project = Project::with(['tasks'])->findOrFail($id);

        $totalTasks = $project->tasks->count();
        $completedTasks = $project->tasks->where('status', 'completed')->count();
        $pendingTasks = $project->tasks->where('status', 'pending')->count();
        $inProgressTasks = $project->tasks->where('status', 'in_progress')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'pending_tasks' => $pendingTasks,
                'in_progress_tasks' => $inProgressTasks,
                'progress' => $project->progress,
                'status' => $project->status,
            ],
        ]);
    }

    /**
     * Get all projects statistics
     */
    public function getAllStatistics()
    {
        $total = Project::count();
        $active = Project::where('status', 'active')->count();
        $completed = Project::where('status', 'completed')->count();
        $onHold = Project::where('status', 'on_hold')->count();
        $cancelled = Project::where('status', 'cancelled')->count();
        $avgProgress = Project::avg('progress') ?? 0;

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'active' => $active,
                'completed' => $completed,
                'on_hold' => $onHold,
                'cancelled' => $cancelled,
                'avg_progress' => round($avgProgress, 2),
            ],
        ]);
    }

    /**
     * Archive project
     */
    public function archive($id)
    {
        $project = Project::findOrFail($id);
        $project->status = 'cancelled';
        $project->save();

        return response()->json([
            'success' => true,
            'message' => 'تم أرشفة المشروع بنجاح',
            'data' => new ProjectResource($project),
        ]);
    }

    /**
     * Duplicate project
     */
    public function duplicate($id)
    {
        $original = Project::with('tasks')->findOrFail($id);

        $duplicate = $original->replicate();
        $duplicate->name = $original->name . ' (نسخة)';
        $duplicate->status = 'active';
        $duplicate->progress = 0;
        $duplicate->completed_at = null;
        $duplicate->save();

        foreach ($original->tasks as $task) {
            $newTask = $task->replicate();
            $newTask->project_id = $duplicate->id;
            $newTask->status = 'pending';
            $newTask->completed_at = null;
            $newTask->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'تم نسخ المشروع بنجاح',
            'data' => new ProjectResource($duplicate->load('tasks')),
        ]);
    }
}

