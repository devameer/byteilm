<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="rtl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Plan') }} — {{ __('لوحة التحكم') }}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        crossorigin="anonymous" referrerpolicy="no-referrer" />
    @vite('resources/css/app.css')
    @stack('styles')
</head>

<body class="bg-slate-100 font-tajawal antialiased text-slate-800">
    <div class="min-h-screen flex">
        <aside class="w-72 bg-white border-l border-slate-200 shadow-sm hidden lg:flex flex-col">
            <div class="px-6 py-6 border-b border-slate-200">
                <span class="text-xl font-bold text-indigo-600">{{ config('app.name', 'Plan') }}</span>
                <p class="text-sm text-slate-500 mt-2">{{ __('لوحة تحكم المسؤول') }}</p>
            </div>

            @php
            $navItems = [
            ['route' => 'admin.dashboard', 'label' => 'نظرة عامة', 'icon' => 'fa-gauge'],
            ['route' => 'admin.users.index', 'label' => 'المستخدمون', 'icon' => 'fa-users'],
            ['route' => 'admin.subscriptions.index', 'label' => 'الاشتراكات', 'icon' => 'fa-rotate'],
            ['route' => 'admin.plans.index', 'label' => 'الباقات', 'icon' => 'fa-layer-group'],
            ['route' => 'admin.usage.index', 'label' => 'إحصائيات الاستخدام', 'icon' => 'fa-chart-pie'],
            ['route' => 'admin.payments.index', 'label' => 'المدفوعات', 'icon' => 'fa-credit-card'],
            ['route' => 'admin.content.index', 'label' => 'المحتوى', 'icon' => 'fa-book'],
            ['route' => 'admin.analytics.index', 'label' => 'التقارير', 'icon' => 'fa-chart-line'],
            ['route' => 'admin.notifications.index', 'label' => 'الإشعارات', 'icon' => 'fa-bell'],
            ['route' => 'admin.reports.index', 'label' => 'التقارير المتقدمة', 'icon' => 'fa-file-lines'],
            ['route' => 'admin.backups.index', 'label' => 'النسخ الاحتياطي', 'icon' => 'fa-database'],
            ['route' => 'admin.referrals.index', 'label' => 'الإحالات', 'icon' => 'fa-link'],
            ['route' => 'admin.teams.index', 'label' => 'الفرق', 'icon' => 'fa-people-group'],
            ['route' => 'admin.logs.index', 'label' => 'السجلات', 'icon' => 'fa-clipboard-list'],
            ['route' => 'admin.settings.index', 'label' => 'الإعدادات', 'icon' => 'fa-sliders'],
            ['route' => 'admin.support.index', 'label' => 'الدعم', 'icon' => 'fa-headset'],
            ];
            @endphp

            <nav class="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                @foreach ($navItems as $item)
                @php($isActive = request()->routeIs($item['route']))
                <a href="{{ route($item['route']) }}"
                    class="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 {{ $isActive ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'hover:bg-slate-100 text-slate-600' }}">
                    <i class="fa-solid {{ $item['icon'] }} text-sm"></i>
                    <span class="text-sm">{{ __($item['label']) }}</span>
                </a>
                @endforeach
            </nav>

            <div class="px-6 py-4 border-t border-slate-200">
                <p class="text-xs text-slate-400">{{ __('آخر تسجيل دخول:') }}
                    <span class="font-medium text-slate-600">{{
                        optional(auth()->user()?->last_login_at)->diffForHumans() ?? __('غير متوفر') }}</span>
                </p>
            </div>
        </aside>

        <div class="flex-1 flex flex-col">
            <header class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 class="text-xl font-semibold text-slate-800">@yield('title', __('لوحة التحكم'))</h1>
                    <p class="text-sm text-slate-500">@yield('subtitle')</p>
                </div>

                <div class="flex items-center gap-4">
                    <div class="text-sm text-right">
                        <p class="font-semibold text-slate-700">{{ auth()->user()->name ?? __('مستخدم') }}</p>
                        <p class="text-slate-500 text-xs">{{ __('دورك:') }}
                            {{ auth()->user()?->roles->pluck('display_name')->implode(', ') ?? __('غير محدد') }}</p>
                    </div>
                    <div
                        class="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                        {{ mb_substr(auth()->user()->name ?? '?', 0, 1) }}
                    </div>
                </div>
            </header>

            <main class="flex-1 p-6 space-y-6">
                @if (session('impersonator_id'))
                <div
                    class="bg-amber-100 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl flex items-center justify-between">
                    <span>{{ __('أنت تتصفح حالياً بصفة مستخدم آخر.') }}</span>
                    <form method="POST" action="{{ route('admin.impersonation.leave') }}">
                        @csrf
                        <button type="submit" class="text-sm font-semibold text-amber-900 hover:underline">
                            {{ __('إنهاء الانتحال') }}
                        </button>
                    </form>
                </div>
                @endif

                @if (session('status'))
                <div class="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl">
                    {{ session('status') }}
                </div>
                @endif

                @if ($errors->any())
                <div class="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl space-y-1">
                    @foreach ($errors->all() as $error)
                    <div>{{ $error }}</div>
                    @endforeach
                </div>
                @endif

                @yield('content')
            </main>
        </div>
    </div>

    @stack('scripts')
</body>

</html>