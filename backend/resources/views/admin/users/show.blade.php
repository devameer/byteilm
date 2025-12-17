@extends('admin.layout')

@section('title', __('تفاصيل المستخدم'))
@section('subtitle', __('إدارة معلومات المستخدم، الأدوار، وحالة الحساب.'))

@section('content')
    <div class="flex justify-between items-center mb-4">
        <a href="{{ route('admin.users.index') }}"
            class="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
            {{ __('العودة لقائمة المستخدمين') }}
        </a>
        <a href="{{ route('admin.users.edit', $user) }}"
            class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
            {{ __('تعديل المستخدم') }}
        </a>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-6">
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 class="text-xl font-semibold text-slate-800">{{ $user->name }}</h2>
                        <p class="text-sm text-slate-500">{{ $user->email }}</p>
                        <p class="text-xs text-slate-400 mt-2">{{ __('انضم في') }}
                            {{ optional($user->created_at)->format('Y-m-d H:i') }}</p>
                        <div class="flex flex-wrap gap-2 mt-3">
                            @forelse ($user->roles as $role)
                                <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold">
                                    {{ $role->display_name ?? $role->name }}
                                </span>
                            @empty
                                <span class="text-xs text-slate-400">{{ __('لا يوجد دور محدد') }}</span>
                            @endforelse
                        </div>
                    </div>
                    <div class="space-y-2 text-sm">
                        <span class="inline-flex items-center px-3 py-1 rounded-lg {{ $user->is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-600' }}">
                            {{ $user->is_active ? __('حساب نشط') : __('حساب معطل') }}
                        </span>
                        <div>
                            <span class="text-slate-500">{{ __('الخطة الحالية:') }}</span>
                            <span class="font-semibold text-slate-700">
                                {{ optional($user->subscription?->plan)->display_name ?? __('مجاني') }}
                            </span>
                        </div>
                    </div>
                </div>

                <dl class="grid gap-4 md:grid-cols-2 text-sm mt-6">
                    <div>
                        <dt class="text-slate-500">{{ __('آخر تسجيل دخول') }}</dt>
                        <dd class="font-semibold text-slate-700">{{ optional($user->last_login_at)->diffForHumans() ?? __('غير متوفر') }}</dd>
                    </div>
                    <div>
                        @php
                            $status = $user->subscription->status ?? 'free';
                            $statusLabel = [
                                'active' => __('اشتراك نشط'),
                                'trialing' => __('فترة تجريبية'),
                                'canceled' => __('اشتراك ملغى'),
                                'expired' => __('اشتراك منتهي'),
                                'free' => __('خطة مجانية'),
                            ][$status] ?? $status;
                        @endphp
                        <dt class="text-slate-500">{{ __('اشتراك') }}</dt>
                        <dd class="font-semibold text-slate-700">{{ $statusLabel }}</dd>
                    </div>
                </dl>
            </div>

            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 class="text-lg font-semibold text-slate-800 mb-4">{{ __('إحصائيات النشاط') }}</h3>
                <div class="grid gap-4 md:grid-cols-3 text-sm">
                    @foreach ($statistics as $stat)
                        <div class="rounded-xl border border-slate-200 p-4">
                            <p class="text-slate-500">{{ $stat['label'] }}</p>
                            <p class="text-2xl font-semibold text-slate-800">{{ number_format($stat['value']) }}</p>
                        </div>
                    @endforeach
                </div>
            </div>

            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 class="text-lg font-semibold text-slate-800 mb-4">{{ __('سجل الاشتراكات الأخيرة') }}</h3>
                <div class="space-y-3 text-sm">
                    @forelse ($recentSubscriptions as $subscription)
                        <div class="flex items-center justify-between p-4 rounded-xl border border-slate-200">
                            <div>
                                <p class="font-semibold text-slate-700">{{ $subscription->plan?->display_name ?? __('—') }}</p>
                                <p class="text-xs text-slate-500">{{ optional($subscription->starts_at)->format('Y-m-d') }} → {{ optional($subscription->ends_at)->format('Y-m-d') ?? '—' }}</p>
                            </div>
                            <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $subscription->status === 'active' ? 'bg-emerald-50 text-emerald-600' : ($subscription->status === 'trialing' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500') }}">
                                {{ __($subscription->status) }}
                            </span>
                        </div>
                    @empty
                        <p class="text-slate-500">{{ __('لا توجد اشتراكات مسجلة بعد لهذا المستخدم.') }}</p>
                    @endforelse
                </div>
            </div>
        </div>

        <div class="space-y-6">
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 class="text-lg font-semibold text-slate-800 mb-4">{{ __('تعديل الأدوار') }}</h3>
                <form method="POST" action="{{ route('admin.users.roles.update', $user) }}" class="space-y-4">
                    @csrf
                    @method('PUT')
                    <div class="space-y-2 text-sm">
                        @foreach ($roles as $role)
                            <label class="flex items-center gap-3">
                                <input type="checkbox" name="roles[]" value="{{ $role->name }}"
                                    @checked($user->roles->contains('name', $role->name))
                                    class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
                                <span class="text-slate-600">{{ $role->display_name ?? $role->name }}</span>
                            </label>
                        @endforeach
                    </div>
                    <button type="submit"
                        class="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
                        {{ __('حفظ الأدوار') }}</button>
                </form>
            </div>

            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 class="text-lg font-semibold text-slate-800 mb-4">{{ __('إدارة حالة الحساب') }}</h3>
                <form method="POST" action="{{ route('admin.users.status.update', $user) }}" class="space-y-4">
                    @csrf
                    @method('PUT')
                    <label class="flex items-center gap-3 text-sm">
                        <input type="hidden" name="is_active" value="0">
                        <input type="checkbox" name="is_active" value="1" @checked($user->is_active)
                            class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
                        <span class="text-slate-600">{{ __('السماح بتسجيل الدخول') }}</span>
                    </label>
                    <button type="submit"
                        class="w-full px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900">
                        {{ __('تحديث الحالة') }}</button>
                </form>
            </div>

            <div class="bg-white rounded-2xl p-6 border border-rose-200 shadow-sm">
                <h3 class="text-lg font-semibold text-rose-600 mb-4">{{ __('إجراءات خطرة') }}</h3>
                <div class="space-y-3 text-sm">
                    @if (auth()->id() !== $user->id)
                        <form method="POST" action="{{ route('admin.users.impersonate', $user) }}">
                            @csrf
                            <button type="submit"
                                class="w-full px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600">
                                {{ __('تسجيل الدخول كمستخدم') }}
                            </button>
                        </form>
                    @endif
                    <form method="POST" action="{{ route('admin.users.destroy', $user) }}"
                        onsubmit="return confirm('{{ __('هل أنت متأكد من حذف هذا المستخدم؟') }}');">
                        @csrf
                        @method('DELETE')
                        <button type="submit"
                            class="w-full px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700">
                            {{ __('حذف المستخدم') }}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
