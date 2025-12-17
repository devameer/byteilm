<?php

namespace App\Http\Controllers;

use App\Services\ProductivityReportService;
use App\Services\TeamReportService;
use App\Services\CourseProgressReportService;
use App\Services\TimeTrackingReportService;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ReportController extends Controller
{
    protected $productivityService;
    protected $teamService;
    protected $courseProgressService;
    protected $timeTrackingService;

    public function __construct(
        ProductivityReportService $productivityService,
        TeamReportService $teamService,
        CourseProgressReportService $courseProgressService,
        TimeTrackingReportService $timeTrackingService
    ) {
        $this->productivityService = $productivityService;
        $this->teamService = $teamService;
        $this->courseProgressService = $courseProgressService;
        $this->timeTrackingService = $timeTrackingService;
    }

    /**
     * Get Personal Productivity Report
     * GET /api/reports/productivity?start_date=2025-01-01&end_date=2025-01-31
     */
    public function getProductivityReport(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        $user = Auth::user();
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        $report = $this->productivityService->generatePersonalProductivityReport(
            $user,
            $startDate,
            $endDate
        );

        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }

    /**
     * Get Team Performance Report
     * GET /api/reports/team/{teamId}?start_date=2025-01-01&end_date=2025-01-31
     */
    public function getTeamReport(Request $request, $teamId)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        $team = Team::findOrFail($teamId);

        // Check if user is a member of this team
        $user = Auth::user();
        $isMember = $team->members()->where('user_id', $user->id)->exists();

        if (!$isMember && $team->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بعرض تقارير هذا الفريق'
            ], 403);
        }

        $startDate = $request->start_date;
        $endDate = $request->end_date;

        $report = $this->teamService->generateTeamPerformanceReport(
            $team,
            $startDate,
            $endDate
        );

        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }

    /**
     * Get Course Progress Report
     * GET /api/reports/courses?start_date=2025-01-01&end_date=2025-01-31
     */
    public function getCourseProgressReport(Request $request)
    {
        $request->validate([
            'start_date' => 'date',
            'end_date' => 'date|after_or_equal:start_date'
        ]);

        $user = Auth::user();
        $startDate = $request->start_date ?? Carbon::now()->subMonths(3);
        $endDate = $request->end_date ?? Carbon::now();

        $report = $this->courseProgressService->generateCourseProgressReport(
            $user,
            $startDate,
            $endDate
        );

        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }

    /**
     * Get Time Tracking Report
     * GET /api/reports/time-tracking?start_date=2025-01-01&end_date=2025-01-31
     */
    public function getTimeTrackingReport(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        $user = Auth::user();
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        $report = $this->timeTrackingService->generateTimeTrackingReport(
            $user,
            $startDate,
            $endDate
        );

        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }

    /**
     * Get all reports summary
     * GET /api/reports/summary?start_date=2025-01-01&end_date=2025-01-31
     */
    public function getReportsSummary(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        $user = Auth::user();
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        // Get all reports
        $productivity = $this->productivityService->generatePersonalProductivityReport(
            $user,
            $startDate,
            $endDate
        );

        $courseProgress = $this->courseProgressService->generateCourseProgressReport(
            $user,
            $startDate,
            $endDate
        );

        $timeTracking = $this->timeTrackingService->generateTimeTrackingReport(
            $user,
            $startDate,
            $endDate
        );

        return response()->json([
            'success' => true,
            'data' => [
                'productivity' => [
                    'total_tasks' => $productivity['summary']['total_tasks'],
                    'completed_tasks' => $productivity['summary']['completed_tasks'],
                    'completion_rate' => $productivity['summary']['completion_rate'],
                    'performance_score' => $productivity['summary']['performance_score']
                ],
                'courses' => [
                    'total_courses' => $courseProgress['summary']['total_courses'],
                    'completed_courses' => $courseProgress['summary']['completed_courses'],
                    'completion_rate' => $courseProgress['summary']['completion_rate'],
                    'average_progress' => $courseProgress['summary']['average_progress']
                ],
                'time_tracking' => [
                    'total_hours' => $timeTracking['summary']['total_time_spent']['hours'],
                    'average_daily_hours' => $timeTracking['summary']['average_daily_time']['hours'],
                    'billable_hours' => $timeTracking['summary']['billable_hours']['hours']
                ],
                'period' => [
                    'start' => $startDate,
                    'end' => $endDate
                ]
            ]
        ]);
    }

    /**
     * Export Productivity Report to PDF
     * GET /api/reports/productivity/export/pdf?start_date=2025-01-01&end_date=2025-01-31
     */
    public function exportProductivityPDF(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        $user = Auth::user();
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        $report = $this->productivityService->generatePersonalProductivityReport(
            $user,
            $startDate,
            $endDate
        );

        return $this->productivityService->exportToPDF($report, $user);
    }

    /**
     * Export Productivity Report to Excel
     * GET /api/reports/productivity/export/excel?start_date=2025-01-01&end_date=2025-01-31
     */
    public function exportProductivityExcel(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        $user = Auth::user();
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        $report = $this->productivityService->generatePersonalProductivityReport(
            $user,
            $startDate,
            $endDate
        );

        return $this->productivityService->exportToExcel($report, $user);
    }

    /**
     * Get available report types and periods
     * GET /api/reports/types
     */
    public function getReportTypes()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'types' => [
                    [
                        'id' => 'productivity',
                        'name' => 'تقرير الإنتاجية الشخصية',
                        'description' => 'تقرير شامل عن أدائك وإنتاجيتك',
                        'icon' => 'chart-bar',
                        'requires_date_range' => true,
                        'export_formats' => ['pdf', 'excel', 'csv']
                    ],
                    [
                        'id' => 'team',
                        'name' => 'تقرير أداء الفريق',
                        'description' => 'تحليل أداء الفريق والتعاون',
                        'icon' => 'users',
                        'requires_date_range' => true,
                        'requires_team_selection' => true,
                        'export_formats' => ['pdf', 'excel']
                    ],
                    [
                        'id' => 'courses',
                        'name' => 'تقرير التقدم في الدورات',
                        'description' => 'تتبع تقدمك في الدورات التعليمية',
                        'icon' => 'academic-cap',
                        'requires_date_range' => false,
                        'export_formats' => ['pdf', 'excel']
                    ],
                    [
                        'id' => 'time_tracking',
                        'name' => 'تقرير الوقت المستغرق',
                        'description' => 'تحليل الوقت المستغرق في المهام',
                        'icon' => 'clock',
                        'requires_date_range' => true,
                        'export_formats' => ['pdf', 'excel', 'csv']
                    ]
                ],
                'preset_periods' => [
                    [
                        'id' => 'today',
                        'name' => 'اليوم',
                        'start_date' => Carbon::today()->format('Y-m-d'),
                        'end_date' => Carbon::today()->format('Y-m-d')
                    ],
                    [
                        'id' => 'yesterday',
                        'name' => 'أمس',
                        'start_date' => Carbon::yesterday()->format('Y-m-d'),
                        'end_date' => Carbon::yesterday()->format('Y-m-d')
                    ],
                    [
                        'id' => 'this_week',
                        'name' => 'هذا الأسبوع',
                        'start_date' => Carbon::now()->startOfWeek()->format('Y-m-d'),
                        'end_date' => Carbon::now()->endOfWeek()->format('Y-m-d')
                    ],
                    [
                        'id' => 'last_week',
                        'name' => 'الأسبوع الماضي',
                        'start_date' => Carbon::now()->subWeek()->startOfWeek()->format('Y-m-d'),
                        'end_date' => Carbon::now()->subWeek()->endOfWeek()->format('Y-m-d')
                    ],
                    [
                        'id' => 'this_month',
                        'name' => 'هذا الشهر',
                        'start_date' => Carbon::now()->startOfMonth()->format('Y-m-d'),
                        'end_date' => Carbon::now()->endOfMonth()->format('Y-m-d')
                    ],
                    [
                        'id' => 'last_month',
                        'name' => 'الشهر الماضي',
                        'start_date' => Carbon::now()->subMonth()->startOfMonth()->format('Y-m-d'),
                        'end_date' => Carbon::now()->subMonth()->endOfMonth()->format('Y-m-d')
                    ],
                    [
                        'id' => 'last_3_months',
                        'name' => 'آخر 3 شهور',
                        'start_date' => Carbon::now()->subMonths(3)->format('Y-m-d'),
                        'end_date' => Carbon::now()->format('Y-m-d')
                    ],
                    [
                        'id' => 'this_year',
                        'name' => 'هذا العام',
                        'start_date' => Carbon::now()->startOfYear()->format('Y-m-d'),
                        'end_date' => Carbon::now()->endOfYear()->format('Y-m-d')
                    ],
                    [
                        'id' => 'custom',
                        'name' => 'فترة مخصصة',
                        'start_date' => null,
                        'end_date' => null
                    ]
                ]
            ]
        ]);
    }

    /**
     * Get user's teams for team report selection
     * GET /api/reports/teams
     */
    public function getUserTeams()
    {
        $user = Auth::user();

        // Teams where user is owner
        $ownedTeams = Team::where('user_id', $user->id)
            ->select('id', 'name', 'description', 'created_at')
            ->get()
            ->map(function ($team) {
                return array_merge($team->toArray(), ['role' => 'owner']);
            });

        // Teams where user is member
        $memberTeams = Team::whereHas('members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with(['members' => function ($query) use ($user) {
            $query->where('user_id', $user->id);
        }])
        ->select('id', 'name', 'description', 'created_at')
        ->get()
        ->map(function ($team) {
            return array_merge($team->toArray(), [
                'role' => $team->members->first()->role ?? 'member'
            ]);
        });

        $teams = $ownedTeams->merge($memberTeams)->unique('id');

        return response()->json([
            'success' => true,
            'data' => $teams->values()
        ]);
    }
}
