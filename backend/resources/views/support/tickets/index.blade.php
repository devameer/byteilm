@extends('layouts.support')

@section('content')
    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
            <div>
                <h2 class="text-lg font-semibold text-slate-800">{{ __('تذاكري') }}</h2>
                <p class="text-sm text-slate-500">{{ __('احصل على لمحة عن جميع طلبات الدعم الخاصة بك.') }}</p>
            </div>
            <a href="{{ route('support.tickets.create') }}"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                <i class="fa-solid fa-plus"></i>
                {{ __('فتح تذكرة جديدة') }}
            </a>
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-slate-600">
                    <tr>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المرجع') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الموضوع') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الحالة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('آخر تحديث') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('تفاصيل') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @forelse ($tickets as $ticket)
                        <tr class="hover:bg-slate-50">
                            <td class="px-4 py-3 text-slate-500 ltr:font-mono">{{ $ticket->reference }}</td>
                            <td class="px-4 py-3 text-slate-700">
                                <div class="font-semibold text-slate-800">{{ $ticket->subject }}</div>
                                <div class="text-xs text-slate-400 mt-1">{{ $ticket->category ?? __('غير مصنف') }}</div>
                            </td>
                            <td class="px-4 py-3">
                                @php
                                    $statusColors = [
                                        'open' => 'bg-emerald-50 text-emerald-600',
                                        'pending' => 'bg-amber-50 text-amber-600',
                                        'resolved' => 'bg-slate-100 text-slate-500',
                                        'closed' => 'bg-slate-200 text-slate-600',
                                    ];
                                @endphp
                                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $statusColors[$ticket->status] ?? 'bg-slate-100 text-slate-500' }}">
                                    {{ __($ticket->status) }}
                                </span>
                                @if (($ticket->unread_count ?? 0) > 0)
                                    <span class="ml-2 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-600">
                                        {{ __('ردود جديدة: :count', ['count' => $ticket->unread_count]) }}
                                    </span>
                                @endif
                            </td>
                            <td class="px-4 py-3 text-slate-500">{{ optional($ticket->last_message_at)->diffForHumans() }}</td>
                            <td class="px-4 py-3 text-slate-500">
                                <a href="{{ route('support.tickets.show', $ticket) }}"
                                    class="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">
                                    <i class="fa-solid fa-eye text-[10px]"></i>
                                    {{ __('عرض') }}
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="px-4 py-6 text-center text-slate-500">
                                {{ __('لا توجد تذاكر حتى الآن. انقر على زر فتح تذكرة جديدة للبدء.') }}
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="mt-6">
            {{ $tickets->links() }}
        </div>
    </div>
@endsection
