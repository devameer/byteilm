@extends('admin.layout')

@section('title', __('التقارير المالية'))
@section('subtitle', __('تحليل المدفوعات، الاستردادات، وأداء البوابات المالية.'))

@php
    $statusAmounts = $statusSummary->pluck('amount', 'status');
    $statusCounts = $statusSummary->pluck('total', 'status');
    $completedAmount = $statusAmounts->get('completed', 0);
    $refundedAmount = $statusAmounts->get('refunded', 0);
    $failedCount = $statusCounts->get('failed', 0);
    $pendingCount = $statusCounts->get('pending', 0);
@endphp

@section('content')
    <div class="flex justify-end">
        <a href="{{ route('admin.payments.index') }}"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
            <i class="fa-solid fa-rotate-left text-xs"></i>
            {{ __('العودة لسجل المدفوعات') }}
        </a>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('إجمالي المدفوعات المكتملة') }}</p>
            <p class="text-3xl font-semibold text-emerald-600 mt-2">{{ number_format($completedAmount, 2) }} USD</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('المبالغ المستردة') }}</p>
            <p class="text-3xl font-semibold text-amber-600 mt-2">{{ number_format($refundedAmount, 2) }} USD</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('مدفوعات فاشلة') }}</p>
            <p class="text-3xl font-semibold text-rose-500 mt-2">{{ number_format($failedCount) }}</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('مدفوعات معلقة') }}</p>
            <p class="text-3xl font-semibold text-slate-800 mt-2">{{ number_format($pendingCount) }}</p>
        </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2 mt-6">
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('توزيع المدفوعات حسب الحالة') }}</h2>
            <ul class="space-y-3 text-sm">
                @forelse ($statusSummary as $row)
                    <li class="flex items-center justify-between">
                        <div>
                            <p class="font-semibold text-slate-700">{{ __($row->status ?? 'غير محدد') }}</p>
                            <p class="text-xs text-slate-500">
                                {{ __('العدد:') }} {{ number_format($row->total) }}
                            </p>
                        </div>
                        <span class="font-semibold text-emerald-600">{{ number_format($row->amount, 2) }} USD</span>
                    </li>
                @empty
                    <li class="text-slate-500">{{ __('لا توجد بيانات مالية متاحة بعد.') }}</li>
                @endforelse
            </ul>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('أداء بوابات الدفع') }}</h2>
            <ul class="space-y-3 text-sm">
                @forelse ($gatewayBreakdown as $row)
                    <li class="flex items-center justify-between">
                        <span class="text-slate-500">{{ $row->payment_gateway ?? __('غير محدد') }}</span>
                        <span class="font-semibold text-slate-700">{{ number_format($row->total) }} / {{ number_format($row->amount, 2) }} USD</span>
                    </li>
                @empty
                    <li class="text-slate-500">{{ __('لم يتم تفعيل أي بوابة دفع بعد.') }}</li>
                @endforelse
            </ul>
        </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2 mt-6">
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('أفضل العملاء (حسب الإيراد)') }}</h2>
            <ul class="space-y-3 text-sm">
                @forelse ($topCustomers as $entry)
                    <li class="flex items-center justify-between">
                        <div>
                            <p class="font-semibold text-slate-800">{{ $entry->user?->name ?? __('مستخدم غير معروف') }}</p>
                            <p class="text-xs text-slate-500">{{ $entry->user?->email }}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold text-emerald-600">{{ number_format($entry->total_amount, 2) }} USD</p>
                            <p class="text-xs text-slate-500">{{ __('عدد المدفوعات:') }} {{ number_format($entry->payments_count) }}</p>
                        </div>
                    </li>
                @empty
                    <li class="text-slate-500">{{ __('لا توجد مدفوعات مكتملة حتى الآن.') }}</li>
                @endforelse
            </ul>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('الأداء الشهري (آخر 6 أشهر)') }}</h2>
            <ul class="space-y-3 text-sm">
                @foreach ($monthlyTotals as $entry)
                    <li class="flex items-center justify-between">
                        <span class="text-slate-500">{{ $entry['label'] }}</span>
                        <div class="text-right">
                            <p class="font-semibold text-emerald-600">{{ number_format($entry['completed'], 2) }} USD</p>
                            <p class="text-xs text-rose-500">{{ __('مسترد:') }} {{ number_format($entry['refunded'], 2) }} USD</p>
                        </div>
                    </li>
                @endforeach
            </ul>
        </div>
    </div>
@endsection
