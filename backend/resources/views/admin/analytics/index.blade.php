@extends('admin.layout')

@section('title', __('التقارير والإحصائيات'))
@section('subtitle', __('لوحة تحليلية لمؤشرات النمو والاحتفاظ والإيرادات.'))

@section('content')
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form method="GET"
            class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:gap-4 text-sm">
            <div>
                <label for="range" class="text-xs text-slate-500">{{ __('نطاق التحليل') }}</label>
                <select id="range" name="range"
                    class="mt-1 rounded-xl border border-slate-200 px-3 py-1.5 focus:outline-none focus:border-indigo-400">
                    @foreach ([
                        '7_days' => __('آخر 7 أيام'),
                        '30_days' => __('آخر 30 يوم'),
                        '90_days' => __('آخر 90 يوم'),
                        'year' => __('منذ بداية العام'),
                    ] as $value => $label)
                        <option value="{{ $value }}" @selected($selectedRange === $value)>{{ $label }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label for="months" class="text-xs text-slate-500">{{ __('عدد الأشهر في المخططات') }}</label>
                <select id="months" name="months"
                    class="mt-1 rounded-xl border border-slate-200 px-3 py-1.5 focus:outline-none focus:border-indigo-400">
                    @foreach ([6, 9, 12] as $option)
                        <option value="{{ $option }}" @selected($months === $option)>{{ $option }}</option>
                    @endforeach
                </select>
            </div>
            <div class="flex items-end gap-2 mt-2 md:mt-6">
                <button type="submit"
                    class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">{{ __('تحديث') }}</button>
                <a href="{{ route('admin.analytics.export', request()->query()) }}"
                    class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 inline-flex items-center gap-2">
                    <i class="fa-solid fa-file-arrow-down text-xs"></i>
                    {{ __('تصدير JSON') }}
                </a>
            </div>
        </form>

        <div class="text-sm text-slate-500">
            <p>{{ __('النطاق الحالي: من :from إلى :to', ['from' => $rangeFrom->format('Y-m-d'), 'to' => $rangeTo->format('Y-m-d')]) }}
            </p>
        </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        @foreach ($summaryCards as $metric)
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <p class="text-sm text-slate-500">{{ $metric['label'] }}</p>
                <p class="text-2xl font-semibold text-slate-800 mt-2">{{ number_format($metric['value']) }}</p>
                <span class="inline-flex items-center gap-1 text-xs mt-3 px-2.5 py-1 rounded-lg
                    {{ $metric['delta'] >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600' }}">
                    <i class="fa-solid {{ $metric['delta'] >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down' }}"></i>
                    {{ $metric['delta'] >= 0 ? '+' : '' }}{{ number_format($metric['delta'], 2) }}%
                </span>
            </div>
        @endforeach
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm lg:col-span-2">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-slate-800">{{ __('تطور المستخدمين الجدد') }}</h2>
                <span class="text-xs text-slate-500">{{ __('آخر :months شهر', ['months' => $months]) }}</span>
            </div>
            <canvas id="newUsersChart" class="h-64"></canvas>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('معدل الاحتفاظ والتحويل') }}</h2>
            <div class="space-y-4">
                <div class="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <p class="text-xs text-slate-500 mb-1">{{ __('اشتراكات ملغاة (آخر 30 يوم)') }}</p>
                    <p class="text-3xl font-bold text-rose-500">{{ number_format($churn['recent_cancellations']) }}</p>
                </div>
                <div class="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <p class="text-xs text-slate-500 mb-1">{{ __('معدل الاحتفاظ الشهري') }}</p>
                    <p class="text-3xl font-bold text-emerald-600">{{ number_format($churn['retention_rate'], 2) }}%</p>
                </div>
            </div>
        </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-slate-800">{{ __('اتجاه الإيرادات الشهرية') }}</h2>
                <span class="text-xs text-slate-500">{{ __('آخر :months شهر', ['months' => $months]) }}</span>
            </div>
            <canvas id="revenueChart" class="h-64"></canvas>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('المستخدمون النشطون يومياً') }}</h2>
            <canvas id="activeUsersChart" class="h-64"></canvas>
        </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('قمع التحويل') }}</h2>
            <div class="space-y-4">
                @foreach ($conversionFunnel as $step)
                    <div class="border border-slate-200 rounded-xl p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-semibold text-slate-800">{{ $step['label'] }}</p>
                                <p class="text-xs text-slate-500">{{ __('معدل التحويل: :rate%', ['rate' => number_format($step['rate'], 2)]) }}</p>
                            </div>
                            <span class="text-lg font-bold text-indigo-600">{{ number_format($step['value']) }}</span>
                        </div>
                        <div class="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div class="h-full bg-indigo-500" style="width: {{ max(min($step['rate'], 100), 0) }}%"></div>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('تحليل السلوك') }}</h2>
            <div class="space-y-3 text-sm">
                @foreach ($engagement as $metric)
                    <div class="flex items-center justify-between">
                        <span class="text-slate-500">{{ $metric['label'] }}</span>
                        <span class="font-semibold text-slate-800">
                            {{ number_format($metric['value'], $metric['value'] < 5 ? 2 : 0) }}{{ $metric['suffix'] ?? '' }}
                        </span>
                    </div>
                @endforeach
            </div>
        </div>
    </div>

    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('تحليل Cohort للاحتفاظ بالمستخدمين') }}</h2>
        @if (empty($cohortRetention))
            <p class="text-sm text-slate-500">{{ __('لم يتم جمع بيانات كافية لتوليد تحليل Cohort بعد.') }}</p>
        @else
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200 text-sm">
                    <thead class="bg-slate-50 text-slate-600">
                        <tr>
                            <th class="px-4 py-3 text-right font-semibold">{{ __('الشهر (Cohort)') }}</th>
                            <th class="px-4 py-3 text-right font-semibold">{{ __('عدد المسجلين') }}</th>
                            <th class="px-4 py-3 text-right font-semibold">{{ __('المستخدمون المحتفظ بهم') }}</th>
                            <th class="px-4 py-3 text-right font-semibold">{{ __('نسبة الاحتفاظ') }}</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        @foreach ($cohortRetention as $cohort)
                            <tr class="hover:bg-slate-50">
                                <td class="px-4 py-3 text-slate-700">{{ $cohort['label'] }}</td>
                                <td class="px-4 py-3 text-slate-500">{{ number_format($cohort['total']) }}</td>
                                <td class="px-4 py-3 text-slate-500">{{ number_format($cohort['retained']) }}</td>
                                <td class="px-4 py-3 font-semibold text-emerald-600">
                                    {{ number_format($cohort['retention_rate'], 2) }}%
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </div>
@endsection

@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js"
        integrity="sha384-yCAF+L3mTVDFF1iB6F2RMlPl62rQoTZWeHvMVWwgdV8tlVmq04xTf1j6MG3H1rUv"
        crossorigin="anonymous"></script>
    <script>
        const newUsers = @json($monthlyNewUsers);
        const revenueTrend = @json($revenueTrend);
        const activeUsers = @json($dailyActiveUsers);

        const renderLineChart = (canvasId, dataset, label, color) => {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            const labels = dataset.map(point => point.label);
            const values = dataset.map(point => point.value);

            new Chart(canvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label,
                        data: values,
                        borderColor: color,
                        backgroundColor: color + '33',
                        tension: 0.4,
                        pointRadius: 3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => value.toLocaleString()
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: context => `${context.parsed.y.toLocaleString()}`
                            }
                        }
                    }
                }
            });
        };

        renderLineChart('newUsersChart', newUsers, '{{ __('مستخدمون جدد') }}', '#6366F1');
        renderLineChart('revenueChart', revenueTrend, '{{ __('إيرادات مكتسبة (USD)') }}', '#22C55E');
        renderLineChart('activeUsersChart', activeUsers, '{{ __('مستخدمون نشطون يومياً') }}', '#F97316');
    </script>
@endpush
