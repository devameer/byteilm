<?php

use App\Http\Controllers\AnalyticsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Analytics Routes
|--------------------------------------------------------------------------
|
| Routes for Advanced Analytics System
|
*/

Route::prefix('analytics')->group(function () {

    // Public tracking endpoints (no auth required for tracking)
    Route::post('/events', [AnalyticsController::class, 'trackEvent']);
    Route::post('/page-views', [AnalyticsController::class, 'trackPageView']);
    Route::post('/heatmap', [AnalyticsController::class, 'trackHeatmap']);

    // Protected analytics viewing endpoints
    Route::middleware('auth:sanctum')->group(function () {

        // Dashboard
        Route::get('/dashboard', [AnalyticsController::class, 'getDashboard']);

        // Realtime analytics
        Route::get('/realtime', [AnalyticsController::class, 'getRealtime']);

        // Heatmap data
        Route::get('/heatmap/{pageUrl}', [AnalyticsController::class, 'getHeatmap']);

        // Page analytics
        Route::get('/pages/{pageUrl}', [AnalyticsController::class, 'getPageAnalytics']);

        // Event analytics
        Route::get('/events/{eventName}', [AnalyticsController::class, 'getEventAnalytics']);

        // Traffic sources
        Route::get('/traffic-sources', [AnalyticsController::class, 'getTrafficSources']);

        // Conversion funnel
        Route::get('/funnel', [AnalyticsController::class, 'getFunnel']);
    });
});

/*
|--------------------------------------------------------------------------
| Usage Examples
|--------------------------------------------------------------------------
|
| 1. Track Event (from frontend):
| POST /api/analytics/events
| Body: {
|   "event_name": "button_click",
|   "event_category": "engagement",
|   "event_data": {"button_id": "subscribe", "location": "header"}
| }
|
| 2. Track Page View:
| POST /api/analytics/page-views
| Body: {
|   "page_url": "/courses",
|   "page_title": "All Courses",
|   "time_on_page": 45
| }
|
| 3. Track Heatmap Click:
| POST /api/analytics/heatmap
| Body: {
|   "type": "click",
|   "page_url": "/pricing",
|   "x": 150,
|   "y": 300,
|   "element": ".btn-subscribe",
|   "viewport_width": 1920,
|   "viewport_height": 1080
| }
|
| 4. Get Dashboard Metrics:
| GET /api/analytics/dashboard?start_date=2025-01-01&end_date=2025-12-31
|
| 5. Get Heatmap Data:
| GET /api/analytics/heatmap/pricing?type=click&device_type=desktop
|
| 6. Get Page Analytics:
| GET /api/analytics/pages/courses?start_date=2025-01-01&end_date=2025-12-31
|
| 7. Get Event Analytics:
| GET /api/analytics/events/course_purchase?start_date=2025-01-01
|
| 8. Get Realtime Analytics:
| GET /api/analytics/realtime
|
| 9. Get Traffic Sources:
| GET /api/analytics/traffic-sources?start_date=2025-01-01
|
| 10. Get Conversion Funnel:
| GET /api/analytics/funnel?steps[]=page_view&steps[]=add_to_cart&steps[]=checkout&steps[]=purchase
|
*/
