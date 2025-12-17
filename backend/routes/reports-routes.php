<?php

use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Reports Routes
|--------------------------------------------------------------------------
|
| Routes for Advanced Reports System
| يجب إضافتها في routes/api.php داخل middleware('auth:sanctum')
|
*/

Route::middleware('auth:sanctum')->prefix('reports')->name('reports.')->group(function () {

    // Get available report types and periods
    Route::get('/types', [ReportController::class, 'getReportTypes'])
        ->name('types');

    // Get user's teams for team report selection
    Route::get('/teams', [ReportController::class, 'getUserTeams'])
        ->name('teams');

    // Get all reports summary
    Route::get('/summary', [ReportController::class, 'getReportsSummary'])
        ->name('summary');

    // ========================================
    // Productivity Reports
    // ========================================
    Route::prefix('productivity')->name('productivity.')->group(function () {

        // Get productivity report
        Route::get('/', [ReportController::class, 'getProductivityReport'])
            ->name('get');

        // Export to PDF
        Route::get('/export/pdf', [ReportController::class, 'exportProductivityPDF'])
            ->name('export.pdf');

        // Export to Excel
        Route::get('/export/excel', [ReportController::class, 'exportProductivityExcel'])
            ->name('export.excel');
    });

    // ========================================
    // Team Performance Reports
    // ========================================
    Route::prefix('team')->name('team.')->group(function () {

        // Get team report
        Route::get('/{teamId}', [ReportController::class, 'getTeamReport'])
            ->name('get');
    });

    // ========================================
    // Course Progress Reports
    // ========================================
    Route::prefix('courses')->name('courses.')->group(function () {

        // Get course progress report
        Route::get('/', [ReportController::class, 'getCourseProgressReport'])
            ->name('get');
    });

    // ========================================
    // Time Tracking Reports
    // ========================================
    Route::prefix('time-tracking')->name('time-tracking.')->group(function () {

        // Get time tracking report
        Route::get('/', [ReportController::class, 'getTimeTrackingReport'])
            ->name('get');
    });
});

/*
|--------------------------------------------------------------------------
| كيفية الاستخدام
|--------------------------------------------------------------------------
|
| 1. انسخ محتوى هذا الملف
| 2. افتح plan-backend/routes/api.php
| 3. أضف الـ Routes داخل middleware('auth:sanctum')
|
| مثال:
|
| Route::middleware('auth:sanctum')->group(function () {
|     // ... الـ Routes الموجودة
|
|     // تضمين Reports Routes
|     require __DIR__.'/reports-routes.php';
| });
|
|--------------------------------------------------------------------------
| أمثلة على الاستخدام
|--------------------------------------------------------------------------
|
| GET /api/reports/types
| - احصل على أنواع التقارير المتاحة والفترات الزمنية
|
| GET /api/reports/productivity?start_date=2025-01-01&end_date=2025-01-31
| - تقرير الإنتاجية الشخصية
|
| GET /api/reports/team/1?start_date=2025-01-01&end_date=2025-01-31
| - تقرير أداء الفريق رقم 1
|
| GET /api/reports/courses?start_date=2025-01-01&end_date=2025-01-31
| - تقرير التقدم في الدورات
|
| GET /api/reports/time-tracking?start_date=2025-01-01&end_date=2025-01-31
| - تقرير الوقت المستغرق
|
| GET /api/reports/summary?start_date=2025-01-01&end_date=2025-01-31
| - ملخص جميع التقارير
|
| GET /api/reports/productivity/export/pdf?start_date=2025-01-01&end_date=2025-01-31
| - تصدير تقرير الإنتاجية إلى PDF
|
| GET /api/reports/productivity/export/excel?start_date=2025-01-01&end_date=2025-01-31
| - تصدير تقرير الإنتاجية إلى Excel
|
*/
