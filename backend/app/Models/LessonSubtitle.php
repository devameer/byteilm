<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class LessonSubtitle extends Model
{
    protected $fillable = [
        'lesson_video_id',
        'language',
        'language_name',
        'file_name',
        'file_path',
        'file_size',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    protected $appends = ['subtitle_url', 'vtt_url', 'proxy_vtt_url', 'formatted_size'];

    /**
     * Get the video that owns this subtitle.
     */
    public function video()
    {
        return $this->belongsTo(LessonVideo::class, 'lesson_video_id');
    }

    /**
     * Get the full URL for the subtitle file.
     */
    public function getSubtitleUrlAttribute()
    {
        if (!$this->file_path) {
            return null;
        }

        $disk = config('filesystems.default');

        // For S3, generate temporary signed URL (valid for 24 hours)
        if ($disk === 's3') {
            try {
                return Storage::disk('s3')->temporaryUrl(
                    $this->file_path,
                    now()->addHours(24)
                );
            } catch (\Exception $e) {
                \Log::error('Failed to generate S3 signed URL for subtitle', [
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
     * Get the VTT URL for HTML5 video player.
     */
    public function getVttUrlAttribute()
    {
        if (!$this->file_path) {
            return null;
        }

        $disk = config('filesystems.default');

        // For S3, generate temporary signed URL (valid for 24 hours)
        if ($disk === 's3') {
            try {
                return Storage::disk('s3')->temporaryUrl(
                    $this->file_path,
                    now()->addHours(24)
                );
            } catch (\Exception $e) {
                \Log::error('Failed to generate S3 signed URL for VTT', [
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
     * Get the proxy URL for the subtitle (with CORS support).
     * Use this for video players that need CORS headers.
     */
    public function getProxyVttUrlAttribute()
    {
        if (!$this->id) {
            return null;
        }

        // Use Laravel proxy endpoint for better CORS handling
        return url("/api/media/subtitle/{$this->id}");
    }

    /**
     * Get formatted file size (KB, MB).
     */
    public function getFormattedSizeAttribute()
    {
        $bytes = $this->file_size;

        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' bytes';
        }
    }

    /**
     * Get the subtitle content.
     */
    public function getContent()
    {
        $disk = config('filesystems.default');

        if ($this->file_path && Storage::disk($disk)->exists($this->file_path)) {
            return Storage::disk($disk)->get($this->file_path);
        }

        return null;
    }

    /**
     * Delete subtitle file when model is deleted.
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($subtitle) {
            $disk = config('filesystems.default');

            if ($subtitle->file_path && Storage::disk($disk)->exists($subtitle->file_path)) {
                Storage::disk($disk)->delete($subtitle->file_path);
            }
        });
    }
}
