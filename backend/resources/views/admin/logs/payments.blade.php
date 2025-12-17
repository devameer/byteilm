@extends('admin.layout')

@section('title', __('سجلات المدفوعات'))
@section('subtitle', __('تعقب تاريخ العمليات المالية مع حالة التنفيذ لكل دفعة.'))

@php
    $logNav = [
        ['route' => 'admin.logs.login', 'label' => __('تسجيل الدخول')],
        ['route' => 'admin.logs.activity', 'label' => __('الأنشطة')],
        ['route' => 'admin.logs.errors', 'label' => __('الأخطاء')],
        ['route' => 'admin.logs.api', 'label' => __('API')],
        ['route' => 'admin.logs.payments', 'label' => __('المدفوعات')],
    ];
@endphp

@section('content')
    <div class="mb-6">
        <nav class="flex flex-wrap gap-2">
            @foreach ($logNav as $item)
                @php($active = request()->routeIs($item['route']))
                <a href="{{ route($item['route']) }}"
                    class="px-4 py-2 text-sm rounded-xl border {{ $active ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-semibold' : 'border-slate-200 text-slate-600 hover:bg-slate-100' }}">
                    {{ $item['label'] }}
                </a>
            @endforeach
        </nav>
    </div>

    @if (!empty($statusBreakdown))
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            @foreach ($statusBreakdown as $status => $count)
                @php
                    $statusLabel = [
                        'pending' => __('قيد المعالجة'),
                        'completed' => __('مكتمل'),
                        'failed' => __('فشل'),
                        'refunded' => __('مسترد'),
                    ][$status] ?? __($status);
                @endphp
                <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <p class="text-sm text-slate-500">{{ $statusLabel }}</p>
                    <p class="text-2xl font-semibold text-slate-800 mt-2">{{ number_format($count) }}</p>
                </div>
            @endforeach
        </div>
    @endif

    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-800">{{ __('سجل المدفوعات') }}</h2>
            <a href="{{ route('admin.logs.export', array_merge(['type' => 'payments'], request()->except('page'))) }}"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                <i class="fa-solid fa-file-arrow-down"></i>
                {{ __('تصدير CSV') }}
            </a>
        </div>

        <form method="GET" class="grid gap-3 lg:grid-cols-6 mb-6">
            <input type="search" name="search" value="{{ request('search') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('ابحث بالمعرف أو المستخدم') }}">

            <select name="status"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">{{ __('كل الحالات') }}</option>
                @foreach (['pending', 'completed', 'failed', 'refunded'] as $status)
                    <option value="{{ $status }}" @selected(request('status') === $status)>
                        {{ __($status) }}
                    </option>
                @endforeach
            </select>

            <select name="gateway"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">{{ __('كل البوابات') }}</option>
                @foreach ($gateways as $gateway)
                    <option value="{{ $gateway }}" @selected(request('gateway') === $gateway)>{{ $gateway }}</option>
                @endforeach
            </select>

            <input type="date" name="date_from" value="{{ request('date_from') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('من تاريخ') }}">

            <input type="date" name="date_to" value="{{ request('date_to') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('إلى تاريخ') }}">

            <select name="per_page"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                @foreach ([25, 50, 100] as $size)
                    <option value="{{ $size }}" @selected((int) request('per_page', 25) === $size)>
                        {{ $size }} {{ __('لكل صفحة') }}
                    </option>
                @endforeach
            </select>

            <div class="flex gap-2 lg:col-span-6">
                <a href="{{ route('admin.logs.payments') }}"
                    class="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">{{ __('إعادة تعيين') }}</a>
                <button type="submit"
                    class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">{{ __('تصفية') }}</button>
            </div>
        </form>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-slate-600">
                    <tr>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('التاريخ') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المستخدم') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الباقة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المبلغ') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الحالة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('البوابة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المعرف المرجعي') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @forelse ($paymentLogs as $payment)
                        <tr class="hover:bg-slate-50">
                            <td class="px-4 py-3 text-slate-500">{{ optional($payment->created_at)->format('Y-m-d H:i') }}</td>
                            <td class="px-4 py-3">
                                <div class="font-semibold text-slate-800">{{ $payment->user?->name ?? __('غير معروف') }}</div>
                                <div class="text-xs text-slate-500">{{ $payment->user?->email }}</div>
                            </td>
                            <td class="px-4 py-3 text-slate-500">{{ $payment->subscription?->plan?->display_name ?? __('—') }}</td>
                            <td class="px-4 py-3 font-semibold text-slate-700">
                                {{ number_format($payment->amount, 2) }} {{ $payment->currency }}
                            </td>
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
                            <td class="px-4 py-3 text-slate-500">{{ $payment->payment_gateway ?? __('غير محدد') }}</td>
                            <td class="px-4 py-3 text-slate-500 ltr:font-mono">{{ $payment->transaction_id ?? '—' }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" class="px-4 py-6 text-center text-slate-500">
                                {{ __('لا توجد عمليات دفع مسجلة بعد.') }}
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="mt-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span class="text-sm text-slate-500">{{ __('إجمالي النتائج: :count', ['count' => $paymentLogs->total()]) }}</span>
            {{ $paymentLogs->links() }}
        </div>
    </div>
@endsection
