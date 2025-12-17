<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Goal extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'team_id',
        'title',
        'description',
        'type',
        'category',
        'metric_type',
        'target_value',
        'current_value',
        'start_date',
        'end_date',
        'status',
        'completed_at',
        'reward_points',
        'reward_badge',
        'reward_description',
        'reminders_enabled',
        'reminder_frequency',
        'last_reminder_at',
        'milestones',
        'visibility'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'completed_at' => 'datetime',
        'last_reminder_at' => 'datetime',
        'milestones' => 'array',
        'reminders_enabled' => 'boolean',
        'target_value' => 'integer',
        'current_value' => 'integer',
        'reward_points' => 'integer'
    ];

    protected $appends = [
        'progress_percentage',
        'days_remaining',
        'is_overdue',
        'time_elapsed_percentage'
    ];

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function progress()
    {
        return $this->hasMany(GoalProgress::class);
    }

    public function collaborators()
    {
        return $this->hasMany(GoalCollaborator::class);
    }

    /**
     * Computed attributes
     */
    public function getProgressPercentageAttribute()
    {
        if ($this->target_value == 0) {
            return 0;
        }

        return round(($this->current_value / $this->target_value) * 100, 2);
    }

    public function getDaysRemainingAttribute()
    {
        if ($this->status === 'completed' || $this->status === 'cancelled') {
            return 0;
        }

        $now = Carbon::now();
        $endDate = Carbon::parse($this->end_date);

        if ($now->gt($endDate)) {
            return 0;
        }

        return $now->diffInDays($endDate);
    }

    public function getIsOverdueAttribute()
    {
        if ($this->status === 'completed' || $this->status === 'cancelled') {
            return false;
        }

        return Carbon::now()->gt(Carbon::parse($this->end_date));
    }

    public function getTimeElapsedPercentageAttribute()
    {
        $start = Carbon::parse($this->start_date);
        $end = Carbon::parse($this->end_date);
        $now = Carbon::now();

        if ($now->lt($start)) {
            return 0;
        }

        if ($now->gt($end)) {
            return 100;
        }

        $totalDays = $start->diffInDays($end);
        $elapsedDays = $start->diffInDays($now);

        return $totalDays > 0 ? round(($elapsedDays / $totalDays) * 100, 2) : 0;
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePersonal($query)
    {
        return $query->where('type', 'personal');
    }

    public function scopeTeam($query)
    {
        return $query->where('type', 'team');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId)
            ->orWhereHas('collaborators', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            });
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'active')
            ->where('end_date', '<', Carbon::now());
    }

    /**
     * Methods
     */
    public function updateProgress($value, $note = null)
    {
        $this->current_value = $value;

        // Check if goal is completed
        if ($this->current_value >= $this->target_value && $this->status === 'active') {
            $this->status = 'completed';
            $this->completed_at = now();
        }

        $this->save();

        // Record progress
        $this->progress()->create([
            'value' => $value,
            'note' => $note,
            'recorded_at' => now()
        ]);

        return $this;
    }

    public function incrementProgress($amount = 1, $note = null)
    {
        return $this->updateProgress($this->current_value + $amount, $note);
    }

    public function checkMilestones()
    {
        if (!$this->milestones) {
            return [];
        }

        $reached = [];
        $percentage = $this->progress_percentage;

        foreach ($this->milestones as $milestone) {
            if ($percentage >= $milestone && !in_array($milestone, $reached)) {
                $reached[] = $milestone;
            }
        }

        return $reached;
    }

    public function needsReminder()
    {
        if (!$this->reminders_enabled || $this->status !== 'active') {
            return false;
        }

        if (!$this->last_reminder_at) {
            return true;
        }

        $lastReminder = Carbon::parse($this->last_reminder_at);
        $now = Carbon::now();

        switch ($this->reminder_frequency) {
            case 'daily':
                return $lastReminder->diffInDays($now) >= 1;
            case 'weekly':
                return $lastReminder->diffInWeeks($now) >= 1;
            case 'milestone':
                // Check if reached new milestone since last reminder
                $milestones = $this->checkMilestones();
                return !empty($milestones);
            default:
                return false;
        }
    }

    public function sendReminder()
    {
        if (!$this->needsReminder()) {
            return false;
        }

        $this->last_reminder_at = now();
        $this->save();

        // Send notification
        $this->user->notify(new \App\Notifications\GoalReminderNotification($this));

        return true;
    }

    public function isOnTrack()
    {
        $progressPercentage = $this->progress_percentage;
        $timeElapsedPercentage = $this->time_elapsed_percentage;

        // On track if progress >= time elapsed - 10% tolerance
        return $progressPercentage >= ($timeElapsedPercentage - 10);
    }

    public function getStatus()
    {
        if ($this->status === 'completed') {
            return 'completed';
        }

        if ($this->is_overdue) {
            return 'overdue';
        }

        if ($this->isOnTrack()) {
            return 'on_track';
        }

        return 'behind';
    }

    public function awardRewards()
    {
        if ($this->status !== 'completed' || !$this->reward_points) {
            return false;
        }

        // Award points to user
        $this->user->increment('points', $this->reward_points);

        // Award badge if specified
        if ($this->reward_badge) {
            $this->user->badges()->create([
                'name' => $this->reward_badge,
                'description' => $this->reward_description,
                'earned_at' => now()
            ]);
        }

        return true;
    }
}
