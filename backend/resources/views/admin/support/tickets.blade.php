@extends('admin.layout')

@section('title', __('التذاكر'))
@section('subtitle', __('إدارة طلبات الدعم ومتابعة حالة كل تذكرة.'))

@php
$supportNav = [
['route' => 'admin.support.index', 'label' => __('نظرة عامة')],
['route' => 'admin.support.tickets', 'label' => __('التذاكر')],
['route' => 'admin.support.messages', 'label' => __('الرسائل')],
['route' => 'admin.support.faq', 'label' => __('الأسئلة الشائعة')],
];
@endphp

@section('content')
<div class="mb-6">
    <nav class="flex flex-wrap gap-2">
        @foreach ($supportNav as $item)
        @php
        $active = request()->routeIs($item['route']);

        @endphp
        <a href="{{ route($item['route']) }}"
            class="px-4 py-2 text-sm rounded-xl border {{ $active ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-semibold' : 'border-slate-200 text-slate-600 hover:bg-slate-100' }}">
            {{ $item['label'] }}
        </a>
        @endforeach
    </nav>
</div>

<div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
            <h2 class="text-lg font-semibold text-slate-800">{{ __('مركز التذاكر') }}</h2>
            <p class="text-sm text-slate-500">{{ __('استخدم عوامل التصفية لمتابعة التذاكر حسب الحالة والأولوية
                وتصنيفها.') }}</p>
        </div>
        <a href="{{ route('support.tickets.create') }}"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
            <i class="fa-solid fa-plus"></i>
            {{ __('فتح تذكرة جديدة') }}
        </a>
    </div>

    @php
    $statusLabels = [
    'open' => __('مفتوحة'),
    'pending' => __('قيد المتابعة'),
    'resolved' => __('محلولة'),
    'closed' => __('مغلقة'),
    ];
    @endphp

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        @foreach ($statusLabels as $statusKey => $label)
        <div class="rounded-xl border border-slate-200 px-5 py-4">
            <p class="text-xs text-slate-500">{{ $label }}</p>
            <p class="text-2xl font-semibold text-slate-800 mt-2">{{ number_format($summary[$statusKey] ?? 0) }}</p>
        </div>
        @endforeach
    </div>

    <form method="GET" class="grid gap-3 lg:grid-cols-5 mb-6">
        <input type="search" name="search" value="{{ request('search') }}"
            class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            placeholder="{{ __('ابحث عن المرجع أو الموضوع') }}">

        <select name="status"
            class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
            <option value="">{{ __('كل الحالات') }}</option>
            @foreach ($statusLabels as $statusKey => $label)
            <option value="{{ $statusKey }}" @selected(request('status')===$statusKey)>{{ $label }}</option>
            @endforeach
        </select>

        <select name="priority"
            class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
            <option value="">{{ __('كل الأولويات') }}</option>
            @foreach (['low', 'medium', 'high', 'urgent'] as $priority)
            <option value="{{ $priority }}" @selected(request('priority')===$priority)>{{ __($priority) }}</option>
            @endforeach
        </select>

        <select name="category"
            class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
            <option value="">{{ __('كل التصنيفات') }}</option>
            @foreach ($categories as $category)
            <option value="{{ $category }}" @selected(request('category')===$category)>{{ $category }}</option>
            @endforeach
        </select>

        <div class="flex gap-2">
            <a href="{{ route('admin.support.tickets') }}"
                class="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">{{
                __('إعادة تعيين') }}</a>
            <button type="submit"
                class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">{{
                __('تصفية') }}</button>
        </div>
    </form>

    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-slate-600">
                <tr>
                    <th class="px-4 py-3 text-right font-semibold">{{ __('المرجع') }}</th>
                    <th class="px-4 py-3 text-right font-semibold">{{ __('الموضوع') }}</th>
                    <th class="px-4 py-3 text-right font-semibold">{{ __('الأولوية') }}</th>
                    <th class="px-4 py-3 text-right font-semibold">{{ __('الحالة') }}</th>
                    <th class="px-4 py-3 text-right font-semibold">{{ __('المستخدم') }}</th>
                    <th class="px-4 py-3 text-right font-semibold">{{ __('آخر رسالة') }}</th>
                    <th class="px-4 py-3 text-right font-semibold">{{ __('إجراءات') }}</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                @forelse ($tickets as $ticket)
                @php
                $priorityColors = [
                'low' => 'bg-slate-100 text-slate-500',
                'medium' => 'bg-amber-50 text-amber-600',
                'high' => 'bg-rose-50 text-rose-600',
                'urgent' => 'bg-red-100 text-red-600',
                ];
                $statusColors = [
                'open' => 'bg-emerald-50 text-emerald-600',
                'pending' => 'bg-amber-50 text-amber-600',
                'resolved' => 'bg-slate-100 text-slate-500',
                'closed' => 'bg-slate-200 text-slate-600',
                ];
                @endphp
                <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 text-slate-500 ltr:font-mono">{{ $ticket->reference }}</td>
                    <td class="px-4 py-3 text-slate-700">
                        <div class="font-semibold text-slate-800">{{ $ticket->subject }}</div>
                        <div class="text-xs text-slate-500 mt-1">{{ $ticket->category ?? __('غير مصنف') }}</div>
                    </td>
                    <td class="px-4 py-3">
                        <span
                            class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $priorityColors[$ticket->priority] ?? 'bg-slate-100 text-slate-500' }}">
                            {{ __($ticket->priority) }}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <span
                            class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $statusColors[$ticket->status] ?? 'bg-slate-100 text-slate-500' }}">
                            {{ __($ticket->status) }}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-slate-500">
                        <div class="font-semibold text-slate-700">{{ $ticket->user?->name ?? __('ضيف') }}</div>
                        <div class="text-xs text-slate-400">{{ $ticket->user?->email }}</div>
                    </td>
                    <td class="px-4 py-3 text-slate-500">
                        {{ optional($ticket->last_message_at)->diffForHumans() }}
                    </td>
                    <td class="px-4 py-3 text-slate-500">
                        <a href="{{ route('admin.support.tickets.show', $ticket) }}"
                            class="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">
                            <i class="fa-solid fa-eye text-[10px]"></i>
                            {{ __('عرض') }}
                        </a>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="7" class="px-4 py-6 text-center text-slate-500">{{ __('لا توجد تذاكر حتى الآن.') }}
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-6">
        {{ $tickets->links() }}
    </div>
</div>
@endsection