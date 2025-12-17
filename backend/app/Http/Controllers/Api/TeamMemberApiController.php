<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamMemberApiController extends Controller
{
    public function store(Request $request, Team $team): JsonResponse
    {
        $team = $this->loadTeamForUser($request, $team);
        $user = $request->user();

        abort_unless($team->canManageMembers($user), 403, __('لا تملك صلاحية إدارة أعضاء الفريق.'));

        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'role' => ['required', 'string', 'in:' . implode(',', TeamMember::roles())],
        ]);

        $memberUser = User::where('email', $validated['email'])->firstOrFail();

        abort_if($memberUser->id === $team->owner_id && $validated['role'] !== TeamMember::ROLE_OWNER, 422, __('المالك يجب أن يحتفظ بدور المالك.'));

        if ($validated['role'] === TeamMember::ROLE_OWNER) {
            $team->setOwner($memberUser);
        } else {
            $team->addMember($memberUser, $validated['role']);
        }

        $team->load(['owner', 'members.user', 'courses', 'projects']);

        return response()->json([
            'success' => true,
            'message' => __('تم إضافة العضو إلى الفريق.'),
            'data' => new TeamResource($team),
        ], 201);
    }

    public function update(Request $request, Team $team, TeamMember $member): JsonResponse
    {
        $team = $this->loadTeamForUser($request, $team);
        abort_unless($member->team_id === $team->id, 404);

        $user = $request->user();
        abort_unless($team->canManageMembers($user), 403, __('لا تملك صلاحية إدارة أعضاء الفريق.'));

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:' . implode(',', TeamMember::roles())],
        ]);

        if ($member->isOwner() && $validated['role'] !== TeamMember::ROLE_OWNER) {
            return response()->json([
                'success' => false,
                'message' => __('لا يمكن تغيير دور المالك مباشرة. استخدم خيار تغيير المالك بدلاً من ذلك.'),
            ], 422);
        }

        if ($validated['role'] === TeamMember::ROLE_OWNER) {
            $team->setOwner($member->user);
        } else {
            $team->changeMemberRole($member->user, $validated['role']);
        }

        $team->load(['owner', 'members.user', 'courses', 'projects']);

        return response()->json([
            'success' => true,
            'message' => __('تم تحديث دور العضو.'),
            'data' => new TeamResource($team),
        ]);
    }

    public function destroy(Request $request, Team $team, TeamMember $member): JsonResponse
    {
        $team = $this->loadTeamForUser($request, $team);
        abort_unless($member->team_id === $team->id, 404);

        $user = $request->user();
        abort_unless($team->canManageMembers($user), 403, __('لا تملك صلاحية إدارة أعضاء الفريق.'));

        if ($member->isOwner()) {
            return response()->json([
                'success' => false,
                'message' => __('لا يمكن إزالة مالك الفريق. قم بنقل الملكية أولاً.'),
            ], 422);
        }

        $team->removeMember($member->user);

        $team->load(['owner', 'members.user', 'courses', 'projects']);

        return response()->json([
            'success' => true,
            'message' => __('تم إزالة العضو من الفريق.'),
            'data' => new TeamResource($team),
        ]);
    }

    private function loadTeamForUser(Request $request, Team $team): Team
    {
        $user = $request->user();
        $team->loadMissing(['members.user', 'owner']);
        abort_unless($team->hasMember($user) || $team->owner_id === $user->id, 404);

        return $team;
    }
}
