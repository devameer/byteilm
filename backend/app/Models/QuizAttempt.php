<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class QuizAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'user_id',
        'attempt_number',
        'status',
        'started_at',
        'completed_at',
        'score',
        'total_points',
        'earned_points',
        'passed',
        'time_spent_seconds',
        'answers'
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'passed' => 'boolean',
        'answers' => 'array',
        'score' => 'integer',
        'total_points' => 'integer',
        'earned_points' => 'integer',
        'time_spent_seconds' => 'integer',
        'attempt_number' => 'integer'
    ];

    /**
     * Get the quiz
     */
    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    /**
     * Get the user
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get individual answers
     */
    public function quizAnswers()
    {
        return $this->hasMany(QuizAnswer::class);
    }

    /**
     * Calculate score
     */
    public function calculateScore()
    {
        $totalPoints = $this->quiz->total_points;
        $earnedPoints = $this->quizAnswers()->sum('points_earned');

        $this->total_points = $totalPoints;
        $this->earned_points = $earnedPoints;
        $this->score = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100) : 0;
        $this->passed = $this->score >= $this->quiz->passing_score;

        $this->save();

        return $this->score;
    }

    /**
     * Complete the attempt
     */
    public function complete()
    {
        $this->status = 'completed';
        $this->completed_at = now();
        $this->time_spent_seconds = now()->diffInSeconds($this->started_at);

        $this->calculateScore();

        return $this;
    }

    /**
     * Check if attempt is expired
     */
    public function isExpired()
    {
        if ($this->status !== 'in_progress') {
            return false;
        }

        $durationMinutes = $this->quiz->duration_minutes;
        $expiryTime = $this->started_at->addMinutes($durationMinutes);

        return now()->isAfter($expiryTime);
    }

    /**
     * Get remaining time in seconds
     */
    public function getRemainingTimeAttribute()
    {
        if ($this->status !== 'in_progress') {
            return 0;
        }

        $durationMinutes = $this->quiz->duration_minutes;
        $expiryTime = $this->started_at->addMinutes($durationMinutes);

        return max(0, now()->diffInSeconds($expiryTime, false));
    }

    /**
     * Get time spent formatted
     */
    public function getFormattedTimeSpentAttribute()
    {
        if (!$this->time_spent_seconds) {
            return '0:00';
        }

        $minutes = floor($this->time_spent_seconds / 60);
        $seconds = $this->time_spent_seconds % 60;

        return sprintf('%d:%02d', $minutes, $seconds);
    }

    /**
     * Get grade letter
     */
    public function getGradeAttribute()
    {
        if (!$this->score) {
            return 'F';
        }

        if ($this->score >= 90) return 'A';
        if ($this->score >= 80) return 'B';
        if ($this->score >= 70) return 'C';
        if ($this->score >= 60) return 'D';
        return 'F';
    }

    /**
     * Scope: Completed attempts
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope: Passed attempts
     */
    public function scopePassed($query)
    {
        return $query->where('passed', true);
    }

    /**
     * Scope: For user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
