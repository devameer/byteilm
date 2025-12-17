<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VideoAnalysis extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_id',
        'analyzed_by',
        'status',
        'main_topics',
        'chapters',
        'keywords',
        'summary',
        'notes',
        'detected_language',
        'transcript',
        'duration_seconds',
        'video_url',
        'error_message',
        'started_at',
        'completed_at'
    ];

    protected $casts = [
        'main_topics' => 'array',
        'chapters' => 'array',
        'keywords' => 'array',
        'transcript' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime'
    ];

    /**
     * Get the lesson this analysis belongs to
     */
    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Get the user who initiated the analysis
     */
    public function analyzer()
    {
        return $this->belongsTo(User::class, 'analyzed_by');
    }

    /**
     * Mark as processing
     */
    public function markAsProcessing()
    {
        $this->update([
            'status' => 'processing',
            'started_at' => now()
        ]);
    }

    /**
     * Mark as completed
     */
    public function markAsCompleted(array $results)
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
            ...$results
        ]);
    }

    /**
     * Mark as failed
     */
    public function markAsFailed($errorMessage)
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
            'completed_at' => now()
        ]);
    }

    /**
     * Check if analysis is complete
     */
    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    /**
     * Check if analysis failed
     */
    public function hasFailed()
    {
        return $this->status === 'failed';
    }

    /**
     * Scope: Completed analyses
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope: Pending analyses
     */
    public function scopePending($query)
    {
        return $query->whereIn('status', ['pending', 'processing']);
    }
}
