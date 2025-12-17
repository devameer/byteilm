@extends('admin.layout')

@section('title', __('الإشعارات'))
@section('subtitle', __('متابعة الإشعارات الداخلية وتحديث حالتها.'))

@section('content')
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <form method="GET" class="grid gap-4 md:grid-cols-4 mb-6">
            <select name="type" class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">{{ __('جميع الأنواع') }}</option>
                @foreach ($types as $type)
                    <option value="{{ $type }}" @selected(request('type') === $type)>{{ $type }}</option>
                @endforeach
            </select>
            <label class="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="unread" value="1" @checked(request()->boolean('unread'))
                    class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
                {{ __('إظهار الإشعارات غير المقروءة فقط') }}
            </label>
            <div class="md:col-span-2 flex justify-end gap-2">
                <a href="{{ route('admin.notifications.index') }}" class="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">{{ __('إعادة تعيين') }}</a>
                <button type="submit" class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">{{ __('تصفية') }}</button>
            </div>
        </form>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-slate-600">
                    <tr>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المستخدم') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('العنوان') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('النوع') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الحالة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('التاريخ') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الإجراءات') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @forelse ($notifications as $notification)
                        <tr class="hover:bg-slate-50">
                            <td class="px-4 py-3">
                                <div class="font-semibold text-slate-800">{{ $notification->user?->name ?? __('مستخدم غير معروف') }}</div>
                                <div class="text-xs text-slate-500">{{ $notification->user?->email }}</div>
                            </td>
                            <td class="px-4 py-3">
                                <div class="font-semibold text-slate-800">{{ $notification->title }}</div>
                                <div class="text-xs text-slate-500">{{ \Illuminate\Support\Str::limit($notification->message, 80) }}</div>
                            </td>
                            <td class="px-4 py-3 text-slate-500">{{ $notification->type }}</td>
                            <td class="px-4 py-3">
                                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $notification->read_at ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600' }}">
                                    {{ $notification->read_at ? __('مقروء') : __('غير مقروء') }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-slate-500">{{ optional($notification->created_at)->format('Y-m-d H:i') }}</td>
                            <td class="px-4 py-3">
                                <div class="flex gap-2 justify-end">
                                    @if (!$notification->read_at)
                                        <form method="POST" action="{{ route('admin.notifications.read', $notification) }}">
                                            @csrf
                                            <button type="submit" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200">{{ __('تعليم مقروء') }}</button>
                                        </form>
                                    @endif
                                    <form method="POST" action="{{ route('admin.notifications.destroy', $notification) }}" onsubmit="return confirm('{{ __('تأكيد حذف الإشعار؟') }}');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200">{{ __('حذف') }}</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="px-4 py-6 text-center text-slate-500">{{ __('لا توجد إشعارات حالياً.') }}</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="mt-6">
            {{ $notifications->links() }}
        </div>
    </div>
@endsection
