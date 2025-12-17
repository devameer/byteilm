<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TeamApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $teams = Team::query()
            ->where(function ($query) use ($user) {
                $query->where('owner_id', $user->id)
                    ->orWhereHas('members', function ($memberQuery) use ($user) {
                        $memberQuery->where('user_id', $user->id);
                    });
            })
            ->with(['owner', 'members.user'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => TeamResource::collection($teams)->resolve(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $team = DB::transaction(function () use ($validated, $user) {
            $team = Team::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'owner_id' => $user->id,
            ]);

            $team->addMember($user, TeamMember::ROLE_OWNER);

            return $team->load(['owner', 'members.user']);
        });

        return response()->json([
            'success' => true,
            'message' => __('تم إنشاء الفريق بنجاح.'),
            'data' => new TeamResource($team),
        ], 201);
    }

    public function show(Request $request, Team $team): JsonResponse
    {
        $team = $this->loadTeamForUser($request, $team, ['owner', 'members.user', 'courses', 'projects']);

        return response()->json([
            'success' => true,
            'data' => new TeamResource($team),
        ]);
    }

    public function update(Request $request, Team $team): JsonResponse
    {
        $team = $this->loadTeamForUser($request, $team, ['owner', 'members.user']);

        $user = $request->user();
        abort_unless($team->canManageTeam($user), 403, __('لا تملك صلاحية إدارة هذا الفريق.'));

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'new_owner_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
        ]);

        $team->fill([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);
        $team->save();

        if (!empty($validated['new_owner_id']) && $validated['new_owner_id'] !== $team->owner_id) {
            $newOwner = User::find($validated['new_owner_id']);
            if (!$newOwner || !$team->hasMember($newOwner)) {
                return response()->json([
                    'success' => false,
                    'message' => __('يجب أن يكون المالك الجديد عضواً في الفريق قبل نقل الملكية.'),
                ], 422);
            }

            $team->setOwner($newOwner);
        }

        $team->load(['owner', 'members.user']);

        return response()->json([
            'success' => true,
            'message' => __('تم تحديث بيانات الفريق.'),
            'data' => new TeamResource($team),
        ]);
    }

    public function destroy(Request $request, Team $team): JsonResponse
    {
        $team = $this->loadTeamForUser($request, $team);

        abort_unless($team->canManageTeam($request->user()), 403, __('لا تملك صلاحية حذف هذا الفريق.'));

        $team->delete();

        return response()->json([
            'success' => true,
            'message' => __('تم حذف الفريق بنجاح.'),
        ]);
    }

    private function loadTeamForUser(Request $request, Team $team, array $relations = []): Team
    {
        $user = $request->user();

        $team->loadMissing(array_merge(['members.user', 'owner'], $relations));

        abort_unless($team->hasMember($user) || $team->owner_id === $user->id, 404);

        return $team;
    }
}
