<?php

namespace App\Http\Controllers;

use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AnalyticsController extends Controller
{
    protected $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Track event
     * POST /api/analytics/events
     */
    public function trackEvent(Request $request)
    {
        $request->validate([
            'event_name' => 'required|string',
            'event_category' => 'string',
            'event_data' => 'array'
        ]);

        $event = $this->analyticsService->trackEvent(
            $request->event_name,
            $request->event_data ?? [],
            $request->event_category ?? 'engagement'
        );

        return response()->json([
            'success' => true,
            'event_id' => $event->id
        ]);
    }

    /**
     * Track page view
     * POST /api/analytics/page-views
     */
    public function trackPageView(Request $request)
    {
        $request->validate([
            'page_url' => 'required|string',
            'page_title' => 'nullable|string',
            'time_on_page' => 'nullable|integer'
        ]);

        $pageView = $this->analyticsService->trackPageView(
            $request->page_url,
            $request->page_title,
            $request->time_on_page
        );

        return response()->json([
            'success' => true,
            'page_view_id' => $pageView->id
        ]);
    }

    /**
     * Track heatmap data
     * POST /api/analytics/heatmap
     */
    public function trackHeatmap(Request $request)
    {
        $request->validate([
            'type' => 'required|in:click,scroll,move',
            'page_url' => 'required|string',
            'x' => 'nullable|integer',
            'y' => 'nullable|integer',
            'scroll_depth' => 'nullable|integer',
            'element' => 'nullable|string',
            'text' => 'nullable|string',
            'viewport_width' => 'required|integer',
            'viewport_height' => 'required|integer'
        ]);

        $this->analyticsService->trackHeatmap(
            $request->type,
            $request->all()
        );

        return response()->json(['success' => true]);
    }

    /**
     * Get dashboard metrics
     * GET /api/analytics/dashboard
     */
    public function getDashboard(Request $request)
    {
        $startDate = $request->input('start_date', now()->subDays(30));
        $endDate = $request->input('end_date', now());

        $metrics = $this->analyticsService->getDashboardMetrics($startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => $metrics
        ]);
    }

    /**
     * Get heatmap data
     * GET /api/analytics/heatmap/{pageUrl}
     */
    public function getHeatmap(Request $request, $pageUrl)
    {
        $type = $request->input('type', 'click');
        $deviceType = $request->input('device_type');

        $data = $this->analyticsService->getHeatmapData(
            urldecode($pageUrl),
            $type,
            $deviceType
        );

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Get page analytics
     * GET /api/analytics/pages/{pageUrl}
     */
    public function getPageAnalytics(Request $request, $pageUrl)
    {
        $startDate = $request->input('start_date', now()->subDays(30));
        $endDate = $request->input('end_date', now());

        $pageUrl = urldecode($pageUrl);

        $stats = \App\Models\PageView::where('page_url', $pageUrl)
            ->whereBetween('viewed_at', [$startDate, $endDate])
            ->selectRaw('
                count(*) as total_views,
                count(distinct user_id) as unique_visitors,
                avg(time_on_page) as avg_time,
                avg(scroll_depth) as avg_scroll,
                sum(case when bounced = 1 then 1 else 0 end) as bounces
            ')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'page_url' => $pageUrl,
                'total_views' => $stats->total_views ?? 0,
                'unique_visitors' => $stats->unique_visitors ?? 0,
                'avg_time_on_page' => round($stats->avg_time ?? 0),
                'avg_scroll_depth' => round($stats->avg_scroll ?? 0),
                'bounce_rate' => $stats->total_views > 0
                    ? round(($stats->bounces / $stats->total_views) * 100, 2)
                    : 0
            ]
        ]);
    }

    /**
     * Get event analytics
     * GET /api/analytics/events/{eventName}
     */
    public function getEventAnalytics(Request $request, $eventName)
    {
        $startDate = $request->input('start_date', now()->subDays(30));
        $endDate = $request->input('end_date', now());

        $events = \App\Models\UserEvent::where('event_name', $eventName)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $byDay = $events->groupBy(function ($event) {
            return $event->created_at->format('Y-m-d');
        })->map->count();

        $byDevice = $events->groupBy('device_type')->map->count();

        return response()->json([
            'success' => true,
            'data' => [
                'event_name' => $eventName,
                'total_count' => $events->count(),
                'unique_users' => $events->unique('user_id')->count(),
                'by_day' => $byDay,
                'by_device' => $byDevice
            ]
        ]);
    }

    /**
     * Get realtime analytics
     * GET /api/analytics/realtime
     */
    public function getRealtime()
    {
        $since = now()->subMinutes(5);

        $data = [
            'active_users' => \App\Models\UserSession::where('started_at', '>=', $since)
                ->distinct('session_id')
                ->count(),
            'page_views' => \App\Models\PageView::where('viewed_at', '>=', $since)->count(),
            'events' => \App\Models\UserEvent::where('created_at', '>=', $since)->count(),
            'recent_pages' => \App\Models\PageView::where('viewed_at', '>=', $since)
                ->select('page_url', 'page_title')
                ->groupBy('page_url', 'page_title')
                ->selectRaw('count(*) as views')
                ->orderBy('views', 'desc')
                ->limit(10)
                ->get()
        ];

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Get traffic sources
     * GET /api/analytics/traffic-sources
     */
    public function getTrafficSources(Request $request)
    {
        $startDate = $request->input('start_date', now()->subDays(30));
        $endDate = $request->input('end_date', now());

        $sources = \App\Models\UserSession::whereBetween('started_at', [$startDate, $endDate])
            ->select('utm_source', 'utm_medium', 'utm_campaign')
            ->selectRaw('count(*) as sessions')
            ->groupBy('utm_source', 'utm_medium', 'utm_campaign')
            ->orderBy('sessions', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $sources
        ]);
    }

    /**
     * Get conversion funnel
     * GET /api/analytics/funnel
     */
    public function getFunnel(Request $request)
    {
        $request->validate([
            'steps' => 'required|array|min:2',
            'steps.*' => 'required|string'
        ]);

        $startDate = $request->input('start_date', now()->subDays(30));
        $endDate = $request->input('end_date', now());
        $steps = $request->input('steps');

        $result = [];
        $previousCount = null;

        foreach ($steps as $index => $eventName) {
            $count = \App\Models\UserEvent::where('event_name', $eventName)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->distinct('user_id')
                ->count('user_id');

            $result[] = [
                'step' => $index + 1,
                'event_name' => $eventName,
                'count' => $count,
                'conversion_rate' => $previousCount > 0
                    ? round(($count / $previousCount) * 100, 2)
                    : 100,
                'dropoff_rate' => $previousCount > 0
                    ? round((($previousCount - $count) / $previousCount) * 100, 2)
                    : 0
            ];

            $previousCount = $count;
        }

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }
}
