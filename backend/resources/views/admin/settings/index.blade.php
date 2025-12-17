@extends('admin.layout')

@section('title', __('الإعدادات'))
@section('subtitle', __('ضبط إعدادات المنصة والتكاملات.'))

@section('content')
    <div class="grid gap-6 lg:grid-cols-2">
        @foreach ($settings as $section => $values)
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('قسم:') }} {{ __($section) }}</h2>
                <dl class="space-y-3 text-sm text-slate-600">
                    @foreach ($values as $key => $value)
                        <div class="flex items-center justify-between">
                            <dt class="text-slate-500">{{ __($key) }}</dt>
                            <dd class="font-semibold text-slate-700">{{ is_bool($value) ? ($value ? __('مفعل') : __('معطل')) : ($value ?: __('غير محدد')) }}</dd>
                        </div>
                    @endforeach
                </dl>
                <div class="mt-4">
                    <button type="button"
                        class="px-4 py-2 rounded-lg border border-indigo-200 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition"
                        disabled>
                        {{ __('تعديل (قريباً)') }}
                    </button>
                </div>
            </div>
        @endforeach
    </div>
@endsection
