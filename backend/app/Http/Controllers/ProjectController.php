<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProjectController extends BaseController
{
    /**
     * Display a listing of projects
     */
    public function index(Request $request)
    {
        $status = $request->input('status', 'all');

        $query = Project::withCount(['tasks', 'pendingTasks', 'completedTasks'])
            ->orderBy('order')
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $projects = $query->get();

        return view('projects.index', compact('projects', 'status'));
    }

    /**
     * Show the form for creating a new project
     */
    public function create()
    {
        return view('projects.create');
    }

    /**
     * Store a newly created project
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:active,completed,on_hold,cancelled',
            'priority' => 'in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'color' => 'nullable|string|max:7',
        ]);

        try {
            $project = Project::create($validated);

            if ($request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم إنشاء المشروع بنجاح',
                    'project' => $project
                ]);
            }

            return redirect()->route('projects.show', $project)
                ->with('success', 'تم إنشاء المشروع بنجاح');
        } catch (\Exception $e) {
            Log::error('Error creating project: ' . $e->getMessage());

            if ($request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'حدث خطأ أثناء إنشاء المشروع'
                ], 500);
            }

            return redirect()->back()
                ->withInput()
                ->with('error', 'حدث خطأ أثناء إنشاء المشروع');
        }
    }

    /**
     * Display the specified project
     */
    public function show(Project $project)
    {
        $project->load(['tasks' => function ($query) {
            $query->orderBy('order')->orderBy('created_at');
        }]);

        $stats = [
            'total_tasks' => $project->tasks()->count(),
            'pending_tasks' => $project->pendingTasks()->count(),
            'in_progress_tasks' => $project->tasks()->where('status', 'in_progress')->count(),
            'completed_tasks' => $project->completedTasks()->count(),
        ];

        return view('projects.show', compact('project', 'stats'));
    }

    /**
     * Show the form for editing the specified project
     */
    public function edit(Project $project)
    {
        return view('projects.edit', compact('project'));
    }

    /**
     * Update the specified project
     */
    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:active,completed,on_hold,cancelled',
            'priority' => 'in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'color' => 'nullable|string|max:7',
            'progress' => 'nullable|integer|min:0|max:100',
        ]);

        try {
            $project->update($validated);

            if ($request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم تحديث المشروع بنجاح',
                    'project' => $project
                ]);
            }

            return redirect()->route('projects.show', $project)
                ->with('success', 'تم تحديث المشروع بنجاح');
        } catch (\Exception $e) {
            Log::error('Error updating project: ' . $e->getMessage());

            if ($request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'حدث خطأ أثناء تحديث المشروع'
                ], 500);
            }

            return redirect()->back()
                ->withInput()
                ->with('error', 'حدث خطأ أثناء تحديث المشروع');
        }
    }

    /**
     * Remove the specified project
     */
    public function destroy(Request $request, Project $project)
    {
        try {
            $project->delete();

            if ($request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم حذف المشروع بنجاح'
                ]);
            }

            return redirect()->route('projects.index')
                ->with('success', 'تم حذف المشروع بنجاح');
        } catch (\Exception $e) {
            Log::error('Error deleting project: ' . $e->getMessage());

            if ($request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'حدث خطأ أثناء حذف المشروع'
                ], 500);
            }

            return redirect()->back()
                ->with('error', 'حدث خطأ أثناء حذف المشروع');
        }
    }

    /**
     * Toggle project status
     */
    public function toggleStatus(Request $request, Project $project)
    {
        try {
            if ($project->status === 'completed') {
                $project->status = 'active';
                $project->completed_at = null;
            } else {
                $project->markAsCompleted();
            }

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث حالة المشروع',
                'project' => $project
            ]);
        } catch (\Exception $e) {
            Log::error('Error toggling project status: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث الحالة'
            ], 500);
        }
    }

    /**
     * Update project progress
     */
    public function updateProgress(Project $project)
    {
        try {
            $project->updateProgress();

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث التقدم',
                'progress' => $project->progress
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating project progress: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث التقدم'
            ], 500);
        }
    }
}
