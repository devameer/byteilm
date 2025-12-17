<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\View\View;

class ReportController extends Controller
{
    public function index(): View
    {
        $availableReports = [
            ['key' => 'user_usage', 'title' => __('تقرير استخدام المستخدم'), 'description' => __('ملخص نشاط المستخدمين، الدروس المكتملة، والمهام المنجزة.')],
            ['key' => 'course_progress', 'title' => __('تقرير التقدم في الدورات'), 'description' => __('نسبة إكمال الدورات والدروس لكل مستخدم.')],
            ['key' => 'project_overview', 'title' => __('تقرير المشاريع'), 'description' => __('حالة المشاريع والمهام المرتبطة بها.')],
            ['key' => 'productivity', 'title' => __('تقرير الإنتاجية'), 'description' => __('مؤشرات الأداء الرئيسية والوقت المستغرق في المهام.')],
        ];

        return view('admin.reports.index', compact('availableReports'));
    }
}
