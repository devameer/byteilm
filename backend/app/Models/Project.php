<?php

namespace App\Models;

use App\Models\Concerns\HasUserOwnership;
use App\Events\UserUsageShouldUpdate;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasUserOwnership;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'status',
        'priority',
        'start_date',
        'due_date',
        'completed_at',
        'progress',
        'color',
        'order'
    ];

    protected $casts = [
        'start_date' => 'date',
        'due_date' => 'date',
        'completed_at' => 'date',
        'progress' => 'integer',
    ];

    /**
     * Get all tasks for this project
     */
    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function teams()
    {
        return $this->belongsToMany(Team::class, 'project_team')->withTimestamps();
    }

    /**
     * Get pending tasks
     */
    public function pendingTasks()
    {
        return $this->hasMany(Task::class)->where('status', 'pending');
    }

    /**
     * Get completed tasks
     */
    public function completedTasks()
    {
        return $this->hasMany(Task::class)->where('status', 'completed');
    }

    /**
     * Calculate project progress based on tasks
     */
    public function updateProgress()
    {
        $totalTasks = $this->tasks()->count();

        if ($totalTasks === 0) {
            $this->progress = 0;
        } else {
            $completedTasks = $this->completedTasks()->count();
            $this->progress = round(($completedTasks / $totalTasks) * 100);
        }

        $this->save();
    }

    /**
     * Mark project as completed
     */
    public function markAsCompleted()
    {
        $this->status = 'completed';
        $this->completed_at = now();
        $this->progress = 100;
        $this->save();

        return $this;
    }

    /**
     * Check if project is overdue
     */
    public function isOverdue()
    {
        return $this->due_date && $this->due_date->isPast() && $this->status !== 'completed';
    }

    /**
     * Get remaining days until due date
     */
    public function getRemainingDaysAttribute()
    {
        if (!$this->due_date) {
            return null;
        }

        return now()->diffInDays($this->due_date, false);
    }

    /**
     * Scope for active projects
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for completed projects
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    protected static function booted(): void
    {
        static::created(function (Project $project): void {
            if ($project->user_id) {
                event(new UserUsageShouldUpdate($project->user_id));
            }
        });

        static::deleted(function (Project $project): void {
            if ($project->user_id) {
                event(new UserUsageShouldUpdate($project->user_id));
            }
        });
    }
}
