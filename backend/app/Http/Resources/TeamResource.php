<?php

namespace App\Http\Resources;

use App\Models\TeamMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();

        $members = $this->relationLoaded('members') ? $this->members : collect();
        $currentMember = $user ? $members->firstWhere('user_id', $user->id) : null;

        $currentRole = $currentMember?->role;
        if (!$currentRole && $user && $this->owner_id === $user->id) {
            $currentRole = TeamMember::ROLE_OWNER;
        }

        $permissions = [
            'manage_team' => $user ? $this->resource->canManageTeam($user) : false,
            'manage_members' => $user ? $this->resource->canManageMembers($user) : false,
            'manage_resources' => $user ? $this->resource->canManageResources($user) : false,
        ];

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'owner' => $this->whenLoaded('owner', function () {
                return [
                    'id' => $this->owner?->id,
                    'name' => $this->owner?->name,
                    'email' => $this->owner?->email,
                ];
            }),
            'current_role' => $currentRole,
            'permissions' => $permissions,
            'members' => $this->when(
                $this->relationLoaded('members'),
                TeamMemberResource::collection($this->members)
            ),
            'courses' => $this->when(
                $this->relationLoaded('courses'),
                $this->courses->map(fn ($course) => [
                    'id' => $course->id,
                    'name' => $course->name,
                    'active' => isset($course->active) ? (bool) $course->active : null,
                ])
            ),
            'projects' => $this->when(
                $this->relationLoaded('projects'),
                $this->projects->map(fn ($project) => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'status' => $project->status,
                ])
            ),
            'created_at' => optional($this->created_at)->toDateTimeString(),
            'updated_at' => optional($this->updated_at)->toDateTimeString(),
        ];
    }
}
