@extends('admin.layout')

@section('title', __('سجلات تسجيل الدخول'))
@section('subtitle', __('متابعة محاولات تسجيل الدخول الناجحة والفاشلة.'))

@php
    $logNav = [
        ['route' => 'admin.logs.login', 'label' => __('تسجيل الدخول')],
        ['route' => 'admin.logs.activity', 'label' => __('الأنشطة')],
        ['route' => 'admin.logs.errors', 'label' => __('الأخطاء')],
        ['route' => 'admin.logs.api', 'label' => __('API')],
        ['route' => 'admin.logs.payments', 'label' => __('المدفوعات')],
    ];
    $statusLabels = [
        'success' => __('ناجحة'),
        'failed' => __('فاشلة'),
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

    @if (!empty($statusCounts))
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            @foreach ($availableStatuses as $status)
                @php($count = $statusCounts[$status] ?? 0)
                <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <p class="text-sm text-slate-500">{{ __('عدد المحاولات :status', ['status' => $statusLabels[$status] ?? __($status)]) }}</p>
                    <p class="text-2xl font-semibold text-slate-800 mt-2">{{ number_format($count) }}</p>
                </div>
            @endforeach
        </div>
    @endif

    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-800">{{ __('سجل محاولات تسجيل الدخول') }}</h2>
            <a href="{{ route('admin.logs.export', array_merge(['type' => 'login'], request()->except('page'))) }}"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                <i class="fa-solid fa-file-arrow-down"></i>
                {{ __('تصدير CSV') }}
            </a>
        </div>

        <form method="GET" class="grid gap-3 lg:grid-cols-6 mb-6">
            <input type="search" name="search" value="{{ request('search') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('ابحث بالاسم أو البريد') }}">

            <select name="status"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">{{ __('كل الحالات') }}</option>
                @foreach ($availableStatuses as $status)
                    <option value="{{ $status }}" @selected(request('status') === $status)>
                        {{ $statusLabels[$status] ?? __($status) }} @if (($statusCounts[$status] ?? 0) > 0) ({{ $statusCounts[$status] }}) @endif
                    </option>
                @endforeach
            </select>

            <input type="date" name="date_from" value="{{ request('date_from') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('من تاريخ') }}">

            <input type="date" name="date_to" value="{{ request('date_to') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('إلى تاريخ') }}">

            <input type="search" name="user" value="{{ request('user') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('المستخدم (اسم أو بريد)') }}">

            <select name="per_page"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                @foreach ([25, 50, 100] as $size)
                    <option value="{{ $size }}" @selected((int) request('per_page', 25) === $size)>
                        {{ $size }} {{ __('لكل صفحة') }}
                    </option>
                @endforeach
            </select>

            <div class="flex gap-2 lg:col-span-6">
                <a href="{{ route('admin.logs.login') }}"
                    class="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">{{ __('إعادة تعيين') }}</a>
                <button type="submit"
                    class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">{{ __('تصفية') }}</button>
            </div>
        </form>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-slate-600">
                    <tr>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المستخدم') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الحالة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الوصف') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('عنوان IP') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المتصفح') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('التاريخ') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @forelse ($loginLogs as $log)
                        @php
                            $status = data_get($log->metadata, 'status', __('غير محدد'));
                        @endphp
                        <tr class="hover:bg-slate-50">
                            <td class="px-4 py-3">
                                <div class="font-semibold text-slate-800">{{ $log->user?->name ?? __('غير معروف') }}</div>
                                <div class="text-xs text-slate-500">{{ $log->user?->email }}</div>
                            </td>
                            <td class="px-4 py-3">
                                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $status === 'success' ? 'bg-emerald-50 text-emerald-600' : ($status === 'failed' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500') }}">
                                    {{ $statusLabels[$status] ?? __($status) }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-slate-500">{{ \Illuminate\Support\Str::limit($log->description, 80) }}</td>
                            <td class="px-4 py-3 text-slate-500">{{ $log->ip_address ?? '—' }}</td>
                            <td class="px-4 py-3 text-slate-500 truncate max-w-xs" title="{{ $log->user_agent }}">{{ \Illuminate\Support\Str::limit($log->user_agent, 60) }}</td>
                            <td class="px-4 py-3 text-slate-500">{{ optional($log->created_at)->format('Y-m-d H:i') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="px-4 py-6 text-center text-slate-500">
                                {{ __('لم يتم تسجيل أي محاولات حتى الآن. قم بتفعيل تسجيل الدخول في جدول activity_logs.') }}
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="mt-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span class="text-sm text-slate-500">{{ __('إجمالي النتائج: :count', ['count' => $loginLogs->total()]) }}</span>
            {{ $loginLogs->links() }}
        </div>
    </div>
@endsection
