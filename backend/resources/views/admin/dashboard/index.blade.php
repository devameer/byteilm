@extends('admin.layout')

@section('title', __('نظرة عامة'))
@section('subtitle', __('مؤشرات عامة عن النظام والاشتراكات.'))

@section('content')

<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    @php
    $primaryMetrics = [
    ['label' => __('إجمالي المستخدمين'), 'value' => number_format($metrics['total_users']), 'accent' =>
    'text-slate-800'],
    ['label' => __('المستخدمون النشطون اليوم'), 'value' => number_format($metrics['active_users_today']), 'accent' =>
    'text-emerald-600'],
    ['label' => __('مستخدمون جدد هذا الشهر'), 'value' => number_format($metrics['new_users_this_month']), 'accent' =>
    'text-indigo-600'],
    ['label' => __('الإيرادات التراكمية'), 'value' => number_format($metrics['total_revenue'], 2) . ' USD', 'accent' =>
    'text-slate-800'],
    ['label' => __('الإيرادات الشهرية'), 'value' => number_format($metrics['monthly_revenue'], 2) . ' USD', 'accent' =>
    'text-indigo-600'],
    ['label' => __('MRR'), 'value' => number_format($metrics['mrr'], 2) . ' USD', 'accent' => 'text-slate-800'],
    ['label' => __('الاشتراكات النشطة'), 'value' => number_format($metrics['active_subscriptions']), 'accent' =>
    'text-emerald-600'],
    ['label' => __('المستخدمون التجريبيون'), 'value' => number_format($metrics['trial_users']), 'accent' =>
    'text-amber-600'],
    ['label' => __('معدل التحويل'), 'value' => number_format($metrics['conversion_rate'], 2) . '%', 'accent' =>
    'text-amber-600'],
    ['label' => __('معدل الإلغاء'), 'value' => number_format($metrics['churn_rate'], 2) . '%', 'accent' =>
    'text-rose-600'],
    ];
    @endphp
    @foreach ($primaryMetrics as $metric)
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <p class="text-sm text-slate-500">{{ $metric['label'] }}</p>
        <p class="text-2xl font-bold mt-3 {{ $metric['accent'] }}">{{ $metric['value'] }}</p>
    </div>
    @endforeach
</section>

<section class="grid gap-6 xl:grid-cols-3 mt-6">
    <div class="xl:col-span-2 grid gap-6 md:grid-cols-2">
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('نمو المستخدمين') }}</h2>
            <div class="space-y-3">
                @foreach ($growthChart['labels'] as $index => $label)
                <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-500">{{ $label }}</span>
                    <span class="font-semibold text-slate-700">{{ number_format($growthChart['data'][$index]) }}</span>
                </div>
                @endforeach
            </div>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('اتجاه الإيرادات') }}</h2>
            <div class="space-y-3">
                @foreach ($revenueChart['labels'] as $index => $label)
                <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-500">{{ $label }}</span>
                    <span class="font-semibold text-emerald-600">{{ number_format($revenueChart['data'][$index], 2) }}
                        USD</span>
                </div>
                @endforeach
            </div>
        </div>
    </div>

    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('إجراءات سريعة') }}</h2>
        <div class="grid gap-3 text-sm">
            <a href="{{ route('admin.users.index') }}" class="quick-action">{{ __('إدارة المستخدمين') }}<i
                    class="fa-solid fa-angle-left text-xs"></i></a>
            <a href="{{ route('admin.subscriptions.index') }}" class="quick-action">{{ __('مراجعة الاشتراكات') }}<i
                    class="fa-solid fa-angle-left text-xs"></i></a>
            <a href="{{ route('admin.plans.index') }}" class="quick-action">{{ __('ضبط الباقات') }}<i
                    class="fa-solid fa-angle-left text-xs"></i></a>
            <a href="{{ route('admin.payments.index') }}" class="quick-action">{{ __('التقارير المالية') }}<i
                    class="fa-solid fa-angle-left text-xs"></i></a>
            <a href="{{ route('admin.analytics.index') }}" class="quick-action">{{ __('عرض لوحة التقارير') }}<i
                    class="fa-solid fa-angle-left text-xs"></i></a>
        </div>
    </div>
</section>

