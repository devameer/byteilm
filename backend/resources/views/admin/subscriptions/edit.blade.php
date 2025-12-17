@extends('admin.layout')

@section('title', __('تعديل الاشتراك'))
@section('subtitle', __('تحديث بيانات الاشتراك أو تغيير حالته.'))

@section('content')
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <form method="POST" action="{{ route('admin.subscriptions.update', $subscription) }}" class="space-y-6">
            @csrf
            @method('PUT')

            @include('admin.subscriptions.partials.form-fields', [
                'subscription' => $subscription,
                'plans' => $plans,
                'users' => $users,
                'statusOptions' => $statusOptions,
            ])

            <div class="flex justify-end gap-3">
                <a href="{{ route('admin.subscriptions.index') }}"
                    class="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                    {{ __('إلغاء') }}
                </a>
                <button type="submit"
                    class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                    {{ __('تحديث الاشتراك') }}
                </button>
            </div>
        </form>
    </div>
@endsection
