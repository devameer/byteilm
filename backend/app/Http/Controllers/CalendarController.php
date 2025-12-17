<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\Course;
use App\Models\Project;
use Carbon\Carbon;

class CalendarController extends BaseController
{
    /**
     * Display unified calendar with all items (lessons + tasks)
     */
    public function index(Request $request)
    {
        $date = $request->date ? Carbon::parse($request->date) : Carbon::today();
        $month = $date->format('F Y');
        $daysInMonth = $date->daysInMonth;
        $firstDayOfMonth = Carbon::parse($date->format('Y-m-01'));
        $startingDayOfWeek = $firstDayOfMonth->dayOfWeek;

        // Get date range for the month
        $startDate = $firstDayOfMonth->copy();
        $endDate = $firstDayOfMonth->copy()->endOfMonth();

        // Get all items (lessons + tasks) for the current month
        $items = Task::with(['project', 'lesson.course', 'course'])
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', '!=', 'completed')
            ->orderBy('scheduled_date')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->get()
            ->groupBy(function ($item) {
                return Carbon::parse($item->scheduled_date)->format('Y-m-d');
            });

        // Get today's items
        $todayItems = Task::with(['project', 'lesson.course', 'course'])
            ->whereDate('scheduled_date', Carbon::today())
            ->where('status', '!=', 'completed')
            ->orderBy('is_lesson', 'desc') // Lessons first
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->get();

        // Get tomorrow's items
        $tomorrowItems = Task::with(['project', 'lesson.course', 'course'])
            ->whereDate('scheduled_date', Carbon::tomorrow())
            ->where('status', '!=', 'completed')
            ->orderBy('is_lesson', 'desc')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->get();

        // Calculate week items
        $weekStart = Carbon::today();
        $weekEnd = Carbon::today()->addWeek();

        $weekItems = Task::whereBetween('scheduled_date', [$weekStart, $weekEnd])
            ->where('status', '!=', 'completed')
            ->get();

        $weekCount = $weekItems->count();

        // Get overdue tasks
        $overdueItems = Task::with(['project', 'lesson.course', 'course'])
            ->where('status', '!=', 'completed')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', Carbon::today())
            ->orderBy('due_date')
            ->get();

        // Get active courses and projects for dropdowns
        $courses = Course::where('active', true)->get();
        $projects = Project::where('status', 'active')->get();

        // Statistics
        $stats = [
            'today' => [
                'lessons' => $todayItems->where('is_lesson', true)->count(),
                'tasks' => $todayItems->where('is_lesson', false)->count(),
                'total' => $todayItems->count(),
            ],
            'tomorrow' => [
                'lessons' => $tomorrowItems->where('is_lesson', true)->count(),
                'tasks' => $tomorrowItems->where('is_lesson', false)->count(),
                'total' => $tomorrowItems->count(),
            ],
            'week' => [
                'lessons' => $weekItems->where('is_lesson', true)->count(),
                'tasks' => $weekItems->where('is_lesson', false)->count(),
                'total' => $weekCount,
            ],
            'overdue' => $overdueItems->count(),
        ];

        return view('calendar.index_interactive', compact(
            'date',
            'month',
            'daysInMonth',
            'startingDayOfWeek',
            'items',
            'todayItems',
            'tomorrowItems',
            'overdueItems',
            'courses',
            'projects',
            'stats'
        ));
    }

    /**
     * Get items for a specific date
     */
    public function getItemsForDate(Request $request, $date)
    {
        $date = Carbon::parse($date);

        $items = Task::with(['project', 'lesson.course', 'course'])
            ->whereDate('scheduled_date', $date)
            ->where('status', '!=', 'completed')
            ->orderBy('is_lesson', 'desc')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->get();

        return response()->json([
            'success' => true,
            'date' => $date->format('Y-m-d'),
            'formatted_date' => $date->format('l, F d, Y'),
            'items' => $items,
            'total' => $items->count()
        ]);
    }

    /**
     * Get calendar data as JSON (for API/AJAX)
     */
    public function getCalendarData(Request $request)
    {
        $startDate = $request->start ? Carbon::parse($request->start) : Carbon::today()->startOfMonth();
        $endDate = $request->end ? Carbon::parse($request->end) : Carbon::today()->endOfMonth();

        // Get all items
        $items = Task::with(['project', 'lesson.course', 'course'])
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', '!=', 'completed')
            ->get();

        // Format for calendar (FullCalendar.js format)
        $events = [];

        foreach ($items as $item) {
            $color = '#3b82f6'; // Default blue

            if ($item->is_lesson) {
                $color = '#3b82f6'; // blue for lessons
            } else {
                $color = match ($item->priority) {
                    'urgent' => '#ef4444', // red
                    'high' => '#f97316', // orange
                    'medium' => '#eab308', // yellow
                    'low' => '#22c55e', // green
                    default => '#8b5cf6' // purple
                };
            }

            $events[] = [
                'id' => $item->id,
                'title' => $item->title,
                'start' => $item->scheduled_date ? $item->scheduled_date->format('Y-m-d') : null,
                'backgroundColor' => $color,
                'borderColor' => $color,
                'isLesson' => $item->is_lesson,
                'priority' => $item->priority,
                'status' => $item->status,
                'description' => $item->description,
                'project' => $item->project ? $item->project->name : null,
                'course' => $item->course ? $item->course->name : null,
            ];
        }

        return response()->json([
            'success' => true,
            'events' => $events
        ]);
    }

