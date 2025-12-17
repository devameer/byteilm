@extends('admin.layout')

@section('title', __('إدارة الفريق: :name', ['name' => $team->name]))
@section('subtitle', __('تحديث بيانات الفريق والتحكم في أعضائه.'))

@section('content')
    <div class="space-y-6">
        @if (session('status'))
            <div class="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3">
                {{ session('status') }}
            </div>
        @endif

        @if ($errors->any())
            <div class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3">
                <ul class="list-disc list-inside space-y-1">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <form method="POST" action="{{ route('admin.teams.update', $team) }}" class="space-y-6">
                @csrf
                @method('PUT')

                <div class="grid gap-5 lg:grid-cols-2">
                    <div class="space-y-3">
                        <label for="name" class="block text-sm font-semibold text-slate-700">
                            {{ __('اسم الفريق') }}
                        </label>
                        <input id="name" name="name" type="text" required value="{{ old('name', $team->name) }}"
                            class="form-input">
                    </div>

                    <div class="space-y-3">
                        <label for="owner_email" class="block text-sm font-semibold text-slate-700">
                            {{ __('البريد الإلكتروني لمالك الفريق') }}
                        </label>
                        <input id="owner_email" name="owner_email" type="email" required
                            value="{{ old('owner_email', $team->owner?->email) }}" class="form-input">
                        <p class="text-xs text-slate-500">
                            {{ __('سيتم تعيين البريد المدخل كمالك للفريق (مع الاحتفاظ ببيانات الأعضاء).') }}
                        </p>
                    </div>
                </div>

                <div class="space-y-3">
                    <label for="description" class="block text-sm font-semibold text-slate-700">
                        {{ __('وصف الفريق') }}
                    </label>
                    <textarea id="description" name="description" rows="4" class="form-textarea">{{ old('description', $team->description) }}</textarea>
                </div>

                <div class="flex justify-end gap-3">
                    <a href="{{ route('admin.teams.index') }}"
                        class="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100">
                        {{ __('رجوع للقائمة') }}
                    </a>
                    <button type="submit"
                        class="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                        {{ __('حفظ التغييرات') }}
                    </button>
                </div>
            </form>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ __('إضافة عضو جديد') }}</h2>
            <form method="POST" action="{{ route('admin.teams.members.store', $team) }}" class="grid gap-4 md:grid-cols-2">
                @csrf
                <div class="space-y-2">
                    <label for="member_email" class="block text-sm font-semibold text-slate-700">
                        {{ __('البريد الإلكتروني للعضو') }}
                    </label>
                    <input id="member_email" name="email" type="email" required class="form-input"
                        placeholder="member@example.com">
                </div>
                <div class="space-y-2">
                    <label for="member_role" class="block text-sm font-semibold text-slate-700">
                        {{ __('الدور') }}
                    </label>
                    <select id="member_role" name="role" class="form-select">
                        @php
                            $roleLabels = [
                                'owner' => __('مالك'),
                                'member' => __('عضو'),
                                'viewer' => __('مشاهد'),
                            ];
                        @endphp
                        @foreach ($roles as $role)
                            <option value="{{ $role }}">{{ $roleLabels[$role] ?? $role }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="md:col-span-2 flex justify-end">
                    <button type="submit"
                        class="px-4 py-2 text-sm rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700">
                        {{ __('إضافة العضو') }}
                    </button>
                </div>
            </form>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-slate-800">{{ __('قائمة الأعضاء') }}</h2>
                <p class="text-xs text-slate-500">
                    {{ __('يمكنك تعديل أدوار الأعضاء أو إزالتهم (باستثناء المالك الحالي).') }}
                </p>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200 text-sm">
                    <thead class="bg-slate-50 text-slate-600">
                        <tr>
                            <th class="px-4 py-2 text-right font-semibold">{{ __('العضو') }}</th>
                            <th class="px-4 py-2 text-right font-semibold">{{ __('الدور الحالي') }}</th>
                            <th class="px-4 py-2 text-right font-semibold">{{ __('تاريخ الانضمام') }}</th>
                            <th class="px-4 py-2 text-right font-semibold">{{ __('إجراءات') }}</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        @forelse ($team->members as $member)
                            <tr>
                                <td class="px-4 py-3">
                                    <div class="font-semibold text-slate-800">{{ $member->user?->name }}</div>
                                    <div class="text-xs text-slate-500">{{ $member->user?->email }}</div>
                                </td>
                                <td class="px-4 py-3 text-slate-600">
                                    {{ $roleLabels[$member->role] ?? $member->role }}
                                </td>
                                <td class="px-4 py-3 text-xs text-slate-500">
                                    {{ optional($member->joined_at)->format('Y-m-d') ?? '—' }}
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <form method="POST"
                                            action="{{ route('admin.teams.members.update', [$team, $member]) }}"
                                            class="flex items-center gap-2">
                                            @csrf
                                            @method('PATCH')
                                            <select name="role" class="form-select text-xs">
                                                @foreach ($roles as $role)
                                                    <option value="{{ $role }}" @selected($member->role === $role)>
                                                        {{ $roleLabels[$role] ?? $role }}
                                                    </option>
                                                @endforeach
                                            </select>
                                            <button type="submit"
                                                class="px-3 py-1 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                                                {{ __('تحديث') }}
                                            </button>
                                        </form>

                                        <form method="POST"
                                            action="{{ route('admin.teams.members.destroy', [$team, $member]) }}">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit"
                                                class="px-3 py-1 text-xs rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                                @disabled($member->isOwner())
                                                onclick="return confirm('{{ __('هل أنت متأكد من إزالة هذا العضو؟') }}')">
                                                {{ __('إزالة') }}
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="4" class="px-4 py-6 text-center text-slate-500">
                                    {{ __('لا يوجد أعضاء في هذا الفريق بعد.') }}
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-red-200 shadow-sm">
            <h2 class="text-lg font-semibold text-red-600 mb-3">{{ __('حذف الفريق') }}</h2>
            <p class="text-sm text-slate-600 mb-4">
                {{ __('سيتم حذف الفريق وجميع العضويات المرتبطة به. لا يمكن التراجع عن هذه العملية.') }}
            </p>
            <form method="POST" action="{{ route('admin.teams.destroy', $team) }}"
                onsubmit="return confirm('{{ __('هل أنت متأكد من رغبتك في حذف هذا الفريق نهائياً؟') }}')">
                @csrf
                @method('DELETE')
                <button type="submit"
                    class="px-4 py-2 text-sm rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700">
                    {{ __('حذف الفريق') }}
                </button>
            </form>
        </div>
    </div>
@endsection
