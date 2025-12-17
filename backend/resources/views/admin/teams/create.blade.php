@extends('admin.layout')

@section('title', __('إنشاء فريق جديد'))
@section('subtitle', __('إضافة فريق جديد وتحديد مالكه.'))

@section('content')
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <form method="POST" action="{{ route('admin.teams.store') }}" class="space-y-6">
            @csrf

            <div class="grid gap-5 lg:grid-cols-2">
                <div class="space-y-3">
                    <label for="name" class="block text-sm font-semibold text-slate-700">
                        {{ __('اسم الفريق') }}
                    </label>
                    <input id="name" name="name" type="text" required value="{{ old('name') }}"
                        class="form-input" placeholder="{{ __('مثال: فريق المحتوى') }}">
                    @error('name')
                        <p class="text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <div class="space-y-3">
                    <label for="owner_email" class="block text-sm font-semibold text-slate-700">
                        {{ __('البريد الإلكتروني لمالك الفريق') }}
                    </label>
                    <input id="owner_email" name="owner_email" type="email" required
                        value="{{ old('owner_email') }}" class="form-input"
                        placeholder="owner@example.com">
                    <p class="text-xs text-slate-500">
                        {{ __('سيتم تعيين صاحب البريد الإلكتروني كمالك للفريق وسيتم إضافته تلقائياً للأعضاء.') }}
                    </p>
                    @error('owner_email')
                        <p class="text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>
            </div>

            <div class="space-y-3">
                <label for="description" class="block text-sm font-semibold text-slate-700">
                    {{ __('وصف الفريق') }}
                </label>
                <textarea id="description" name="description" rows="4" class="form-textarea"
                    placeholder="{{ __('وصف مختصر عن هدف الفريق ومهامه.') }}">{{ old('description') }}</textarea>
                @error('description')
                    <p class="text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <div class="flex justify-end gap-3">
                <a href="{{ route('admin.teams.index') }}"
                    class="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                    {{ __('إلغاء') }}
                </a>
                <button type="submit"
                    class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                    {{ __('حفظ الفريق') }}
                </button>
            </div>
        </form>
    </div>
@endsection
