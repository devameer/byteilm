@extends('admin.layout')

@section('title', __('إدارة النسخ الاحتياطي'))
@section('subtitle', __('إستراتيجيات النسخ الاحتياطي والاستعادة والامتثال للخصوصية.'))

@section('content')
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div class="grid gap-4 md:grid-cols-3">
            @foreach ($strategies as $strategy)
                <div class="border border-slate-200 rounded-2xl p-5">
                    <h2 class="text-lg font-semibold text-slate-800">{{ $strategy['name'] }}</h2>
                    <p class="text-sm text-slate-500 mt-2">{{ $strategy['description'] }}</p>
                    <button type="button" class="mt-4 px-4 py-2 text-sm rounded-xl border border-indigo-200 text-indigo-600 font-semibold opacity-60 cursor-not-allowed">
                        {{ __('إعداد (قريباً)') }}
                    </button>
                </div>
            @endforeach
        </div>
    </div>
@endsection
