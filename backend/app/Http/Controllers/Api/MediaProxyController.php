<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonSubtitle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class MediaProxyController extends Controller
{
    /**
     * Proxy video file with proper CORS headers
     */
    public function video($lessonId)
    {
        Log::info("📹 [MediaProxy] Video request for lesson: {$lessonId}");

        try {
            $lesson = Lesson::findOrFail($lessonId);
            Log::info("✅ [MediaProxy] Lesson found: {$lesson->id}");

            if (!$lesson->video) {
                Log::warning("⚠️ [MediaProxy] No video for lesson: {$lessonId}");
                return response()->json([
                    'success' => false,
                    'message' => 'لا يوجد فيديو لهذا الدرس',
                ], 404);
            }

            $video = $lesson->video;
            $disk = config('filesystems.default');

            Log::info("📼 [MediaProxy] Video info:", [
                'id' => $video->id,
                'file_path' => $video->file_path,
                'mime_type' => $video->mime_type,
                'disk' => $disk,
                'file_size' => $video->file_size
            ]);

            // Get file from storage
            if (!Storage::disk($disk)->exists($video->file_path)) {
                Log::error("❌ [MediaProxy] Video file not found in storage: {$video->file_path}");
                return response()->json([
                    'success' => false,
                    'message' => 'ملف الفيديو غير موجود',
                ], 404);
            }

            Log::info("✅ [MediaProxy] Video file exists in storage");

            // For local storage, use direct file path
            // For S3, this will work with presigned URLs
            if ($disk === 'local' || $disk === 'public') {
                Log::info("🏠 [MediaProxy] Using local storage streaming");
                $path = Storage::disk($disk)->path($video->file_path);
                return $this->streamLocalVideo($path, $video->mime_type ?? 'video/mp4');
            } else {
                Log::info("☁️ [MediaProxy] Using cloud storage streaming");
                // For S3 or other cloud storage, get stream
                $stream = Storage::disk($disk)->readStream($video->file_path);
                $size = Storage::disk($disk)->size($video->file_path);
                return $this->streamCloudVideo($stream, $size, $video->mime_type ?? 'video/mp4');
            }

        } catch (\Exception $e) {
            Log::error('❌ [MediaProxy] Video proxy error: ' . $e->getMessage(), [
                'lesson_id' => $lessonId,
                'exception' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحميل الفيديو',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Stream local video file
     */
    private function streamLocalVideo($path, $mimeType)
    {
        Log::info("🏠 [MediaProxy] Streaming local video:", [
            'path' => $path,
            'mime_type' => $mimeType,
            'exists' => file_exists($path)
        ]);

        if (!file_exists($path)) {
            Log::error("❌ [MediaProxy] File does not exist: {$path}");
            return response()->json([
                'success' => false,
                'message' => 'ملف الفيديو غير موجود',
            ], 404);
        }

        $size = filesize($path);
        Log::info("📊 [MediaProxy] File size: " . number_format($size / 1024 / 1024, 2) . " MB");

        $headers = [
            'Content-Type' => $mimeType,
            'Accept-Ranges' => 'bytes',
            'Access-Control-Allow-Origin' => request()->header('Origin') ?? '*',
            'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers' => 'Range, Content-Type, Accept',
            'Access-Control-Expose-Headers' => 'Content-Length, Content-Range, Accept-Ranges',
            'Cache-Control' => 'public, max-age=3600',
        ];

        // Support for range requests (for video seeking)
        $rangeHeader = request()->header('Range');
        Log::info("📡 [MediaProxy] Range header: " . ($rangeHeader ?? 'none'));

        if ($rangeHeader && preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $matches)) {
            $start = (int) $matches[1];
            $end = !empty($matches[2]) ? (int) $matches[2] : $size - 1;
            $length = $end - $start + 1;

            Log::info("📦 [MediaProxy] Returning partial content (206):", [
                'start' => $start,
                'end' => $end,
                'length' => number_format($length / 1024, 2) . ' KB'
            ]);

            // Set range headers
            $headers['Content-Range'] = "bytes {$start}-{$end}/{$size}";
            $headers['Content-Length'] = $length;

            // Open file and seek to start position
            $file = fopen($path, 'rb');
            fseek($file, $start);
            $content = fread($file, $length);
            fclose($file);

            return response($content, 206, $headers);
        }

        // Full content
        Log::info("📦 [MediaProxy] Returning full content (200)");
        $headers['Content-Length'] = $size;

        return response()->stream(function () use ($path) {
            $file = fopen($path, 'rb');
            fpassthru($file);
            fclose($file);
        }, 200, $headers);
    }

    /**
     * Stream cloud video file (S3, etc.)
     */
    private function streamCloudVideo($stream, $size, $mimeType)
    {
        $headers = [
            'Content-Type' => $mimeType,
            'Accept-Ranges' => 'bytes',
            'Access-Control-Allow-Origin' => request()->header('Origin') ?? '*',
            'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers' => 'Range, Content-Type, Accept',
            'Access-Control-Expose-Headers' => 'Content-Length, Content-Range, Accept-Ranges',
            'Cache-Control' => 'public, max-age=3600',
        ];

        // Support for range requests (for video seeking)
        $rangeHeader = request()->header('Range');

        if ($rangeHeader && preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $matches)) {
            $start = (int) $matches[1];
            $end = !empty($matches[2]) ? (int) $matches[2] : $size - 1;
            $length = $end - $start + 1;

            // Set range headers
            $headers['Content-Range'] = "bytes {$start}-{$end}/{$size}";
            $headers['Content-Length'] = $length;

            // Read partial content
            fseek($stream, $start);
            $content = fread($stream, $length);
            fclose($stream);

            return response($content, 206, $headers);
        }

        // Full content
        $headers['Content-Length'] = $size;

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            fclose($stream);
        }, 200, $headers);
    }

    /**
     * Proxy subtitle file with proper CORS headers
     */
    public function subtitle($subtitleId)
    {
        Log::info("📝 [MediaProxy] Subtitle request for ID: {$subtitleId}");

        try {
            $subtitle = LessonSubtitle::findOrFail($subtitleId);
            $disk = config('filesystems.default');

            Log::info("📝 [MediaProxy] Subtitle info:", [
                'id' => $subtitle->id,
                'language' => $subtitle->language,
                'file_path' => $subtitle->file_path,
                'disk' => $disk
            ]);

            // Get file from storage
            if (!Storage::disk($disk)->exists($subtitle->file_path)) {
                Log::error("❌ [MediaProxy] Subtitle file not found: {$subtitle->file_path}");
                return response()->json([
                    'success' => false,
                    'message' => 'ملف الترجمة غير موجود',
                ], 404);
            }

            $content = Storage::disk($disk)->get($subtitle->file_path);
            Log::info("✅ [MediaProxy] Subtitle content loaded, size: " . strlen($content) . " bytes");

            return response($content, 200, [
                'Content-Type' => 'text/vtt; charset=utf-8',
                'Access-Control-Allow-Origin' => request()->header('Origin') ?? '*',
                'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Accept',
                'Cache-Control' => 'public, max-age=3600',
            ]);

        } catch (\Exception $e) {
            Log::error('❌ [MediaProxy] Subtitle proxy error: ' . $e->getMessage(), [
                'subtitle_id' => $subtitleId,
                'exception' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحميل الترجمة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle OPTIONS preflight requests
     */
    public function options()
    {
        return response('', 200, [
            'Access-Control-Allow-Origin' => request()->header('Origin') ?? '*',
            'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers' => 'Range, Content-Type, Accept',
            'Access-Control-Max-Age' => '3600',
        ]);
    }
}
