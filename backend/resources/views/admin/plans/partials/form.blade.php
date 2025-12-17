@php
    $plan = $plan ?? null;
    $features = old('features', $plan?->features ?? []);
    $limitKeys = old('limits_keys', array_keys($plan?->limits ?? []));
    $limitValues = old('limits_values', array_values($plan?->limits ?? []));
@endphp

<div class="grid gap-4 md:grid-cols-2">
    <div class="space-y-2">
        <label class="text-sm font-semibold text-slate-600" for="name">{{ __('المعرف (بالإنجليزية)') }}</label>
        <input type="text" id="name" name="name" value="{{ old('name', $plan->name ?? '') }}"
            class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" required>
    </div>
    <div class="space-y-2">
        <label class="text-sm font-semibold text-slate-600" for="display_name">{{ __('اسم العرض') }}</label>
        <input type="text" id="display_name" name="display_name"
            value="{{ old('display_name', $plan->display_name ?? '') }}"
            class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
    </div>
    <div class="md:col-span-2 space-y-2">
        <label class="text-sm font-semibold text-slate-600" for="description">{{ __('الوصف') }}</label>
        <textarea id="description" name="description" rows="3"
            class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">{{ old('description', $plan->description ?? '') }}</textarea>
    </div>
    <div class="space-y-2">
        <label class="text-sm font-semibold text-slate-600" for="price">{{ __('السعر') }}</label>
        <input type="number" step="0.01" id="price" name="price" value="{{ old('price', $plan->price ?? 0) }}"
            class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" required>
    </div>
    <div class="space-y-2">
        <label class="text-sm font-semibold text-slate-600" for="currency">{{ __('العملة') }}</label>
        <input type="text" id="currency" name="currency" value="{{ old('currency', $plan->currency ?? 'USD') }}"
            class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" required>
    </div>
    <div class="space-y-2">
        <label class="text-sm font-semibold text-slate-600" for="billing_period">{{ __('فترة الفوترة') }}</label>
        <select id="billing_period" name="billing_period"
            class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" required>
            <option value="monthly" @selected(old('billing_period', $plan->billing_period ?? '') === 'monthly')>{{ __('شهري') }}</option>
            <option value="yearly" @selected(old('billing_period', $plan->billing_period ?? '') === 'yearly')>{{ __('سنوي') }}</option>
            <option value="lifetime" @selected(old('billing_period', $plan->billing_period ?? '') === 'lifetime')>{{ __('مدى الحياة') }}</option>
        </select>
    </div>
    <div class="space-y-2">
        <label class="text-sm font-semibold text-slate-600" for="sort_order">{{ __('ترتيب العرض') }}</label>
        <input type="number" id="sort_order" name="sort_order" value="{{ old('sort_order', $plan->sort_order ?? 0) }}"
            class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
    </div>
    <div class="space-y-2">
        <label class="text-sm font-semibold text-slate-600">{{ __('الحالة') }}</label>
        <label class="flex items-center gap-3 text-sm">
            <input type="hidden" name="is_active" value="0">
            <input type="checkbox" name="is_active" value="1" @checked(old('is_active', $plan->is_active ?? true))
                class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
            <span class="text-slate-600">{{ __('الباقة مفعّلة') }}</span>
        </label>
    </div>
</div>

<div class="mt-6 grid gap-6 md:grid-cols-2">
    <div>
        <h4 class="text-sm font-semibold text-slate-700 mb-2">{{ __('الميزات (سطر لكل ميزة)') }}</h4>
        <div class="space-y-2">
            @for ($i = 0; $i < max(5, count($features)); $i++)
                <input type="text" name="features[]" value="{{ $features[$i] ?? '' }}"
                    class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
            @endfor
        </div>
    </div>
    <div>
        <h4 class="text-sm font-semibold text-slate-700 mb-2">{{ __('الحدود (المفتاح → القيمة)') }}</h4>
        <div class="space-y-2">
            @for ($i = 0; $i < max(5, count($limitKeys)); $i++)
                <div class="flex gap-2">
                    <input type="text" name="limits_keys[]" value="{{ $limitKeys[$i] ?? '' }}"
                        class="w-1/2 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                        placeholder="{{ __('المفتاح') }}">
                    <input type="text" name="limits_values[]" value="{{ $limitValues[$i] ?? '' }}"
                        class="w-1/2 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                        placeholder="{{ __('القيمة') }}">
                </div>
            @endfor
        </div>
    </div>
</div>
