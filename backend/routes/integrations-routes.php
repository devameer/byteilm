<?php

use App\Http\Controllers\IntegrationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Integrations Routes
|--------------------------------------------------------------------------
|
| Routes for External Integrations System
| يجب إضافتها في routes/api.php داخل middleware('auth:sanctum')
|
*/

Route::middleware('auth:sanctum')->prefix('integrations')->name('integrations.')->group(function () {

    // Get all integrations (connected + available)
    Route::get('/', [IntegrationController::class, 'index'])
        ->name('index');

    // Get OAuth authorization URL
    Route::get('/auth/{provider}', [IntegrationController::class, 'getAuthUrl'])
        ->name('auth');

    // Connect new integration
    Route::post('/connect', [IntegrationController::class, 'connect'])
        ->name('connect');

    // Get integration by provider
    Route::get('/provider/{provider}', [IntegrationController::class, 'getByProvider'])
        ->name('provider');

    // Get single integration
    Route::get('/{id}', [IntegrationController::class, 'show'])
        ->name('show');

    // Update integration settings
    Route::put('/{id}', [IntegrationController::class, 'update'])
        ->name('update');

    // Disconnect integration
    Route::delete('/{id}', [IntegrationController::class, 'disconnect'])
        ->name('disconnect');

    // Test connection
    Route::post('/{id}/test', [IntegrationController::class, 'testConnection'])
        ->name('test');

    // Manual sync
    Route::post('/{id}/sync', [IntegrationController::class, 'sync'])
        ->name('sync');

    // Get logs
    Route::get('/{id}/logs', [IntegrationController::class, 'getLogs'])
        ->name('logs');

    // Get statistics
    Route::get('/{id}/statistics', [IntegrationController::class, 'getStatistics'])
        ->name('statistics');
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
|     // Integrations Routes
|     require __DIR__.'/integrations-routes.php';
| });
|
|--------------------------------------------------------------------------
| أمثلة على الاستخدام
|--------------------------------------------------------------------------
|
| GET /api/integrations
| - احصل على جميع التكاملات (المتصلة والمتاحة)
|
| GET /api/integrations/auth/google_calendar
| - احصل على رابط OAuth للربط مع Google Calendar
|
| POST /api/integrations/connect
| - ربط تكامل جديد (بعد OAuth callback)
| Body: {
|   "provider": "google_calendar",
|   "access_token": "...",
|   "refresh_token": "...",
|   "token_expires_at": "2025-12-20 12:00:00"
| }
|
| GET /api/integrations/{id}
| - احصل على تفاصيل تكامل محدد
|
| PUT /api/integrations/{id}
| - تحديث إعدادات التكامل
| Body: {
|   "auto_sync": true,
|   "is_active": true,
|   "settings": { "calendar_id": "primary" }
| }
|
| DELETE /api/integrations/{id}
| - فصل التكامل
|
| POST /api/integrations/{id}/test
| - اختبار اتصال التكامل
|
| POST /api/integrations/{id}/sync
| - تشغيل المزامنة يدوياً
|
| GET /api/integrations/{id}/logs
| - احصل على سجلات التكامل
|
| GET /api/integrations/{id}/statistics
| - احصل على إحصائيات التكامل
|
*/
