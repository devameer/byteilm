<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonVideo;
use App\Models\User;
use App\Services\VideoProcessingService;
use App\Services\YouTubeDownloadService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LessonVideoApiController extends Controller
{
    protected VideoProcessingService $videoService;
    protected YouTubeDownloadService $youtubeService;

    public function __construct(VideoProcessingService $videoService, YouTubeDownloadService $youtubeService)
    {
        $this->videoService = $videoService;
        $this->youtubeService = $youtubeService;
        $this->middleware('usage.limit:storage')->only([
            'upload',
            'importFromYoutube',
            'startChunkedUpload',
            'uploadChunk',
            'completeChunkedUpload',
        ]);
    }

    /**
     * Upload video for a lesson.
     */
    public function upload(Request $request, $lessonId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        $request->validate([
            'video' => 'required|file|mimes:mp4,avi,mov,wmv,webm|max:512000', // Max 500MB
        ], [
            'video.required' => 'يرجى اختيار ملف الفيديو',
            'video.mimes' => 'نوع الفيديو غير مدعوم. الأنواع المدعومة: MP4, AVI, MOV, WMV, WebM',
            'video.max' => 'حجم الفيديو يجب أن لا يتجاوز 500 ميجابايت',
        ]);

        try {
            DB::beginTransaction();

            $videoFile = $request->file('video');

            // Check if file was uploaded successfully
            if (!$videoFile || !$videoFile->isValid()) {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل رفع الملف. يرجى التحقق من حجم الملف وإعدادات الخادم.',
                ], 422);
            }

            // Validate video
            $errors = $this->videoService->validateVideo($videoFile);
            if (!empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل التحقق من الفيديو',
                    'errors' => $errors,
                ], 422);
            }

            // Delete existing video if any
            $existingVideoSize = $lesson->video?->file_size ?? 0;

            if ($response = $this->ensureStorageAllowance($request->user(), $videoFile->getSize(), $existingVideoSize)) {
                DB::rollBack();
                return $response;
            }

            if ($lesson->video) {
                $lesson->video->delete();
            }

            // Store video
            $videoData = $this->videoService->storeVideo($videoFile, $lesson->id);
            $videoData['source_url'] = null;

            // Extract duration (if possible) - wrapped in try-catch to prevent failures
            try {
                $duration = $this->videoService->extractDuration($videoData['file_path']);
                if ($duration) {
                    $videoData['duration'] = $duration;
                }
            } catch (\Exception $e) {
                // Duration extraction failed, continue without it
                // Duration can be updated manually later
            }

            // Extract audio from video (for faster transcription)
            try {
                if ($this->videoService->isFFmpegAvailable()) {
                    $audioData = $this->videoService->extractAudio($videoData['file_path'], $lesson->id);
                    if ($audioData) {
                        $videoData['audio_path'] = $audioData['audio_path'];
                        \Log::info('Audio extracted successfully', [
                            'lesson_id' => $lesson->id,
                            'audio_path' => $audioData['audio_path']
                        ]);
                    }
                }
            } catch (\Exception $e) {
                // Audio extraction failed, continue without it
                \Log::warning('Audio extraction failed', [
                    'lesson_id' => $lesson->id,
                    'error' => $e->getMessage()
                ]);
            }

            // Create video record
            $video = $lesson->video()->create($videoData);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم رفع الفيديو بنجاح',
                'data' => $video->load('subtitles'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            // Log the error for debugging
            \Log::error('Video upload failed', [
                'lesson_id' => $lessonId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => app()->environment('production')
                    ? 'فشل رفع الفيديو. يرجى المحاولة لاحقاً'
                    : 'فشل رفع الفيديو: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import video from YouTube.
     */
    public function importFromYoutube(Request $request, $lessonId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        $request->validate([
            'url' => ['required', 'url'],
            'quality' => ['nullable', 'regex:/^\d{2,4}$/'],
        ], [
            'url.required' => 'يرجى إدخال رابط الفيديو من YouTube',
            'url.url' => 'رابط YouTube غير صالح',
            'quality.regex' => 'صيغة الجودة غير صحيحة. استخدم أرقاماً مثل 360 أو 720.',
        ]);

        $downloadData = null;

        try {
            DB::beginTransaction();

            $downloadData = $this->youtubeService->download(
                $request->input('url'),
                'mp4',
                $request->input('quality')
            );

            $uploadedFile = new UploadedFile(
                $downloadData['file_path'],
                $downloadData['original_name'],
                $downloadData['mime_type'],
                null,
                true
            );

            $errors = $this->videoService->validateVideo($uploadedFile);
            if (!empty($errors)) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'فشل التحقق من الفيديو المستورد',
                    'errors' => $errors,
                ], 422);
            }

            $incomingSize = isset($downloadData['size'])
                ? (int) $downloadData['size']
                : (file_exists($downloadData['file_path']) ? filesize($downloadData['file_path']) : 0);

            $existingVideoSize = $lesson->video?->file_size ?? 0;

            if ($response = $this->ensureStorageAllowance($request->user(), $incomingSize, $existingVideoSize)) {
                DB::rollBack();
                return $response;
            }

            if ($lesson->video) {
                $lesson->video->delete();
            }

            $videoData = $this->videoService->storeVideo($uploadedFile, $lesson->id);
            $videoData['source_url'] = $request->input('url');

            if (!empty($downloadData['duration'])) {
                $videoData['duration'] = (int) $downloadData['duration'];
            }

            if (!empty($downloadData['size'])) {
                $videoData['file_size'] = (int) $downloadData['size'];
            }

            if (!empty($downloadData['thumbnail_local_path']) && File::exists($downloadData['thumbnail_local_path'])) {
                $extension = pathinfo($downloadData['thumbnail_local_path'], PATHINFO_EXTENSION) ?: 'jpg';
                $thumbnailPath = 'videos/thumbnails/lesson_' . $lesson->id . '_' . Str::random(10) . '.' . $extension;
                Storage::disk('public')->put($thumbnailPath, File::get($downloadData['thumbnail_local_path']));
                $videoData['thumbnail_path'] = $thumbnailPath;
            }

            $video = $lesson->video()->create($videoData);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم استيراد الفيديو من YouTube بنجاح',
                'data' => $video->load('subtitles'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            // Log the error for debugging
            \Log::error('YouTube import failed', [
                'lesson_id' => $lessonId,
                'url' => $request->input('url'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => app()->environment('production')
                    ? 'فشل استيراد الفيديو من YouTube. يرجى المحاولة لاحقاً'
                    : 'فشل استيراد الفيديو من YouTube: ' . $e->getMessage(),
            ], 500);
        } finally {
            if ($downloadData && !empty($downloadData['temp_dir'])) {
                File::deleteDirectory($downloadData['temp_dir']);
            }
        }
    }

    /**
     * Start chunked upload session.
     */
    public function startChunkedUpload(Request $request, $lessonId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        $request->validate([
            'file_name' => 'required|string',
            'file_size' => 'required|integer|min:1',
            'total_chunks' => 'required|integer|min:1',
            'file_type' => 'required|string',
        ]);

        // Validate file type
        $allowedMimes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm'];
        if (!in_array($request->file_type, $allowedMimes)) {
            return response()->json([
                'success' => false,
                'message' => 'نوع الفيديو غير مدعوم. الأنواع المدعومة: MP4, AVI, MOV, WMV, WebM',
            ], 422);
        }

        if ($response = $this->ensureStorageAllowance($request->user(), (int) $request->file_size, $lesson->video?->file_size ?? 0)) {
            return $response;
        }

        // Create unique upload ID
        $uploadId = uniqid('upload_', true);

        // Store upload session in cache (expires in 24 hours)
        cache()->put("upload_session_{$uploadId}", [
            'lesson_id' => $lessonId,
            'file_name' => $request->file_name,
            'file_size' => $request->file_size,
            'total_chunks' => $request->total_chunks,
            'file_type' => $request->file_type,
            'uploaded_chunks' => [],
            'created_at' => now(),
        ], now()->addHours(24));

        return response()->json([
            'success' => true,
            'upload_id' => $uploadId,
            'message' => 'تم بدء جلسة الرفع',
        ]);
    }

    /**
     * Upload a single chunk.
     */
    public function uploadChunk(Request $request, $lessonId, $uploadId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        $request->validate([
            'chunk' => 'required|file',
            'chunk_index' => 'required|integer|min:0',
        ]);

        // Get upload session
        $session = cache()->get("upload_session_{$uploadId}");
        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'جلسة الرفع غير موجودة أو منتهية الصلاحية',
            ], 404);
        }

        // Verify lesson ID matches
        if ($session['lesson_id'] != $lessonId) {
            return response()->json([
                'success' => false,
                'message' => 'معرف الدرس غير صحيح',
            ], 422);
        }

        $chunkIndex = $request->chunk_index;

        // Create temp directory for chunks
        $tempDir = storage_path("app/temp/uploads/{$uploadId}");
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        // Save chunk
        $chunkPath = "{$tempDir}/chunk_{$chunkIndex}";
        $request->file('chunk')->move($tempDir, "chunk_{$chunkIndex}");

        // Update session
        $session['uploaded_chunks'][] = $chunkIndex;
        cache()->put("upload_session_{$uploadId}", $session, now()->addHours(24));

        return response()->json([
            'success' => true,
            'message' => 'تم رفع الجزء بنجاح',
            'uploaded_chunks' => count($session['uploaded_chunks']),
            'total_chunks' => $session['total_chunks'],
        ]);
    }

    /**
     * Complete chunked upload and merge chunks.
     */
    public function completeChunkedUpload(Request $request, $lessonId, $uploadId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        // Get upload session
        $session = cache()->get("upload_session_{$uploadId}");
        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'جلسة الرفع غير موجودة أو منتهية الصلاحية',
            ], 404);
        }

        // Verify all chunks are uploaded
        if (count($session['uploaded_chunks']) !== $session['total_chunks']) {
            return response()->json([
                'success' => false,
                'message' => 'لم يتم رفع جميع الأجزاء',
            ], 422);
        }

        $existingVideoSize = $lesson->video?->file_size ?? 0;
        $incomingSize = isset($session['file_size']) ? (int) $session['file_size'] : 0;

        if ($response = $this->ensureStorageAllowance($request->user(), $incomingSize, $existingVideoSize)) {
            return $response;
        }

        try {
            DB::beginTransaction();

            $tempDir = storage_path("app/temp/uploads/{$uploadId}");
            $disk = config('filesystems.default');

            // Generate unique filename
            $extension = pathinfo($session['file_name'], PATHINFO_EXTENSION);
            $fileName = uniqid() . '_' . time() . '.' . $extension;
            $storagePath = "videos/lessons/{$lesson->id}/{$fileName}";

            // Create temporary merged file
            $tempMergedPath = storage_path("app/temp/{$fileName}");
            $output = fopen($tempMergedPath, 'wb');

            for ($i = 0; $i < $session['total_chunks']; $i++) {
                $chunkPath = "{$tempDir}/chunk_{$i}";
                if (!file_exists($chunkPath)) {
                    throw new \Exception("الجزء {$i} غير موجود");
                }

                $chunk = fopen($chunkPath, 'rb');
                stream_copy_to_stream($chunk, $output);
                fclose($chunk);
            }
            fclose($output);

            // Get file size from temp file
            $fileSize = filesize($tempMergedPath);

            // Extract audio from temp file BEFORE uploading (parallel processing)
            $audioPath = null;
            try {
                $ffmpegPath = $this->videoService->getFFmpegPath();
                if ($ffmpegPath) {
                    // Extract audio directly from the temp merged file
                    $tempAudioPath = storage_path('app/temp/' . pathinfo($fileName, PATHINFO_FILENAME) . '.mp3');

                    // Run FFmpeg on the local temp file
                    $command = sprintf(
                        '%s -i %s -vn -acodec libmp3lame -ab 128k -ar 44100 -y %s 2>&1',
                        escapeshellarg($ffmpegPath),
                        escapeshellarg($tempMergedPath),
                        escapeshellarg($tempAudioPath)
                    );

                    exec($command, $ffmpegOutput, $returnCode);

                    if ($returnCode === 0 && file_exists($tempAudioPath)) {
                        // Audio extracted successfully, will upload to S3 after video
                        \Log::info('Audio extracted from temp file', [
                            'lesson_id' => $lesson->id,
                            'temp_audio_path' => $tempAudioPath
                        ]);
                    } else {
                        $tempAudioPath = null;
                        \Log::warning('FFmpeg audio extraction failed', [
                            'return_code' => $returnCode,
                            'output' => implode("\n", $ffmpegOutput)
                        ]);
                    }
                }
            } catch (\Exception $e) {
                $tempAudioPath = null;
                \Log::warning('Audio extraction failed', [
                    'lesson_id' => $lesson->id,
                    'error' => $e->getMessage()
                ]);
            }

            // Upload video to S3
            $fileContent = file_get_contents($tempMergedPath);
            Storage::disk($disk)->put($storagePath, $fileContent);
            unset($fileContent); // Free memory

            // Set permissions for S3
            if ($disk === 's3') {
                Storage::disk('s3')->setVisibility($storagePath, 'private');
            }

            // Upload audio to S3 if extracted
            if (isset($tempAudioPath) && file_exists($tempAudioPath)) {
                $audioDirectory = "audio/lessons/{$lesson->id}";
                $audioFileName = pathinfo($fileName, PATHINFO_FILENAME) . '.mp3';
                $audioPath = $audioDirectory . '/' . $audioFileName;

                $audioContent = file_get_contents($tempAudioPath);
                Storage::disk($disk)->put($audioPath, $audioContent);
                unset($audioContent); // Free memory

                if ($disk === 's3') {
                    Storage::disk('s3')->setVisibility($audioPath, 'private');
                }

                // Delete temp audio file
                @unlink($tempAudioPath);

                \Log::info('Audio uploaded to S3', [
                    'lesson_id' => $lesson->id,
                    'audio_path' => $audioPath
                ]);
            }

            // Clean up temp files
            $this->cleanupTempFiles($tempDir);
            if (file_exists($tempMergedPath)) {
                unlink($tempMergedPath);
            }

            // Delete existing video if any
            if ($lesson->video) {
                $lesson->video->delete();
            }

            // Create video data
            $videoData = [
                'file_name' => $session['file_name'],
                'file_path' => $storagePath,
                'file_size' => $fileSize,
                'mime_type' => $session['file_type'],
                'source_url' => null,
                'audio_path' => $audioPath,
            ];

            if ($response = $this->ensureStorageAllowance($request->user(), $videoData['file_size'], $existingVideoSize)) {
                DB::rollBack();
                // Delete from storage if quota exceeded
                Storage::disk($disk)->delete($storagePath);
                if ($audioPath) {
                    Storage::disk($disk)->delete($audioPath);
                }
                return $response;
            }

            // Extract duration (from S3)
            try {
                $duration = $this->videoService->extractDuration($videoData['file_path']);
                if ($duration) {
                    $videoData['duration'] = $duration;
                }
            } catch (\Exception $e) {
                // Duration extraction failed, continue without it
            }

            // Create video record
            $video = $lesson->video()->create($videoData);

            // Clear cache
            cache()->forget("upload_session_{$uploadId}");

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم رفع الفيديو بنجاح',
                'data' => $video->load('subtitles'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            // Clean up on error
            if (isset($tempDir)) {
                $this->cleanupTempFiles($tempDir);
            }
            if (isset($tempMergedPath) && file_exists($tempMergedPath)) {
                unlink($tempMergedPath);
            }
            if (isset($storagePath) && isset($disk)) {
                Storage::disk($disk)->delete($storagePath);
            }

            return response()->json([
                'success' => false,
                'message' => 'فشل دمج الفيديو: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get upload session status.
     */
    public function getUploadStatus($lessonId, $uploadId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        $session = cache()->get("upload_session_{$uploadId}");
        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'جلسة الرفع غير موجودة',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'uploaded_chunks' => $session['uploaded_chunks'],
                'total_chunks' => $session['total_chunks'],
                'file_name' => $session['file_name'],
                'file_size' => $session['file_size'],
            ],
        ]);
    }

    /**
     * Cancel chunked upload.
     */
    public function cancelChunkedUpload($lessonId, $uploadId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        $session = cache()->get("upload_session_{$uploadId}");
        if ($session) {
            $tempDir = storage_path("app/temp/uploads/{$uploadId}");
            $this->cleanupTempFiles($tempDir);
            cache()->forget("upload_session_{$uploadId}");
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء عملية الرفع',
        ]);
    }

    private function ensureStorageAllowance(?User $user, int $incomingBytes, int $releasedBytes = 0)
    {
        if (!$user) {
            return null;
        }

        $subscription = $user->subscriptions()
            ->whereIn('status', ['active', 'trialing'])
            ->latest()
            ->first();

        $plan = $subscription?->plan;
        $limits = $plan?->limits ?? [];

        $limitMb = $limits['max_storage_mb']
            ?? (($limits['max_storage_gb'] ?? null) !== null ? $limits['max_storage_gb'] * 1024 : -1);

        if ($limitMb === -1) {
            return null;
        }

        $usage = $user->getOrCreateUsage()->fresh();

        $releasedMb = (int) ceil($releasedBytes / 1048576);
        $incomingMb = (int) ceil($incomingBytes / 1048576);
        $currentMb = max(0, $usage->storage_used_mb - $releasedMb);
        $expectedMb = $currentMb + $incomingMb;

        if ($expectedMb > $limitMb) {
            return response()->json([
                'success' => false,
                'message' => 'لقد تجاوزت الحد الأقصى لمساحة التخزين المسموح بها في خطتك الحالية. قم بحذف بعض الفيديوهات أو قم بالترقية للحصول على مساحة إضافية.',
                'current_mb' => $usage->storage_used_mb,
                'limit_mb' => $limitMb,
            ], 422);
        }

        return null;
    }

    /**
     * Clean up temporary files.
     */
    private function cleanupTempFiles($directory)
    {
        if (!file_exists($directory)) {
            return;
        }

        $files = glob("{$directory}/*");
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        rmdir($directory);
    }

    /**
     * Get video for a lesson.
     */
    public function show($lessonId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        if (!$lesson->video) {
            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'لا يوجد فيديو لهذا الدرس',
            ], 200);
        }

        return response()->json([
            'success' => true,
            'data' => $lesson->video->load('subtitles'),
        ]);
    }

    /**
     * Stream video.
     */
    public function stream($lessonId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        if (!$lesson->video) {
            abort(404, 'لا يوجد فيديو لهذا الدرس');
        }

        return $this->videoService->streamVideo($lesson->video->file_path);
    }

    /**
     * Update video metadata.
     */
    public function update(Request $request, $lessonId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        if (!$lesson->video) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد فيديو لهذا الدرس',
            ], 404);
        }

        $request->validate([
            'duration' => 'nullable|integer|min:0',
        ]);

        $lesson->video->update($request->only(['duration']));

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث بيانات الفيديو بنجاح',
            'data' => $lesson->video->load('subtitles'),
        ]);
    }

    /**
     * Delete video.
     */
    public function destroy($lessonId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        if (!$lesson->video) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد فيديو لهذا الدرس',
            ], 404);
        }

        try {
            $lesson->video->delete();

            return response()->json([
                'success' => true,
                'message' => 'تم حذف الفيديو بنجاح',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل حذف الفيديو: ' . $e->getMessage(),
            ], 500);
        }
    }
}
