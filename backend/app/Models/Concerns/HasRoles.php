<?php

namespace App\Models\Concerns;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;

trait HasRoles
{
    /**
     * Roles relationship.
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_has_roles');
    }

    /**
     * Determine if the user has a given role.
     *
     * @param  string|array|\App\Models\Role  $roles
     */
    public function hasRole($roles): bool
    {
        $this->loadMissing('roles');

        if (is_string($roles)) {
            return $this->roles->contains(fn (Role $role) => $role->name === $roles);
        }

        if ($roles instanceof Role) {
            return $this->roles->contains('id', $roles->getKey());
        }

        if (is_array($roles)) {
            foreach ($roles as $role) {
                if ($this->hasRole($role)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Determine if the user has a given permission through a role.
     *
     * @param  string|\App\Models\Permission  $permission
     */
    public function hasPermission($permission): bool
    {
        $this->loadMissing('roles.permissions');

        if (is_string($permission)) {
            return $this->roles->contains(function (Role $role) use ($permission) {
                return $role->permissions->contains('name', $permission);
            });
        }

        if ($permission instanceof Permission) {
            return $this->roles->contains(function (Role $role) use ($permission) {
                return $role->permissions->contains('id', $permission->getKey());
            });
        }

        return false;
    }

    /**
     * Assign a role to the user.
     *
     * @param  string|\App\Models\Role  $role
     */
    public function assignRole($role): self
    {
        $roleModel = $role instanceof Role
            ? $role
            : Role::where('name', $role)->firstOrFail();

        $this->roles()->syncWithoutDetaching([$roleModel->getKey()]);

        $this->unsetRelation('roles');

        return $this;
    }

    /**
     * Remove a role from the user.
     *
     * @param  string|\App\Models\Role  $role
     */
    public function removeRole($role): self
    {
        $roleModel = $role instanceof Role
            ? $role
            : Role::where('name', $role)->first();

        if ($roleModel) {
            $this->roles()->detach($roleModel->getKey());
            $this->unsetRelation('roles');
        }

        return $this;
    }

    /**
     * Sync the user's roles.
     *
     * @param  array<int, string|\App\Models\Role>  $roles
     */
    public function syncRoles(array $roles): self
    {
        $roleIds = collect($roles)->map(function ($role) {
            return $role instanceof Role
                ? $role->getKey()
                : Role::where('name', $role)->value('id');
        })->filter()->all();

        $this->roles()->sync($roleIds);

        $this->unsetRelation('roles');

        return $this;
    }

    /**
     * Get all permissions through assigned roles.
     */
    public function allPermissions(): Collection
    {
        $this->loadMissing('roles.permissions');

        return $this->roles
            ->flatMap(fn (Role $role) => $role->permissions)
            ->unique('id')
            ->values();
    }
}
