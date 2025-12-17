@extends('admin.layout')

@section('title', __('الإحالات'))
@section('subtitle', __('مراقبة برنامج الإحالة والمكافآت.'))

@section('content')
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <form method="GET" class="flex flex-wrap gap-3 mb-6">
            <select name="status" class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">{{ __('جميع الحالات') }}</option>
                @foreach (['pending' => __('قيد المعالجة'), 'completed' => __('مكتملة'), 'rewarded' => __('تم منح المكافأة')] as $key => $label)
                    <option value="{{ $key }}" @selected(request('status') === $key)>{{ $label }}</option>
                @endforeach
            </select>
            <div class="flex gap-2 ms-auto">
                <a href="{{ route('admin.referrals.index') }}" class="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">{{ __('إعادة تعيين') }}</a>
                <button type="submit" class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">{{ __('تصفية') }}</button>
            </div>
        </form>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-slate-600">
                    <tr>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المحيل') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المحال') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الكود') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الحالة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المكافأة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('التواريخ') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @forelse ($referrals as $referral)
                        <tr class="hover:bg-slate-50">
                            <td class="px-4 py-3">
                                <div class="font-semibold text-slate-800">{{ $referral->referrer?->name }}</div>
                                <div class="text-xs text-slate-500">{{ $referral->referrer?->email }}</div>
                            </td>
                            <td class="px-4 py-3">
                                <div class="font-semibold text-slate-800">{{ $referral->referred?->name }}</div>
                                <div class="text-xs text-slate-500">{{ $referral->referred?->email }}</div>
                            </td>
                            <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ $referral->code }}</td>
                            <td class="px-4 py-3">
                                @php
                                    $labels = ['pending' => __('قيد المعالجة'), 'completed' => __('مكتملة'), 'rewarded' => __('تم منح المكافأة')];
                                @endphp
                                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $referral->status === 'rewarded' ? 'bg-emerald-50 text-emerald-600' : ($referral->status === 'completed' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500') }}">
                                    {{ $labels[$referral->status] ?? $referral->status }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-slate-600">
                                {{ $referral->reward_type ? $referral->reward_type . ' - ' . number_format($referral->reward_value, 2) : __('لا يوجد') }}
                            </td>
                            <td class="px-4 py-3 text-xs text-slate-500">
                                <div>{{ __('أُنشئ:') }} {{ optional($referral->created_at)->format('Y-m-d') }}</div>
                                @if ($referral->completed_at)
                                    <div>{{ __('اكتمل:') }} {{ $referral->completed_at->format('Y-m-d') }}</div>
                                @endif
                                @if ($referral->rewarded_at)
                                    <div>{{ __('المكافأة:') }} {{ $referral->rewarded_at->format('Y-m-d') }}</div>
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="px-4 py-6 text-center text-slate-500">{{ __('لا توجد إحالات مسجلة بعد.') }}</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="mt-6">
            {{ $referrals->links() }}
        </div>
    </div>
@endsection
