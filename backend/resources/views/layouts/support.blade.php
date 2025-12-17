<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="rtl">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Plan') }} — {{ __('الدعم الفني') }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap">
    @vite('resources/css/app.css')
</head>

<body class="bg-slate-100 font-tajawal text-slate-800">
    <div class="min-h-screen flex flex-col">
        <header class="bg-white border-b border-slate-200">
            <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                <div>
                    <h1 class="text-lg font-semibold text-slate-900">{{ __('مركز المساعدة') }}</h1>
                    <p class="text-sm text-slate-500">{{ __('تواصل مع فريق الدعم أو تصفح الأسئلة الشائعة.') }}</p>
                </div>
                <a href="{{ url('/') }}"
                    class="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600">
                    <i class="fa-solid fa-arrow-left-long text-xs"></i>
                    {{ __('العودة للمنصة') }}
                </a>
            </div>
        </header>

        <main class="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
            @if (session('status'))
                <div class="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl">
                    {{ session('status') }}
                </div>
            @endif

            @if ($errors->any())
                <div class="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl space-y-1">
                    @foreach ($errors->all() as $error)
                        <div>{{ $error }}</div>
                    @endforeach
                </div>
            @endif

            @yield('content')
        </main>

        <footer class="border-t border-slate-200 bg-white">
            <div class="max-w-5xl mx-auto px-4 py-4 text-xs text-slate-500">
                {{ __('© :year جميع الحقوق محفوظة', ['year' => date('Y')]) }}
            </div>
        </footer>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/js/all.min.js"
        crossorigin="anonymous" referrerpolicy="no-referrer"></script>
</body>

</html>
