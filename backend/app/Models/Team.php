<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** @mixin \Illuminate\Database\Eloquent\Builder */
class Team extends Model
{
    protected $fillable = [
        'owner_id',
        'name',
        'description',
    ];

    /**
     * Team owner.
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Team members with eager-loaded users.
     */
    public function members()
    {
        return $this->hasMany(TeamMember::class)->with('user');
    }

    /**
     * Courses shared with the team.
     */
    public function courses()
    {
        return $this->belongsToMany(Course::class, 'course_team')->withTimestamps();
    }

    /**
     * Projects shared with the team.
     */
    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_team')->withTimestamps();
    }

    /**
     * Tasks shared with the team.
     */
    public function tasks()
    {
        return $this->belongsToMany(Task::class, 'task_team')->withTimestamps();
    }

    /**
     * Get membership record for the given user.
     */
    public function membershipFor(User $user): ?TeamMember
    {
        if (!$user->exists) {
            return null;
        }

        $members = $this->relationLoaded('members')
            ? $this->members
            : $this->members()->get();

        return $members->firstWhere('user_id', $user->id);
    }

    /**
     * Get role for the given user (if any).
     */
    public function roleFor(User $user): ?string
    {
        return $this->membershipFor($user)?->role;
    }

    /**
     * Determine if a user belongs to the team.
     */
    public function hasMember(User $user): bool
    {
        return (bool) $this->membershipFor($user);
    }

    /**
     * Add or update a member within the team.
     */
    public function addMember(User $user, string $role = TeamMember::ROLE_MEMBER): TeamMember
    {
        $member = $this->members()->firstOrNew(['user_id' => $user->id]);

        if (!$member->exists) {
            $member->joined_at = now();
        }

        $member->role = $role;
        $member->save();

        return $member->fresh();
    }

    /**
     * Update member role.
     */
    public function changeMemberRole(User $user, string $role): void
    {
        $this->members()
            ->where('user_id', $user->id)
            ->update(['role' => $role]);
    }

    /**
     * Remove a member from the team.
     */
    public function removeMember(User $user): void
    {
        $this->members()
            ->where('user_id', $user->id)
            ->delete();
    }

    /**
     * Set (or change) the team owner.
     */
    public function setOwner(User $owner): void
    {
        $previousOwnerId = $this->owner_id;

        $this->owner()->associate($owner);
        $this->save();

        $this->addMember($owner, TeamMember::ROLE_OWNER);

        if ($previousOwnerId && $previousOwnerId !== $owner->id) {
            $this->members()
                ->where('user_id', $previousOwnerId)
                ->update(['role' => TeamMember::ROLE_MEMBER]);
        }
    }

    /**
     * Determine if the user can manage the team (owner only).
     */
    public function canManageTeam(User $user): bool
    {
        return $this->roleFor($user) === TeamMember::ROLE_OWNER;
    }

    /**
     * Determine if the user can manage members.
     */
    public function canManageMembers(User $user): bool
    {
        return $this->roleFor($user) === TeamMember::ROLE_OWNER;
    }

    /**
     * Determine if the user can share resources with the team.
     */
    public function canManageResources(User $user): bool
    {
        return in_array($this->roleFor($user), [TeamMember::ROLE_OWNER, TeamMember::ROLE_MEMBER], true);
    }
}
