<?php

namespace App\Models;

use App\Models\Concerns\HasUserOwnership;
use App\Events\UserUsageShouldUpdate;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasUserOwnership;

    protected $fillable = ['user_id', 'name', 'image', 'link', 'category_id', 'completed', 'progress', 'completed_at', 'active'];

    protected $casts = [
        'completed' => 'boolean',
        'progress' => 'float',
        'completed_at' => 'datetime',
        'active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class);
    }

    /**
     * Owning user.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function teams()
    {
        return $this->belongsToMany(Team::class, 'course_team')->withTimestamps();
    }

    /**
     * Get the lesson categories for the course.
     */
    public function lessonCategories()
    {
        return $this->hasMany(LessonCategory::class);
    }

    protected static function booted(): void
    {
        static::created(function (Course $course): void {
            if ($course->user_id) {
                event(new UserUsageShouldUpdate($course->user_id));
            }
        });

        static::deleted(function (Course $course): void {
            if ($course->user_id) {
                event(new UserUsageShouldUpdate($course->user_id));
            }
        });
    }

    /**
     * Scope a query to only include active courses
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Update the completion status and progress of the course
     */
    public function updateCompletionStatus()
    {
        $totalLessons = $this->lessons()->count();

        if ($totalLessons === 0) {
            $this->progress = 0;
            $this->completed = false;
            $this->completed_at = null;
        } else {
            $completedLessons = $this->lessons()->where('completed', true)->count();
            $this->progress = ($completedLessons / $totalLessons) * 100;

            // If all lessons are completed, mark the course as completed
            if ($completedLessons === $totalLessons) {
                $this->completed = true;
                // Only set completed_at if it's not already set
                if (!$this->completed_at) {
                    $this->completed_at = now();
                }
            } else {
                $this->completed = false;
                $this->completed_at = null;
            }
        }

        $this->save();

        // Update the category progress
        if ($this->category) {
            $this->category->updateProgress();
        }

        return $this;
    }
}
