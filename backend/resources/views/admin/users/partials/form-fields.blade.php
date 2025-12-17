@php
    $isEdit = isset($user) && $user;
    $selectedRoles = old('roles', $selectedRoles ?? []);
    $selectedPlanId = old('plan_id', $selectedPlanId ?? null);
    $selectedStatus = old('subscription_status', $selectedSubscriptionStatus ?? 'active');
    $selectedTrialEndsAt = old('trial_ends_at', $selectedTrialEndsAt ?? null);
    $isActive = old('is_active', optional($user)->is_active ?? true);
@endphp

<div class="grid gap-4 md:grid-cols-2">
    <div>
        <label class="block text-sm font-medium text-slate-700">{{ __('الاسم الكامل') }}</label>
        <input type="text" name="name" value="{{ old('name', optional($user)->name) }}"
            class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            required>
    </div>
    <div>
        <label class="block text-sm font-medium text-slate-700">{{ __('البريد الإلكتروني') }}</label>
        <input type="email" name="email" value="{{ old('email', optional($user)->email) }}"
            class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            required>
    </div>
</div>

<div class="grid gap-4 md:grid-cols-2">
    <div>
        <label class="block text-sm font-medium text-slate-700">{{ __('كلمة المرور') }}</label>
        <input type="password" name="password"
            class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            @if(!$isEdit) required @endif placeholder="{{ $isEdit ? __('اترك الحقل فارغاً للاحتفاظ بكلمة المرور الحالية') : '' }}">
    </div>
    <div>
        <label class="block text-sm font-medium text-slate-700">{{ __('تأكيد كلمة المرور') }}</label>
        <input type="password" name="password_confirmation"
            class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            @if(!$isEdit) required @endif>
    </div>
</div>

<div class="grid gap-4 md:grid-cols-2">
    <div>
        <label class="block text-sm font-medium text-slate-700">{{ __('الأدوار') }}</label>
        <select name="roles[]" multiple
            class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400 h-32">
            @foreach ($roles as $role)
                <option value="{{ $role->name }}" @selected(in_array($role->name, $selectedRoles, true))>
                    {{ $role->display_name ?? $role->name }}
                </option>
            @endforeach
        </select>
        <p class="text-xs text-slate-500 mt-2">{{ __('حدد دوراً واحداً أو أكثر لإسناد الصلاحيات المناسبة.') }}</p>
    </div>
    <div class="flex items-end">
        <label class="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input type="hidden" name="is_active" value="0">
            <input type="checkbox" name="is_active" value="1" @checked($isActive)
                class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
            <span>{{ __('تفعيل حساب المستخدم فوراً') }}</span>
        </label>
    </div>
</div>

<div class="grid gap-4 md:grid-cols-2">
    <div>
        <label class="block text-sm font-medium text-slate-700">{{ __('الباقة الحالية') }}</label>
        <select name="plan_id"
            class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
            <option value="">{{ __('خطة مجانية (بدون اشتراك مدفوع)') }}</option>
            @foreach ($plans as $plan)
                <option value="{{ $plan->id }}" @selected($selectedPlanId == $plan->id)>
                    {{ $plan->display_name ?? $plan->name }} — {{ number_format($plan->price, 2) }} {{ $plan->currency }}
                </option>
            @endforeach
        </select>
        <p class="text-xs text-slate-500 mt-2">{{ __('يمكنك ربط المستخدم بإحدى الباقات المدفوعة تلقائياً.') }}</p>
    </div>
    <div>
        <label class="block text-sm font-medium text-slate-700">{{ __('حالة الاشتراك') }}</label>
        <select name="subscription_status"
            class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
            <option value="active" @selected($selectedStatus === 'active')>{{ __('نشط') }}</option>
            <option value="trialing" @selected($selectedStatus === 'trialing')>{{ __('تجريبي') }}</option>
        </select>
    </div>
</div>

<div>
    <label class="block text-sm font-medium text-slate-700">{{ __('تاريخ انتهاء الفترة التجريبية (اختياري)') }}</label>
    <input type="date" name="trial_ends_at" value="{{ $selectedTrialEndsAt }}"
        class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
    <p class="text-xs text-slate-500 mt-2">{{ __('يُستخدم فقط إذا كانت حالة الاشتراك تجريبية.') }}</p>
</div>
