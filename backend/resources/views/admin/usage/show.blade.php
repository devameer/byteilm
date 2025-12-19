@extends('admin.layout')

@section('title', __('تفاصيل استخدام المستخدم'))
@section('subtitle', $user->name . ' — ' . $user->email)

@section('content')
    <div class="mb-6">
        <a href="{{ route('admin.usage.index') }}"
           class="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
            <i class="fa-solid fa-arrow-right"></i>
            {{ __('العودة إلى الإحصائيات') }}
        </a>
    </div>

    {{-- User & Subscription Info --}}
    <div class="grid gap-6 md:grid-cols-3 mb-6">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                    {{ mb_substr($user->name, 0, 1) }}
                </div>
                <div>
                    <h3 class="font-semibold text-slate-800">{{ $user->name }}</h3>
                    <p class="text-xs text-slate-500">{{ $user->email }}</p>
                </div>
            </div>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-slate-500">{{ __('معرف المستخدم') }}</span>
                    <span class="font-semibold text-slate-700">#{{ $user->id }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500">{{ __('تاريخ التسجيل') }}</span>
                    <span class="font-semibold text-slate-700">{{ $user->created_at->format('Y-m-d') }}</span>
                </div>
            </div>
        </div>

        @if ($subscription && $subscription->plan)
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div class="flex items-center gap-2 mb-4">
                    <i class="fa-solid fa-layer-group text-indigo-500"></i>
                    <h3 class="font-semibold text-slate-800">{{ __('الباقة الحالية') }}</h3>
                </div>
                <div class="space-y-2">
                    <p class="text-2xl font-bold text-indigo-600">
                        {{ $subscription->plan->display_name ?? $subscription->plan->name }}
                    </p>
                    <p class="text-sm text-slate-600">
                        {{ number_format($subscription->plan->price, 2) }} {{ $subscription->plan->currency }}
                        <span class="text-slate-400">/ {{ __($subscription->plan->billing_period) }}</span>
                    </p>
                    <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold {{ $subscription->status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500' }}">
                        {{ __($subscription->status) }}
                    </span>
                </div>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div class="flex items-center gap-2 mb-4">
                    <i class="fa-solid fa-calendar text-purple-500"></i>
                    <h3 class="font-semibold text-slate-800">{{ __('تواريخ الاشتراك') }}</h3>
                </div>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-slate-500">{{ __('تاريخ البدء') }}</span>
                        <span class="font-semibold text-slate-700">
                            {{ $subscription->starts_at ? $subscription->starts_at->format('Y-m-d') : __('غير محدد') }}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">{{ __('تاريخ الانتهاء') }}</span>
                        <span class="font-semibold text-slate-700">
                            {{ $subscription->ends_at ? $subscription->ends_at->format('Y-m-d') : __('غير محدد') }}
                        </span>
                    </div>
                    @if ($usage->last_reset_at)
                        <div class="flex justify-between">
                            <span class="text-slate-500">{{ __('آخر إعادة تعيين') }}</span>
                            <span class="font-semibold text-slate-700">
                                {{ $usage->last_reset_at->format('Y-m-d') }}
                            </span>
                        </div>
                    @endif
                </div>
            </div>
        @else
            <div class="md:col-span-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl p-6 text-center">
                <i class="fa-solid fa-exclamation-triangle text-3xl mb-2"></i>
                <p class="font-semibold">{{ __('لا يوجد اشتراك نشط لهذا المستخدم') }}</p>
            </div>
        @endif
    </div>

    @if ($subscription && $subscription->plan)
        @php
            $planLimits = $limits;

            $usageMetrics = [
                ['key' => 'ai_requests_this_month', 'limit_key' => 'max_ai_requests_per_month', 'label' => 'إجمالي طلبات AI', 'icon' => 'fa-brain', 'color' => 'indigo'],
                ['key' => 'quiz_generations_this_month', 'limit_key' => 'max_quiz_generations_per_month', 'label' => 'إنشاء اختبارات', 'icon' => 'fa-clipboard-question', 'color' => 'emerald'],
                ['key' => 'video_transcriptions_this_month', 'limit_key' => 'max_video_transcriptions_per_month', 'label' => 'تحويل فيديو لنص', 'icon' => 'fa-video', 'color' => 'purple'],
                ['key' => 'video_analyses_this_month', 'limit_key' => 'max_video_analyses_per_month', 'label' => 'تحليل فيديو', 'icon' => 'fa-film', 'color' => 'pink'],
                ['key' => 'ai_chat_messages_this_month', 'limit_key' => 'max_ai_chat_messages_per_month', 'label' => 'رسائل الذكاء الاصطناعي', 'icon' => 'fa-comments', 'color' => 'blue'],
                ['key' => 'text_translations_this_month', 'limit_key' => 'max_text_translations_per_month', 'label' => 'ترجمة نصوص', 'icon' => 'fa-language', 'color' => 'cyan'],
                ['key' => 'text_summarizations_this_month', 'limit_key' => 'max_text_summarizations_per_month', 'label' => 'تلخيص نصوص', 'icon' => 'fa-file-lines', 'color' => 'teal'],
                ['key' => 'videos_uploaded_this_month', 'limit_key' => 'max_videos_per_month', 'label' => 'رفع فيديوهات', 'icon' => 'fa-upload', 'color' => 'orange'],
            ];

            $basicMetrics = [
                ['key' => 'projects_count', 'limit_key' => 'max_projects', 'label' => 'المشاريع', 'icon' => 'fa-folder', 'color' => 'violet'],
                ['key' => 'courses_count', 'limit_key' => 'max_courses', 'label' => 'الدورات', 'icon' => 'fa-book', 'color' => 'rose'],
                ['key' => 'storage_used_mb', 'limit_key' => 'max_storage_mb', 'label' => 'التخزين (MB)', 'icon' => 'fa-database', 'color' => 'amber'],
            ];
        @endphp

        {{-- AI Operations Usage --}}
        <div class="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">
                <i class="fa-solid fa-brain text-indigo-500 ml-2"></i>
                {{ __('استخدام عمليات الذكاء الاصطناعي') }}
                <span class="text-sm font-normal text-slate-500">({{ __('هذا الشهر') }})</span>
            </h2>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                @foreach ($usageMetrics as $metric)
                    @php
                        $current = $usage->{$metric['key']} ?? 0;
                        $limit = $planLimits[$metric['limit_key']] ?? $planLimits['max_ai_requests_per_month'] ?? -1;
                        $percentage = $limit > 0 ? round(($current / $limit) * 100, 1) : 0;
                        $isUnlimited = $limit === -1;

                        $progressColor = $percentage >= 90 ? 'bg-rose-500' : ($percentage >= 70 ? 'bg-amber-500' : 'bg-' . $metric['color'] . '-500');
                        $textColor = 'text-' . $metric['color'] . '-600';
                        $bgColor = 'bg-' . $metric['color'] . '-50';
                    @endphp
                    <div class="p-4 rounded-xl border border-slate-200">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-8 h-8 rounded-lg {{ $bgColor }} flex items-center justify-center">
                                <i class="fa-solid {{ $metric['icon'] }} {{ $textColor }} text-sm"></i>
                            </div>
                            <div class="flex-1">
                                <p class="text-xs text-slate-500">{{ $metric['label'] }}</p>
                                <p class="font-bold text-slate-800">
                                    {{ number_format($current) }}
                                    @if (!$isUnlimited)
                                        <span class="text-xs text-slate-400">/ {{ number_format($limit) }}</span>
                                    @endif
                                </p>
                            </div>
                        </div>
                        @if (!$isUnlimited)
                            <div class="space-y-1">
                                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div class="{{ $progressColor }} h-full transition-all duration-300"
                                         style="width: {{ min($percentage, 100) }}%"></div>
                                </div>
                                <p class="text-xs text-slate-500 text-left">
                                    {{ $percentage }}% {{ __('مستخدم') }}
                                </p>
                            </div>
                        @else
                            <p class="text-xs text-emerald-600 font-semibold">{{ __('غير محدود') }}</p>
                        @endif
                    </div>
                @endforeach
            </div>
        </div>

        {{-- Basic Resources --}}
        <div class="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">
                <i class="fa-solid fa-box text-violet-500 ml-2"></i>
                {{ __('الموارد الأساسية') }}
            </h2>
            <div class="grid gap-4 md:grid-cols-3">
                @foreach ($basicMetrics as $metric)
                    @php
                        $current = $usage->{$metric['key']} ?? 0;
                        $limit = $planLimits[$metric['limit_key']] ?? -1;
                        $percentage = $limit > 0 ? round(($current / $limit) * 100, 1) : 0;
                        $isUnlimited = $limit === -1;

                        $progressColor = $percentage >= 90 ? 'bg-rose-500' : ($percentage >= 70 ? 'bg-amber-500' : 'bg-' . $metric['color'] . '-500');
                        $textColor = 'text-' . $metric['color'] . '-600';
                        $bgColor = 'bg-' . $metric['color'] . '-50';
                    @endphp
                    <div class="p-4 rounded-xl border border-slate-200">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-10 h-10 rounded-lg {{ $bgColor }} flex items-center justify-center">
                                <i class="fa-solid {{ $metric['icon'] }} {{ $textColor }}"></i>
                            </div>
                            <div class="flex-1">
                                <p class="text-xs text-slate-500">{{ $metric['label'] }}</p>
                                <p class="text-lg font-bold text-slate-800">
                                    {{ number_format($current) }}
                                    @if (!$isUnlimited)
                                        <span class="text-xs text-slate-400">/ {{ number_format($limit) }}</span>
                                    @endif
                                </p>
                            </div>
                        </div>
                        @if (!$isUnlimited)
                            <div class="space-y-1">
                                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div class="{{ $progressColor }} h-full transition-all duration-300"
                                         style="width: {{ min($percentage, 100) }}%"></div>
                                </div>
                                <p class="text-xs text-slate-500 text-left">
                                    {{ $percentage }}% {{ __('مستخدم') }}
                                </p>
                            </div>
                        @else
                            <p class="text-xs text-emerald-600 font-semibold">{{ __('غير محدود') }}</p>
                        @endif
                    </div>
                @endforeach
            </div>
        </div>

        {{-- External API Usage --}}
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">
                <i class="fa-solid fa-plug text-blue-500 ml-2"></i>
                {{ __('استخدام الخدمات الخارجية') }}
                <span class="text-sm font-normal text-slate-500">({{ __('هذا الشهر') }})</span>
            </h2>
            <div class="grid gap-4 md:grid-cols-2">
                <div class="p-4 rounded-xl border border-slate-200">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                                <i class="fa-solid fa-bolt text-amber-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-slate-700">Gemini API</p>
                                <p class="text-xs text-slate-500">{{ __('إجمالي الطلبات') }}</p>
                            </div>
                        </div>
                        <p class="text-2xl font-bold text-amber-600">
                            {{ number_format($usage->gemini_api_calls_this_month ?? 0) }}
                        </p>
                    </div>
                </div>
                <div class="p-4 rounded-xl border border-slate-200">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <i class="fa-solid fa-microphone text-blue-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-slate-700">AssemblyAI</p>
                                <p class="text-xs text-slate-500">{{ __('إجمالي الطلبات') }}</p>
                            </div>
                        </div>
                        <p class="text-2xl font-bold text-blue-600">
                            {{ number_format($usage->assemblyai_requests_this_month ?? 0) }}
                        </p>
                    </div>
                    @php
                        $canUseAssembly = $planLimits['can_use_assemblyai'] ?? false;
                    @endphp
                    <p class="text-xs {{ $canUseAssembly ? 'text-emerald-600' : 'text-slate-400' }} font-semibold">
                        {{ $canUseAssembly ? '✓ ' . __('متاح في الباقة') : '✗ ' . __('غير متاح في الباقة') }}
                    </p>
                </div>
            </div>
        </div>

        {{-- All-Time Totals --}}
        <div class="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">
                <i class="fa-solid fa-infinity text-indigo-500 ml-2"></i>
                {{ __('الإجمالي الكلي') }} <span class="text-sm font-normal text-slate-500">({{ __('منذ التسجيل') }})</span>
            </h2>
            <div class="grid gap-4 md:grid-cols-4">
                <div class="text-center">
                    <p class="text-3xl font-bold text-indigo-600">{{ number_format($usage->total_ai_requests ?? 0) }}</p>
                    <p class="text-sm text-slate-600 mt-1">{{ __('إجمالي طلبات AI') }}</p>
                </div>
                <div class="text-center">
                    <p class="text-3xl font-bold text-emerald-600">{{ number_format($usage->total_quiz_generations ?? 0) }}</p>
                    <p class="text-sm text-slate-600 mt-1">{{ __('إنشاء اختبارات') }}</p>
                </div>
                <div class="text-center">
                    <p class="text-3xl font-bold text-purple-600">{{ number_format($usage->total_transcriptions ?? 0) }}</p>
                    <p class="text-sm text-slate-600 mt-1">{{ __('تحويل فيديو') }}</p>
                </div>
                <div class="text-center">
                    <p class="text-3xl font-bold text-orange-600">{{ number_format($usage->total_videos ?? 0) }}</p>
                    <p class="text-sm text-slate-600 mt-1">{{ __('رفع فيديوهات') }}</p>
                </div>
            </div>
        </div>
    @endif
@endsection
