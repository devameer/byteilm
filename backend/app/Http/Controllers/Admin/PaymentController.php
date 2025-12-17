<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response;
use Illuminate\View\View;

class PaymentController extends Controller
{
    public function index(Request $request): View
    {
        $baseQuery = Payment::query()
            ->with(['user', 'subscription.plan'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('gateway'), fn ($query) => $query->where('payment_gateway', $request->string('gateway')))
            ->when($request->filled('from'), function ($query) use ($request) {
                $query->whereDate('created_at', '>=', Carbon::parse($request->string('from')));
            })
            ->when($request->filled('to'), function ($query) use ($request) {
                $query->whereDate('created_at', '<=', Carbon::parse($request->string('to')));
            })
            ->orderByDesc('created_at');

        $payments = (clone $baseQuery)->paginate(25)->withQueryString();

        $totals = [
            'completed' => (clone $baseQuery)->where('status', 'completed')->sum('amount'),
            'refunded' => (clone $baseQuery)->where('status', 'refunded')->sum('amount'),
            'pending' => (clone $baseQuery)->where('status', 'pending')->sum('amount'),
        ];

        $gateways = Payment::query()
            ->select('payment_gateway')
            ->whereNotNull('payment_gateway')
            ->distinct()
            ->pluck('payment_gateway');

        return view('admin.payments.index', compact('payments', 'totals', 'gateways'));
    }

    public function reports(): View
    {
        $statusSummary = Payment::query()
            ->select('status', DB::raw('COUNT(*) as total'), DB::raw('COALESCE(SUM(amount), 0) as amount'))
            ->groupBy('status')
            ->orderByDesc('total')
            ->get();

        $gatewayBreakdown = Payment::query()
            ->select('payment_gateway', DB::raw('COUNT(*) as total'), DB::raw('COALESCE(SUM(amount), 0) as amount'))
            ->groupBy('payment_gateway')
            ->orderByDesc('total')
            ->get();

        $topCustomers = Payment::query()
            ->select('user_id', DB::raw('COUNT(*) as payments_count'), DB::raw('SUM(amount) as total_amount'))
            ->with('user')
            ->where('status', 'completed')
            ->groupBy('user_id')
            ->orderByDesc('total_amount')
            ->limit(10)
            ->get();

        $monthlyTotals = collect(range(0, 5))->map(function ($offset) {
            $start = Carbon::now()->subMonths($offset)->startOfMonth();
            $end = (clone $start)->endOfMonth();

            return [
                'label' => $start->format('M Y'),
                'completed' => Payment::where('status', 'completed')
                    ->whereBetween('created_at', [$start, $end])
                    ->sum('amount'),
                'refunded' => Payment::where('status', 'refunded')
                    ->whereBetween('created_at', [$start, $end])
                    ->sum('amount'),
            ];
        })->reverse()->values();

        return view('admin.payments.reports', [
            'statusSummary' => $statusSummary,
            'gatewayBreakdown' => $gatewayBreakdown,
            'topCustomers' => $topCustomers,
            'monthlyTotals' => $monthlyTotals,
        ]);
    }

    public function export(Request $request)
    {
        $payments = Payment::query()
            ->with(['user', 'subscription.plan'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('gateway'), fn ($query) => $query->where('payment_gateway', $request->string('gateway')))
            ->when($request->filled('from'), function ($query) use ($request) {
                $query->whereDate('created_at', '>=', Carbon::parse($request->string('from')));
            })
            ->when($request->filled('to'), function ($query) use ($request) {
                $query->whereDate('created_at', '<=', Carbon::parse($request->string('to')));
            })
            ->orderByDesc('created_at')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="payments-export.csv"',
        ];

        $callback = static function () use ($payments) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Date', 'User', 'Email', 'Plan', 'Amount', 'Currency', 'Gateway', 'Status', 'Transaction ID']);

            foreach ($payments as $payment) {
                fputcsv($handle, [
                    optional($payment->created_at)->format('Y-m-d H:i'),
                    $payment->user?->name,
                    $payment->user?->email,
                    $payment->subscription?->plan?->display_name,
                    $payment->amount,
                    $payment->currency,
                    $payment->payment_gateway,
                    $payment->status,
                    $payment->transaction_id,
                ]);
            }

            fclose($handle);
        };

        return Response::stream($callback, 200, $headers);
    }
}
