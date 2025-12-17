@extends('layouts.support')

@section('content')
    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div class="mb-6">
            <h2 class="text-lg font-semibold text-slate-800">{{ __('فتح تذكرة دعم جديدة') }}</h2>
            <p class="text-sm text-slate-500">{{ __('املأ الحقول التالية، وسيقوم فريق الدعم بالرد عليك في أقرب وقت ممكن.') }}</p>
        </div>

        <form method="POST" action="{{ route('support.tickets.store') }}" class="space-y-4 text-sm">
            @csrf
            <div>
                <label class="block text-xs text-slate-500 mb-1">{{ __('الموضوع') }}</label>
                <input type="text" name="subject" value="{{ old('subject') }}"
                    class="w-full rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:border-indigo-400"
                    required>
            </div>
            <div>
                <label class="block text-xs text-slate-500 mb-1">{{ __('التصنيف (اختياري)') }}</label>
                <input type="text" name="category" value="{{ old('category') }}"
                    class="w-full rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:border-indigo-400"
                    placeholder="{{ __('مثال: المدفوعات، الدروس، حسابي...') }}">
            </div>
            <div>
                <label class="block text-xs text-slate-500 mb-1">{{ __('الأولوية') }}</label>
                <select name="priority"
                    class="w-full rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:border-indigo-400">
                    @foreach (['low', 'medium', 'high', 'urgent'] as $priority)
                        <option value="{{ $priority }}" @selected(old('priority') === $priority)>{{ __($priority) }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="block text-xs text-slate-500 mb-1">{{ __('وصف المشكلة') }}</label>
                <textarea name="message" rows="5"
                    class="w-full rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:border-indigo-400"
                    required>{{ old('message') }}</textarea>
            </div>
            <div class="flex justify-end gap-2">
                <a href="{{ route('support.tickets.index') }}"
                    class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">{{ __('إلغاء') }}</a>
                <button type="submit"
                    class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">{{ __('إرسال التذكرة') }}</button>
            </div>
        </form>
    </div>
@endsection
