<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Task;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends BaseController
{
    public function index()
    {
        // 1. إحصائيات الدورات
        $totalCourses = Course::count();
        $completedCourses = Course::where('completed', true)->count();
        $inProgressCourses = Course::where('completed', false)
            ->whereHas('lessons', function($query) {
                $query->where('completed', true);
            })->count();
        $notStartedCourses = $totalCourses - $completedCourses - $inProgressCourses;

        // 2. إحصائيات الدروس
        $totalLessons = Lesson::count();
        $completedLessons = Lesson::where('completed', true)->count();
        $pendingLessons = $totalLessons - $completedLessons;

        // 3. التقدم الإجمالي
        $overallProgress = $totalLessons > 0 ? ($completedLessons / $totalLessons) * 100 : 0;

        // 4. إحصائيات الوقت المستغرق (بناءً على مدة الدروس المكتملة)
        $totalTimeSpent = Lesson::where('completed', true)
            ->get()
            ->sum(function($lesson) {
                // استخراج الأرقام من duration (مثلاً: "2 ساعة" -> 2)
                preg_match('/(\d+)/', $lesson->duration ?? '0', $matches);
                return isset($matches[1]) ? (int)$matches[1] : 0;
            });

        // 5. أفضل 5 دورات تقدماً
        $topCourses = Course::withCount([
            'lessons as total_lessons',
            'lessons as completed_lessons' => function($query) {
                $query->where('completed', true);
            }
        ])
        ->get()
        ->map(function($course) {
            $course->progress = $course->total_lessons > 0
                ? ($course->completed_lessons / $course->total_lessons) * 100
                : 0;
            return $course;
        })
        ->sortByDesc('progress')
        ->take(5);

        // 6. معدل الإنجاز اليومي (آخر 7 أيام)
        $dailyCompletions = Lesson::where('completed', true)
            ->where('completed_at', '>=', Carbon::now()->subDays(7))
            ->selectRaw('DATE(completed_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        // تعبئة الأيام المفقودة بصفر
        $last7Days = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $count = $dailyCompletions->where('date', $date)->first()->count ?? 0;
            $last7Days->push([
                'date' => Carbon::parse($date)->format('M d'),
                'count' => $count
            ]);
        }

        // 7. معدل الإنجاز الأسبوعي (آخر 4 أسابيع)
        $weeklyCompletions = Lesson::where('completed', true)
            ->where('completed_at', '>=', Carbon::now()->subWeeks(4))
            ->selectRaw('YEARWEEK(completed_at) as week, COUNT(*) as count')
            ->groupBy('week')
            ->orderBy('week', 'asc')
            ->get();

        $last4Weeks = collect();
        for ($i = 3; $i >= 0; $i--) {
            $weekStart = Carbon::now()->subWeeks($i)->startOfWeek();
            $weekEnd = Carbon::now()->subWeeks($i)->endOfWeek();
            $weekNumber = $weekStart->format('oW');

            $count = $weeklyCompletions->where('week', $weekNumber)->first()->count ?? 0;
            $last4Weeks->push([
                'week' => 'أسبوع ' . (4 - $i),
                'count' => $count
            ]);
        }

        // 8. نشاط الشهر الحالي (يوم بيوم)
        $monthlyActivity = Lesson::where('completed', true)
            ->whereMonth('completed_at', Carbon::now()->month)
            ->whereYear('completed_at', Carbon::now()->year)
            ->selectRaw('DAY(completed_at) as day, COUNT(*) as count')
            ->groupBy('day')
            ->orderBy('day', 'asc')
            ->get();

        $daysInMonth = Carbon::now()->daysInMonth;
        $monthlyData = collect();
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $count = $monthlyActivity->where('day', $day)->first()->count ?? 0;
            $monthlyData->push([
                'day' => $day,
                'count' => $count
            ]);
        }

        // 9. إحصائيات إضافية
        $todayCompletions = Lesson::where('completed', true)
            ->whereDate('completed_at', Carbon::today())
            ->count();

        $weekCompletions = Lesson::where('completed', true)
            ->whereBetween('completed_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])
            ->count();

        $monthCompletions = Lesson::where('completed', true)
            ->whereMonth('completed_at', Carbon::now()->month)
            ->whereYear('completed_at', Carbon::now()->year)
            ->count();

        // 10. العناصر القادمة (دروس + مهام مجدولة في الأيام القادمة)
        $upcomingLessons = Lesson::with('course')
            ->whereNotNull('scheduled_date')
            ->where('scheduled_date', '>=', Carbon::today())
            ->where('completed', false)
            ->orderBy('scheduled_date', 'asc')
            ->take(5)
            ->get();

        // إحصائيات المهام (النظام الموحد)
        $totalTasks = Task::count();
        $totalLessonsInTasks = Task::lessons()->count();
        $totalRegularTasks = Task::regularTasks()->count();
        $completedTasks = Task::where('status', 'completed')->count();
        $pendingTasks = Task::where('status', 'pending')->count();
        $inProgressTasks = Task::where('status', 'in_progress')->count();
        $overdueTasks = Task::overdue()->count();

        // مهام اليوم
        $todayTasks = Task::whereDate('scheduled_date', Carbon::today())
            ->where('status', '!=', 'completed')
            ->count();

        // المشاريع
        $totalProjects = Project::count();
        $activeProjects = Project::where('status', 'active')->count();
        $completedProjects = Project::where('status', 'completed')->count();

        // 11. معلومات Streak
        $user = auth()->user();
        $userStreak = $user->streak ?? null;
        $streakAtRisk = $userStreak ? $userStreak->isAtRisk() : false;
        $streakBroken = $userStreak ? $userStreak->isBroken() : false;

        // 12. بيانات رسم Streak (آخر 30 يوم)
        $last30DaysStreak = collect();
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dateStr = $date->format('Y-m-d');

            // Check if user completed any lesson on this day
            $hasActivity = Lesson::where('completed', true)
                ->whereDate('completed_at', $dateStr)
                ->exists();

            $last30DaysStreak->push([
                'date' => $date->format('M d'),
                'active' => $hasActivity ? 1 : 0
            ]);
        }

        return view('dashboard.index', compact(
            'totalCourses',
            'completedCourses',
            'inProgressCourses',
            'notStartedCourses',
            'totalLessons',
            'completedLessons',
            'pendingLessons',
            'overallProgress',
            'totalTimeSpent',
            'topCourses',
            'last7Days',
            'last4Weeks',
            'monthlyData',
            'todayCompletions',
            'weekCompletions',
            'monthCompletions',
            'upcomingLessons',
            'userStreak',
            'streakAtRisk',
            'streakBroken',
            'last30DaysStreak',
            // النظام الموحد
            'totalTasks',
            'totalLessonsInTasks',
            'totalRegularTasks',
            'completedTasks',
            'pendingTasks',
            'inProgressTasks',
            'overdueTasks',
            'todayTasks',
            'totalProjects',
            'activeProjects',
            'completedProjects'
        ));
    }
}
