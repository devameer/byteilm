<?php

namespace App\Models;

use App\Models\Concerns\HasUserOwnership;
use App\Events\UserUsageShouldUpdate;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use HasUserOwnership;

    protected $fillable = ['user_id', 'name', 'description', 'summary', 'type', 'link', 'duration', 'course_id', 'completed', 'completed_at', 'scheduled_date', 'lesson_category_id', 'order'];

    protected $casts = [
        'completed' => 'boolean',
        'completed_at' => 'datetime',
        'scheduled_date' => 'date',
    ];

    protected $appends = ['has_task'];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the category of the lesson.
     */
    public function category()
    {
        return $this->belongsTo(LessonCategory::class, 'lesson_category_id');
    }

    /**
     * Get the linked task representation if it exists.
     */
    public function task()
    {
        return $this->hasOne(Task::class);
    }

    /**
     * Get the video associated with this lesson.
     */
    public function video()
    {
        return $this->hasOne(LessonVideo::class);
    }

    protected static function booted(): void
    {
        static::created(function (Lesson $lesson): void {
            if ($lesson->user_id) {
                event(new UserUsageShouldUpdate($lesson->user_id));
            }
        });

        static::deleted(function (Lesson $lesson): void {
            if ($lesson->user_id) {
                event(new UserUsageShouldUpdate($lesson->user_id));
            }
        });
    }

    /**
     * Check if this lesson has a pending or in-progress task
     */
    public function getHasTaskAttribute()
    {
        // Use relationship if loaded, otherwise query
        if ($this->relationLoaded('task')) {
            return $this->task !== null &&
                   in_array($this->task->status, ['pending', 'in_progress']);
        }

        return Task::where('lesson_id', $this->id)
            ->where('is_lesson', true)
            ->whereIn('status', ['pending', 'in_progress'])
            ->exists();
    }

    /**
     * Mark the lesson as completed
     */
    public function markAsCompleted()
    {
        $this->completed = true;
        $this->completed_at = now();
        $this->save();

        // Check if all lessons in the course are completed
        $this->course->updateCompletionStatus();

        // Update user streaks and award badges
        $this->updateUserStreaksAndBadges();

        return $this;
    }

    /**
     * Update user streaks and award badges on lesson completion
     */
    protected function updateUserStreaksAndBadges()
    {
        $user = auth()->user();
        if (!$user) {
            return;
        }

        // Get or create user streak
        $streak = $user->getOrCreateStreak();
        $oldStreak = $streak->current_streak;

        // Update the streak
        $streak->updateStreak();
        $newStreak = $streak->current_streak;

        // Count total completed lessons
        $totalCompletedLessons = Lesson::where('completed', true)->count();

        // Award badges based on achievements
        $this->awardBadgesForCompletion($user, $totalCompletedLessons, $newStreak, $oldStreak);
    }

    /**
     * Award appropriate badges based on user achievements
     */
    protected function awardBadgesForCompletion($user, $totalLessons, $currentStreak, $previousStreak)
    {
        // First lesson badge
        if ($totalLessons === 1) {
            UserBadge::awardBadge($user->id, 'first_lesson');
        }

        // Lesson count badges
        if ($totalLessons === 10) {
            UserBadge::awardBadge($user->id, 'lessons_10');
        } elseif ($totalLessons === 50) {
            UserBadge::awardBadge($user->id, 'lessons_50');
        } elseif ($totalLessons === 100) {
            UserBadge::awardBadge($user->id, 'lessons_100');
        }

        // Streak badges (only award when streak is reached, not every time)
        if ($currentStreak === 3 && $previousStreak < 3) {
            UserBadge::awardBadge($user->id, 'streak_3');
        } elseif ($currentStreak === 7 && $previousStreak < 7) {
            UserBadge::awardBadge($user->id, 'streak_7');
        } elseif ($currentStreak === 30 && $previousStreak < 30) {
            UserBadge::awardBadge($user->id, 'streak_30');
        } elseif ($currentStreak === 100 && $previousStreak < 100) {
            UserBadge::awardBadge($user->id, 'streak_100');
        }

        // Course completion badge
        if ($this->course->completed) {
            UserBadge::awardBadge($user->id, 'course_complete');
        }
    }

    /**
     * Mark the lesson as not completed
     */
    public function markAsNotCompleted()
    {
        $this->completed = false;
        $this->completed_at = null;
        $this->save();

        // Update course completion status
        $this->course->updateCompletionStatus();

        return $this;
    }
}
