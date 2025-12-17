<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TranscriptionJob extends Model
{
    protected $fillable = [
        'lesson_id',
        'user_id',
        'status',
        'transcript',
        'error_message',
        'progress',
        'current_step',
    ];

    protected $casts = [
        'progress' => 'integer',
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    /**
     * Get the lesson that owns this transcription job.
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Get the user who created this job.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Update job progress.
     */
    public function updateProgress(int $progress, ?string $step = null): void
    {
        $this->update([
            'progress' => min(100, max(0, $progress)),
            'current_step' => $step ?? $this->current_step,
        ]);
    }

    /**
     * Mark job as completed.
     */
    public function markCompleted(string $transcript): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'transcript' => $transcript,
            'progress' => 100,
            'current_step' => 'completed',
        ]);
    }

    /**
     * Mark job as failed.
     */
    public function markFailed(string $error): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_message' => $error,
            'current_step' => 'failed',
        ]);
    }
}
