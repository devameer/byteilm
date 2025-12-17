@extends('admin.layout')

@section('title', __('سجلات الأخطاء'))
@section('subtitle', __('تحليل الاستثناءات والأخطاء غير المتوقعة داخل المنصة.'))

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
            <h2 class="text-lg font-semibold text-slate-800">{{ __('سجل الأخطاء الحرجة') }}</h2>
            <a href="{{ route('admin.logs.export', array_merge(['type' => 'errors'], request()->except('page'))) }}"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                <i class="fa-solid fa-file-arrow-down"></i>
                {{ __('تصدير CSV') }}
            </a>
        </div>

        <form method="GET" class="grid gap-3 lg:grid-cols-6 mb-6">
            <input type="search" name="search" value="{{ request('search') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('ابحث عن الرسالة أو الاستثناء') }}">

            <select name="level"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">{{ __('كل المستويات') }}</option>
                @foreach ($levels as $level)
                    <option value="{{ $level }}" @selected(request('level') === $level)>
                        {{ __($level) }}
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
                        {{ $size }} {{ __('لكل صفحة') }}</option>
                @endforeach
            </select>

            <div class="flex gap-2 lg:col-span-6">
                <a href="{{ route('admin.logs.errors') }}"
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
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المستوى') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الرسالة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المصدر') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المسار') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('التاريخ') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @forelse ($errorLogs as $log)
                        @php
                            $level = data_get($log->metadata, 'level', 'error');
                            $file = data_get($log->metadata, 'file');
                            $line = data_get($log->metadata, 'line');
                            $url = data_get($log->metadata, 'url');
                        @endphp
                        <tr class="hover:bg-slate-50">
                            <td class="px-4 py-3">
                                <div class="font-semibold text-slate-800">{{ $log->user?->name ?? __('النظام') }}</div>
                                <div class="text-xs text-slate-500">{{ $log->user?->email }}</div>
                            </td>
                            <td class="px-4 py-3">
                                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $level === 'critical' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600' }}">
                                    {{ __($level) }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-slate-500">
                                <div class="font-semibold text-slate-700">{{ data_get($log->metadata, 'exception') }}</div>
                                <div class="text-xs text-slate-500 mt-1">{{ Illuminate\Support\Str::limit($log->description ?? __('—'), 120) }}</div>
                            </td>
                            <td class="px-4 py-3 text-slate-500">
                                {{ implode(' › ', array_filter([$file, $line])) ?: __('غير متوفر') }}
                            </td>
                            <td class="px-4 py-3 text-slate-500 truncate max-w-xs" title="{{ $url ?? '' }}">
                                {{ $url ?? '—' }}
                            </td>
                            <td class="px-4 py-3 text-slate-500">{{ optional($log->created_at)->format('Y-m-d H:i') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="px-4 py-6 text-center text-slate-500">
                                {{ __('لا توجد أخطاء مسجلة. قم بربط Sentry أو Telescope لالتقاط الاستثناءات تلقائياً.') }}
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="mt-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span class="text-sm text-slate-500">{{ __('إجمالي النتائج: :count', ['count' => $errorLogs->total()]) }}</span>
            {{ $errorLogs->links() }}
        </div>
    </div>
@endsection
