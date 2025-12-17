<?php

use App\Http\Controllers\OptimizedDashboardController;
use App\Http\Controllers\ImageOptimizationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Performance Optimization Routes
|--------------------------------------------------------------------------
|
| هذه الـ Routes للأداء المحسّن
| يجب إضافتها في routes/api.php داخل middleware('auth:sanctum')
|
*/

Route::middleware('auth:sanctum')->group(function () {

    // ========================================
    // Optimized Dashboard APIs
    // ========================================
    Route::prefix('dashboard/optimized')->name('dashboard.optimized.')->group(function () {

        // Dashboard Statistics (استعلام واحد بدلاً من 10+)
        Route::get('/stats', [OptimizedDashboardController::class, 'getStats'])
            ->name('stats');

        // Get Courses with Relations (استعلام واحد بدلاً من N+1)
        Route::get('/courses', [OptimizedDashboardController::class, 'getCourses'])
            ->name('courses');

        // Get Projects with Stats (استعلام واحد بدلاً من N+1)
        Route::get('/projects', [OptimizedDashboardController::class, 'getProjects'])
            ->name('projects');

        // Get Tasks with Details (استعلام واحد بدلاً من N+1)
        Route::get('/tasks', [OptimizedDashboardController::class, 'getTasks'])
            ->name('tasks');

        // Get Notifications with Details (استعلام واحد بدلاً من N+1)
        Route::get('/notifications', [OptimizedDashboardController::class, 'getNotifications'])
            ->name('notifications');

        // Batch Update Tasks (استعلام واحد بدلاً من N)
        Route::post('/tasks/batch-update', [OptimizedDashboardController::class, 'batchUpdateTasks'])
            ->name('tasks.batch-update');

        // Clear User Cache
        Route::post('/cache/clear', [OptimizedDashboardController::class, 'clearCache'])
            ->name('cache.clear');

        // Get Slow Queries (للمراقبة - Admin only)
        Route::get('/slow-queries', [OptimizedDashboardController::class, 'getSlowQueries'])
            ->name('slow-queries')
            ->middleware('admin'); // أضف middleware admin إذا كان موجود
    });

    // ========================================
    // Image Optimization APIs
    // ========================================
    Route::prefix('images')->name('images.')->group(function () {

        // Upload and Optimize Image
        // POST /api/images/upload
        // Body: image (file), folder (string), sizes (array), generate_webp (boolean)
        Route::post('/upload', [ImageOptimizationController::class, 'upload'])
            ->name('upload');

        // Optimize Existing Image
        // POST /api/images/optimize
        // Body: path (string), generate_webp (boolean)
        Route::post('/optimize', [ImageOptimizationController::class, 'optimize'])
            ->name('optimize');

        // Generate Thumbnail
        // POST /api/images/thumbnail
        // Body: path (string), width (int), height (int)
        Route::post('/thumbnail', [ImageOptimizationController::class, 'thumbnail'])
            ->name('thumbnail');

        // Compress Image
        // POST /api/images/compress
        // Body: path (string), quality (int)
        Route::post('/compress', [ImageOptimizationController::class, 'compress'])
            ->name('compress');

        // Convert to WebP
        // POST /api/images/convert-webp
        // Body: path (string)
        Route::post('/convert-webp', [ImageOptimizationController::class, 'convertToWebP'])
            ->name('convert-webp');

        // Delete Image and All Versions
        // DELETE /api/images/delete
        // Body: path (string)
        Route::delete('/delete', [ImageOptimizationController::class, 'delete'])
            ->name('delete');

        // Get Image Information
        // GET /api/images/info?path=...
        Route::get('/info', [ImageOptimizationController::class, 'info'])
            ->name('info');

        // Get Responsive srcset
        // GET /api/images/srcset?path=...&sizes[]=small&sizes[]=medium
        Route::get('/srcset', [ImageOptimizationController::class, 'srcset'])
            ->name('srcset');
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
|     // انسخ هنا محتوى هذا الملف (بدون middleware الخارجي)
| });
|
|--------------------------------------------------------------------------
| أو يمكنك تضمين هذا الملف مباشرة
|--------------------------------------------------------------------------
|
| في plan-backend/routes/api.php:
|
| Route::middleware('auth:sanctum')->group(function () {
|     // ... الـ Routes الموجودة
|
|     // تضمين Performance Routes
|     require __DIR__.'/performance-routes.php';
| });
|
*/
