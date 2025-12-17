@extends('admin.layout')

@section('title', __('تقارير الاشتراكات'))
@section('subtitle', __('مؤشرات الأداء الرئيسية للاشتراكات ونظرة على نمو الإيرادات المتكررة.'))

@php
    $statusTotals = $statusBreakdown->pluck('total', 'status');
    $activeCount = $statusTotals->get('active', 0);
    $trialCount = $statusTotals->get('trialing', 0);
    $canceledCount = $statusTotals->get('canceled', 0);
    $expiredCount = $statusTotals->get('expired', 0);
@endphp

@section('content')
    <div class="flex justify-end">
        <a href="{{ route('admin.subscriptions.index') }}"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
            <i class="fa-solid fa-rotate-left text-xs"></i>
            {{ __('العودة لقائمة الاشتراكات') }}
        </a>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('MRR الحالي') }}</p>
            <p class="text-3xl font-semibold text-emerald-600 mt-2">{{ number_format($mrr, 2) }} USD</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('اشتراكات نشطة') }}</p>
            <p class="text-3xl font-semibold text-slate-800 mt-2">{{ number_format($activeCount) }}</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('اشتراكات تجريبية') }}</p>
            <p class="text-3xl font-semibold text-amber-600 mt-2">{{ number_format($trialCount) }}</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('اشتراكات ملغاة/منتهية') }}</p>
            <p class="text-3xl font-semibold text-rose-500 mt-2">{{ number_format($canceledCount + $expiredCount) }}</p>
        </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2 mt-6">
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('توزيع الاشتراكات حسب الحالة') }}</h2>
            <ul class="space-y-3 text-sm">
                @forelse ($statusBreakdown as $row)
                    <li class="flex items-center justify-between">
                        <span class="text-slate-500">{{ __($row->status ?? 'غير محدد') }}</span>
                        <span class="font-semibold text-slate-700">{{ number_format($row->total) }}</span>
                    </li>
                @empty
                    <li class="text-slate-500">{{ __('لا توجد بيانات اشتراك بعد.') }}</li>
                @endforelse
            </ul>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('توزيع الاشتراكات حسب الباقة') }}</h2>
            <ul class="space-y-3 text-sm">
                @forelse ($planDistribution as $row)
                    <li class="flex items-center justify-between">
                        <span class="text-slate-500">{{ optional($row->plan)->display_name ?? __('خطة مجانية') }}</span>
                        <span class="font-semibold text-slate-700">{{ number_format($row->total) }}</span>
                    </li>
                @empty
                    <li class="text-slate-500">{{ __('لم يتم ربط أي اشتراكات بالباقات بعد.') }}</li>
                @endforelse
            </ul>
        </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2 mt-6">
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('الاشتراكات التجريبية التي تنتهي قريباً') }}</h2>
            <ul class="space-y-3 text-sm">
                @forelse ($trialEndingSoon as $subscription)
                    <li class="flex items-center justify-between">
                        <div>
                            <p class="font-semibold text-slate-800">{{ $subscription->user?->name ?? __('مستخدم غير معروف') }}</p>
                            <p class="text-xs text-slate-500">{{ optional($subscription->trial_ends_at)->format('Y-m-d') }}</p>
                        </div>
                        <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-xs font-semibold">
                            {{ optional($subscription->plan)->display_name ?? __('خطة مجانية') }}
                        </span>
                    </li>
                @empty
                    <li class="text-slate-500">{{ __('لا توجد اشتراكات تجريبية حالياً.') }}</li>
                @endforelse
            </ul>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('إيرادات الاشتراكات (آخر 6 أشهر)') }}</h2>
            <ul class="space-y-3 text-sm">
                @foreach ($monthlyRevenue as $entry)
                    <li class="flex items-center justify-between">
                        <span class="text-slate-500">{{ $entry['label'] }}</span>
                        <span class="font-semibold text-emerald-600">{{ number_format($entry['total'], 2) }} USD</span>
                    </li>
                @endforeach
            </ul>
        </div>
    </div>
@endsection
