<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeamResource;
use App\Mail\TeamInvitationEmail;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class TeamInvitationController extends Controller
{
    public function sendInvitation(Request $request, Team $team): JsonResponse
    {
        $team = $this->loadTeamForUser($request, $team);
        $user = $request->user();

        abort_unless($team->canManageMembers($user), 403, __('لا تملك صلاحية دعوة أعضاء للفريق.'));

        $validated = $request->validate([
            'email' => ['required', 'email', 'not_in:' . $user->email],
            'role' => ['required', 'string', 'in:member,viewer'],
        ]);

        // Check if user is already a member
        $invitedUser = User::where('email', $validated['email'])->first();
        if ($invitedUser && $team->hasMember($invitedUser)) {
            return response()->json([
                'success' => false,
                'message' => __('هذا المستخدم عضو بالفعل في الفريق.'),
            ], 422);
        }

        // Check if invitation already exists
        $existingInvitation = TeamInvitation::where('team_id', $team->id)
            ->where('email', $validated['email'])
            ->where('expires_at', '>', now())
            ->first();

        if ($existingInvitation) {
            return response()->json([
                'success' => false,
                'message' => __('هناك دعوة معلقة لهذا البريد الإلكتروني بالفعل.'),
            ], 422);
        }

        // Create invitation
        $invitation = TeamInvitation::create([
            'team_id' => $team->id,
            'email' => $validated['email'],
            'role' => $validated['role'],
            'token' => Str::random(32),
            'expires_at' => now()->addDays(7),
        ]);

        // Send email
        if ($invitedUser) {
            Mail::to($invitedUser->email)->queue(new TeamInvitationEmail($invitation));
        } else {
            Mail::to($invitation->email)->queue(new TeamInvitationEmail($invitation));
        }

        $team->load(['owner', 'members.user', 'courses', 'projects']);

        return response()->json([
            'success' => true,
            'message' => __('تم إرسال الدعوة بنجاح.'),
            'data' => new TeamResource($team),
        ]);
    }

    public function acceptInvitation(Request $request, string $token): JsonResponse
    {
        $invitation = TeamInvitation::where('token', $token)
            ->where('expires_at', '>', now())
            ->firstOrFail();

        $user = $request->user();
        
        // Verify email matches
        if ($user->email !== $invitation->email) {
            return response()->json([
                'success' => false,
                'message' => __('هذا الرابط مخصص لبريد إلكتروني مختلف.'),
            ], 422);
        }

        // Check if user is already a member
        if ($invitation->team->hasMember($user)) {
            $invitation->delete();
            return response()->json([
                'success' => false,
                'message' => __('أنت عضو بالفعل في هذا الفريق.'),
            ], 422);
        }

        // Add user to team
        $invitation->team->addMember($user, $invitation->role);
        
        // Delete invitation
        $invitation->delete();

        $invitation->team->load(['owner', 'members.user', 'courses', 'projects']);

        return response()->json([
            'success' => true,
            'message' => __('تم الانضمام إلى الفريق بنجاح.'),
            'data' => new TeamResource($invitation->team),
        ]);
    }

    public function cancelInvitation(Request $request, Team $team, int $invitationId): JsonResponse
    {
        $team = $this->loadTeamForUser($request, $team);
        $user = $request->user();

        abort_unless($team->canManageMembers($user), 403, __('لا تملك صلاحية إلغاء الدعوات.'));

        $invitation = TeamInvitation::where('team_id', $team->id)
            ->where('id', $invitationId)
            ->firstOrFail();

        $invitation->delete();

        $team->load(['owner', 'members.user', 'courses', 'projects']);

        return response()->json([
            'success' => true,
            'message' => __('تم إلغاء الدعوة بنجاح.'),
            'data' => new TeamResource($team),
        ]);
    }

    public function pendingInvitations(Request $request): JsonResponse
    {
        $user = $request->user();

        $invitations = TeamInvitation::where('email', $user->email)
            ->where('expires_at', '>', now())
            ->with('team')
            ->get()
            ->map(function ($invitation) {
                return [
                    'id' => $invitation->id,
                    'team_id' => $invitation->team_id,
                    'team_name' => $invitation->team->name,
                    'team_description' => $invitation->team->description,
                    'role' => $invitation->role,
                    'created_at' => $invitation->created_at->toISOString(),
                    'expires_at' => $invitation->expires_at->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $invitations,
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
