@php
    $current = $subscription ?? null;
    $statusOptions = $statusOptions ?? [];
    $selectedUserId = old('user_id', optional($current)->user_id);
    $selectedPlanId = old('plan_id', optional($current)->plan_id);
    $selectedStatus = old('status', optional($current)->status ?? 'active');
    $startsAt = old('starts_at', optional(optional($current)->starts_at)->format('Y-m-d'));
    $trialEndsAt = old('trial_ends_at', optional(optional($current)->trial_ends_at)->format('Y-m-d'));
    $endsAt = old('ends_at', optional(optional($current)->ends_at)->format('Y-m-d'));
    $canceledAt = old('canceled_at', optional(optional($current)->canceled_at)->format('Y-m-d'));
@endphp

<div class="grid gap-4 md:grid-cols-2">
    <div>
        <label class="block text-sm font-medium text-slate-700">{{ __('المستخدم') }}</label>
        <select name="user_id"
            class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            required>
            <option value="">{{ __('اختر مستخدماً') }}</option>
            @foreach ($users as $user)
                <option value="{{ $user->id }}" @selected($selectedUserId == $user->id)>
                    {{ $user->name }} — {{ $user->email }}
                </option>
            @endforeach
        </select>
    </div>

    <div>
        <label class="block text-sm font-medium text-slate-700">{{ __('الباقة') }}</label>
        <select name="plan_id"
            class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            required>
            <option value="">{{ __('اختر باقة') }}</option>
            @foreach ($plans as $plan)
                <option value="{{ $plan->id }}" @selected($selectedPlanId == $plan->id)>
                    {{ $plan->display_name ?? $plan->name }} — {{ number_format($plan->price, 2) }} {{ $plan->currency }}
                </option>
            @endforeach
        </select>
    </div>
</div>

<div class="grid gap-4 md:grid-cols-2">
    <div>
        <label class="block text-sm font-medium text-slate-700">{{ __('حالة الاشتراك') }}</label>
        <select name="status"
            class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            required>
            @foreach ($statusOptions as $value => $label)
                <option value="{{ $value }}" @selected($selectedStatus === $value)>{{ $label }}</option>
            @endforeach
        </select>
    </div>
    <div>
        <label class="block text-sm font-medium text-slate-700">{{ __('تاريخ البداية') }}</label>
        <input type="date" name="starts_at" value="{{ $startsAt }}"
            class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
        <p class="text-xs text-slate-500 mt-1">{{ __('يُستخدم تاريخ اليوم افتراضياً إذا ترك الحقل فارغاً.') }}</p>
    </div>
</div>

<div class="grid gap-4 md:grid-cols-2">
    <div>
        <label class="block text-sm font-medium text-slate-700">{{ __('نهاية الفترة التجريبية') }}</label>
        <input type="date" name="trial_ends_at" value="{{ $trialEndsAt }}"
            class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
    </div>
    <div>
        <label class="block text-sm font-medium text-slate-700">{{ __('تاريخ انتهاء الاشتراك') }}</label>
        <input type="date" name="ends_at" value="{{ $endsAt }}"
            class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
        <p class="text-xs text-slate-500 mt-1">{{ __('يتم تجاهل هذا الحقل إذا كانت الحالة نشطة أو تجريبية.') }}</p>
    </div>
</div>

<div>
    <label class="block text-sm font-medium text-slate-700">{{ __('تاريخ الإلغاء') }}</label>
    <input type="date" name="canceled_at" value="{{ $canceledAt }}"
        class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
    <p class="text-xs text-slate-500 mt-1">{{ __('يتم تعيين التاريخ الحالي تلقائياً للحالات الملغاة أو المنتهية إن لم يتم تحديده.') }}</p>
</div>
