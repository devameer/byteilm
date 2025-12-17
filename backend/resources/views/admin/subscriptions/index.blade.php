@extends('admin.layout')

@section('title', __('الاشتراكات'))
@section('subtitle', __('متابعة حالة الاشتراكات النشطة والمنتهية والتجريبية.'))

@section('content')
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div class="flex gap-2 flex-wrap text-sm">
                @foreach (['active' => 'نشط', 'trialing' => 'تجريبي', 'canceled' => 'ملغي', 'expired' => 'منتهي'] as $key => $label)
                    <a href="{{ request()->fullUrlWithQuery(['status' => $key]) }}"
                        class="px-3 py-1.5 rounded-full border {{ request('status') === $key ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-100' }}">
                        {{ __($label) }}
                    </a>
                @endforeach
            </div>
            <div class="flex items-center gap-3 flex-wrap justify-end">
                <div class="text-sm text-slate-500">
                    {{ __('إجمالي الاشتراكات:') }}
                    <span class="font-semibold text-slate-700">{{ number_format($subscriptions->total()) }}</span>
                </div>
                <a href="{{ route('admin.subscriptions.create') }}"
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                    <i class="fa-solid fa-plus text-xs"></i>
                    {{ __('اشتراك جديد') }}
                </a>
                <a href="{{ route('admin.subscriptions.reports') }}"
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                    <i class="fa-solid fa-chart-pie text-xs"></i>
                    {{ __('عرض التقارير') }}
                </a>
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-slate-600">
                    <tr>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المستخدم') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الباقة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الحالة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('تاريخ البداية') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('تاريخ الانتهاء') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('نهاية التجربة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الإجراءات') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @forelse ($subscriptions as $subscription)
                        <tr class="hover:bg-slate-50">
                            <td class="px-4 py-3">
                                <div class="font-semibold text-slate-800">{{ $subscription->user?->name }}</div>
                                <div class="text-xs text-slate-500">{{ $subscription->user?->email }}</div>
                            </td>
                            <td class="px-4 py-3 text-slate-700">{{ $subscription->plan?->display_name ?? $subscription->plan?->name }}</td>
                            <td class="px-4 py-3">
                                @php
                                    $statusLabel = [
                                        'active' => __('نشط'),
                                        'trialing' => __('تجريبي'),
                                        'canceled' => __('ملغى'),
                                        'expired' => __('منتهي'),
                                    ][$subscription->status] ?? $subscription->status;
                                @endphp
                                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $subscription->status === 'active' ? 'bg-emerald-50 text-emerald-600' : ($subscription->status === 'trialing' ? 'bg-amber-50 text-amber-600' : ($subscription->status === 'canceled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500')) }}">
                                    {{ $statusLabel }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-slate-500">{{ optional($subscription->starts_at)->format('Y-m-d') }}</td>
                            <td class="px-4 py-3 text-slate-500">{{ optional($subscription->ends_at)->format('Y-m-d') ?? '—' }}</td>
                            <td class="px-4 py-3 text-slate-500">{{ optional($subscription->trial_ends_at)->format('Y-m-d') ?? '—' }}</td>
                            <td class="px-4 py-3">
                                <div class="flex flex-wrap gap-2 justify-end">
                                    <a href="{{ route('admin.subscriptions.edit', $subscription) }}"
                                        class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                                        {{ __('تعديل') }}
                                    </a>
                                    <form method="POST" action="{{ route('admin.subscriptions.destroy', $subscription) }}"
                                        onsubmit="return confirm('{{ __('هل أنت متأكد من حذف هذا الاشتراك؟') }}');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit"
                                            class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                                            {{ __('حذف') }}
                                        </button>
                                    </form>
                                    @if ($subscription->status === 'active')
                                        <form method="POST" action="{{ route('admin.subscriptions.cancel', $subscription) }}"
                                            onsubmit="return confirm('{{ __('تأكيد إلغاء الاشتراك؟') }}');">
                                            @csrf
                                            <button type="submit"
                                                class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200">
                                                {{ __('إلغاء') }}
                                            </button>
                                        </form>
                                    @else
                                        <form method="POST" action="{{ route('admin.subscriptions.resume', $subscription) }}">
                                            @csrf
                                            <button type="submit"
                                                class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200">
                                                {{ __('تجديد') }}
                                            </button>
                                        </form>
                                    @endif
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" class="px-4 py-6 text-center text-slate-500">{{ __('لا توجد اشتراكات بعد.') }}</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="mt-6">
            {{ $subscriptions->withQueryString()->links() }}
        </div>
    </div>
@endsection
