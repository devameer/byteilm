<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserStreak extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'current_streak',
        'longest_streak',
        'last_activity_date',
        'total_days_active',
    ];

    protected $casts = [
        'last_activity_date' => 'date',
    ];

    /**
     * Get the user that owns the streak.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Update the streak based on a new lesson completion.
     */
    public function updateStreak()
    {
        $today = now()->toDateString();
        $lastActivity = $this->last_activity_date ? $this->last_activity_date->toDateString() : null;

        // If this is the first activity ever
        if (!$lastActivity) {
            $this->current_streak = 1;
            $this->longest_streak = 1;
            $this->total_days_active = 1;
            $this->last_activity_date = $today;
            $this->save();
            return;
        }

        // If already completed something today, don't increment
        if ($lastActivity === $today) {
            return;
        }

        // Check if yesterday
        $yesterday = now()->subDay()->toDateString();
        if ($lastActivity === $yesterday) {
            // Continue the streak
            $this->current_streak++;
            $this->total_days_active++;
        } else {
            // Streak is broken, start over
            $this->current_streak = 1;
            $this->total_days_active++;
        }

        // Update longest streak if current is higher
        if ($this->current_streak > $this->longest_streak) {
            $this->longest_streak = $this->current_streak;
        }

        $this->last_activity_date = $today;
        $this->save();
    }

    /**
     * Check if the streak is at risk (last activity was 1 day ago).
     */
    public function isAtRisk()
    {
        if (!$this->last_activity_date) {
            return false;
        }

        $yesterday = now()->subDay()->toDateString();
        return $this->last_activity_date->toDateString() === $yesterday;
    }

    /**
     * Check if the streak is broken (last activity was more than 1 day ago).
     */
    public function isBroken()
    {
        if (!$this->last_activity_date) {
            return false;
        }

        $yesterday = now()->subDay()->toDateString();
        return $this->last_activity_date->toDateString() < $yesterday;
    }
}
