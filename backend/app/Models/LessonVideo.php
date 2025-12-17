<?php

namespace App\Models;

use App\Models\Concerns\HasUserOwnership;
use App\Events\UserUsageShouldUpdate;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class LessonVideo extends Model
{
    use HasUserOwnership;

    protected $fillable = [
        'user_id',
        'lesson_id',
        'file_name',
        'file_path',
        'audio_path',
        'file_size',
        'duration',
        'mime_type',
        'thumbnail_path',
        'source_url',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'duration' => 'integer',
    ];

    protected $appends = ['video_url', 'proxy_video_url', 'audio_url', 'thumbnail_url', 'formatted_size', 'formatted_duration'];

    /**
     * Get the lesson that owns the video.
     */
    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all subtitles for this video.
     */
    public function subtitles()
    {
        return $this->hasMany(LessonSubtitle::class);
    }

    /**
     * Get the full URL for the video.
     */
    public function getVideoUrlAttribute()
    {
        if (!$this->file_path) {
            return null;
        }

        $disk = config('filesystems.default');

        // For S3, generate temporary signed URL (valid for 2 hours)
        if ($disk === 's3') {
            try {
                return Storage::disk('s3')->temporaryUrl(
                    $this->file_path,
                    now()->addHours(2)
                );
            } catch (\Exception $e) {
                \Log::error('Failed to generate S3 signed URL for video', [
                    'file_path' => $this->file_path,
                    'error' => $e->getMessage()
                ]);
                return null;
            }
        }

        // For local storage, use standard URL
        return Storage::disk($disk)->url($this->file_path);
    }

    /**
     * Get the proxy URL for the video (with CORS support).
     * Use this for video players that need CORS headers.
     */
    public function getProxyVideoUrlAttribute()
    {
        if (!$this->lesson_id) {
            return null;
        }

        // Use Laravel proxy endpoint for better CORS handling
        return url("/api/media/video/{$this->lesson_id}");
    }

    /**
     * Get the full URL for the thumbnail.
     */
    public function getThumbnailUrlAttribute()
    {
        if (!$this->thumbnail_path) {
            return null;
        }

        $disk = config('filesystems.default');

        // For S3, generate temporary signed URL (valid for 24 hours)
        if ($disk === 's3') {
            try {
                return Storage::disk('s3')->temporaryUrl(
                    $this->thumbnail_path,
                    now()->addHours(24)
                );
            } catch (\Exception $e) {
                \Log::error('Failed to generate S3 signed URL for thumbnail', [
                    'file_path' => $this->thumbnail_path,
                    'error' => $e->getMessage()
                ]);
                return null;
            }
        }

        // For local storage, use standard URL
        return Storage::disk($disk)->url($this->thumbnail_path);
    }

    /**
     * Get the full URL for the audio file.
     */
    public function getAudioUrlAttribute()
    {
        if (!$this->audio_path) {
            return null;
        }

        $disk = config('filesystems.default');

        // For S3, generate temporary signed URL (valid for 2 hours)
        if ($disk === 's3') {
            try {
                return Storage::disk('s3')->temporaryUrl(
                    $this->audio_path,
                    now()->addHours(2)
                );
            } catch (\Exception $e) {
                \Log::error('Failed to generate S3 signed URL for audio', [
                    'file_path' => $this->audio_path,
                    'error' => $e->getMessage()
                ]);
                return null;
            }
        }

        // For local storage, use standard URL
        return Storage::disk($disk)->url($this->audio_path);
    }

    /**
     * Get formatted file size (MB, GB, etc).
     */
    public function getFormattedSizeAttribute()
    {
        $bytes = $this->file_size;

        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' bytes';
        }
    }

    /**
     * Get formatted duration (HH:MM:SS or MM:SS).
     */
    public function getFormattedDurationAttribute()
    {
        if (!$this->duration) {
            return null;
        }

        $seconds = $this->duration;
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $seconds = $seconds % 60;

        if ($hours > 0) {
            return sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds);
        } else {
            return sprintf('%02d:%02d', $minutes, $seconds);
        }
    }

    /**
     * Delete video file when model is deleted.
     */
    protected static function boot()
    {
        parent::boot();

        static::created(function (LessonVideo $video): void {
            if ($video->user_id) {
                event(new UserUsageShouldUpdate($video->user_id));
            }
        });

        static::deleting(function ($video) {
            $disk = config('filesystems.default');

            // Delete video file
            if ($video->file_path && Storage::disk($disk)->exists($video->file_path)) {
                Storage::disk($disk)->delete($video->file_path);
            }

            // Delete thumbnail
            if ($video->thumbnail_path && Storage::disk($disk)->exists($video->thumbnail_path)) {
                Storage::disk($disk)->delete($video->thumbnail_path);
            }

            // Delete all subtitles (cascade will handle database, but we need to delete files)
            $video->subtitles->each(function ($subtitle) {
                $subtitle->delete();
            });

            if ($video->user_id) {
                event(new UserUsageShouldUpdate($video->user_id));
            }
        });
    }
}
