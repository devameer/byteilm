<?php

namespace App\Models\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait HasUserOwnership
{
    /**
     * Boot the trait and register event listeners/scopes.
     */
    protected static function bootHasUserOwnership(): void
    {
        static::creating(function ($model) {
            $user = Auth::user();

            if ($user) {
                $model->user_id = $user->getKey();
            }
        });

        static::addGlobalScope('user', function (Builder $builder) {
            if (app()->runningInConsole() && !app()->runningUnitTests()) {
                return;
            }

            $user = Auth::user();

            if (!$user) {
                return;
            }

            if (method_exists($user, 'isAdmin') && $user->isAdmin()) {
                return;
            }

            $builder->where($builder->getModel()->getTable() . '.user_id', $user->getKey());
        });
    }

    /**
     * Scope the query to a specific user.
     */
    public function scopeForUser(Builder $builder, ?int $userId = null): Builder
    {
        $userId ??= Auth::id();

        if (!$userId) {
            return $builder;
        }

        return $builder->withoutGlobalScope('user')
            ->where($builder->getModel()->getTable() . '.user_id', $userId);
    }

    /**
     * Direct relation back to the owning user.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
