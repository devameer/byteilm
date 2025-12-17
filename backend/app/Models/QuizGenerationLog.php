<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class QuizGenerationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_id',
        'quiz_id',
        'user_id',
        'status',
        'ai_model',
        'video_transcript',
        'questions_generated',
        'ai_response',
        'error_message',
        'processing_time_seconds'
    ];

    protected $casts = [
        'ai_response' => 'array',
        'questions_generated' => 'integer',
        'processing_time_seconds' => 'integer'
    ];

    /**
     * Get the lesson
     */
    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Get the quiz
     */
    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    /**
     * Get the user who triggered generation
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: By status
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Recent logs
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}
