@extends('admin.layout')

@section('title', __('المحتوى'))
@section('subtitle', __('نظرة عامة على المحتوى المنشور واستخدام التخزين.'))

@php
    $formatBytes = function ($bytes) {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        }
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }

        return number_format($bytes) . ' B';
    };
@endphp

@section('content')
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('إجمالي الدورات') }}</p>
            <p class="text-2xl font-semibold text-slate-800 mt-2">{{ number_format($totals['courses']) }}</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('إجمالي الدروس') }}</p>
            <p class="text-2xl font-semibold text-slate-800 mt-2">{{ number_format($totals['lessons']) }}</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('إجمالي المشاريع') }}</p>
            <p class="text-2xl font-semibold text-slate-800 mt-2">{{ number_format($totals['projects']) }}</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-sm text-slate-500">{{ __('إجمالي المهام') }}</p>
            <p class="text-2xl font-semibold text-slate-800 mt-2">{{ number_format($totals['tasks']) }}</p>
        </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2 mt-6">
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('استهلاك التخزين') }}</h2>
            <p class="text-3xl font-bold text-indigo-600">{{ $formatBytes($storageBytes) }}</p>
            <p class="text-sm text-slate-500 mt-2">{{ __('يشمل جميع ملفات الفيديو والوسائط المرفوعة. راقب الاستخدام لتحديد الحاجة لخطط تخزين إضافية.') }}</p>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('أكثر المستخدمين نشاطاً (عدد الدروس)') }}</h2>
            <ul class="space-y-3 text-sm">
                @forelse ($topUsers as $item)
                    <li class="flex items-center justify-between">
                        <div>
                            <p class="font-semibold text-slate-800">{{ $item['user']?->name ?? __('مستخدم غير معروف') }}</p>
                            <p class="text-xs text-slate-500">{{ $item['user']?->email }}</p>
                        </div>
                        <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-medium">
                            {{ number_format($item['lessons_count']) }}
                        </span>
                    </li>
                @empty
                    <li class="text-slate-500">{{ __('لم يتم تسجيل نشاط كافٍ بعد.') }}</li>
                @endforelse
            </ul>
        </div>
    </div>
@endsection
