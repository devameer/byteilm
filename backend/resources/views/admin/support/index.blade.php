@extends('admin.layout')

@section('title', __('الدعم الفني'))
@section('subtitle', __('إدارة التذاكر والرسائل واستفسارات العملاء.'))

@section('content')
    <div class="grid gap-4 md:grid-cols-3 mb-6">
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('التذاكر المفتوحة') }}</p>
            <p class="text-3xl font-semibold text-rose-500">{{ number_format($stats['tickets_open']) }}</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('التذاكر المغلقة') }}</p>
            <p class="text-3xl font-semibold text-emerald-600">{{ number_format($stats['tickets_resolved']) }}</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('الرسائل غير المقروءة') }}</p>
            <p class="text-3xl font-semibold text-amber-600">{{ number_format($stats['unread_messages']) }}</p>
        </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
        @foreach ($sections as $section)
            <a href="{{ $section['route'] }}"
                class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow transition">
                <h2 class="text-lg font-semibold text-slate-800">{{ $section['title'] }}</h2>
                <p class="text-sm text-slate-500 mt-2">{{ $section['description'] }}</p>
                <span class="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 mt-4">
                    {{ __('إدارة') }}
                    <i class="fa-solid fa-arrow-left-long text-xs"></i>
                </span>
            </a>
        @endforeach
    </div>
@endsection
