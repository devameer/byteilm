@extends('layouts.support')

@section('content')
    <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-4">
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h2 class="text-lg font-semibold text-slate-800">{{ $ticket->subject }}</h2>
                        <p class="text-sm text-slate-500">{{ $ticket->reference }} · {{ $ticket->category ?? __('غير مصنف') }}</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
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
                    </div>
                </div>
                <dl class="grid gap-3 sm:grid-cols-3 text-xs text-slate-500 mt-4">
                    <div>
                        <dt>{{ __('تاريخ الإنشاء') }}</dt>
                        <dd class="text-sm text-slate-700">{{ optional($ticket->created_at)->format('Y-m-d H:i') }}</dd>
                    </div>
                    <div>
                        <dt>{{ __('آخر تحديث') }}</dt>
                        <dd class="text-sm text-slate-700">{{ optional($ticket->last_message_at)->diffForHumans() }}</dd>
                    </div>
                    <div>
                        <dt>{{ __('الأولوية') }}</dt>
                        <dd class="text-sm text-slate-700">{{ __($ticket->priority) }}</dd>
                    </div>
                </dl>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 class="text-base font-semibold text-slate-800 mb-4">{{ __('المحادثة') }}</h3>
                <div class="space-y-4">
                    @forelse ($ticket->messages as $message)
                        <div class="border border-slate-200 rounded-2xl p-4 {{ $message->isFromAdmin() ? 'bg-indigo-50/60 border-indigo-100' : 'bg-slate-50' }}">
                            <div class="flex items-center justify-between gap-3">
                                <div>
                                    <p class="text-sm font-semibold text-slate-800">
                                        {{ $message->sender?->name ?? __('النظام') }}
                                        @if ($message->isFromAdmin())
                                            <span class="text-xs text-indigo-600">{{ __('(دعم)') }}</span>
                                        @endif
                                    </p>
                                    <p class="text-xs text-slate-500">{{ optional($message->created_at)->format('Y-m-d H:i') }}</p>
                                </div>
                                @if ($message->is_internal)
                                    <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-white">
                                        {{ __('ملاحظة داخلية') }}
                                    </span>
                                @endif
                            </div>
                            <div class="mt-3 text-sm leading-6 text-slate-700">{!! nl2br(e($message->body)) !!}</div>
                        </div>
                    @empty
                        <p class="text-sm text-slate-500">{{ __('لم يتم تبادل أي رسائل بعد.') }}</p>
                    @endforelse
                </div>
            </div>
        </div>

        <div class="space-y-4">
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 class="text-base font-semibold text-slate-800 mb-4">{{ __('إرسال رد') }}</h3>
                <form method="POST" action="{{ route('support.tickets.reply', $ticket) }}" class="space-y-3 text-sm">
                    @csrf
                    <div>
                        <label class="block text-xs text-slate-500 mb-1">{{ __('رسالتك') }}</label>
                        <textarea name="message" rows="4"
                            class="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-400"
                            required>{{ old('message') }}</textarea>
                    </div>
                    <div class="flex justify-end gap-2">
                        <a href="{{ route('support.tickets.index') }}"
                            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">{{ __('عودة للتذاكر') }}</a>
                        <button type="submit"
                            class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">{{ __('إرسال الرد') }}</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection
