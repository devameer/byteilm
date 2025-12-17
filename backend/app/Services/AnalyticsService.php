<?php

namespace App\Services;

use App\Models\UserEvent;
use App\Models\PageView;
use App\Models\HeatmapData;
use App\Models\UserSession;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class AnalyticsService
{
    /**
     * Track event
     */
    public function trackEvent($eventName, $eventData = [], $category = 'engagement')
    {
        return UserEvent::create([
            'user_id' => auth()->id(),
            'session_id' => $this->getSessionId(),
            'event_name' => $eventName,
            'event_category' => $category,
            'event_data' => $eventData,
            'page_url' => url()->current(),
            'referrer' => request()->header('referer'),
            'user_agent' => request()->userAgent(),
            'ip_address' => request()->ip(),
            'device_type' => $this->getDeviceType(),
            'browser' => $this->getBrowser(),
            'os' => $this->getOS(),
            'screen_width' => request()->input('screen_width'),
            'screen_height' => request()->input('screen_height')
        ]);
    }

    /**
     * Track page view
     */
    public function trackPageView($pageUrl, $pageTitle = null, $timeOnPage = null)
    {
        return PageView::create([
            'user_id' => auth()->id(),
            'session_id' => $this->getSessionId(),
            'page_url' => $pageUrl,
            'page_title' => $pageTitle,
            'referrer' => request()->header('referer'),
            'time_on_page' => $timeOnPage,
            'viewed_at' => now()
        ]);
    }

    /**
     * Track heatmap interaction
     */
    public function trackHeatmap($type, $data)
    {
        return DB::table('heatmap_data')->insert([
            'page_url' => $data['page_url'],
            'type' => $type,
            'x_position' => $data['x'] ?? null,
            'y_position' => $data['y'] ?? null,
            'scroll_depth' => $data['scroll_depth'] ?? null,
            'element_selector' => $data['element'] ?? null,
            'element_text' => $data['text'] ?? null,
            'viewport_width' => $data['viewport_width'],
            'viewport_height' => $data['viewport_height'],
            'device_type' => $this->getDeviceType(),
            'created_at' => now()
        ]);
    }

    /**
     * Get dashboard metrics
     */
    public function getDashboardMetrics($startDate, $endDate)
    {
        $cacheKey = "dashboard_metrics:{$startDate}:{$endDate}";

        return Cache::remember($cacheKey, 3600, function () use ($startDate, $endDate) {
            return [
                'overview' => $this->getOverviewMetrics($startDate, $endDate),
                'traffic' => $this->getTrafficMetrics($startDate, $endDate),
                'engagement' => $this->getEngagementMetrics($startDate, $endDate),
                'conversions' => $this->getConversionMetrics($startDate, $endDate),
                'devices' => $this->getDeviceBreakdown($startDate, $endDate),
                'top_pages' => $this->getTopPages($startDate, $endDate),
                'top_events' => $this->getTopEvents($startDate, $endDate),
                'realtime' => $this->getRealtimeMetrics()
            ];
        });
    }

    /**
     * Get overview metrics
     */
    protected function getOverviewMetrics($startDate, $endDate)
    {
        $sessions = UserSession::whereBetween('started_at', [$startDate, $endDate]);
        $pageViews = PageView::whereBetween('viewed_at', [$startDate, $endDate]);
        $events = UserEvent::whereBetween('created_at', [$startDate, $endDate]);

        return [
            'total_users' => $sessions->distinct('user_id')->count('user_id'),
            'total_sessions' => $sessions->count(),
            'total_page_views' => $pageViews->count(),
            'total_events' => $events->count(),
            'avg_session_duration' => round($sessions->avg('duration') ?? 0),
            'avg_pages_per_session' => round($sessions->avg('page_views') ?? 0, 2),
            'bounce_rate' => $this->getBounceRate($startDate, $endDate)
        ];
    }

    /**
     * Get traffic sources
     */
    protected function getTrafficMetrics($startDate, $endDate)
    {
        return UserSession::whereBetween('started_at', [$startDate, $endDate])
            ->select('utm_source', 'utm_medium', DB::raw('count(*) as count'))
            ->groupBy('utm_source', 'utm_medium')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();
    }

    /**
     * Get engagement metrics
     */
    protected function getEngagementMetrics($startDate, $endDate)
    {
        $pageViews = PageView::whereBetween('viewed_at', [$startDate, $endDate]);

        return [
            'avg_time_on_page' => round($pageViews->avg('time_on_page') ?? 0),
            'avg_scroll_depth' => round($pageViews->avg('scroll_depth') ?? 0),
            'pages_per_session' => round($pageViews->count() / max(UserSession::whereBetween('started_at', [$startDate, $endDate])->count(), 1), 2)
        ];
    }

    /**
     * Get conversion metrics
     */
    protected function getConversionMetrics($startDate, $endDate)
    {
        $conversionEvents = UserEvent::whereBetween('created_at', [$startDate, $endDate])
            ->where('event_category', 'conversion')
            ->get();

        return [
            'total_conversions' => $conversionEvents->count(),
            'by_type' => $conversionEvents->groupBy('event_name')->map->count()
        ];
    }

    /**
     * Get device breakdown
     */
    protected function getDeviceBreakdown($startDate, $endDate)
    {
        return UserSession::whereBetween('started_at', [$startDate, $endDate])
            ->select('device_type', DB::raw('count(*) as count'))
            ->groupBy('device_type')
            ->get()
            ->map(function ($item) {
                return [
                    'device' => $item->device_type ?? 'unknown',
                    'count' => $item->count
                ];
            });
    }

    /**
     * Get top pages
     */
    protected function getTopPages($startDate, $endDate)
    {
        return PageView::whereBetween('viewed_at', [$startDate, $endDate])
            ->select(
                'page_url',
                'page_title',
                DB::raw('count(*) as views'),
                DB::raw('avg(time_on_page) as avg_time'),
                DB::raw('avg(scroll_depth) as avg_scroll')
            )
            ->groupBy('page_url', 'page_title')
            ->orderBy('views', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($item) {
                return [
                    'url' => $item->page_url,
                    'title' => $item->page_title,
                    'views' => $item->views,
                    'avg_time' => round($item->avg_time ?? 0),
                    'avg_scroll' => round($item->avg_scroll ?? 0)
                ];
            });
    }

    /**
     * Get top events
     */
    protected function getTopEvents($startDate, $endDate)
    {
        return UserEvent::whereBetween('created_at', [$startDate, $endDate])
            ->select('event_name', 'event_category', DB::raw('count(*) as count'))
            ->groupBy('event_name', 'event_category')
            ->orderBy('count', 'desc')
            ->limit(20)
            ->get();
    }

    /**
     * Get realtime metrics (last 5 minutes)
     */
    protected function getRealtimeMetrics()
    {
        $since = now()->subMinutes(5);

        return [
            'active_users' => UserSession::where('started_at', '>=', $since)
                ->distinct('session_id')
                ->count(),
            'page_views' => PageView::where('viewed_at', '>=', $since)->count(),
            'events' => UserEvent::where('created_at', '>=', $since)->count()
        ];
    }

    /**
     * Get bounce rate
     */
    protected function getBounceRate($startDate, $endDate)
    {
        $totalSessions = UserSession::whereBetween('started_at', [$startDate, $endDate])->count();
        $bouncedSessions = UserSession::whereBetween('started_at', [$startDate, $endDate])
            ->where('page_views', 1)
            ->count();

        return $totalSessions > 0 ? round(($bouncedSessions / $totalSessions) * 100, 2) : 0;
    }

    /**
     * Get heatmap data for page
     */
    public function getHeatmapData($pageUrl, $type = 'click', $deviceType = null)
    {
        $query = DB::table('heatmap_data')
            ->where('page_url', $pageUrl)
            ->where('type', $type);

        if ($deviceType) {
            $query->where('device_type', $deviceType);
        }

        return $query->get(['x_position', 'y_position', 'element_selector'])
            ->map(function ($item) {
                return [
                    'x' => $item->x_position,
                    'y' => $item->y_position,
                    'value' => 1,
                    'element' => $item->element_selector
                ];
            });
    }

    /**
     * Helper: Get session ID
     */
    protected function getSessionId()
    {
        return request()->header('X-Session-Id') ?? session()->getId();
    }

    /**
     * Helper: Get device type
     */
    protected function getDeviceType()
    {
        $userAgent = request()->userAgent();

        if (preg_match('/mobile/i', $userAgent)) {
            return 'mobile';
        } elseif (preg_match('/tablet|ipad/i', $userAgent)) {
            return 'tablet';
        }

        return 'desktop';
    }

    /**
     * Helper: Get browser
     */
    protected function getBrowser()
    {
        $userAgent = request()->userAgent();

        if (strpos($userAgent, 'Chrome') !== false) return 'Chrome';
        if (strpos($userAgent, 'Firefox') !== false) return 'Firefox';
        if (strpos($userAgent, 'Safari') !== false) return 'Safari';
        if (strpos($userAgent, 'Edge') !== false) return 'Edge';

        return 'Other';
    }

    /**
     * Helper: Get OS
     */
    protected function getOS()
    {
        $userAgent = request()->userAgent();

        if (strpos($userAgent, 'Windows') !== false) return 'Windows';
        if (strpos($userAgent, 'Mac') !== false) return 'MacOS';
        if (strpos($userAgent, 'Linux') !== false) return 'Linux';
        if (strpos($userAgent, 'Android') !== false) return 'Android';
        if (strpos($userAgent, 'iOS') !== false) return 'iOS';

        return 'Other';
    }
}
