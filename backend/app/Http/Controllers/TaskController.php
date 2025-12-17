<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class TaskController extends BaseController
{
    /**
     * Display a listing of tasks
     */
    public function index(Request $request)
    {
        $filter = $request->input('filter', 'all'); // all, today, tomorrow, pending, completed, standalone
        $projectId = $request->input('project_id');

        $query = Task::with(['project', 'lesson.course', 'course'])
            ->orderBy('scheduled_date')
            ->orderBy('order')
            ->orderBy('created_at');

        // Filter: Show only tasks/lessons from active courses
        // If task has course_id, check course is active
        // If task has lesson_id, check lesson's course is active
        $query->where(function($q) {
            $q->where(function($subQ) {
                // Tasks with course: course must be active
                $subQ->whereNotNull('course_id')
                     ->whereHas('course', function($courseQ) {
                         $courseQ->where('active', true);
                     });
            })
            ->orWhere(function($subQ) {
                // Tasks with lesson: lesson's course must be active
                $subQ->whereNotNull('lesson_id')
                     ->whereHas('lesson.course', function($courseQ) {
                         $courseQ->where('active', true);
                     });
            })
            ->orWhere(function($subQ) {
                // Tasks without course or lesson (standalone or project-only)
                $subQ->whereNull('course_id')
                     ->whereNull('lesson_id');
            });
        });

        // تطبيق الفلاتر
        switch ($filter) {
            case 'today':
                $query->whereDate('scheduled_date', Carbon::today());
                break;
            case 'tomorrow':
                $query->whereDate('scheduled_date', Carbon::tomorrow());
                break;
            case 'pending':
                $query->where('status', 'pending');
                break;
            case 'in_progress':
                $query->where('status', 'in_progress');
                break;
            case 'completed':
                $query->where('status', 'completed');
                break;
            case 'standalone':
                $query->standalone();
                break;
            case 'overdue':
                $query->overdue();
                break;
        }

        if ($projectId) {
            $query->where('project_id', $projectId);
        }

        $tasks = $query->get();
        $projects = Project::active()->get();
        $courses = Course::where('active', true)->orderBy('name')->get();

        return view('tasks.index', compact('tasks', 'filter', 'projects', 'projectId', 'courses'));
    }

    /**
     * Filter tasks via AJAX
     */
    public function filter(Request $request)
    {
        $query = Task::with(['project', 'lesson.course', 'course']);

        // Filter: Show only tasks/lessons from active courses
        $query->where(function($q) {
            $q->where(function($subQ) {
                // Tasks with course: course must be active
                $subQ->whereNotNull('course_id')
                     ->whereHas('course', function($courseQ) {
                         $courseQ->where('active', true);
                     });
            })
            ->orWhere(function($subQ) {
                // Tasks with lesson: lesson's course must be active
                $subQ->whereNotNull('lesson_id')
                     ->whereHas('lesson.course', function($courseQ) {
                         $courseQ->where('active', true);
                     });
            })
            ->orWhere(function($subQ) {
                // Tasks without course or lesson (standalone or project-only)
                $subQ->whereNull('course_id')
                     ->whereNull('lesson_id');
            });
        });

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Priority filter
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        // Project filter
        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        // Course filter (only active courses)
        if ($request->filled('course_id')) {
            $query->where('course_id', $request->course_id)
                  ->whereHas('course', function($q) {
                      $q->where('active', true);
                  });
        }

        // Lesson filter (only lessons from active courses)
        if ($request->filled('lesson_id')) {
            $query->where('lesson_id', $request->lesson_id)
                  ->whereHas('lesson.course', function($q) {
                      $q->where('active', true);
                  });
        }

        // Is Lesson filter (تمييز الدروس عن المهام)
        if ($request->filled('is_lesson')) {
            $query->where('is_lesson', $request->is_lesson === 'true' || $request->is_lesson === '1');
        }

        // Type filter (standalone, project, course, lesson)
        if ($request->filled('type')) {
            switch ($request->type) {
                case 'standalone':
                    $query->standalone();
                    break;
                case 'project':
                    $query->whereNotNull('project_id');
                    break;
                case 'course':
                    $query->whereNotNull('course_id');
                    break;
                case 'lesson':
                    $query->whereNotNull('lesson_id');
                    break;
            }
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('scheduled_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('scheduled_date', '<=', $request->date_to);
        }

        // Quick date filters
        if ($request->filled('quick_date')) {
            switch ($request->quick_date) {
                case 'today':
                    $query->whereDate('scheduled_date', Carbon::today());
                    break;
                case 'tomorrow':
                    $query->whereDate('scheduled_date', Carbon::tomorrow());
                    break;
                case 'this_week':
                    $query->whereBetween('scheduled_date', [
                        Carbon::now()->startOfWeek(),
                        Carbon::now()->endOfWeek()
                    ]);
                    break;
                case 'next_week':
                    $query->whereBetween('scheduled_date', [
                        Carbon::now()->addWeek()->startOfWeek(),
                        Carbon::now()->addWeek()->endOfWeek()
                    ]);
                    break;
                case 'overdue':
                    $query->overdue();
                    break;
            }
        }

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Tags filter
        if ($request->filled('tags')) {
            $tags = explode(',', $request->tags);
            foreach ($tags as $tag) {
                $query->whereJsonContains('tags', trim($tag));
            }
        }

        // Order by
        $orderBy = $request->input('order_by', 'scheduled_date');
        $orderDirection = $request->input('order_direction', 'asc');

        if ($orderBy === 'priority') {
            $query->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')");
        } else {
            $query->orderBy($orderBy, $orderDirection);
        }

        $tasks = $query->get();

        // Statistics
        $stats = [
            'total' => $tasks->count(),
            'pending' => $tasks->where('status', 'pending')->count(),
            'in_progress' => $tasks->where('status', 'in_progress')->count(),
            'completed' => $tasks->where('status', 'completed')->count(),
            'cancelled' => $tasks->where('status', 'cancelled')->count(),
            'today' => $tasks->filter(fn($t) => $t->scheduled_date && $t->scheduled_date->isToday())->count(),
            'overdue' => $tasks->filter(fn($t) => $t->due_date && $t->due_date->isPast() && $t->status !== 'completed')->count(),
            'lessons' => $tasks->where('is_lesson', true)->count(),
            'regular_tasks' => $tasks->where('is_lesson', false)->count(),
        ];

        return response()->json([
            'success' => true,
            'tasks' => $tasks,
            'stats' => $stats,
            'count' => $tasks->count()
        ]);
    }

    /**
     * Show the form for creating a new task
     */
    public function create(Request $request)
    {
        $projects = Project::active()->orderBy('name')->get();
        $courses = Course::where('active', true)->orderBy('name')->get();

        // Don't load all lessons - they will be loaded via AJAX when course is selected
        $lessons = collect([]);

        // If lesson_id is provided, load that specific lesson with its course
        $selectedLessonId = $request->input('lesson_id');
        if ($selectedLessonId) {
            $selectedLesson = Lesson::with('course')->find($selectedLessonId);
            if ($selectedLesson) {
                $lessons = collect([$selectedLesson]);
            }
        }

        $selectedProjectId = $request->input('project_id');
        $selectedCourseId = $request->input('course_id');

        return view('tasks.create', compact(
            'projects',
            'courses',
            'lessons',
            'selectedProjectId',
            'selectedCourseId',
            'selectedLessonId'
        ));
    }

    /**
     * Store a newly created task
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'nullable|exists:projects,id',
            'lesson_id' => 'nullable|exists:lessons,id',
            'course_id' => 'nullable|exists:courses,id',
            'is_lesson' => 'nullable|boolean',
            'status' => 'in:pending,in_progress,completed,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'scheduled_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'type' => 'nullable|string|max:50',
            'estimated_duration' => 'nullable|integer|min:1',
            'link' => 'nullable|url|max:500',
            'tags' => 'nullable|string',
            'order' => 'nullable|integer|min:0',
        ]);

        // Convert tags from comma-separated string to array
        if (isset($validated['tags']) && is_string($validated['tags'])) {
            $validated['tags'] = array_map('trim', explode(',', $validated['tags']));
            $validated['tags'] = array_filter($validated['tags']); // Remove empty values
        }

        // Handle source_type - clear other source fields based on selection
        $sourceType = $request->input('source_type', 'none');
        if ($sourceType === 'none') {
            $validated['project_id'] = null;
            $validated['course_id'] = null;
            $validated['lesson_id'] = null;
        } elseif ($sourceType === 'project') {
            $validated['course_id'] = null;
            $validated['lesson_id'] = null;
        } elseif ($sourceType === 'course') {
            $validated['project_id'] = null;
            $validated['lesson_id'] = null;
        } elseif ($sourceType === 'lesson') {
            $validated['project_id'] = null;
            $validated['course_id'] = null;
        }

        try {
            // Check if this lesson already has a pending or in-progress task
            if (isset($validated['lesson_id']) && $validated['lesson_id']) {
                $existingTask = Task::where('lesson_id', $validated['lesson_id'])
                    ->where('is_lesson', true)
                    ->whereIn('status', ['pending', 'in_progress'])
                    ->first();

                if ($existingTask) {
                    if ($request->expectsJson() || $request->ajax()) {
                        return response()->json([
                            'success' => false,
                            'message' => 'هذا الدرس مجدول بالفعل في المهام'
                        ], 422);
                    }

                    return redirect()->back()
                        ->withInput()
                        ->with('error', 'هذا الدرس مجدول بالفعل في المهام');
                }
            }

            $task = Task::create($validated);

            // Update project progress if task belongs to a project
            if ($task->project_id) {
                $task->project->updateProgress();
            }

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم إضافة المهمة بنجاح',
                    'task' => $task->load(['project', 'lesson', 'course'])
                ]);
            }

            $redirectRoute = $task->project_id
                ? route('projects.show', $task->project_id)
                : route('tasks.index');

            return redirect($redirectRoute)
                ->with('success', 'تم إضافة المهمة بنجاح');
        } catch (\Exception $e) {
            Log::error('Error creating task: ' . $e->getMessage());

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'حدث خطأ أثناء إضافة المهمة'
                ], 500);
            }

            return redirect()->back()
                ->withInput()
                ->with('error', 'حدث خطأ أثناء إضافة المهمة');
        }
    }

    /**
     * Display the specified task
     */
    public function show(Task $task)
    {
        $task->load(['project', 'lesson.course', 'course']);

        return view('tasks.show', compact('task'));
    }

    /**
     * Show the form for editing the specified task
     */
    public function edit(Task $task)
    {
        // Load task with its relationships
        $task->load(['lesson.course', 'project', 'course']);

        $projects = Project::active()->orderBy('name')->get();
        $courses = Course::where('active', true)->orderBy('name')->get();

        // Load lessons only if task has a lesson_id (for editing existing selection)
        $lessons = collect([]);
        if ($task->lesson_id && $task->lesson) {
            $lessons = collect([$task->lesson]);
        }

        return view('tasks.edit', compact('task', 'projects', 'courses', 'lessons'));
    }

    /**
     * Update the specified task
     */
    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'nullable|exists:projects,id',
            'lesson_id' => 'nullable|exists:lessons,id',
            'course_id' => 'nullable|exists:courses,id',
            'status' => 'in:pending,in_progress,completed,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'scheduled_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'type' => 'nullable|string|max:50',
            'estimated_duration' => 'nullable|integer|min:1',
            'actual_duration' => 'nullable|integer|min:1',
            'link' => 'nullable|url|max:500',
            'tags' => 'nullable|string',
            'order' => 'nullable|integer|min:0',
        ]);

        // Convert tags from comma-separated string to array
        if (isset($validated['tags']) && is_string($validated['tags'])) {
            $validated['tags'] = array_map('trim', explode(',', $validated['tags']));
            $validated['tags'] = array_filter($validated['tags']); // Remove empty values
        }

        // Handle source_type - clear other source fields based on selection
        $sourceType = $request->input('source_type', 'none');
        if ($sourceType === 'none') {
            $validated['project_id'] = null;
            $validated['course_id'] = null;
            $validated['lesson_id'] = null;
        } elseif ($sourceType === 'project') {
            $validated['course_id'] = null;
            $validated['lesson_id'] = null;
        } elseif ($sourceType === 'course') {
            $validated['project_id'] = null;
            $validated['lesson_id'] = null;
        } elseif ($sourceType === 'lesson') {
            $validated['project_id'] = null;
            $validated['course_id'] = null;
        }

        try {
            $oldProjectId = $task->project_id;
            $oldStatus = $task->status;

            $task->update($validated);

            // Update old and new project progress if changed
            if ($oldProjectId && $oldProjectId !== $task->project_id) {
                Project::find($oldProjectId)->updateProgress();
            }

            if ($task->project_id) {
                $task->project->updateProgress();
            }

            // If status changed to completed and this is a lesson task, mark the lesson as completed
            if ($oldStatus !== 'completed' && $task->status === 'completed') {
                if ($task->is_lesson && $task->lesson_id && $task->lesson) {
                    $task->lesson->update(['completed' => true]);
                }
            }

            // If status changed from completed to something else and this is a lesson task, mark the lesson as not completed
            if ($oldStatus === 'completed' && $task->status !== 'completed') {
                if ($task->is_lesson && $task->lesson_id && $task->lesson) {
                    $task->lesson->update(['completed' => false]);
                }
            }

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم تحديث المهمة بنجاح',
                    'task' => $task->load(['project', 'lesson', 'course'])
                ]);
            }

            return redirect()->route('tasks.show', $task)
                ->with('success', 'تم تحديث المهمة بنجاح');
        } catch (\Exception $e) {
            Log::error('Error updating task: ' . $e->getMessage());

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'حدث خطأ أثناء تحديث المهمة'
                ], 500);
            }

            return redirect()->back()
                ->withInput()
                ->with('error', 'حدث خطأ أثناء تحديث المهمة');
        }
    }

    /**
     * Remove the specified task
     */
    public function destroy(Request $request, Task $task)
    {
        try {
            $projectId = $task->project_id;

            $task->delete();

            // Update project progress
            if ($projectId) {
                Project::find($projectId)->updateProgress();
            }

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم حذف المهمة بنجاح'
                ]);
            }

            return redirect()->route('tasks.index')
                ->with('success', 'تم حذف المهمة بنجاح');
        } catch (\Exception $e) {
            Log::error('Error deleting task: ' . $e->getMessage());

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'حدث خطأ أثناء حذف المهمة'
                ], 500);
            }

            return redirect()->back()
                ->with('error', 'حدث خطأ أثناء حذف المهمة');
        }
    }

    /**
     * Toggle task status (pending <-> completed)
     */
    public function toggleStatus(Request $request, Task $task)
    {
        try {
            if ($task->status === 'completed') {
                $task->markAsNotCompleted();
                $message = 'تم إلغاء اكتمال المهمة';
            } else {
                $task->markAsCompleted();
                $message = 'تم اكتمال المهمة';
            }

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'task' => $task
                ]);
            }

            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            Log::error('Error toggling task status: ' . $e->getMessage());

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'حدث خطأ أثناء تحديث الحالة'
                ], 500);
            }

            return redirect()->back()->with('error', 'حدث خطأ أثناء تحديث الحالة');
        }
    }

    /**
     * Start task (set to in_progress)
     */
    public function start(Request $request, Task $task)
    {
        try {
            $task->start();

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم بدء المهمة',
                    'task' => $task
                ]);
            }

            return redirect()->back()->with('success', 'تم بدء المهمة');
        } catch (\Exception $e) {
            Log::error('Error starting task: ' . $e->getMessage());

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'حدث خطأ أثناء بدء المهمة'
                ], 500);
            }

            return redirect()->back()->with('error', 'حدث خطأ أثناء بدء المهمة');
        }
    }

    /**
     * Get lessons for a specific course (AJAX)
     */
    public function getLessonsByCourse(Request $request, $courseId)
    {
        try {
            $lessons = Lesson::where('course_id', $courseId)
                ->whereHas('course', function($q) {
                    $q->where('active', true);
                })
                ->orderBy('order')
                ->orderBy('name')
                ->get(['id', 'name', 'order']);

            return response()->json([
                'success' => true,
                'lessons' => $lessons
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحميل الدروس'
            ], 500);
        }
    }

    /**
     * Update task priority (AJAX)
     */
    public function updatePriority(Request $request, Task $task)
    {
        $request->validate([
            'priority' => 'required|in:low,medium,high,urgent'
        ]);

        try {
            $task->update(['priority' => $request->priority]);

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم تحديث الأولوية بنجاح',
                    'task' => $task
                ]);
            }

            return redirect()->back()->with('success', 'تم تحديث الأولوية بنجاح');
        } catch (\Exception $e) {
            Log::error('Error updating task priority: ' . $e->getMessage());

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'حدث خطأ أثناء تحديث الأولوية'
                ], 500);
            }

            return redirect()->back()->with('error', 'حدث خطأ أثناء تحديث الأولوية');
        }
    }

    /**
     * Duplicate task (AJAX)
     */
    public function duplicate(Request $request, Task $task)
    {
        try {
            $newTask = $task->replicate();
            $newTask->title = $task->title . ' (نسخة)';
            $newTask->status = 'pending';
            $newTask->completed_at = null;
            $newTask->save();

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم نسخ المهمة بنجاح',
                    'task' => $newTask->load(['project', 'lesson', 'course'])
                ]);
            }

            return redirect()->route('tasks.index')->with('success', 'تم نسخ المهمة بنجاح');
        } catch (\Exception $e) {
            Log::error('Error duplicating task: ' . $e->getMessage());

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'حدث خطأ أثناء نسخ المهمة'
                ], 500);
            }

            return redirect()->back()->with('error', 'حدث خطأ أثناء نسخ المهمة');
        }
    }

    /**
     * Reschedule task (AJAX)
     */
    public function reschedule(Request $request, Task $task)
    {
        $request->validate([
            'scheduled_date' => 'required|date'
        ]);

        try {
            $task->update(['scheduled_date' => $request->scheduled_date]);

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم إعادة جدولة المهمة بنجاح',
                    'task' => $task
                ]);
            }

            return redirect()->back()->with('success', 'تم إعادة جدولة المهمة بنجاح');
        } catch (\Exception $e) {
            Log::error('Error rescheduling task: ' . $e->getMessage());

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'حدث خطأ أثناء إعادة الجدولة'
                ], 500);
            }

            return redirect()->back()->with('error', 'حدث خطأ أثناء إعادة الجدولة');
        }
    }
}
