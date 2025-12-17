<?php

use App\Http\Controllers\GoalController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Goals Routes
|--------------------------------------------------------------------------
|
| Routes for Goals System
| يجب إضافتها في routes/api.php داخل middleware('auth:sanctum')
|
*/

Route::middleware('auth:sanctum')->prefix('goals')->name('goals.')->group(function () {

    // Get statistics
    Route::get('/statistics', [GoalController::class, 'statistics'])
        ->name('statistics');

    // Get suggestions
    Route::get('/suggestions', [GoalController::class, 'suggestions'])
        ->name('suggestions');

    // Get leaderboard
    Route::get('/leaderboard', [GoalController::class, 'leaderboard'])
        ->name('leaderboard');

    // Get team goals
    Route::get('/team/{teamId}', [GoalController::class, 'teamGoals'])
        ->name('team');

    // CRUD operations
    Route::get('/', [GoalController::class, 'index'])
        ->name('index');

    Route::post('/', [GoalController::class, 'store'])
        ->name('store');

    Route::get('/{id}', [GoalController::class, 'show'])
        ->name('show');

    Route::put('/{id}', [GoalController::class, 'update'])
        ->name('update');

    Route::delete('/{id}', [GoalController::class, 'destroy'])
        ->name('destroy');

    // Progress management
    Route::post('/{id}/progress', [GoalController::class, 'updateProgress'])
        ->name('progress.update');

    Route::post('/{id}/increment', [GoalController::class, 'incrementProgress'])
        ->name('progress.increment');

    // Status management
    Route::post('/{id}/complete', [GoalController::class, 'markCompleted'])
        ->name('complete');

    Route::post('/{id}/cancel', [GoalController::class, 'cancel'])
        ->name('cancel');
});

/*
|--------------------------------------------------------------------------
| كيفية الاستخدام
|--------------------------------------------------------------------------
|
| في plan-backend/routes/api.php:
|
| Route::middleware('auth:sanctum')->group(function () {
|     // ... الـ Routes الموجودة
|
|     // Goals Routes
|     require __DIR__.'/goals-routes.php';
| });
|
|--------------------------------------------------------------------------
| أمثلة على الاستخدام
|--------------------------------------------------------------------------
|
| GET /api/goals
| - احصل على جميع أهداف المستخدم
|
| GET /api/goals?type=personal&status=active
| - احصل على الأهداف الشخصية النشطة
|
| POST /api/goals
| - إنشاء هدف جديد
|
| PUT /api/goals/1
| - تحديث هدف
|
| POST /api/goals/1/progress
| - تحديث التقدم
|
| POST /api/goals/1/increment
| - زيادة التقدم
|
| GET /api/goals/statistics
| - احصل على إحصائيات الأهداف
|
| GET /api/goals/suggestions
| - احصل على اقتراحات أهداف
|
| GET /api/goals/leaderboard
| - احصل على لوحة المتصدرين
|
*/
