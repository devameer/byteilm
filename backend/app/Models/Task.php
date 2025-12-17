<?php

namespace App\Models;

use App\Models\Concerns\HasUserOwnership;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasUserOwnership;

    protected $fillable = [
        'user_id',
        'title',
        'is_lesson',
        'description',
        'project_id',
        'lesson_id',
        'course_id',
        'status',
        'priority',
        'scheduled_date',
        'due_date',
        'completed_at',
        'type',
        'estimated_duration',
        'actual_duration',
        'link',
        'tags',
        'order'
    ];

    protected $casts = [
        'is_lesson' => 'boolean',
        'scheduled_date' => 'date',
        'due_date' => 'date',
        'completed_at' => 'datetime',
        'tags' => 'array',
        'estimated_duration' => 'integer',
        'actual_duration' => 'integer',
    ];

    /**
     * Get the project this task belongs to
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get subtasks for this task
     */
    public function subtasks()
    {
        return $this->hasMany(Subtask::class)->orderBy('order');
    }

    /**
     * Get the lesson this task is related to
     */
    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Get the course this task is related to
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark task as completed
     */
    public function markAsCompleted()
    {
        $this->status = 'completed';
        $this->completed_at = now();
        $this->save();

        // Update project progress if task belongs to a project
        if ($this->project) {
            $this->project->updateProgress();
        }

        // If this is a lesson task, mark the lesson as completed
        if ($this->is_lesson && $this->lesson_id && $this->lesson) {
            $this->lesson->update(['completed' => true]);
        }

        return $this;
    }

    /**
     * Mark task as not completed
     */
    public function markAsNotCompleted()
    {
        $this->status = 'pending';
        $this->completed_at = null;
        $this->save();

        // Update project progress if task belongs to a project
        if ($this->project) {
            $this->project->updateProgress();
        }

        // If this is a lesson task, mark the lesson as not completed
        if ($this->is_lesson && $this->lesson_id && $this->lesson) {
            $this->lesson->update(['completed' => false]);
        }

        return $this;
    }

    /**
     * Start task (set to in_progress)
     */
    public function start()
    {
        $this->status = 'in_progress';
        $this->save();

        return $this;
    }

    /**
     * Check if task is overdue
     */
    public function isOverdue()
    {
        return $this->due_date && $this->due_date->isPast() && $this->status !== 'completed';
    }

    /**
     * Check if task is standalone (not related to project, lesson, or course)
     */
    public function isStandalone()
    {
        return !$this->project_id && !$this->lesson_id && !$this->course_id;
    }

    /**
     * Get task source (project, lesson, course, or standalone)
     */
    public function getSourceAttribute()
    {
        if ($this->project_id) {
            return 'project';
        } elseif ($this->lesson_id) {
            return 'lesson';
        } elseif ($this->course_id) {
            return 'course';
        }

        return 'standalone';
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
     * Scope for pending tasks
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for in progress tasks
     */
    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    /**
     * Scope for completed tasks
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for today's tasks
     */
    public function scopeToday($query)
    {
        return $query->whereDate('scheduled_date', today());
    }

    /**
     * Scope for tomorrow's tasks
     */
    public function scopeTomorrow($query)
    {
        return $query->whereDate('scheduled_date', today()->addDay());
    }

    /**
     * Scope for standalone tasks
     */
    public function scopeStandalone($query)
    {
        return $query->whereNull('project_id')
                     ->whereNull('lesson_id')
                     ->whereNull('course_id');
    }

    /**
     * Scope for tasks with due dates
     */
    public function scopeWithDueDate($query)
    {
        return $query->whereNotNull('due_date');
    }

    /**
     * Scope for overdue tasks
     */
    public function scopeOverdue($query)
    {
        return $query->whereNotNull('due_date')
                     ->where('due_date', '<', now())
                     ->where('status', '!=', 'completed');
    }

    /**
     * Scope for lessons only
     */
    public function scopeLessons($query)
    {
        return $query->where('is_lesson', true);
    }

    /**
     * Scope for regular tasks only (not lessons)
     */
    public function scopeRegularTasks($query)
    {
        return $query->where('is_lesson', false);
    }

    /**
     * Check if this is a lesson
     */
    public function isLesson()
    {
        return $this->is_lesson;
    }

    /**
     * Get display name (for unified interface)
     */
    public function getDisplayNameAttribute()
    {
        return $this->title;
    }

    /**
     * Get type icon
     */
    public function getTypeIconAttribute()
    {
        if ($this->is_lesson) {
            return match(strtolower($this->type ?? '')) {
                'video' => '🎥',
                'reading' => '📖',
                'quiz' => '📝',
                'practice' => '💻',
                'project' => '🚀',
                default => '📚'
            };
        }

        return '✅';
    }

    /**
     * Get file attachments for this task
     */
    public function attachments()
    {
        return $this->morphMany(FileAttachment::class, 'attachable');
    }

    /**
     * Get comments for this task
     */
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable')->whereNull('parent_id')->orderBy('created_at');
    }
}
