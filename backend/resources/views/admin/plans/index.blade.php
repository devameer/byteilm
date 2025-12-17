@extends('admin.layout')

@section('title', __('الباقات'))
@section('subtitle', __('إدارة الباقات والخصائص والحدود.'))

@section('content')
    <div class="flex justify-between items-center mb-6">
        <p class="text-sm text-slate-500">{{ __('عدد الباقات المتاحة:') }}
            <span class="font-semibold text-slate-700">{{ $plans->count() }}</span>
        </p>
        <a href="{{ route('admin.plans.create') }}"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
            <i class="fa-solid fa-plus"></i>
            {{ __('إنشاء باقة جديدة') }}
        </a>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
        @forelse ($plans as $plan)
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <h2 class="text-xl font-semibold text-slate-800">{{ $plan->display_name ?? $plan->name }}</h2>
                        <p class="text-sm text-slate-500 mt-1">{{ $plan->description }}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-2xl font-bold text-indigo-600">
                            {{ number_format($plan->price, 2) }}
                            <span class="text-sm text-slate-500">{{ $plan->currency }}</span>
                        </p>
                        <p class="text-xs text-slate-400">{{ __($plan->billing_period) }}</p>
                        <span class="inline-flex items-center px-2.5 py-1 mt-2 rounded-lg text-xs font-semibold {{ $plan->is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500' }}">
                            {{ $plan->is_active ? __('مفعل') : __('معطل') }}
                        </span>
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2 mt-6">
                    <div>
                        <h3 class="text-sm font-semibold text-slate-700 mb-2">{{ __('الميزات') }}</h3>
                        <ul class="space-y-2 text-sm text-slate-600">
                            @foreach ($plan->features ?? [] as $feature)
                                <li class="flex items-start gap-2">
                                    <i class="fa-solid fa-circle-check text-emerald-500 mt-0.5"></i>
                                    <span>{{ $feature }}</span>
                                </li>
                            @endforeach
                        </ul>
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-slate-700 mb-2">{{ __('الحدود') }}</h3>
                        <ul class="space-y-2 text-sm text-slate-600">
                            @foreach ($plan->limits ?? [] as $key => $value)
                                <li class="flex items-center gap-2">
                                    <span class="font-medium text-slate-500">{{ __($key) }}:</span>
                                    <span>{{ $value === -1 ? __('غير محدود') : $value }}</span>
                                </li>
                            @endforeach
                        </ul>
                    </div>
                </div>

                <div class="mt-6 flex items-center justify-between text-sm text-slate-500">
                    <div class="space-y-1">
                        <p>{{ __('مشتركين نشطين:') }}
                            <span class="font-semibold text-slate-700">{{ number_format($plan->active_subscriptions_count) }}</span>
                        </p>
                        <p>{{ __('إجمالي الاشتراكات:') }}
                            <span class="font-semibold text-slate-700">{{ number_format($plan->total_subscriptions_count) }}</span>
                        </p>
                    </div>
                    <div class="flex gap-2">
                        <a href="{{ route('admin.plans.edit', $plan) }}"
                            class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                            {{ __('تعديل') }}
                        </a>
                        <form method="POST" action="{{ route('admin.plans.toggle', $plan) }}">
                            @csrf
                            <button type="submit"
                                class="px-3 py-1.5 text-xs font-semibold rounded-lg {{ $plan->is_active ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' }}">
                                {{ $plan->is_active ? __('تعطيل') : __('تفعيل') }}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        @empty
            <div class="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
                {{ __('لم يتم إنشاء أي باقات بعد.') }}
            </div>
        @endforelse
    </div>
@endsection
