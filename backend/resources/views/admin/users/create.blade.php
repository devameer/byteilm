@extends('admin.layout')

@section('title', __('إنشاء مستخدم جديد'))
@section('subtitle', __('إضافة مستخدم جديد وتحديد الأدوار والباقة المناسبة.'))

@section('content')
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <form method="POST" action="{{ route('admin.users.store') }}" class="space-y-6">
            @csrf

            @include('admin.users.partials.form-fields', [
                'user' => null,
                'roles' => $roles,
                'plans' => $plans,
                'selectedRoles' => $selectedRoles,
                'selectedPlanId' => $selectedPlanId,
                'selectedSubscriptionStatus' => $selectedSubscriptionStatus,
                'selectedTrialEndsAt' => $selectedTrialEndsAt,
            ])

            <div class="flex justify-end gap-3">
                <a href="{{ route('admin.users.index') }}"
                    class="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                    {{ __('إلغاء') }}
                </a>
                <button type="submit"
                    class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                    {{ __('حفظ المستخدم') }}
                </button>
            </div>
        </form>
    </div>
@endsection
