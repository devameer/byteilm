<?php

namespace App\Http\Controllers;

use App\Models\ContentReport;
use App\Models\CourseReview;
use App\Models\LessonComment;
use App\Models\TaskComment;
use App\Models\ProjectComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContentReportController extends Controller
{
    /**
     * Report content
     * POST /api/content/report
     */
    public function report(Request $request)
    {
        $request->validate([
            'reportable_type' => 'required|string|in:review,lesson_comment,task_comment,project_comment',
            'reportable_id' => 'required|integer',
            'reason' => 'required|string|in:spam,inappropriate,offensive,harassment,misinformation,other',
            'details' => 'nullable|string|max:1000'
        ]);

        // Map reportable_type to model class
        $modelMap = [
            'review' => CourseReview::class,
            'lesson_comment' => LessonComment::class,
            'task_comment' => TaskComment::class,
            'project_comment' => ProjectComment::class
        ];

        $modelClass = $modelMap[$request->reportable_type];
        $reportable = $modelClass::find($request->reportable_id);

        if (!$reportable) {
            return response()->json([
                'success' => false,
                'message' => 'المحتوى المبلغ عنه غير موجود'
            ], 404);
        }

        // Check if user already reported this content
        $existingReport = ContentReport::where('reported_by', Auth::id())
            ->where('reportable_type', $modelClass)
            ->where('reportable_id', $request->reportable_id)
            ->first();

        if ($existingReport) {
            return response()->json([
                'success' => false,
                'message' => 'لقد قمت بالإبلاغ عن هذا المحتوى مسبقاً'
            ], 422);
        }

        $report = ContentReport::create([
            'reported_by' => Auth::id(),
            'reportable_type' => $modelClass,
            'reportable_id' => $request->reportable_id,
            'reason' => $request->reason,
            'details' => $request->details,
            'status' => 'pending'
        ]);

        return response()->json([
            'success' => true,
            'data' => $report,
            'message' => 'تم إرسال البلاغ وسيتم مراجعته قريباً'
        ], 201);
    }

    /**
     * Get user's reports
     * GET /api/my-reports
     */
    public function myReports()
    {
        $reports = ContentReport::where('reported_by', Auth::id())
            ->with(['reportable', 'reviewer'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }

    /**
     * ========================================
     * MODERATION ENDPOINTS (Admin only)
     * ========================================
     */

    /**
     * Get all reports for moderation
     * GET /api/admin/reports
     */
    public function index(Request $request)
    {
        // TODO: Add admin middleware

        $query = ContentReport::with(['reporter', 'reportable', 'reviewer']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by reason
        if ($request->has('reason')) {
            $query->where('reason', $request->reason);
        }

        // Sort
        $sort = $request->input('sort', 'recent');
        if ($sort === 'recent') {
            $query->latest();
        } elseif ($sort === 'oldest') {
            $query->oldest();
        }

        $reports = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }

    /**
     * Get pending reports count
     * GET /api/admin/reports/pending-count
     */
    public function pendingCount()
    {
        // TODO: Add admin middleware

        $count = ContentReport::pending()->count();

        return response()->json([
            'success' => true,
            'data' => ['count' => $count]
        ]);
    }

    /**
     * Get report details
     * GET /api/admin/reports/{id}
     */
    public function show($id)
    {
        // TODO: Add admin middleware

        $report = ContentReport::with(['reporter', 'reportable', 'reviewer'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }

    /**
     * Start reviewing a report
     * POST /api/admin/reports/{id}/review
     */
    public function startReview($id)
    {
        // TODO: Add admin middleware

        $report = ContentReport::findOrFail($id);

        if ($report->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'هذا البلاغ قيد المراجعة أو تمت معالجته بالفعل'
            ], 422);
        }

        $report->markAsReviewing(Auth::id());

        return response()->json([
            'success' => true,
            'data' => $report,
            'message' => 'تم بدء مراجعة البلاغ'
        ]);
    }

    /**
     * Resolve a report (take action)
     * POST /api/admin/reports/{id}/resolve
     */
    public function resolve(Request $request, $id)
    {
        // TODO: Add admin middleware

        $request->validate([
            'action' => 'required|in:delete_content,warn_user,no_action',
            'notes' => 'nullable|string|max:1000'
        ]);

        $report = ContentReport::with('reportable')->findOrFail($id);

        // Take action based on decision
        switch ($request->action) {
            case 'delete_content':
                // Delete the reported content
                if ($report->reportable) {
                    $report->reportable->delete();
                }
                $actionMessage = 'تم حذف المحتوى المخالف';
                break;

            case 'warn_user':
                // TODO: Send warning to the content creator
                $actionMessage = 'تم إرسال تحذير للمستخدم';
                break;

            case 'no_action':
                $actionMessage = 'لا يوجد إجراء مطلوب';
                break;
        }

        $report->resolve($request->notes . ' - الإجراء: ' . $actionMessage);

        return response()->json([
            'success' => true,
            'message' => 'تم حل البلاغ بنجاح'
        ]);
    }

    /**
     * Dismiss a report (no violation)
     * POST /api/admin/reports/{id}/dismiss
     */
    public function dismiss(Request $request, $id)
    {
        // TODO: Add admin middleware

        $request->validate([
            'notes' => 'nullable|string|max:1000'
        ]);

        $report = ContentReport::findOrFail($id);

        $report->dismiss($request->notes);

        return response()->json([
            'success' => true,
            'message' => 'تم رفض البلاغ'
        ]);
    }

    /**
     * Get report statistics
     * GET /api/admin/reports/stats
     */
    public function statistics()
    {
        // TODO: Add admin middleware

        $stats = [
            'total' => ContentReport::count(),
            'pending' => ContentReport::pending()->count(),
            'reviewing' => ContentReport::reviewing()->count(),
            'resolved' => ContentReport::where('status', 'resolved')->count(),
            'dismissed' => ContentReport::where('status', 'dismissed')->count(),
            'by_reason' => ContentReport::select('reason')
                ->selectRaw('count(*) as count')
                ->groupBy('reason')
                ->get(),
            'recent' => ContentReport::latest()->limit(5)->with(['reporter', 'reportable'])->get()
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
