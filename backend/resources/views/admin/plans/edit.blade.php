@extends('admin.layout')

@section('title', __('تعديل الباقة'))
@section('subtitle', __('قم بتحديث تفاصيل الباقة الحالية.'))

@section('content')
    <form method="POST" action="{{ route('admin.plans.update', $plan) }}" class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        @csrf
        @method('PUT')
        @include('admin.plans.partials.form', ['plan' => $plan])

        <div class="flex justify-end gap-3">
            <a href="{{ route('admin.plans.index') }}" class="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                {{ __('عودة') }}
            </a>
            <button type="submit" class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                {{ __('تحديث الباقة') }}
            </button>
        </div>
    </form>

    <form method="POST" action="{{ route('admin.plans.toggle', $plan) }}" class="mt-4 inline-block">
        @csrf
        <button type="submit"
            class="px-4 py-2 text-sm rounded-xl border {{ $plan->is_active ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' }}">
            {{ $plan->is_active ? __('تعطيل الباقة') : __('تفعيل الباقة') }}
        </button>
    </form>
@endsection
