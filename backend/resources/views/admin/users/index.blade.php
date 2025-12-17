@extends('admin.layout')

@section('title', __('المستخدمون'))
@section('subtitle', __('إدارة حسابات المستخدمين والأدوار والاشتراكات.'))

@section('content')
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
            <div>
                <h2 class="text-lg font-semibold text-slate-800">{{ __('قائمة المستخدمين') }}</h2>
                <p class="text-sm text-slate-500">{{ __('استخدم مرشحات البحث لتحديد المستخدم المطلوب.') }}</p>
            </div>
            <a href="{{ route('admin.users.create') }}"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
                <i class="fa-solid fa-user-plus text-xs"></i>
                {{ __('إضافة مستخدم جديد') }}
            </a>
        </div>

        <form method="GET" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
            <label class="relative block">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400"><i class="fa-solid fa-search"></i></span>
                <input type="text" name="q" value="{{ request('q') }}"
                    class="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="{{ __('ابحث عن مستخدم بالاسم أو البريد...') }}">
            </label>

            <select name="role"
                class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">{{ __('جميع الأدوار') }}</option>
                @foreach ($roles as $role)
                    <option value="{{ $role->name }}" @selected(request('role') === $role->name)>
                        {{ $role->display_name ?? $role->name }}
                    </option>
                @endforeach
            </select>

            <select name="plan"
                class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">{{ __('جميع الباقات') }}</option>
                <option value="free" @selected(request('plan') === 'free')>{{ __('خطة مجانية') }}</option>
                @foreach ($plans as $plan)
                    <option value="{{ $plan->name }}" @selected(request('plan') === $plan->name)>
                        {{ $plan->display_name ?? $plan->name }}
                    </option>
                @endforeach
            </select>

            <select name="status"
                class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">{{ __('جميع الحالات') }}</option>
                <option value="active" @selected(request('status') === 'active')>{{ __('حساب نشط') }}</option>
                <option value="inactive" @selected(request('status') === 'inactive')>{{ __('حساب معطل') }}</option>
                <option value="trialing" @selected(request('status') === 'trialing')>{{ __('اشتراك تجريبي') }}</option>
                <option value="canceled" @selected(request('status') === 'canceled')>{{ __('اشتراك ملغى') }}</option>
                <option value="expired" @selected(request('status') === 'expired')>{{ __('اشتراك منتهي') }}</option>
            </select>

            <div class="md:col-span-2 xl:col-span-4 flex justify-end gap-2">
                <a href="{{ route('admin.users.index') }}"
                    class="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100">{{ __('إعادة تعيين') }}</a>
                <button type="submit"
                    class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">{{ __('تصفية') }}</button>
            </div>
        </form>

        <div class="text-sm text-slate-500 mb-4">
            {{ __('إجمالي المستخدمين:') }}
            <span class="font-semibold text-slate-700">{{ number_format($users->total()) }}</span>
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-slate-600">
                    <tr>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المستخدم') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الدور') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الباقة') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('حالة الاشتراك') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('تاريخ التسجيل') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الإجراءات') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @forelse ($users as $user)
                        <tr class="hover:bg-slate-50">
                            <td class="px-4 py-3">
                                <div class="font-semibold text-slate-800">{{ $user->name }}</div>
                                <div class="text-xs text-slate-500 ltr:font-mono">{{ $user->email }}</div>
                            </td>
                            <td class="px-4 py-3">
                                <div class="flex flex-wrap gap-2">
                                    @forelse ($user->roles as $role)
                                        <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600">
                                            {{ $role->display_name ?? $role->name }}
                                        </span>
                                    @empty
                                        <span class="text-slate-400">{{ __('لا يوجد دور') }}</span>
                                    @endforelse
                                </div>
                            </td>
                            <td class="px-4 py-3">
                                <div class="text-slate-700">
                                    {{ optional($user->subscription?->plan)->display_name ?? __('مجاني') }}
                                </div>
                            </td>
                            <td class="px-4 py-3">
                                @php
                                    $status = optional($user->subscription)->status ?? 'free';
                                    $statusLabel = [
                                        'active' => __('اشتراك نشط'),
                                        'trialing' => __('فترة تجريبية'),
                                        'canceled' => __('اشتراك ملغى'),
                                        'expired' => __('اشتراك منتهي'),
                                        'free' => __('خطة مجانية'),
                                    ][$status] ?? $status;
                                @endphp
                                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $status === 'active' ? 'bg-emerald-50 text-emerald-600' : ($status === 'trialing' ? 'bg-amber-50 text-amber-600' : ($status === 'free' ? 'bg-slate-100 text-slate-500' : 'bg-rose-50 text-rose-600')) }}">
                                    {{ $statusLabel }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-slate-500">{{ optional($user->created_at)->format('Y-m-d') }}</td>
                            <td class="px-4 py-3 text-right">
                                <a href="{{ route('admin.users.show', $user) }}"
                                    class="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                                    {{ __('عرض التفاصيل') }}
                                </a>
                                <a href="{{ route('admin.users.edit', $user) }}"
                                    class="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 ms-2">
                                    {{ __('تعديل') }}
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="px-4 py-6 text-center text-slate-500">{{ __('لا يوجد مستخدمون بعد.') }}</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="mt-6">
            {{ $users->withQueryString()->links() }}
        </div>
    </div>
@endsection
