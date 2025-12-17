@extends('admin.layout')

@section('title', __('إدارة الأسئلة الشائعة'))
@section('subtitle', __('تنظيم مقالات FAQ وتحديث حالتها.'))

@php
    $supportNav = [
        ['route' => 'admin.support.index', 'label' => __('نظرة عامة')],
        ['route' => 'admin.support.tickets', 'label' => __('التذاكر')],
        ['route' => 'admin.support.messages', 'label' => __('الرسائل')],
        ['route' => 'admin.support.faq', 'label' => __('الأسئلة الشائعة')],
    ];
@endphp

@section('content')
    <div class="mb-6">
        <nav class="flex flex-wrap gap-2">
            @foreach ($supportNav as $item)
                @php($active = request()->routeIs($item['route']))
                <a href="{{ route($item['route']) }}"
                    class="px-4 py-2 text-sm rounded-xl border {{ $active ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-semibold' : 'border-slate-200 text-slate-600 hover:bg-slate-100' }}">
                    {{ $item['label'] }}
                </a>
            @endforeach
        </nav>
    </div>

    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('إضافة مقال جديد') }}</h2>
        <form method="POST" action="{{ route('admin.support.faq.store') }}" class="grid gap-4 lg:grid-cols-2">
            @csrf
            <div>
                <label class="block text-xs text-slate-500 mb-1">{{ __('السؤال') }}</label>
                <input type="text" name="question" value="{{ old('question') }}"
                    class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    required>
            </div>
            <div>
                <label class="block text-xs text-slate-500 mb-1">{{ __('التصنيف') }}</label>
                <input type="text" name="category" value="{{ old('category') }}"
                    class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="{{ __('مثال: الاشتراكات، الفيديوهات...') }}">
            </div>
            <div class="lg:col-span-2">
                <label class="block text-xs text-slate-500 mb-1">{{ __('الإجابة') }}</label>
                <textarea name="answer" rows="4"
                    class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    required>{{ old('answer') }}</textarea>
            </div>
            <div class="flex items-center gap-3">
                <label class="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" name="is_published" value="1" class="rounded" @checked(old('is_published'))>
                    {{ __('نشر فوراً') }}
                </label>
                <input type="number" name="sort_order" value="{{ old('sort_order', 0) }}"
                    class="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    min="0">
            </div>
            <div class="lg:col-span-2 flex justify-end">
                <button type="submit"
                    class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                    {{ __('حفظ المقال') }}
                </button>
            </div>
        </form>
    </div>

    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-lg font-semibold text-slate-800">{{ __('مكتبة الأسئلة الشائعة') }}</h2>
                <p class="text-sm text-slate-500">{{ __('قم بتحديث المقالات وضبط حالتها من هنا.') }}</p>
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-slate-600">
                    <tr>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('السؤال') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('التصنيف') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الحالة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الترتيب') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('آخر تحديث') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('إجراءات') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @forelse ($articles as $article)
                        <tr class="hover:bg-slate-50">
                            <td class="px-4 py-3 text-slate-700">
                                <div class="font-semibold text-slate-800">{{ $article->question }}</div>
                                <details class="mt-2">
                                    <summary class="text-xs text-indigo-600 cursor-pointer">{{ __('عرض الإجابة') }}</summary>
                                    <div class="mt-2 text-xs text-slate-600 leading-6">{!! nl2br(e($article->answer)) !!}</div>
                                </details>
                            </td>
                            <td class="px-4 py-3 text-slate-500">{{ $article->category ?? __('بدون تصنيف') }}</td>
                            <td class="px-4 py-3">
                                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $article->is_published ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600' }}">
                                    {{ $article->is_published ? __('منشور') : __('مسودة') }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-slate-500">{{ $article->sort_order }}</td>
                            <td class="px-4 py-3 text-slate-500">{{ optional($article->updated_at)->diffForHumans() }}</td>
                            <td class="px-4 py-3 space-y-3">
                                <form method="POST" action="{{ route('admin.support.faq.update', $article) }}"
                                    class="space-y-3 border border-slate-200 rounded-xl p-4 bg-slate-50">
                                    @csrf
                                    @method('PUT')
                                    <div>
                                        <label class="block text-xs text-slate-500 mb-1">{{ __('السؤال') }}</label>
                                        <input type="text" name="question" value="{{ old('question', $article->question) }}"
                                            class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                                    </div>
                                    <div>
                                        <label class="block text-xs text-slate-500 mb-1">{{ __('التصنيف') }}</label>
                                        <input type="text" name="category" value="{{ old('category', $article->category) }}"
                                            class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                                    </div>
                                    <div>
                                        <label class="block text-xs text-slate-500 mb-1">{{ __('الإجابة') }}</label>
                                        <textarea name="answer" rows="3"
                                            class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">{{ old('answer', $article->answer) }}</textarea>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <label class="inline-flex items-center gap-2 text-sm text-slate-600">
                                            <input type="checkbox" name="is_published" value="1" class="rounded"
                                                @checked(old('is_published', $article->is_published))>
                                            {{ __('منشور') }}
                                        </label>
                                        <input type="number" name="sort_order" value="{{ old('sort_order', $article->sort_order) }}"
                                            class="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                                            min="0">
                                    </div>
                                    <div class="flex justify-end">
                                        <button type="submit"
                                            class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                                            {{ __('حفظ التعديلات') }}
                                        </button>
                                    </div>
                                </form>
                                <form method="POST" action="{{ route('admin.support.faq.destroy', $article) }}"
                                    onsubmit="return confirm('{{ __('هل أنت متأكد؟') }}');" class="flex justify-end">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit"
                                        class="px-3 py-1.5 text-xs rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50">
                                        {{ __('حذف') }}
                                    </button>
                                </form>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="px-4 py-6 text-center text-slate-500">
                                {{ __('لم تتم إضافة مقالات بعد.') }}
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="mt-6">
            {{ $articles->links() }}
        </div>
    </div>
@endsection