<section class="grid gap-6 lg:grid-cols-2 mt-6">
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('إحصائيات المحتوى') }}</h2>
        <div class="grid gap-4 md:grid-cols-2 text-sm">
            <div class="rounded-xl border border-slate-200 p-4">
                <p class="text-slate-500">{{ __('إجمالي الدورات') }}</p>
                <p class="text-xl font-semibold text-slate-800 mt-1">{{ number_format($contentStats['total_courses']) }}
                </p>
            </div>
            <div class="rounded-xl border border-slate-200 p-4">
                <p class="text-slate-500">{{ __('إجمالي الدروس') }}</p>
                <p class="text-xl font-semibold text-slate-800 mt-1">{{ number_format($contentStats['total_lessons']) }}
                </p>
            </div>
            <div class="rounded-xl border border-slate-200 p-4">
                <p class="text-slate-500">{{ __('إجمالي الفيديوهات') }}</p>
                <p class="text-xl font-semibold text-slate-800 mt-1">{{ number_format($contentStats['total_videos']) }}
                </p>
            </div>
            <div class="rounded-xl border border-slate-200 p-4">
                <p class="text-slate-500">{{ __('إجمالي المشاريع') }}</p>
                <p class="text-xl font-semibold text-slate-800 mt-1">{{ number_format($contentStats['total_projects'])
                    }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 p-4 md:col-span-2">
                <p class="text-slate-500">{{ __('استخدام التخزين') }}</p>
                <p class="text-xl font-semibold text-slate-800 mt-1">{{ number_format($contentStats['storage_used_gb'],
                    2) }} GB</p>
            </div>
        </div>
    </div>

    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('التفاعل') }}</h2>
        <ul class="space-y-3 text-sm">
            <li class="flex items-center justify-between"><span class="text-slate-500">{{ __('المستخدمون النشطون
                    يومياً') }}</span><span class="font-semibold text-slate-700">{{
                    number_format($engagement['daily_active_users']) }}</span></li>
            <li class="flex items-center justify-between"><span class="text-slate-500">{{ __('المستخدمون النشطون
                    أسبوعياً') }}</span><span class="font-semibold text-slate-700">{{
                    number_format($engagement['weekly_active_users']) }}</span></li>
            <li class="flex items-center justify-between"><span class="text-slate-500">{{ __('المستخدمون النشطون
                    شهرياً') }}</span><span class="font-semibold text-slate-700">{{
                    number_format($engagement['monthly_active_users']) }}</span></li>
            <li class="flex items-center justify-between"><span class="text-slate-500">{{ __('متوسط مدة الجلسة')
                    }}</span><span class="font-semibold text-slate-700">{{ $engagement['avg_session_duration'] }}</span>
            </li>
        </ul>
    </div>
</section>

<section class="grid gap-6 lg:grid-cols-3 mt-6">
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('أكثر المستخدمين نشاطاً') }}</h2>
        <ul class="space-y-3 text-sm">
            @foreach ($mostActiveUsers as $item)
            <li class="flex items-center justify-between">
                <div>
                    <p class="font-semibold text-slate-800">{{ $item->user?->name ?? __('مستخدم غير معروف') }}</p>
                    <p class="text-xs text-slate-500">{{ $item->user?->email }}</p>
                </div>
                <span
                    class="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-medium">{{
                    number_format($item->tasks_count) }}</span>
            </li>
            @endforeach
        </ul>
    </div>

    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('أفضل صناع المحتوى') }}</h2>
        <ul class="space-y-3 text-sm">
            @foreach ($topContentCreators as $item)
            <li class="flex items-center justify-between">
                <div>
                    <p class="font-semibold text-slate-800">{{ $item->user?->name ?? __('مستخدم غير معروف') }}</p>
                    <p class="text-xs text-slate-500">{{ $item->user?->email }}</p>
                </div>
                <span
                    class="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-medium">{{
                    number_format($item->courses_count) }}</span>
            </li>
            @endforeach
        </ul>
    </div>

    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('المستخدمون الجدد') }}</h2>
        <ul class="space-y-3 text-sm">
            @foreach ($newestUsers as $user)
            <li class="flex items-center justify-between">
                <div>
                    <p class="font-semibold text-slate-800">{{ $user->name }}</p>
                    <p class="text-xs text-slate-500">{{ $user->email }}</p>
                </div>
                <span class="text-xs text-slate-400">{{ optional($user->created_at)->diffForHumans() }}</span>
            </li>
            @endforeach
        </ul>
    </div>
</section>
@endsection

@push('styles')
<style>
    .quick-action {
        @apply flex items-center justify-between px-4 py-3 rounded-xl border border-indigo-100 text-sm font-semibold text-indigo-600 bg-indigo-50 hover: bg-indigo-100 transition;
    }
</style>
@endpush