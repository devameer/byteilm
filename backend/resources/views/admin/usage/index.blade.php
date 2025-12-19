@extends('admin.layout')

@section('title', __('إحصائيات الاستخدام'))
@section('subtitle', __('مراقبة استخدام الموارد والذكاء الاصطناعي والخدمات الخارجية.'))

@section('content')
    {{-- Overall Statistics --}}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-slate-500">{{ __('إجمالي طلبات AI') }}</p>
                    <p class="text-2xl font-bold text-indigo-600 mt-1">
                        {{ number_format($totalStats['total_ai_requests_this_month']) }}
                    </p>
                    <p class="text-xs text-slate-400 mt-1">{{ __('هذا الشهر') }}</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <i class="fa-solid fa-brain text-indigo-600 text-xl"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-slate-500">{{ __('إنشاء اختبارات') }}</p>
                    <p class="text-2xl font-bold text-emerald-600 mt-1">
                        {{ number_format($totalStats['total_quiz_generations_this_month']) }}
                    </p>
                    <p class="text-xs text-slate-400 mt-1">{{ __('هذا الشهر') }}</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <i class="fa-solid fa-clipboard-question text-emerald-600 text-xl"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-slate-500">{{ __('تحويل فيديو') }}</p>
                    <p class="text-2xl font-bold text-purple-600 mt-1">
                        {{ number_format($totalStats['total_video_transcriptions_this_month']) }}
                    </p>
                    <p class="text-xs text-slate-400 mt-1">{{ __('هذا الشهر') }}</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                    <i class="fa-solid fa-video text-purple-600 text-xl"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-slate-500">{{ __('Gemini API') }}</p>
                    <p class="text-2xl font-bold text-amber-600 mt-1">
                        {{ number_format($totalStats['total_gemini_calls_this_month']) }}
                    </p>
                    <p class="text-xs text-slate-400 mt-1">{{ __('هذا الشهر') }}</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <i class="fa-solid fa-bolt text-amber-600 text-xl"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
        {{-- Top AI Users --}}
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">
                <i class="fa-solid fa-trophy text-amber-500 ml-2"></i>
                {{ __('أكثر المستخدمين استخداماً للذكاء الاصطناعي') }}
            </h2>
            <div class="space-y-3">
                @forelse ($topAiUsers as $index => $userUsage)
                    @php
                        $user = $userUsage->user;
                        $rankColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];
                        $rankColor = $rankColors[$index] ?? 'text-slate-500';
                    @endphp
                    <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {{ $index + 1 }}
                        </div>
                        <div class="flex-1">
                            <a href="{{ route('admin.usage.show', $user) }}"
                               class="font-semibold text-slate-800 hover:text-indigo-600">
                                {{ $user->name }}
                            </a>
                            <p class="text-xs text-slate-500">{{ $user->email }}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold {{ $rankColor }}">
                                {{ number_format($userUsage->ai_requests_this_month) }}
                            </p>
                            <p class="text-xs text-slate-400">{{ __('طلب') }}</p>
                        </div>
                    </div>
                @empty
                    <div class="text-center text-slate-400 py-6">
                        {{ __('لا يوجد بيانات استخدام') }}
                    </div>
                @endforelse
            </div>
        </div>

        {{-- Usage by Plan --}}
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">
                <i class="fa-solid fa-layer-group text-indigo-500 ml-2"></i>
                {{ __('الاستخدام حسب الباقة') }}
            </h2>
            <div class="space-y-4">
                @foreach ($usageByPlan as $plan)
                    <div class="p-4 rounded-xl border border-slate-200">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <h3 class="font-semibold text-slate-800">{{ $plan['name'] }}</h3>
                                <p class="text-xs text-slate-500">
                                    {{ number_format($plan['active_users']) }} {{ __('مستخدم نشط') }}
                                </p>
                            </div>
                            <span class="text-lg font-bold text-indigo-600">
                                {{ number_format($plan['total_ai_requests']) }}
                            </span>
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-xs">
                            <div>
                                <p class="text-slate-500">{{ __('اختبارات') }}</p>
                                <p class="font-semibold text-emerald-600">
                                    {{ number_format($plan['quiz_generations']) }}
                                </p>
                            </div>
                            <div>
                                <p class="text-slate-500">{{ __('تحويل فيديو') }}</p>
                                <p class="font-semibold text-purple-600">
                                    {{ number_format($plan['video_transcriptions']) }}
                                </p>
                            </div>
                            <div>
                                <p class="text-slate-500">{{ __('ترجمة') }}</p>
                                <p class="font-semibold text-blue-600">
                                    {{ number_format($plan['text_translations']) }}
                                </p>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </div>

    {{-- Users Approaching Limits --}}
    @if ($usersNearLimit->count() > 0)
        <div class="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">
                <i class="fa-solid fa-exclamation-triangle text-amber-500 ml-2"></i>
                {{ __('مستخدمون يقتربون من الحد الأقصى') }}
                <span class="text-sm font-normal text-slate-500">(≥80%)</span>
            </h2>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-slate-200">
                            <th class="text-right py-3 px-4 font-semibold text-slate-700">{{ __('المستخدم') }}</th>
                            <th class="text-right py-3 px-4 font-semibold text-slate-700">{{ __('الباقة') }}</th>
                            <th class="text-right py-3 px-4 font-semibold text-slate-700">{{ __('الاستخدام') }}</th>
                            <th class="text-right py-3 px-4 font-semibold text-slate-700">{{ __('النسبة') }}</th>
                            <th class="text-right py-3 px-4 font-semibold text-slate-700">{{ __('الإجراءات') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($usersNearLimit as $user)
                            @php
                                $usage = $user->usage;
                                $subscription = $user->subscriptions->where('status', 'active')->first();
                                $plan = $subscription?->plan;
                                $limit = $plan?->limits['max_ai_requests_per_month'] ?? -1;
                                $current = $usage->ai_requests_this_month ?? 0;
                                $percentage = $limit > 0 ? round(($current / $limit) * 100, 1) : 0;

                                $colorClass = $percentage >= 95 ? 'text-rose-600' : ($percentage >= 90 ? 'text-amber-600' : 'text-orange-600');
                            @endphp
                            <tr class="border-b border-slate-100 hover:bg-slate-50">
                                <td class="py-3 px-4">
                                    <div>
                                        <p class="font-semibold text-slate-800">{{ $user->name }}</p>
                                        <p class="text-xs text-slate-500">{{ $user->email }}</p>
                                    </div>
                                </td>
                                <td class="py-3 px-4">
                                    <span class="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600">
                                        {{ $plan?->display_name ?? $plan?->name ?? __('بدون باقة') }}
                                    </span>
                                </td>
                                <td class="py-3 px-4">
                                    <p class="font-semibold text-slate-700">
                                        {{ number_format($current) }} / {{ $limit === -1 ? __('غير محدود') : number_format($limit) }}
                                    </p>
                                </td>
                                <td class="py-3 px-4">
                                    <div class="flex items-center gap-2">
                                        <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div class="h-full {{ $percentage >= 95 ? 'bg-rose-500' : ($percentage >= 90 ? 'bg-amber-500' : 'bg-orange-500') }}"
                                                 style="width: {{ min($percentage, 100) }}%"></div>
                                        </div>
                                        <span class="font-semibold {{ $colorClass }}">{{ $percentage }}%</span>
                                    </div>
                                </td>
                                <td class="py-3 px-4">
                                    <a href="{{ route('admin.usage.show', $user) }}"
                                       class="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                                        {{ __('عرض التفاصيل') }}
                                    </a>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    @endif

    {{-- External API Statistics --}}
    <div class="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">
            <i class="fa-solid fa-plug text-blue-500 ml-2"></i>
            {{ __('إحصائيات الخدمات الخارجية') }}
        </h2>
        <div class="grid gap-4 md:grid-cols-2">
            <div class="p-4 rounded-xl border border-slate-200">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-semibold text-slate-700">Gemini API</p>
                        <p class="text-xs text-slate-500 mt-1">{{ __('إجمالي الطلبات') }}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-2xl font-bold text-amber-600">
                            {{ number_format($totalStats['total_gemini_calls_this_month']) }}
                        </p>
                        <p class="text-xs text-slate-400">{{ __('هذا الشهر') }}</p>
                    </div>
                </div>
            </div>
            <div class="p-4 rounded-xl border border-slate-200">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-semibold text-slate-700">AssemblyAI</p>
                        <p class="text-xs text-slate-500 mt-1">{{ __('إجمالي الطلبات') }}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-2xl font-bold text-blue-600">
                            {{ number_format($totalStats['total_assemblyai_requests_this_month']) }}
                        </p>
                        <p class="text-xs text-slate-400">{{ __('هذا الشهر') }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
