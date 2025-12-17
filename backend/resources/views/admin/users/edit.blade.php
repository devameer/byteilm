@extends('admin.layout')

@section('title', __('تعديل المستخدم'))
@section('subtitle', __('تحديث بيانات المستخدم والأدوار والاشتراك.'))

@section('content')
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <form method="POST" action="{{ route('admin.users.update', $user) }}" class="space-y-6">
            @csrf
            @method('PUT')

            @include('admin.users.partials.form-fields', [
                'user' => $user,
                'roles' => $roles,
                'plans' => $plans,
                'selectedRoles' => $selectedRoles,
                'selectedPlanId' => $selectedPlanId,
                'selectedSubscriptionStatus' => $selectedSubscriptionStatus,
                'selectedTrialEndsAt' => $selectedTrialEndsAt,
            ])

            <div class="flex justify-end gap-3">
                <a href="{{ route('admin.users.show', $user) }}"
                    class="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                    {{ __('إلغاء') }}
                </a>
                <button type="submit"
                    class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                    {{ __('تحديث البيانات') }}
                </button>
            </div>
        </form>
    </div>
@endsection