    /**
     * Move item to different date (drag & drop)
     */
    public function moveItem(Request $request)
    {
        $request->validate([
            'id' => 'required|integer',
            'date' => 'required|date'
        ]);

        try {
            $newDate = Carbon::parse($request->date);
            $item = Task::findOrFail($request->id);
            $item->scheduled_date = $newDate;
            $item->save();

            return response()->json([
                'success' => true,
                'message' => $item->is_lesson ? 'تم نقل الدرس بنجاح' : 'تم نقل المهمة بنجاح'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء نقل العنصر'
            ], 500);
        }
    }

    /**
     * Complete item
     */
    public function completeItem(Request $request)
    {
        $request->validate([
            'id' => 'required|integer'
        ]);

        try {
            $item = Task::findOrFail($request->id);
            $item->markAsCompleted();

            return response()->json([
                'success' => true,
                'message' => $item->is_lesson ? 'تم اكتمال الدرس' : 'تم اكتمال المهمة'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث الحالة'
            ], 500);
        }
    }

    /**
     * Quick add item to today
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
            // If lesson_id is provided, get lesson details
            $title = $request->title;
            $courseId = $request->course_id;
            $lessonId = $request->lesson_id;

            // Convert is_lesson to boolean
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
                'message' => 'تمت إضافة الدرس إلى التقويم بنجاح',
                'item' => $item->load(['course', 'project', 'lesson'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء الإضافة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export calendar data as CSV
     */
    public function export(Request $request)
    {
        $startDate = $request->start ? Carbon::parse($request->start) : Carbon::today()->startOfMonth();
        $endDate = $request->end ? Carbon::parse($request->end) : Carbon::today()->endOfMonth();

        $items = Task::with(['project', 'lesson.course', 'course'])
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->orderBy('scheduled_date')
            ->get();

        $filename = 'calendar-export-' . $startDate->format('Y-m') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function () use ($items) {
            $file = fopen('php://output', 'w');

            // Add BOM for UTF-8
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Headers
            fputcsv($file, ['التاريخ', 'العنوان', 'النوع', 'الحالة', 'الأولوية', 'المصدر', 'الوصف']);

            foreach ($items as $item) {
                $type = $item->is_lesson ? 'درس' : 'مهمة';
                $status = match ($item->status) {
                    'pending' => 'قيد الانتظار',
                    'in_progress' => 'قيد التنفيذ',
                    'completed' => 'مكتملة',
                    'cancelled' => 'ملغاة',
                    default => $item->status
                };
                $priority = match ($item->priority) {
                    'urgent' => 'عاجل',
                    'high' => 'عالي',
                    'medium' => 'متوسط',
                    'low' => 'منخفض',
                    default => $item->priority ?? '-'
                };

                $source = '';
                if ($item->course) {
                    $source = $item->course->name;
                } elseif ($item->project) {
                    $source = $item->project->name;
                } elseif ($item->lesson) {
                    $source = $item->lesson->name ?? 'درس';
                } else {
                    $source = 'مستقلة';
                }

                fputcsv($file, [
                    $item->scheduled_date ? $item->scheduled_date->format('Y-m-d') : '-',
                    $item->title,
                    $type,
                    $status,
                    $priority,
                    $source,
                    $item->description ?? ''
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Week view - Display items for current week
     */
    public function weekView(Request $request)
    {
        $date = $request->date ? Carbon::parse($request->date) : Carbon::today();
        $weekStart = $date->copy()->startOfWeek();
        $weekEnd = $date->copy()->endOfWeek();

        // Get all items for the week
        $items = Task::with(['project', 'lesson.course', 'course'])
            ->whereBetween('scheduled_date', [$weekStart, $weekEnd])
            ->where('status', '!=', 'completed')
            ->orderBy('scheduled_date')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->get()
            ->groupBy(function ($item) {
                return Carbon::parse($item->scheduled_date)->format('Y-m-d');
            });

        // Generate week days array
        $weekDays = [];
        for ($i = 0; $i < 7; $i++) {
            $currentDay = $weekStart->copy()->addDays($i);
            $weekDays[] = [
                'date' => $currentDay,
                'dateKey' => $currentDay->format('Y-m-d'),
                'dayName' => $currentDay->locale('ar')->dayName,
                'isToday' => $currentDay->isToday(),
                'items' => $items[$currentDay->format('Y-m-d')] ?? collect()
            ];
        }

        // Get stats for the week
        $stats = $this->getWeekStats($weekStart, $weekEnd);

        return view('calendar.week', compact('weekDays', 'weekStart', 'weekEnd', 'stats', 'date'));
    }

    /**
     * List view - Display items as a list
     */
    public function listView(Request $request)
    {
        $query = Task::with(['project', 'lesson.course', 'course'])
            ->where('status', '!=', 'completed')
            ->whereDate('scheduled_date', '>=', Carbon::today());

        // Apply filters
        if ($request->type) {
            if ($request->type === 'lesson') {
                $query->where('is_lesson', true);
            } elseif ($request->type === 'task') {
                $query->where('is_lesson', false);
            }
        }

        if ($request->priority) {
            $query->where('priority', $request->priority);
        }

        if ($request->course_id) {
            $query->where('course_id', $request->course_id);
        }

        if ($request->project_id) {
            $query->where('project_id', $request->project_id);
        }

        // Search
        if ($request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $items = $query->orderBy('scheduled_date')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->paginate(20);

        // Get filter options
        $courses = Course::where('active', true)->get();
        $projects = Project::where('status', 'active')->get();

        return view('calendar.list', compact('items', 'courses', 'projects'));
    }

    /**
     * Search items
     */
    public function search(Request $request)
    {
        $search = $request->input('q', '');

        if (strlen($search) < 2) {
            return response()->json([
                'success' => false,
                'message' => 'الرجاء إدخال حرفين على الأقل'
            ]);
        }

        $items = Task::with(['project', 'lesson.course', 'course'])
            ->where(function ($query) use ($search) {
                $query->where('title', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            })
            ->where('status', '!=', 'completed')
            ->orderBy('scheduled_date')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'items' => $items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'date' => $item->scheduled_date ? $item->scheduled_date->format('Y-m-d') : null,
                    'formatted_date' => $item->scheduled_date ? $item->scheduled_date->locale('ar')->isoFormat('D MMMM YYYY') : null,
                    'is_lesson' => $item->is_lesson,
                    'priority' => $item->priority,
                    'course' => $item->course ? $item->course->name : null,
                    'project' => $item->project ? $item->project->name : null,
                ];
            })
        ]);
    }

    /**
     * Get advanced statistics
     */
    public function getStatistics(Request $request)
    {
        $period = $request->input('period', 'month'); // week, month, year
        $startDate = Carbon::today();
        $endDate = Carbon::today();

        switch ($period) {
            case 'week':
                $startDate = Carbon::today()->startOfWeek();
                $endDate = Carbon::today()->endOfWeek();
                break;
            case 'month':
                $startDate = Carbon::today()->startOfMonth();
                $endDate = Carbon::today()->endOfMonth();
                break;
            case 'year':
                $startDate = Carbon::today()->startOfYear();
                $endDate = Carbon::today()->endOfYear();
                break;
        }

        // Completion rate
        $totalTasks = Task::whereBetween('scheduled_date', [$startDate, $endDate])->count();
        $completedTasks = Task::whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'completed')
            ->count();
        $completionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;

        // Tasks by priority
        $tasksByPriority = Task::whereBetween('scheduled_date', [$startDate, $endDate])
            ->selectRaw('priority, count(*) as count')
            ->groupBy('priority')
            ->pluck('count', 'priority');

        // Tasks by type
        $lessonCount = Task::whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('is_lesson', true)
            ->count();
        $taskCount = Task::whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('is_lesson', false)
            ->count();

        // Daily completion for chart
        $dailyData = [];
        $currentDate = $startDate->copy();
        while ($currentDate <= $endDate) {
            $completed = Task::whereDate('scheduled_date', $currentDate)
                ->where('status', 'completed')
                ->count();
            $dailyData[] = [
                'date' => $currentDate->format('Y-m-d'),
                'completed' => $completed
            ];
            $currentDate->addDay();
        }

        return response()->json([
            'success' => true,
            'statistics' => [
                'period' => $period,
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'completion_rate' => $completionRate,
                'tasks_by_priority' => $tasksByPriority,
                'lessons_count' => $lessonCount,
                'tasks_count' => $taskCount,
                'daily_completion' => $dailyData
            ]
        ]);
    }

    /**
     * Focus mode - Today's tasks only
     */
    public function focusMode()
    {
        $todayItems = Task::with(['project', 'lesson.course', 'course'])
            ->whereDate('scheduled_date', Carbon::today())
            ->where('status', '!=', 'completed')
            ->orderBy('is_lesson', 'desc')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->get();

        $completedToday = Task::whereDate('scheduled_date', Carbon::today())
            ->where('status', 'completed')
            ->count();

        $totalToday = $todayItems->count() + $completedToday;
        $progress = $totalToday > 0 ? round(($completedToday / $totalToday) * 100) : 0;

        return view('calendar.focus', compact('todayItems', 'completedToday', 'totalToday', 'progress'));
    }

    /**
     * Helper: Get week statistics
     */
    private function getWeekStats($weekStart, $weekEnd)
    {
        $items = Task::whereBetween('scheduled_date', [$weekStart, $weekEnd])
            ->where('status', '!=', 'completed')
            ->get();

        return [
            'total' => $items->count(),
            'lessons' => $items->where('is_lesson', true)->count(),
            'tasks' => $items->where('is_lesson', false)->count(),
            'urgent' => $items->where('priority', 'urgent')->count(),
            'high' => $items->where('priority', 'high')->count(),
        ];
    }
}
