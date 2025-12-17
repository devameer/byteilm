<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TaskApiController extends Controller
{
    /**
     * Display a listing of tasks
     */
    public function index(\App\Http\Requests\Api\IndexTaskRequest $request)
    {
        $filter = $request->input('filter', 'all');

        $query = Task::with(['project', 'lesson.course', 'course'])
            ->orderBy('scheduled_date')
            ->orderBy('order')
            ->orderBy('created_at');

        // Filter: Show only tasks/lessons from active courses (optional filter)
        // Only apply this filter if explicitly requested via 'active_courses_only' parameter
        if ($request->boolean('active_courses_only')) {
            $query->where(function($q) {
                $q->where(function($subQ) {
                    $subQ->whereNotNull('course_id')
                         ->whereHas('course', function($courseQ) {
                             $courseQ->where('active', true);
                         });
                })
                ->orWhere(function($subQ) {
                    $subQ->whereNotNull('lesson_id')
                         ->whereHas('lesson.course', function($courseQ) {
                             $courseQ->where('active', true);
                         });
                })
                ->orWhere(function($subQ) {
                    $subQ->whereNull('course_id')
                         ->whereNull('lesson_id');
                });
            });
        }

        // Apply filters
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
                $query->whereNull('project_id')
                      ->whereNull('course_id')
                      ->whereNull('lesson_id');
                break;
            case 'overdue':
                $query->where('status', '!=', 'completed')
                      ->whereNotNull('due_date')
                      ->whereDate('due_date', '<', Carbon::today());
                break;
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        if ($request->filled('lesson_id')) {
            $query->where('lesson_id', $request->lesson_id);
        }

        // إخفاء المهام المكتملة بشكل افتراضي
        // إلا إذا طلب المستخدم صراحةً عرضها أو عرض جميع المهام
        if ($request->filled('status')) {
            $status = $request->status;
            // دعم 'all' لعرض جميع المهام (بما فيها المكتملة)
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        } else {
            // عند عدم تحديد status، نخفي المكتملة بشكل افتراضي
            $query->where('status', '!=', 'completed');
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->has('is_lesson')) {
            $value = $request->is_lesson;
            $bool = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if (!is_null($bool)) {
                $query->where('is_lesson', $bool);
            }
        }

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

        if ($request->filled('date_from')) {
            $query->whereDate('scheduled_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('scheduled_date', '<=', $request->date_to);
        }

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
                        Carbon::now()->endOfWeek(),
                    ]);
                    break;
                case 'next_week':
                    $query->whereBetween('scheduled_date', [
                        Carbon::now()->addWeek()->startOfWeek(),
                        Carbon::now()->addWeek()->endOfWeek(),
                    ]);
                    break;
                case 'overdue':
                    $query->overdue();
                    break;
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('tags')) {
            $tags = $request->tags;
            if (is_string($tags)) {
                $tags = array_map('trim', explode(',', $tags));
            }
            if (is_array($tags)) {
                foreach ($tags as $tag) {
                    if ($tag !== '') {
                        $query->whereJsonContains('tags', $tag);
                    }
                }
            }
        }

        $orderBy = $request->input('order_by', 'scheduled_date');
        $orderDirection = $request->input('order_direction', 'asc');

        if ($orderBy === 'priority') {
            $query->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')");
        } else {
            $query->orderBy($orderBy, $orderDirection);
        }

        // Add pagination support
        $perPage = $request->input('per_page', 15);
        $perPage = min($perPage, 100); // Max 100 items per page
        
        if ($request->has('page')) {
            $tasks = $query->paginate($perPage);
            $response = [
                'success' => true,
                'data' => TaskResource::collection($tasks->items()),
                'meta' => [
                    'current_page' => $tasks->currentPage(),
                    'last_page' => $tasks->lastPage(),
                    'per_page' => $tasks->perPage(),
                    'total' => $tasks->total(),
                    'from' => $tasks->firstItem(),
                    'to' => $tasks->lastItem(),
                ],
                'links' => [
                    'first' => $tasks->url(1),
                    'last' => $tasks->url($tasks->lastPage()),
                    'prev' => $tasks->previousPageUrl(),
                    'next' => $tasks->nextPageUrl(),
                ],
            ];
        } else {
            $tasks = $query->get();
            $response = [
                'success' => true,
                'data' => TaskResource::collection($tasks),
            ];
        }

        if ($request->boolean('with_stats')) {
            $response['stats'] = $this->buildStatistics($tasks instanceof \Illuminate\Pagination\LengthAwarePaginator ? $tasks->items() : $tasks);
        }

        return response()->json($response);
    }

    /**
     * Store a newly created task
     */
    public function store(\App\Http\Requests\Api\StoreTaskRequest $request)
    {
        $data = $request->validated();

        if (isset($data['tags'])) {
            if (is_string($data['tags'])) {
                $data['tags'] = array_values(array_filter(array_map('trim', explode(',', $data['tags']))));
            } elseif (!is_array($data['tags'])) {
                $data['tags'] = [];
            }
        }

        if (array_key_exists('is_lesson', $data)) {
            $bool = filter_var($data['is_lesson'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            $data['is_lesson'] = $bool ?? false;
        }

        $sourceType = $request->input('source_type', 'none');
        unset($data['source_type']);
        if ($sourceType === 'none') {
            $data['project_id'] = null;
            $data['course_id'] = null;
            $data['lesson_id'] = null;
        } elseif ($sourceType === 'project') {
            $data['course_id'] = null;
            $data['lesson_id'] = null;
        } elseif ($sourceType === 'course') {
            $data['project_id'] = null;
            $data['lesson_id'] = null;
        } elseif ($sourceType === 'lesson') {
            $data['project_id'] = null;
            $data['course_id'] = null;
        }

        $task = Task::create($data);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء المهمة بنجاح',
            'data' => new TaskResource($task->load(['project', 'course', 'lesson'])),
        ], 201);
    }

    /**
     * Display the specified task
     */
    public function show($id)
    {
        $task = Task::with(['project', 'lesson.course', 'course'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new TaskResource($task),
        ]);
    }

    /**
     * Update the specified task
     */
    public function update(\App\Http\Requests\Api\UpdateTaskRequest $request, $id)
    {
        $task = Task::findOrFail($id);

        $data = $request->validated();

        if (isset($data['tags'])) {
            if (is_string($data['tags'])) {
                $data['tags'] = array_values(array_filter(array_map('trim', explode(',', $data['tags']))));
            } elseif (!is_array($data['tags'])) {
                $data['tags'] = [];
            }
        }

        if (array_key_exists('is_lesson', $data)) {
            $bool = filter_var($data['is_lesson'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            $data['is_lesson'] = $bool ?? false;
        }

        if (!empty($data['source_type'])) {
            $sourceType = $data['source_type'];
            unset($data['source_type']);

            if ($sourceType === 'none') {
                $data['project_id'] = null;
                $data['course_id'] = null;
                $data['lesson_id'] = null;
            } elseif ($sourceType === 'project') {
                $data['course_id'] = null;
                $data['lesson_id'] = null;
            } elseif ($sourceType === 'course') {
                $data['project_id'] = null;
                $data['lesson_id'] = null;
            } elseif ($sourceType === 'lesson') {
                $data['project_id'] = null;
                $data['course_id'] = null;
            }
        }

        $task->update($data);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث المهمة بنجاح',
            'data' => new TaskResource($task->load(['project', 'course', 'lesson'])),
        ]);
    }

    /**
     * Remove the specified task
     */
    public function destroy($id)
    {
        $task = Task::findOrFail($id);
        $project = $task->project;

        $task->delete();

        if ($project) {
            $project->updateProgress();
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المهمة بنجاح',
        ]);
    }

    /**
     * Mark task as complete
     */
    public function complete($id)
    {
        $task = Task::findOrFail($id);
        $task->markAsCompleted();

        return response()->json([
            'success' => true,
            'message' => 'تم إكمال المهمة بنجاح',
            'data' => new TaskResource($task->load(['project', 'course', 'lesson'])),
        ]);
    }

    /**
     * Reorder tasks
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'tasks' => 'required|array',
            'tasks.*.id' => 'required|exists:tasks,id',
            'tasks.*.order' => 'required|integer',
        ]);

        foreach ($validated['tasks'] as $taskData) {
            Task::where('id', $taskData['id'])->update(['order' => $taskData['order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إعادة ترتيب المهام بنجاح',
        ]);
    }

    /**
     * Build statistics payload similar to legacy dashboard.
     */
    protected function buildStatistics($tasks): array
    {
        return [
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
    }
}
