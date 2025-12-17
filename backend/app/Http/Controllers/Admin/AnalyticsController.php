<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Analytics\PlatformAnalytics;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AnalyticsController extends Controller
{
    public function __construct(private PlatformAnalytics $analytics)
    {
    }

    public function index(Request $request): View
    {
        $months = (int) $request->integer('months', 6);
        $funnelRange = $request->string('range', '30_days');

        [$from, $to] = $this->resolveRange($funnelRange);

        $summaryCards = $this->analytics->summarySnapshot();
        $monthlyNewUsers = $this->analytics->monthlyNewUsers($months);
        $revenueTrend = $this->analytics->revenueTrend($months);
        $conversionFunnel = $this->analytics->conversionFunnel($from, $to);
        $churn = $this->analytics->churnMetrics();
        $engagement = $this->analytics->engagementBreakdown();
        $dailyActiveUsers = $this->analytics->dailyActiveUsers();
        $cohortRetention = $this->analytics->cohortRetention($months);

        return view('admin.analytics.index', [
            'summaryCards' => $summaryCards,
            'monthlyNewUsers' => $monthlyNewUsers,
            'revenueTrend' => $revenueTrend,
            'conversionFunnel' => $conversionFunnel,
            'churn' => $churn,
            'engagement' => $engagement,
            'dailyActiveUsers' => $dailyActiveUsers,
            'cohortRetention' => $cohortRetention,
            'selectedRange' => $funnelRange,
            'months' => $months,
            'rangeFrom' => $from,
            'rangeTo' => $to,
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $funnelRange = $request->string('range', '30_days');
        [$from, $to] = $this->resolveRange($funnelRange);

        $report = $this->analytics->exportReport($from, $to);
        $filename = sprintf('analytics_report_%s_%s.json', $from->format('Ymd'), $to->format('Ymd'));

        return response()->streamDownload(function () use ($report) {
            echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }, $filename, [
            'Content-Type' => 'application/json; charset=utf-8',
        ]);
    }

    protected function resolveRange(string $range): array
    {
        $now = Carbon::now();

        return match ($range) {
            '7_days' => [$now->copy()->subDays(6)->startOfDay(), $now->copy()->endOfDay()],
            '90_days' => [$now->copy()->subDays(89)->startOfDay(), $now->copy()->endOfDay()],
            'year' => [$now->copy()->startOfYear(), $now->copy()->endOfDay()],
            default => [$now->copy()->subDays(29)->startOfDay(), $now->copy()->endOfDay()],
        };
    }
}
