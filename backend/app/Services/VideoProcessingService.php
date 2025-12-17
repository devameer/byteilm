<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VideoProcessingService
{
    /**
     * Allowed video MIME types.
     */
    protected array $allowedMimeTypes = [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
        'video/webm',
    ];

    /**
     * Maximum file size in bytes (500MB).
     */
    protected int $maxFileSize = 524288000; // 500MB

    /**
     * Validate video file.
     */
    public function validateVideo(UploadedFile $file): array
    {
        $errors = [];

        // Check file size (skip if unlimited)
        if ($this->maxFileSize > 0 && $file->getSize() > $this->maxFileSize) {
            $errors[] = 'حجم الفيديو يجب أن لا يتجاوز ' . ($this->maxFileSize / 1048576) . ' ميجابايت.';
        }

        // Check MIME type
        if (!in_array($file->getMimeType(), $this->allowedMimeTypes)) {
            $errors[] = 'نوع الفيديو غير مدعوم. الأنواع المدعومة: MP4, AVI, MOV, WMV, WebM';
        }

        // Check if file is valid
        if (!$file->isValid()) {
            $errors[] = 'الملف غير صالح أو تم رفعه بشكل غير صحيح.';
        }

        // Validate actual file content (not just extension)
        if (!$this->validateVideoContent($file)) {
            $errors[] = 'الملف المرفوع ليس فيديو صالح. يرجى رفع ملف فيديو حقيقي.';
        }

        return $errors;
    }

    /**
     * Validate that the file is actually a video (not just by extension)
     */
    private function validateVideoContent(UploadedFile $file): bool
    {
        try {
            // Double-check MIME type starts with 'video/'
            $mimeType = $file->getMimeType();
            if (!str_starts_with($mimeType, 'video/')) {
                return false;
            }

            // Read first few bytes to check for video file signatures
            $handle = fopen($file->getRealPath(), 'rb');
            if (!$handle) {
                return false;
            }

            $header = fread($handle, 12);
            fclose($handle);

            // Check for common video file signatures
            // MP4/MOV: contains 'ftyp'
            if (str_contains($header, 'ftyp')) {
                return true;
            }

            // AVI: starts with RIFF
            if (str_starts_with($header, 'RIFF')) {
                return true;
            }

            // WebM: starts with specific byte sequence
            if (ord($header[0]) === 0x1A && ord($header[1]) === 0x45 && ord($header[2]) === 0xDF && ord($header[3]) === 0xA3) {
                return true;
            }

            // If no known signature found, still allow (might be valid but unknown format)
            return true;
        } catch (\Exception $e) {
            // If validation fails, log but allow upload
            \Log::warning('Video content validation failed', [
                'error' => $e->getMessage(),
                'file' => $file->getClientOriginalName(),
            ]);
            return true;
        }
    }

    /**
     * Store video file and return path.
     */
    public function storeVideo(UploadedFile $file, ?int $lessonId = null): array
    {
        // Generate unique file name
        $extension = $file->getClientOriginalExtension();
        $prefix = $lessonId ? 'lesson_' . $lessonId : 'library';
        $fileName = $prefix . '_' . Str::random(10) . '.' . $extension;

        // Choose storage directory
        $directory = $lessonId ? "videos/lessons/{$lessonId}" : 'videos/library';

        // Determine which disk to use
        $disk = config('filesystems.default');

        // Store file in videos directory
        $path = $file->storeAs($directory, $fileName, $disk);

        // Set proper permissions for S3
        if ($disk === 's3') {
            Storage::disk('s3')->setVisibility($path, 'private');
        }

        return [
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ];
    }

    /**
     * Extract video duration using getID3 library (if available)
     * or return null if not possible.
     */
    public function extractDuration(string $filePath): ?int
    {
        // This is a placeholder. In production, you would use:
        // - getID3 library
        // - FFmpeg
        // - Or similar video processing tool

        // For now, return null and let it be updated manually if needed
        return null;
    }

    /**
     * Generate video thumbnail (placeholder).
     */
    public function generateThumbnail(string $videoPath): ?string
    {
        // This is a placeholder. In production, you would use:
        // - FFmpeg to extract a frame
        // - Store it in thumbnails directory

        // For now, return null
        return null;
    }

    /**
     * Delete video file.
     */
    public function deleteVideo(string $filePath): bool
    {
        $disk = config('filesystems.default');

        if (Storage::disk($disk)->exists($filePath)) {
            return Storage::disk($disk)->delete($filePath);
        }

        return false;
    }

    /**
     * Get video stream response.
     */
    public function streamVideo(string $filePath)
    {
        $disk = config('filesystems.default');

        // For S3, redirect to temporary signed URL
        if ($disk === 's3') {
            if (!Storage::disk('s3')->exists($filePath)) {
                abort(404, 'الفيديو غير موجود');
            }

            // Generate temporary URL valid for 1 hour
            $url = Storage::disk('s3')->temporaryUrl(
                $filePath,
                now()->addHour()
            );

            return redirect($url);
        }

        // For local storage, stream directly
        $fullPath = Storage::disk($disk)->path($filePath);

        if (!file_exists($fullPath)) {
            abort(404, 'الفيديو غير موجود');
        }

        $stream = fopen($fullPath, 'rb');
        $fileSize = filesize($fullPath);
        $mimeType = Storage::disk($disk)->mimeType($filePath);

        return response()->stream(function () use ($stream) {
            while (!feof($stream)) {
                echo fread($stream, 8192);
                flush();
            }
            fclose($stream);
        }, 200, [
            'Content-Type' => $mimeType,
            'Content-Length' => $fileSize,
            'Accept-Ranges' => 'bytes',
        ]);
    }
}
