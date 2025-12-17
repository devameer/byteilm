<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class TeamController extends Controller
{
    public function index(Request $request): View
    {
        $teams = Team::query()
            ->with(['owner', 'members.user'])
            ->when($request->filled('owner'), function ($query) use ($request) {
                $query->whereHas('owner', fn ($ownerQuery) => $ownerQuery->where('email', 'like', '%' . $request->string('owner') . '%'));
            })
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return view('admin.teams.index', compact('teams'));
    }

    public function create(): View
    {
        return view('admin.teams.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'owner_email' => ['required', 'email', 'exists:users,email'],
        ]);

        $owner = User::where('email', $validated['owner_email'])->firstOrFail();

        $team = Team::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'owner_id' => $owner->id,
        ]);

        $team->addMember($owner, TeamMember::ROLE_OWNER);

        return redirect()
            ->route('admin.teams.edit', $team)
            ->with('status', __('تم إنشاء الفريق بنجاح.'));
    }

    public function edit(Team $team): View
    {
        $team->load(['owner', 'members.user']);

        return view('admin.teams.edit', [
            'team' => $team,
            'roles' => TeamMember::roles(),
        ]);
    }

    public function update(Request $request, Team $team): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'owner_email' => ['required', 'email', 'exists:users,email'],
        ]);

        $owner = User::where('email', $validated['owner_email'])->firstOrFail();

        $team->fill([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);
        $team->save();

        if ($owner->id !== $team->owner_id) {
            $team->setOwner($owner);
        } else {
            $team->addMember($owner, TeamMember::ROLE_OWNER);
        }

        return redirect()
            ->route('admin.teams.edit', $team)
            ->with('status', __('تم تحديث بيانات الفريق.'));
    }

    public function destroy(Team $team): RedirectResponse
    {
        $team->delete();

        return redirect()
            ->route('admin.teams.index')
            ->with('status', __('تم حذف الفريق بنجاح.'));
    }

    public function storeMember(Request $request, Team $team): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'role' => ['required', 'string', 'in:' . implode(',', TeamMember::roles())],
        ]);

        $user = User::where('email', $validated['email'])->firstOrFail();

        $team->addMember($user, $validated['role']);

        if ($validated['role'] === TeamMember::ROLE_OWNER) {
            $team->setOwner($user);
        }

        return redirect()
            ->route('admin.teams.edit', $team)
            ->with('status', __('تم إضافة العضو للفريق.'));
    }

    public function updateMember(Request $request, Team $team, TeamMember $member): RedirectResponse
    {
        abort_unless($member->team_id === $team->id, 404);

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:' . implode(',', TeamMember::roles())],
        ]);

        if ($member->isOwner() && $validated['role'] !== TeamMember::ROLE_OWNER) {
            return redirect()
                ->route('admin.teams.edit', $team)
                ->withErrors(['role' => __('لا يمكن تغيير دور المالك من دون تحديد مالك جديد أولاً.')]);
        }

        if ($validated['role'] === TeamMember::ROLE_OWNER) {
            $team->setOwner($member->user);
        } else {
            $team->changeMemberRole($member->user, $validated['role']);
        }

        return redirect()
            ->route('admin.teams.edit', $team)
            ->with('status', __('تم تحديث دور العضو.'));
    }

    public function destroyMember(Team $team, TeamMember $member): RedirectResponse
    {
        abort_unless($member->team_id === $team->id, 404);

        if ($member->isOwner()) {
            return redirect()
                ->route('admin.teams.edit', $team)
                ->withErrors(['member' => __('لا يمكن إزالة مالك الفريق. يرجى نقل الملكية أولاً.')]);
        }

        $team->removeMember($member->user);

        return redirect()
            ->route('admin.teams.edit', $team)
            ->with('status', __('تم إزالة العضو من الفريق.'));
    }
}
