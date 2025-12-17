@extends('layouts.support')

@section('content')
    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
            <div>
                <h2 class="text-lg font-semibold text-slate-800">{{ __('الأسئلة الشائعة') }}</h2>
                <p class="text-sm text-slate-500">{{ __('ابحث عن إجابات سريعة قبل فتح تذكرة جديدة.') }}</p>
            </div>
            <a href="{{ route('support.tickets.create') }}"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                <i class="fa-solid fa-ticket text-xs"></i>
                {{ __('فتح تذكرة') }}
            </a>
        </div>

        <form method="GET" class="grid gap-3 md:grid-cols-3 mb-6">
            <input type="search" name="q" value="{{ request('q') }}"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="{{ __('اكتب كلمة مفتاحية للبحث') }}">
            <select name="category"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">{{ __('كل التصنيفات') }}</option>
                @foreach ($categories as $category)
                    <option value="{{ $category }}" @selected($selectedCategory === $category)>{{ $category }}</option>
                @endforeach
            </select>
            <div class="flex gap-2">
                <a href="{{ route('support.faq.index') }}"
                    class="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">{{ __('إعادة تعيين') }}</a>
                <button type="submit"
                    class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">{{ __('بحث') }}</button>
            </div>
        </form>

        @forelse ($articles as $category => $items)
            <div class="mb-6">
                <h3 class="text-sm font-semibold text-slate-600 mb-3">{{ $category }}</h3>
                <div class="space-y-3">
                    @foreach ($items as $article)
                        <details class="border border-slate-200 rounded-xl px-4 py-3">
                            <summary class="text-sm font-semibold text-slate-800 cursor-pointer">
                                {{ $article->question }}
                            </summary>
                            <div class="mt-2 text-sm leading-6 text-slate-700">{!! nl2br(e($article->answer)) !!}</div>
                        </details>
                    @endforeach
                </div>
            </div>
        @empty
            <p class="text-center text-slate-500 py-6 border border-dashed border-slate-200 rounded-2xl">
                {{ __('لا توجد مقالات منشورة حالياً.') }}
            </p>
        @endforelse
    </div>
@endsection
