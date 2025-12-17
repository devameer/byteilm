@extends('admin.layout')

@section('title', __('تفاصيل التذكرة :reference', ['reference' => $ticket->reference]))
@section('subtitle', __('إدارة المحادثة وتحديث حالة التذكرة.'))

@section('content')
    <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-4">
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h2 class="text-lg font-semibold text-slate-800">{{ $ticket->subject }}</h2>
                        <p class="text-sm text-slate-500">{{ $ticket->category ?? __('بدون تصنيف') }}</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                        @php
                            $priorityColors = [
                                'low' => 'bg-slate-100 text-slate-500',
                                'medium' => 'bg-amber-50 text-amber-600',
                                'high' => 'bg-rose-50 text-rose-600',
                                'urgent' => 'bg-red-100 text-red-600',
                            ];
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
                        <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $priorityColors[$ticket->priority] ?? 'bg-slate-100 text-slate-500' }}">
                            {{ __($ticket->priority) }}
                        </span>
                    </div>
                </div>

                <dl class="grid gap-3 sm:grid-cols-2 text-sm text-slate-600 mt-4">
                    <div>
                        <dt class="text-xs text-slate-500">{{ __('المستخدم') }}</dt>
                        <dd class="font-semibold text-slate-800">{{ $ticket->user?->name ?? __('ضيف') }}</dd>
                        <dd class="text-xs text-slate-400">{{ $ticket->user?->email }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs text-slate-500">{{ __('تاريخ الإنشاء') }}</dt>
                        <dd>{{ optional($ticket->created_at)->format('Y-m-d H:i') }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs text-slate-500">{{ __('آخر تحديث') }}</dt>
                        <dd>{{ optional($ticket->last_message_at)->diffForHumans() }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs text-slate-500">{{ __('تاريخ الإغلاق') }}</dt>
                        <dd>{{ optional($ticket->closed_at)->format('Y-m-d H:i') ?? __('—') }}</dd>
                    </div>
                </dl>
            </div>

            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('المحادثة') }}</h2>
                <div class="space-y-4">
                    @forelse ($ticket->messages as $message)
                        <div class="border border-slate-200 rounded-2xl p-4 {{ $message->isFromAdmin() ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50' }}">
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
                        <p class="text-sm text-slate-500">{{ __('لا توجد رسائل بعد.') }}</p>
                    @endforelse
                </div>
            </div>
        </div>

        <div class="space-y-4">
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 class="text-base font-semibold text-slate-800 mb-4">{{ __('تحديث الحالة') }}</h3>
                <form method="POST" action="{{ route('admin.support.tickets.status', $ticket) }}" class="space-y-4 text-sm">
                    @csrf
                    @method('PATCH')
                    <div>
                        <label class="block text-xs text-slate-500 mb-1">{{ __('الحالة') }}</label>
                        <select name="status"
                            class="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-400">
                            @foreach (['open', 'pending', 'resolved', 'closed'] as $status)
                                <option value="{{ $status }}" @selected($ticket->status === $status)>{{ __($status) }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs text-slate-500 mb-1">{{ __('الأولوية') }}</label>
                        <select name="priority"
                            class="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-400">
                            @foreach (['low', 'medium', 'high', 'urgent'] as $priority)
                                <option value="{{ $priority }}" @selected($ticket->priority === $priority)>{{ __($priority) }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="flex justify-end">
                        <button type="submit"
                            class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                            {{ __('تحديث') }}
                        </button>
                    </div>
                </form>
            </div>

            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 class="text-base font-semibold text-slate-800 mb-4">{{ __('إرسال رد') }}</h3>
                <form method="POST" action="{{ route('admin.support.tickets.reply', $ticket) }}" class="space-y-3 text-sm">
                    @csrf
                    <div>
                        <label class="block text-xs text-slate-500 mb-1">{{ __('الرسالة') }}</label>
                        <textarea name="body" rows="4"
                            class="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-400"
                            required>{{ old('body') }}</textarea>
                    </div>
                    <label class="inline-flex items-center gap-2 text-xs text-slate-600">
                        <input type="checkbox" name="is_internal" value="1" class="rounded" @checked(old('is_internal'))>
                        {{ __('اعتبار الرد ملاحظة داخلية (لن يراه المستخدم)') }}
                    </label>
                    <div class="flex justify-end">
                        <button type="submit"
                            class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                            {{ __('إرسال') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection
