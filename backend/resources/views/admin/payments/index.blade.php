@extends('admin.layout')

@section('title', __('المدفوعات'))
@section('subtitle', __('مراجعة المدفوعات والتحويلات المالية.'))

@section('content')
    <div class="grid gap-4 md:grid-cols-3 mb-6">
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('إجمالي المدفوعات الناجحة') }}</p>
            <p class="text-2xl font-semibold text-emerald-600 mt-2">{{ number_format($totals['completed'], 2) }} USD</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('المبالغ المستردة') }}</p>
            <p class="text-2xl font-semibold text-amber-600 mt-2">{{ number_format($totals['refunded'], 2) }} USD</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('المدفوعات المعلقة') }}</p>
            <p class="text-2xl font-semibold text-slate-600 mt-2">{{ number_format($totals['pending'], 2) }} USD</p>
        </div>
    </div>

    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
        <form method="GET" class="grid gap-4 md:grid-cols-5">
            <input type="date" name="from" value="{{ request('from') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('من تاريخ') }}">
            <input type="date" name="to" value="{{ request('to') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('إلى تاريخ') }}">
            <select name="status"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">{{ __('كل الحالات') }}</option>
                @foreach (['pending', 'completed', 'failed', 'refunded'] as $status)
                    <option value="{{ $status }}" @selected(request('status') === $status)>{{ __($status) }}</option>
                @endforeach
            </select>
            <select name="gateway"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">{{ __('كل البوابات') }}</option>
                @foreach ($gateways as $gateway)
                    <option value="{{ $gateway }}" @selected(request('gateway') === $gateway)>{{ $gateway }}</option>
                @endforeach
            </select>
            <div class="flex gap-2">
                <a href="{{ route('admin.payments.index') }}"
                    class="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">{{ __('إعادة تعيين') }}</a>
                <button type="submit"
                    class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">{{ __('تصفية') }}</button>
            </div>
        </form>
    </div>

    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-3">
                <h2 class="text-lg font-semibold text-slate-800">{{ __('سجل المدفوعات') }}</h2>
                <a href="{{ route('admin.payments.reports') }}"
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                    <i class="fa-solid fa-chart-column text-xs"></i>
                    {{ __('عرض التقارير') }}
                </a>
            </div>
            <a href="{{ route('admin.payments.export', request()->query()) }}"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                <i class="fa-solid fa-file-arrow-down"></i>
                {{ __('تصدير CSV') }}
            </a>
        </div>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-slate-600">
                    <tr>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('التاريخ') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المستخدم') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الباقة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المبلغ') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('البوابة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الحالة') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @forelse ($payments as $payment)
                        <tr class="hover:bg-slate-50">
                            <td class="px-4 py-3 text-slate-500">{{ optional($payment->created_at)->format('Y-m-d H:i') }}</td>
                            <td class="px-4 py-3">
                                <div class="font-semibold text-slate-800">{{ $payment->user?->name }}</div>
                                <div class="text-xs text-slate-500">{{ $payment->user?->email }}</div>
                            </td>
                            <td class="px-4 py-3 text-slate-700">{{ $payment->subscription?->plan?->display_name ?? __('—') }}</td>
                            <td class="px-4 py-3 font-semibold text-slate-700">
                                {{ number_format($payment->amount, 2) }} {{ $payment->currency }}
                            </td>
                            <td class="px-4 py-3 text-slate-500">{{ $payment->payment_gateway ?? __('غير محدد') }}</td>
                            <td class="px-4 py-3">
                                @php
                                    $statusLabel = [
                                        'pending' => __('قيد المعالجة'),
                                        'completed' => __('مكتمل'),
                                        'failed' => __('فشل'),
                                        'refunded' => __('مسترد'),
                                    ][$payment->status] ?? $payment->status;
                                @endphp
                                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $payment->status === 'completed' ? 'bg-emerald-50 text-emerald-600' : ($payment->status === 'failed' ? 'bg-rose-50 text-rose-600' : ($payment->status === 'refunded' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500')) }}">
                                    {{ $statusLabel }}
                                </span>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="px-4 py-6 text-center text-slate-500">{{ __('لا توجد مدفوعات مسجلة.') }}</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="mt-6">
            {{ $payments->links() }}
        </div>
    </div>
@endsection
