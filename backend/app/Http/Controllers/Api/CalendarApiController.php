<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Http\Resources\CourseResource;
use App\Http\Resources\ProjectResource;
use App\Models\Task;
use App\Models\Course;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CalendarApiController extends Controller
{
    /**
     * Get calendar data for a specific month
     */
    public function getCalendarData(Request $request)
    {
        try {
            // Parse date parameter
            $date = $request->date ? Carbon::parse($request->date) : Carbon::today();
            $startDate = $date->copy()->startOfMonth();
            $endDate = $date->copy()->endOfMonth();

            // Get all items for the month (only non-completed tasks with scheduled_date)
            $items = Task::with(['project', 'lesson.course', 'course'])
                ->whereNotNull('scheduled_date')
                ->whereBetween('scheduled_date', [$startDate, $endDate])
                ->where('status', '!=', 'completed')
                ->orderBy('scheduled_date')
                ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
                ->get()
                ->groupBy(function ($item) {
                    return Carbon::parse($item->scheduled_date)->format('Y-m-d');
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'month' => $date->copy()->locale('ar')->isoFormat('MMMM YYYY'),
                    'year' => $date->year,
                    'month_number' => $date->month,
                    'days_in_month' => $date->daysInMonth,
                    'first_day_of_week' => $date->copy()->startOfMonth()->dayOfWeek,
                    'items_by_date' => $items->mapWithKeys(function ($dayItems, $day) use ($request) {
                        return [
                            $day => TaskResource::collection($dayItems)->toArray($request),
                        ];
                    }),
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Calendar API Error: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحميل بيانات التقويم',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get items for a specific date
     */
    public function getItemsForDate(Request $request, $date)
    {
        try {
            $targetDate = Carbon::parse($date);

            $items = Task::with(['project', 'lesson.course', 'course'])
                ->whereNotNull('scheduled_date')
                ->whereDate('scheduled_date', $targetDate)
                ->where('status', '!=', 'completed')
                ->orderBy('is_lesson', 'desc')
                ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
                ->get();

            return response()->json([
                'success' => true,
                'data' => TaskResource::collection($items),
            ]);
        } catch (\Exception $e) {
            \Log::error('Calendar API Error (getItemsForDate): ' . $e->getMessage(), [
                'exception' => $e,
                'date' => $date,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحميل بيانات التاريخ',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Move item to a new date
     */
    public function moveItem(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:tasks,id',
            'new_date' => 'required|date',
        ]);

        try {
            $item = Task::findOrFail($request->item_id);
            $item->scheduled_date = Carbon::parse($request->new_date);
            $item->save();

            return response()->json([
                'success' => true,
                'message' => 'تم نقل العنصر بنجاح',
                'data' => new TaskResource($item->load(['course', 'project', 'lesson'])),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء النقل: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark item as complete
     */
    public function completeItem(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:tasks,id',
        ]);

        try {
            $item = Task::findOrFail($request->item_id);

            // Use markAsCompleted to trigger lesson completion
            $item->markAsCompleted();

            return response()->json([
                'success' => true,
                'message' => 'تم إكمال العنصر بنجاح',
                'data' => new TaskResource($item->load(['course', 'project', 'lesson'])),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Quick add item
     */
    public function quickAdd(Request $request)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'is_lesson' => 'nullable|in:0,1,true,false',
            'lesson_id' => 'nullable|exists:lessons,id',
            'course_id' => 'nullable|exists:courses,id',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'scheduled_date' => 'nullable|date',
        ]);

        try {
            $title = $request->title;
            $courseId = $request->course_id;
            $lessonId = $request->lesson_id;
            $isLesson = filter_var($request->is_lesson, FILTER_VALIDATE_BOOLEAN);

            if ($lessonId) {
                $lesson = \App\Models\Lesson::find($lessonId);
                if ($lesson) {
                    $title = $title ?? $lesson->name;
                    $courseId = $courseId ?? $lesson->course_id;
                }
            }

            $item = Task::create([
                'title' => $title ?? 'مهمة جديدة',
                'is_lesson' => $isLesson,
                'lesson_id' => $lessonId,
                'course_id' => $courseId,
                'priority' => $request->priority ?? 'medium',
                'scheduled_date' => $request->scheduled_date ?? Carbon::today(),
                'status' => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تمت إضافة العنصر بنجاح',
                'data' => new TaskResource($item->load(['course', 'project', 'lesson'])),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء الإضافة: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search in items
     */
    public function search(Request $request)
    {
        $query = $request->q;
        $type = $request->type; // 'lesson', 'task', or null for all
        $status = $request->status;
        $priority = $request->priority;

        $items = Task::with(['project', 'lesson.course', 'course'])
            ->when($query, function ($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                    ->orWhere('description', 'like', "%{$query}%")
                    ->orWhereHas('course', function ($q) use ($query) {
                        $q->where('name', 'like', "%{$query}%");
                    })
                    ->orWhereHas('project', function ($q) use ($query) {
                        $q->where('name', 'like', "%{$query}%");
                    });
            })
            ->when($type === 'lesson', fn($q) => $q->where('is_lesson', true))
            ->when($type === 'task', fn($q) => $q->where('is_lesson', false))
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($priority, fn($q) => $q->where('priority', $priority))
            ->orderBy('scheduled_date', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => TaskResource::collection($items),
        ]);
    }

    /**
     * Get statistics
     */
    public function getStatistics(Request $request)
    {
        $period = $request->period ?? 'week'; // week, month, year

        $today = Carbon::today();
        $startDate = match ($period) {
            'week' => $today->copy()->startOfWeek(),
            'month' => $today->copy()->startOfMonth(),
            'year' => $today->copy()->startOfYear(),
            default => $today->copy()->startOfWeek(),
        };
        $endDate = match ($period) {
            'week' => $today->copy()->endOfWeek(),
            'month' => $today->copy()->endOfMonth(),
            'year' => $today->copy()->endOfYear(),
            default => $today->copy()->endOfWeek(),
        };

        // Get tasks for the period
        $tasks = Task::whereBetween('scheduled_date', [$startDate, $endDate])->get();

        $stats = [
            'period' => $period,
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'total' => $tasks->count(),
            'completed' => $tasks->where('status', 'completed')->count(),
            'pending' => $tasks->where('status', 'pending')->count(),
            'in_progress' => $tasks->where('status', 'in_progress')->count(),
            'lessons' => $tasks->where('is_lesson', true)->count(),
            'tasks' => $tasks->where('is_lesson', false)->count(),
            'by_priority' => [
                'urgent' => $tasks->where('priority', 'urgent')->count(),
                'high' => $tasks->where('priority', 'high')->count(),
                'medium' => $tasks->where('priority', 'medium')->count(),
                'low' => $tasks->where('priority', 'low')->count(),
            ],
            'completion_rate' => $tasks->count() > 0
                ? round(($tasks->where('status', 'completed')->count() / $tasks->count()) * 100, 2)
                : 0,
        ];

        // Get overdue tasks
        $overdue = Task::where('status', '!=', 'completed')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', $today)
            ->count();

        $stats['overdue'] = $overdue;

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get active courses and projects (for dropdowns)
     */
    public function getMetadata()
    {
        $courses = Course::where('active', true)->get();
        $projects = Project::where('status', 'active')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'courses' => CourseResource::collection($courses),
                'projects' => ProjectResource::collection($projects),
            ],
        ]);
    }
}
