@extends('admin.layout')

@section('title', __('السجلات'))
@section('subtitle', __('مراجعة نشاط المنصة والسجلات التقنية عبر الأقسام المتخصصة.'))

@section('content')
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        @foreach ($sections as $section)
            <a href="{{ $section['route'] }}"
                class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow transition">
                <h2 class="text-lg font-semibold text-slate-800">{{ $section['title'] }}</h2>
                <p class="text-sm text-slate-500 mt-2">{{ $section['description'] }}</p>
                <span class="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 mt-4">
                    {{ __('عرض التفاصيل') }}
                    <i class="fa-solid fa-arrow-left-long text-xs"></i>
                </span>
            </a>
        @endforeach
    </div>

    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('أحدث الأنشطة') }}</h2>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-slate-600">
                    <tr>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('المستخدم') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الإجراء') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('الوصف') }}</th>
                        <th class="px-4 py-3 text-right font-semibold">{{ __('التاريخ') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @forelse ($recentLogs as $log)
                        <tr class="hover:bg-slate-50">
                            <td class="px-4 py-3">
                                <div class="font-semibold text-slate-800">{{ $log->user?->name ?? __('غير معروف') }}</div>
                                <div class="text-xs text-slate-500">{{ $log->user?->email }}</div>
                            </td>
                            <td class="px-4 py-3 text-slate-700">{{ __($log->action ?? '—') }}</td>
                            <td class="px-4 py-3 text-slate-500">{{ \Illuminate\Support\Str::limit($log->description ?? __('—'), 80) }}</td>
                            <td class="px-4 py-3 text-slate-500">{{ optional($log->created_at)->diffForHumans() }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="4" class="px-4 py-6 text-center text-slate-500">
                                {{ __('لا توجد أنشطة مسجلة بعد. قم بتمكين سجل الأنشطة لإظهار البيانات.') }}
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
@endsection
