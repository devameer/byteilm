@extends('admin.layout')

@section('title', __('الرسائل'))
@section('subtitle', __('مراقبة محادثات المستخدمين مع فريق الدعم.'))

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
                @php($active = request()->routeIs($item['route']))
                <a href="{{ route($item['route']) }}"
                    class="px-4 py-2 text-sm rounded-xl border {{ $active ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-semibold' : 'border-slate-200 text-slate-600 hover:bg-slate-100' }}">
                    {{ $item['label'] }}
                </a>
            @endforeach
        </nav>
    </div>

    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-slate-800">{{ __('سجل المحادثات') }}</h2>
            <a href="{{ route('admin.support.tickets') }}"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                <i class="fa-solid fa-ticket text-xs"></i>
                {{ __('إدارة التذاكر') }}
            </a>
        </div>

        <ul class="space-y-4">
            @forelse ($conversations as $conversation)
                <li
                    class="border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p class="font-semibold text-slate-800">
                            {{ $conversation->user?->name ?? __('ضيف') }}
                            <span class="text-xs text-slate-400 ml-2">{{ $conversation->reference }}</span>
                        </p>
                        <p class="text-sm text-slate-500">
                            {{ \Illuminate\Support\Str::limit(optional($conversation->messages->first())->body, 120) ?? __('لم يتم إرسال رسائل بعد.') }}
                        </p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span>{{ optional($conversation->last_message_at)->diffForHumans() }}</span>
                        @if (($conversation->unread_count ?? 0) > 0)
                            <span
                                class="inline-flex items-center px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold">
                                {{ __('غير مقروء:') }} {{ $conversation->unread_count }}
                            </span>
                        @else
                            <span
                                class="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
                                {{ __('لا توجد رسائل جديدة') }}
                            </span>
                        @endif
                        <a href="{{ route('admin.support.tickets.show', $conversation) }}"
                            class="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">
                            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                            {{ __('فتح التذكرة') }}
                        </a>
                    </div>
                </li>
            @empty
                <li
                    class="text-center text-slate-500 py-6 border border-dashed border-slate-300 rounded-2xl">
                    {{ __('لا توجد محادثات مسجلة حالياً.') }}
                </li>
            @endforelse
        </ul>

        <div class="mt-6">
            {{ $conversations->links() }}
        </div>
    </div>
@endsection
