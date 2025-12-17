@extends('admin.layout')

@section('title', __('فرق العمل'))
@section('subtitle', __('إدارة فرق الباقة Business ومتابعة أعضائها.'))

@section('content')
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div class="flex flex-wrap items-center gap-3 mb-6">
            <form method="GET" class="flex flex-wrap gap-3">
                <input type="text" name="owner" value="{{ request('owner') }}" placeholder="{{ __('بحث بالبريد الإلكتروني لمالك الفريق') }}"
                    class="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <div class="flex gap-2 ms-auto">
                    <a href="{{ route('admin.teams.index') }}" class="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">{{ __('إعادة تعيين') }}</a>
                    <button type="submit" class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">{{ __('بحث') }}</button>
                </div>
            </form>
            <a href="{{ route('admin.teams.create') }}"
                class="px-4 py-2 text-sm rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700">
                {{ __('إنشاء فريق جديد') }}
            </a>
        </div>

        <div class="space-y-4">
            @forelse ($teams as $team)
                <div class="border border-slate-200 rounded-2xl p-5">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 class="text-lg font-semibold text-slate-800">{{ $team->name }}</h2>
                            <p class="text-sm text-slate-500">{{ $team->description }}</p>
                            <p class="text-xs text-slate-400 mt-2">{{ __('أنشئ في') }} {{ optional($team->created_at)->format('Y-m-d') }}</p>
                        </div>
                        <div class="text-sm text-slate-600">
                            <p>{{ __('المالك:') }} <span class="font-semibold text-slate-800">{{ $team->owner?->name }}</span></p>
                            <p class="text-xs text-slate-500">{{ $team->owner?->email }}</p>
                        </div>
                    </div>

                    <div class="mt-4">
                        <h3 class="text-sm font-semibold text-slate-700 mb-2">{{ __('الأعضاء') }}</h3>
                        @php
                            $roleLabels = [
                                'owner' => __('مالك'),
                                'member' => __('عضو'),
                                'viewer' => __('مشاهد'),
                            ];
                        @endphp
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-slate-200 text-xs">
                                <thead class="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th class="px-3 py-2 text-right font-semibold">{{ __('العضو') }}</th>
                                        <th class="px-3 py-2 text-right font-semibold">{{ __('الدور') }}</th>
                                        <th class="px-3 py-2 text-right font-semibold">{{ __('تاريخ الانضمام') }}</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    @foreach ($team->members as $member)
                                        <tr>
                                            <td class="px-3 py-2">
                                                <div class="font-semibold text-slate-800">{{ $member->user?->name }}</div>
                                                <div class="text-[11px] text-slate-500">{{ $member->user?->email }}</div>
                                            </td>
                                            <td class="px-3 py-2 text-slate-500">{{ $roleLabels[$member->role] ?? $member->role }}</td>
                                            <td class="px-3 py-2 text-slate-500">{{ optional($member->joined_at)->format('Y-m-d') }}</td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            @empty
                <p class="text-center text-slate-500 py-6">{{ __('لا توجد فرق مسجلة حالياً.') }}</p>
            @endforelse
        </div>

        <div class="mt-6">
            {{ $teams->links() }}
        </div>
    </div>
@endsection
