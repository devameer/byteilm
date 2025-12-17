@extends('admin.layout')

@section('title', __('سجلات API'))
@section('subtitle', __('متابعة الطلبات الصادرة والواردة عبر واجهات البرمجة.'))

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

    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-800">{{ __('سجل طلبات API') }}</h2>
            <a href="{{ route('admin.logs.export', array_merge(['type' => 'api'], request()->except('page'))) }}"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                <i class="fa-solid fa-file-arrow-down"></i>
                {{ __('تصدير CSV') }}
            </a>
        </div>

        <form method="GET" class="grid gap-3 lg:grid-cols-6 mb-6">
            <input type="search" name="search" value="{{ request('search') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('ابحث في الوصف أو المسار') }}">

            <select name="method"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">{{ __('كل الطرق') }}</option>
                @foreach ($methods as $method)
                    <option value="{{ $method }}" @selected(strtoupper(request('method')) === $method)>
                        {{ $method }}
                    </option>
                @endforeach
            </select>

            <input type="number" name="status" value="{{ request('status') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('رمز الحالة') }}">

            <select name="route_name"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">{{ __('كل المسارات المسماة') }}</option>
                @foreach ($routes as $route)
                    <option value="{{ $route }}" @selected(request('route_name') === $route)>{{ $route }}</option>
                @endforeach
            </select>

            <input type="date" name="date_from" value="{{ request('date_from') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('من تاريخ') }}">

            <input type="date" name="date_to" value="{{ request('date_to') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('إلى تاريخ') }}">

            <input type="search" name="user" value="{{ request('user') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400 lg:col-span-2"
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
                <a href="{{ route('admin.logs.api') }}"
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
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المسار') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الطريقة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الحالة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المدة (مللي ثانية)') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('اسم المسار') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('التاريخ') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @if ($apiLogs->isEmpty())
                        <tr>
                            <td colspan="7" class="px-4 py-6 text-center text-slate-500">
                                {{ __('لم يتم تسجيل أي طلبات API حتى الآن. قم بحفظ طلبات الويب هوك في جدول activity_logs.') }}
                            </td>
                        </tr>
                    @else
                        @foreach ($apiLogs as $log)
                            @php($meta = $log->metadata ?? [])
                            @php($statusCode = $meta['status_code'] ?? 0)
                            @php($duration = $meta['duration_ms'] ?? null)
                            @php($method = $meta['method'] ?? 'GET')
                            @php($path = $meta['path'] ?? ($meta['endpoint'] ?? '—'))
                            @php($routeName = $meta['route_name'] ?? '—')
                            @php($statusValue = $meta['status'] ?? $statusCode ?? 0)

                            <tr class="hover:bg-slate-50">
                                <td class="px-4 py-3">
                                    <div class="font-semibold text-slate-800">{{ $log->user?->name ?? __('مجهول') }}</div>
                                    <div class="text-xs text-slate-500">{{ $log->user?->email }}</div>
                                </td>
                                <td class="px-4 py-3 text-slate-700 ltr:font-mono">{{ $path }}</td>
                                <td class="px-4 py-3 text-slate-500">{{ strtoupper($method) }}</td>
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $statusValue >= 200 && $statusValue < 300 ? 'bg-emerald-50 text-emerald-600' : ($statusValue >= 400 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500') }}">
                                        {{ $statusValue ?: __('غير متوفر') }}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-slate-500">{{ $duration ? number_format($duration) : '—' }}</td>
                                <td class="px-4 py-3 text-slate-500">{{ $routeName ?: '—' }}</td>
                                <td class="px-4 py-3 text-slate-500">{{ optional($log->created_at)->format('Y-m-d H:i') }}</td>
                            </tr>
                        @endforeach
                    @endif
                </tbody>
            </table>
        </div>

        <div class="mt-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span class="text-sm text-slate-500">{{ __('إجمالي النتائج: :count', ['count' => $apiLogs->total()]) }}</span>
            {{ $apiLogs->links() }}
        </div>
    </div>
@endsection
