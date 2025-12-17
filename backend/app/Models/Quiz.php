<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Quiz extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'lesson_id',
        'title',
        'description',
        'duration_minutes',
        'passing_score',
        'max_attempts',
        'randomize_questions',
        'show_correct_answers',
        'is_active',
        'difficulty',
        'metadata'
    ];

    protected $casts = [
        'randomize_questions' => 'boolean',
        'show_correct_answers' => 'boolean',
        'is_active' => 'boolean',
        'metadata' => 'array',
        'duration_minutes' => 'integer',
        'passing_score' => 'integer',
        'max_attempts' => 'integer'
    ];

    /**
     * Get the lesson that owns the quiz
     */
    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Get the questions for the quiz
     */
    public function questions()
    {
        return $this->hasMany(QuizQuestion::class);
    }

    /**
     * Get all attempts for this quiz
     */
    public function attempts()
    {
        return $this->hasMany(QuizAttempt::class);
    }

    /**
     * Get generation logs
     */
    public function generationLogs()
    {
        return $this->hasMany(QuizGenerationLog::class);
    }

    /**
     * Get user's attempts for this quiz
     */
    public function userAttempts($userId)
    {
        return $this->attempts()->where('user_id', $userId);
    }

    /**
     * Get user's best attempt
     */
    public function getBestAttempt($userId)
    {
        return $this->userAttempts($userId)
            ->where('status', 'completed')
            ->orderBy('score', 'desc')
            ->first();
    }

    /**
     * Get user's latest attempt
     */
    public function getLatestAttempt($userId)
    {
        return $this->userAttempts($userId)
            ->latest()
            ->first();
    }

    /**
     * Check if user can take the quiz
     */
    public function canUserTakeQuiz($userId)
    {
        $attemptsCount = $this->userAttempts($userId)
            ->where('status', 'completed')
            ->count();

        return $attemptsCount < $this->max_attempts;
    }

    /**
     * Get remaining attempts for user
     */
    public function getRemainingAttempts($userId)
    {
        $attemptsCount = $this->userAttempts($userId)
            ->where('status', 'completed')
            ->count();

        return max(0, $this->max_attempts - $attemptsCount);
    }

    /**
     * Check if user passed the quiz
     */
    public function hasUserPassed($userId)
    {
        return $this->userAttempts($userId)
            ->where('status', 'completed')
            ->where('passed', true)
            ->exists();
    }

    /**
     * Get total points for the quiz
     */
    public function getTotalPointsAttribute()
    {
        return $this->questions()->sum('points');
    }

    /**
     * Get average score
     */
    public function getAverageScoreAttribute()
    {
        return $this->attempts()
            ->where('status', 'completed')
            ->avg('score') ?? 0;
    }

    /**
     * Get completion rate
     */
    public function getCompletionRateAttribute()
    {
        $total = $this->attempts()->count();
        if ($total === 0) return 0;

        $completed = $this->attempts()->where('status', 'completed')->count();
        return round(($completed / $total) * 100, 2);
    }

    /**
     * Get pass rate
     */
    public function getPassRateAttribute()
    {
        $completed = $this->attempts()->where('status', 'completed')->count();
        if ($completed === 0) return 0;

        $passed = $this->attempts()
            ->where('status', 'completed')
            ->where('passed', true)
            ->count();

        return round(($passed / $completed) * 100, 2);
    }

    /**
     * Scope: Active quizzes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: By difficulty
     */
    public function scopeDifficulty($query, $difficulty)
    {
        return $query->where('difficulty', $difficulty);
    }

    /**
     * Scope: For lesson
     */
    public function scopeForLesson($query, $lessonId)
    {
        return $query->where('lesson_id', $lessonId);
    }
}
