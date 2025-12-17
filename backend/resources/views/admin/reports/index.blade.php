@extends('admin.layout')

@section('title', __('نظام التقارير'))
@section('subtitle', __('إعداد وتحميل التقارير المتقدمة للمستخدمين والمحتوى.'))

@section('content')
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <p class="text-sm text-slate-600 mb-4">{{ __('اختر التقرير المطلوب لتحميله. سيتم تنفيذ التصدير عبر المهام الخلفية (قريباً).') }}</p>

        <div class="grid gap-4 md:grid-cols-2">
            @foreach ($availableReports as $report)
                <div class="border border-slate-200 rounded-2xl p-5">
                    <h2 class="text-lg font-semibold text-slate-800">{{ $report['title'] }}</h2>
                    <p class="text-sm text-slate-500 mt-2">{{ $report['description'] }}</p>
                    <div class="mt-4 flex gap-2">
                        <button type="button" class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold opacity-60 cursor-not-allowed">
                            {{ __('تحميل PDF (قريباً)') }}
                        </button>
                        <button type="button" class="px-4 py-2 text-sm rounded-xl border border-indigo-200 text-indigo-600 font-semibold opacity-60 cursor-not-allowed">
                            {{ __('تصدير Excel (قريباً)') }}
                        </button>
                    </div>
                </div>
            @endforeach
        </div>
    </div>
@endsection
