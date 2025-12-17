@extends('admin.layout')

@section('title', __('إنشاء باقة جديدة'))
@section('subtitle', __('حدد تفاصيل الباقة والميزات وحدود الاستخدام.'))

@section('content')
    <form method="POST" action="{{ route('admin.plans.store') }}" class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        @csrf
        @include('admin.plans.partials.form')

        <div class="flex justify-end gap-3">
            <a href="{{ route('admin.plans.index') }}" class="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                {{ __('إلغاء') }}
            </a>
            <button type="submit" class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                {{ __('حفظ الباقة') }}
            </button>
        </div>
    </form>
@endsection
