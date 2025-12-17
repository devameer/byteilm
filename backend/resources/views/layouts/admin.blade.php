<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'لوحة التحكم') - {{ config('app.name') }}</title>

    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <!-- Vite Assets -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])

    @stack('styles')
</head>

<body class="bg-gray-100">
    <div class="min-h-screen flex">
        <!-- Sidebar -->
        <aside class="w-64 bg-gray-800 text-white">
            <div class="p-4">
                <h1 class="text-2xl font-bold">لوحة التasdsaحكم</h1>
            </div>
            <nav class="mt-4">
                <a href="{{ route('admin.dashboard') }}"
                    class="block px-4 py-2 hover:bg-gray-700 {{ request()->routeIs('admin.dashboard') ? 'bg-gray-700' : '' }}">
                    الرئيسية
                </a>
                <a href="{{ route('admin.users.index') }}"
                    class="block px-4 py-2 hover:bg-gray-700 {{ request()->routeIs('admin.users.*') ? 'bg-gray-700' : '' }}">
                    المستخدمين
                </a>
                <a href="{{ route('admin.subscriptions.index') }}"
                    class="block px-4 py-2 hover:bg-gray-700 {{ request()->routeIs('admin.subscriptions.*') ? 'bg-gray-700' : '' }}">
                    الاشتراكات
                </a>
                <a href="{{ route('admin.plans.index') }}"
                    class="block px-4 py-2 hover:bg-gray-700 {{ request()->routeIs('admin.plans.*') ? 'bg-gray-700' : '' }}">
                    الخطط
                </a>
                <a href="{{ route('admin.payments.index') }}"
                    class="block px-4 py-2 hover:bg-gray-700 {{ request()->routeIs('admin.payments.*') ? 'bg-gray-700' : '' }}">
                    المدفوعات
                </a>
                <a href="{{ route('admin.analytics.index') }}"
                    class="block px-4 py-2 hover:bg-gray-700 {{ request()->routeIs('admin.analytics.*') ? 'bg-gray-700' : '' }}">
                    التحليلات
                </a>
                <a href="{{ route('admin.support.index') }}"
                    class="block px-4 py-2 hover:bg-gray-700 {{ request()->routeIs('admin.support.*') ? 'bg-gray-700' : '' }}">
                    الدعم الفني
                </a>
                <a href="{{ route('admin.settings.index') }}"
                    class="block px-4 py-2 hover:bg-gray-700 {{ request()->routeIs('admin.settings.*') ? 'bg-gray-700' : '' }}">
                    الإعدادات
                </a>
            </nav>
        </aside>

        <!-- Main Content -->
        <div class="flex-1">
            <!-- Top Navigation -->
            <header class="bg-white shadow">
                <div class="flex justify-between items-center px-6 py-4">
                    <h2 class="text-xl font-semibold text-gray-800">@yield('page-title', 'الرئيسية')</h2>
                    <div class="flex items-center gap-4">
                        <span class="text-gray-700">{{ auth()->user()->name }}</span>
                        <form action="{{ route('admin.logout') }}" method="POST" class="inline">
                            @csrf
                            <button type="submit" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                                تسجيل الخروج
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <!-- Page Content -->
            <main class="p-6">
                @if(session('success'))
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {{ session('success') }}
                </div>
                @endif

                @if(session('error'))
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {{ session('error') }}
                </div>
                @endif

                @yield('content')
            </main>
        </div>
    </div>

    @stack('scripts')
</body>

</html>