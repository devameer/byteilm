<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonSubtitle;
use App\Models\LessonVideo;
use App\Models\TranscriptionJob;
use App\Services\SubtitleService;
use App\Services\GeminiService;
use App\Services\AudioExtractionService;
use App\Services\AssemblyAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;


class LessonSubtitleApiController extends Controller
{
    protected SubtitleService $subtitleService;
    protected GeminiService $geminiService;
    protected AudioExtractionService $audioService;
    protected AssemblyAIService $assemblyAIService;

    public function __construct(
        SubtitleService $subtitleService,
        GeminiService $geminiService,
        AudioExtractionService $audioService,
        AssemblyAIService $assemblyAIService
    ) {
        $this->subtitleService = $subtitleService;
        $this->geminiService = $geminiService;
        $this->audioService = $audioService;
        $this->assemblyAIService = $assemblyAIService;

        // Apply usage limit middleware to AI-powered methods
        $this->middleware('usage.limit:ai_requests')->only([
            'transcribe',
            'translateToArabic',
            'translate'
        ]);
    }

    /**
     * Upload subtitle for a lesson video.
     */
    public function upload(Request $request, $lessonId)
    {
        $lesson = Lesson::with('video')->findOrFail($lessonId);

        if (!$lesson->video) {
            return response()->json([
                'success' => false,
                'message' => 'يجب رفع الفيديو أولاً قبل إضافة الترجمات',
            ], 404);
        }

        $request->validate([
            'subtitle' => 'required|file|max:5120', // 5MB - removed mimes validation
            'language' => 'required|string|max:10',
            'language_name' => 'required|string|max:50',
        ], [
            'subtitle.required' => 'يرجى اختيار ملف الترجمة',
            'subtitle.max' => 'حجم ملف الترجمة يجب أن لا يتجاوز 5 ميجابايت',
            'language.required' => 'يرجى تحديد لغة الترجمة',
            'language_name.required' => 'يرجى إدخال اسم اللغة',
        ]);

        // Validate file extension manually (case-insensitive)
        $subtitleFile = $request->file('subtitle');
        $extension = strtolower($subtitleFile->getClientOriginalExtension());
        if (!in_array($extension, ['srt', 'vtt'])) {
            return response()->json([
                'success' => false,
                'message' => 'نوع ملف الترجمة غير مدعوم. الأنواع المدعومة: SRT, VTT',
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Validate subtitle
            $errors = $this->subtitleService->validateSubtitle($subtitleFile);
            if (!empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل التحقق من ملف الترجمة',
                    'errors' => $errors,
                ], 422);
            }

            // Check if subtitle for this language already exists
            $existingSubtitle = $lesson->video->subtitles()
                ->where('language', $request->language)
                ->first();

            if ($existingSubtitle) {
                $existingSubtitle->delete();
            }

            // Store subtitle
            $subtitleData = $this->subtitleService->storeSubtitle(
                $subtitleFile,
                $lesson->video->id,
                $request->language
            );

            // Create subtitle record
            $subtitle = $lesson->video->subtitles()->create([
                'language' => $request->language,
                'language_name' => $request->language_name,
                'file_name' => $subtitleData['file_name'],
                'file_path' => $subtitleData['file_path'],
                'file_size' => $subtitleData['file_size'],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم رفع ملف الترجمة بنجاح',
                'data' => $subtitle,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'فشل رفع ملف الترجمة: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all subtitles for a lesson.
     */
    public function index($lessonId)
    {
        $lesson = Lesson::with('video.subtitles')->findOrFail($lessonId);

        if (!$lesson->video) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد فيديو لهذا الدرس',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $lesson->video->subtitles,
        ]);
    }

    /**
     * Get subtitle content.
     */
    public function show($subtitleId)
    {
        $subtitle = LessonSubtitle::findOrFail($subtitleId);

        $content = $subtitle->getContent();

        if (!$content) {
            return response()->json([
                'success' => false,
                'message' => 'فشل قراءة محتوى الترجمة',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'subtitle' => $subtitle,
                'content' => $content,
            ],
        ]);
    }

    /**
     * Get subtitle in VTT format for HTML5 video player.
     */
    public function getVtt($subtitleId)
    {
        $subtitle = LessonSubtitle::findOrFail($subtitleId);

        $content = $subtitle->getContent();

        if (!$content) {
            abort(404, 'فشل قراءة محتوى الترجمة');
        }

        // Convert SRT to VTT if needed
        $extension = strtolower(pathinfo($subtitle->file_path, PATHINFO_EXTENSION));
        if ($extension === 'srt') {
            $content = $this->subtitleService->convertSrtToVtt($content);
        }

        return response($content, 200)
            ->header('Content-Type', 'text/vtt; charset=utf-8')
            ->header('Cache-Control', 'public, max-age=3600');
    }

    /**
     * Update subtitle language.
     */
    public function updateLanguage(Request $request, $subtitleId)
    {
        $request->validate([
            'language' => 'required|string|max:10',
            'language_name' => 'required|string|max:50',
        ], [
            'language.required' => 'يرجى تحديد لغة الترجمة',
            'language_name.required' => 'يرجى إدخال اسم اللغة',
        ]);

        $subtitle = LessonSubtitle::findOrFail($subtitleId);

        try {
            // Check if subtitle for this language already exists (excluding current subtitle)
            $existingSubtitle = LessonSubtitle::where('lesson_video_id', $subtitle->lesson_video_id)
                ->where('language', $request->language)
                ->where('id', '!=', $subtitle->id)
                ->first();

            if ($existingSubtitle) {
                return response()->json([
                    'success' => false,
                    'message' => 'توجد ترجمة بنفس اللغة بالفعل',
                ], 422);
            }

            $subtitle->update([
                'language' => $request->language,
                'language_name' => $request->language_name,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث لغة الترجمة بنجاح',
                'data' => $subtitle->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل تحديث لغة الترجمة: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete subtitle.
     */
    public function destroy($subtitleId)
    {
        $subtitle = LessonSubtitle::findOrFail($subtitleId);

        try {
            $subtitle->delete();

            return response()->json([
                'success' => true,
                'message' => 'تم حذف ملف الترجمة بنجاح',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل حذف ملف الترجمة: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get supported languages.
     */
    public function getSupportedLanguages()
    {
        return response()->json([
            'success' => true,
            'data' => $this->subtitleService->getSupportedLanguages(),
        ]);
    }

    /**
     * Transcribe video to text with timestamps using AssemblyAI.
     * 
     * Uses S3 URL directly when available for better performance.
     */
    public function transcribe(Request $request, $lessonId)
    {
        // Increase max execution time for transcription
        set_time_limit(600); // 10 minutes for AssemblyAI polling

        $lesson = Lesson::with('video')->findOrFail($lessonId);

        if (!$lesson->video) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد فيديو لهذا الدرس. الرجاء رفع الفيديو أولاً.',
            ], 404);
        }

        // Check if AssemblyAI is configured
        if (!$this->assemblyAIService->isAvailable()) {
            return response()->json([
                'success' => false,
                'message' => 'خدمة AssemblyAI غير مهيأة. أضف ASSEMBLYAI_API_KEY في ملف .env',
            ], 500);
        }

        $audioPath = null;

        try {
            // Determine storage disk (S3 or local)
            $disk = config('filesystems.default');

            // Check if video file exists
            if (!Storage::disk($disk)->exists($lesson->video->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'لم يتم العثور على ملف الفيديو في التخزين.',
                ], 404);
            }

            \Log::info('🚀 Starting AssemblyAI transcription', [
                'lesson_id' => $lessonId,
                'video_id' => $lesson->video->id,
                'file_size' => number_format($lesson->video->file_size / 1024 / 1024, 2) . ' MB',
                'disk' => $disk,
            ]);

            // Check if we can use S3 URL directly (faster - no download needed)
            if ($disk === 's3') {
                \Log::info('📡 Using S3 URL directly for AssemblyAI...');

                // Generate temporary presigned URL for AssemblyAI to access
                $s3Url = Storage::disk('s3')->temporaryUrl(
                    $lesson->video->file_path,
                    now()->addHours(1) // URL valid for 1 hour
                );

                \Log::info('🎤 Starting transcription with AssemblyAI (S3 direct)...');
                $result = $this->assemblyAIService->transcribeFromUrl($s3Url);

                $transcript = $result['text'];

                \Log::info('✅ AssemblyAI transcription completed (S3 direct)', [
                    'transcript_length' => strlen($transcript),
                    'word_count' => count($result['words'] ?? []),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'تم التفريغ بنجاح باستخدام AssemblyAI',
                    'data' => [
                        'transcript' => $transcript,
                        'lesson_name' => $lesson->name,
                        'word_count' => count($result['words'] ?? []),
                        'method' => 's3_direct',
                    ],
                ]);
            }

            // Fallback: Extract audio and use Base64 (for local storage)
            \Log::info('🎵 Extracting audio from video (local storage)...');
            $audioData = $this->audioService->extractAudioFromVideo(
                $lesson->video->file_path,
                $disk
            );
            $audioPath = $audioData['path'];

            \Log::info('✅ Audio extracted successfully', [
                'audio_size' => number_format($audioData['size'] / 1024 / 1024, 2) . ' MB',
                'duration' => $audioData['duration'] . ' seconds',
                'truncated' => $audioData['truncated'] ?? false,
            ]);

            // Encode audio as Base64
            \Log::info('📦 Encoding audio as Base64...');
            $base64Audio = base64_encode(file_get_contents($audioPath));

            // Transcribe using AssemblyAI
            \Log::info('🎤 Starting transcription with AssemblyAI...');
            $result = $this->assemblyAIService->transcribeFromBase64(
                $base64Audio,
                $audioData['mime_type'] ?? 'audio/mpeg'
            );

            $transcript = $result['text'];

            \Log::info('✅ AssemblyAI transcription completed', [
                'transcript_length' => strlen($transcript),
                'word_count' => count($result['words'] ?? []),
            ]);

            // Prepare response message
            $message = 'تم التفريغ بنجاح باستخدام AssemblyAI';
            if (!empty($audioData['truncated'])) {
                $maxMinutes = floor($this->audioService->getMaxDurationSeconds() / 60);
                $message .= " (تم تفريغ أول {$maxMinutes} دقيقة من الفيديو)";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'transcript' => $transcript,
                    'lesson_name' => $lesson->name,
                    'audio_duration' => $audioData['duration'],
                    'truncated' => $audioData['truncated'] ?? false,
                    'word_count' => count($result['words'] ?? []),
                    'method' => 'base64',
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('❌ Transcription error', [
                'lesson_id' => $lessonId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء التفريغ: ' . $e->getMessage(),
            ], 500);
        } finally {
            // Cleanup temp audio file
            if ($audioPath) {
                $this->audioService->cleanup($audioPath);
            }
        }
    }

    /**
     * Generate a temporary presigned URL for video access.
     */
    private function getVideoPresignedUrl(LessonVideo $video, string $disk): string
    {
        if ($disk === 's3') {
            // Generate S3 presigned URL (valid for 1 hour)
            $s3Client = Storage::disk('s3')->getClient();
            $command = $s3Client->getCommand('GetObject', [
                'Bucket' => config('filesystems.disks.s3.bucket'),
                'Key' => $video->file_path,
            ]);

            $request = $s3Client->createPresignedRequest($command, '+1 hour');
            return (string) $request->getUri();
        } else {
            // For local storage, use full public URL from MediaProxyController
            // The proxy_video_url already handles CORS and range requests
            $baseUrl = rtrim(config('app.url'), '/');
            return "{$baseUrl}/api/media/proxy/video/{$video->lesson_id}";
        }
    }

    /**
     * Start async transcription (Polling-based approach).
     * Returns a job ID that can be used to check status.
     */
    public function startTranscription(Request $request, $lessonId)
    {
        $lesson = Lesson::with('video')->findOrFail($lessonId);

        if (!$lesson->video) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد فيديو لهذا الدرس. الرجاء رفع الفيديو أولاً.',
            ], 404);
        }

        // Check if there's already a pending/processing job for this lesson
        $existingJob = TranscriptionJob::where('lesson_id', $lessonId)
            ->whereIn('status', [TranscriptionJob::STATUS_PENDING, TranscriptionJob::STATUS_PROCESSING])
            ->first();

        if ($existingJob) {
            return response()->json([
                'success' => true,
                'message' => 'هناك عملية تفريغ جارية بالفعل',
                'data' => [
                    'job_id' => $existingJob->id,
                    'status' => $existingJob->status,
                    'progress' => $existingJob->progress,
                    'current_step' => $existingJob->current_step,
                ],
            ]);
        }

        // Create new transcription job
        $job = TranscriptionJob::create([
            'lesson_id' => $lessonId,
            'user_id' => auth()->id(),
            'status' => TranscriptionJob::STATUS_PENDING,
            'progress' => 0,
            'current_step' => 'initializing',
        ]);

        // Prepare response data
        $responseData = [
            'success' => true,
            'message' => 'بدأت عملية التفريغ',
            'data' => [
                'job_id' => $job->id,
                'status' => $job->status,
                'progress' => $job->progress,
            ],
        ];

        // Settings for background execution
        ignore_user_abort(true);
        set_time_limit(900);

        // Send response and close connection, then continue processing
        ob_start();
        echo json_encode($responseData);
        $size = ob_get_length();

        header('Content-Type: application/json');
        header('Content-Length: ' . $size);
        header('Connection: close');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-XSRF-TOKEN');
        header('Access-Control-Allow-Credentials: true');

        ob_end_flush();
        if (ob_get_level() > 0) {
            ob_flush();
        }
        flush();

        // For PHP-FPM, finish the request but keep processing
        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();
        }

        // Close session to prevent blocking
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }

        // Now process transcription (client already got response)
        $this->processTranscription($job, $lesson);

        exit;
    }

    /**
     * Get transcription job status.
     */
    public function getTranscriptionStatus(Request $request, $lessonId)
    {
        $job = TranscriptionJob::where('lesson_id', $lessonId)
            ->latest()
            ->first();

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'لم يتم العثور على عملية تفريغ',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $job->id,
                'status' => $job->status,
                'progress' => $job->progress,
                'current_step' => $job->current_step,
                'transcript' => $job->status === TranscriptionJob::STATUS_COMPLETED ? $job->transcript : null,
                'error_message' => $job->status === TranscriptionJob::STATUS_FAILED ? $job->error_message : null,
            ],
        ]);
    }

    /**
     * Process transcription in background.
     */
    public function processTranscription(TranscriptionJob $job, Lesson $lesson): void
    {
        try {
            $job->update([
                'status' => TranscriptionJob::STATUS_PROCESSING,
                'current_step' => 'preparing',
                'progress' => 5,
            ]);

            $disk = config('filesystems.default');
            $fileSize = $lesson->video->file_size;
            $maxSize = 2 * 1024 * 1024 * 1024; // 2GB

            if ($fileSize > $maxSize) {
                $job->markFailed('حجم الفيديو كبير جداً. الحد الأقصى 2GB.');
                return;
            }

            if (!Storage::disk($disk)->exists($lesson->video->file_path)) {
                $job->markFailed('لم يتم العثور على ملف الفيديو.');
                return;
            }

            $mimeType = $lesson->video->mime_type ?? 'video/mp4';
            $videoUrl = $this->getVideoPresignedUrl($lesson->video, $disk);

            // Update progress: Uploading
            $job->updateProgress(10, 'uploading');

            \Log::info('📤 Starting async video upload to Gemini', [
                'job_id' => $job->id,
                'lesson_id' => $lesson->id,
            ]);

            // Upload file to Gemini
            $fileData = $this->geminiService->uploadFileFromUrl(
                $videoUrl,
                $mimeType,
                'lesson_' . $lesson->id . '_video'
            );

            $job->updateProgress(50, 'processing');

            \Log::info('✅ Video uploaded, waiting for processing', [
                'job_id' => $job->id,
                'file_uri' => $fileData['uri'],
            ]);

            // Update progress: Transcribing
            $job->updateProgress(60, 'transcribing');

            // Transcribe
            $transcript = $this->geminiService->transcribeMediaFromFile($fileData['uri']);

            // Complete
            $job->markCompleted($transcript);

            \Log::info('✅ Transcription completed', [
                'job_id' => $job->id,
                'transcript_length' => strlen($transcript),
            ]);

        } catch (\Exception $e) {
            \Log::error('❌ Async transcription error', [
                'job_id' => $job->id,
                'error' => $e->getMessage(),
            ]);

            $job->markFailed($e->getMessage());
        }
    }

    /**
     * Translate text to Arabic while preserving timestamps.
     */
    public function translateToArabic(Request $request, $lessonId)
    {
        $request->validate([
            'text' => 'required|string',
        ]);

        try {
            $translatedText = $this->geminiService->translateToArabicWithTimestamps($request->text);

            // Track usage
            $user = Auth::user();
            $usage = $user->usage ?: $user->getOrCreateUsage();
            $usage->incrementUsage('text_translation');

            return response()->json([
                'success' => true,
                'message' => 'تمت الترجمة بنجاح',
                'data' => [
                    'translated_text' => $translatedText,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء الترجمة: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Save transcription or translation as subtitle file.
     */
    public function saveAsSubtitle(Request $request, $lessonId)
    {
        $request->validate([
            'text' => 'required|string',
            'language' => 'required|string|max:10',
            'language_name' => 'required|string|max:50',
        ]);

        $lesson = Lesson::with('video')->findOrFail($lessonId);

        if (!$lesson->video) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد فيديو لهذا الدرس',
            ], 404);
        }

        try {
            DB::beginTransaction();

            // Convert text to VTT format
            $vttContent = $this->geminiService->convertToVTT($request->text);

            // Create temporary file
            $fileName = 'subtitle_' . time() . '_' . $request->language . '.vtt';
            $tempPath = sys_get_temp_dir() . '/' . $fileName;
            file_put_contents($tempPath, $vttContent);

            // Create UploadedFile instance
            $uploadedFile = new \Illuminate\Http\UploadedFile(
                $tempPath,
                $fileName,
                'text/vtt',
                null,
                true
            );

            // Validate subtitle
            $errors = $this->subtitleService->validateSubtitle($uploadedFile);
            if (!empty($errors)) {
                unlink($tempPath);
                return response()->json([
                    'success' => false,
                    'message' => 'فشل التحقق من ملف الترجمة',
                    'errors' => $errors,
                ], 422);
            }

            // Check if subtitle for this language already exists
            $existingSubtitle = $lesson->video->subtitles()
                ->where('language', $request->language)
                ->first();

            if ($existingSubtitle) {
                $existingSubtitle->delete();
            }

            // Store subtitle
            $subtitleData = $this->subtitleService->storeSubtitle(
                $uploadedFile,
                $lesson->video->id,
                $request->language
            );

            // Create subtitle record
            $subtitle = $lesson->video->subtitles()->create([
                'language' => $request->language,
                'language_name' => $request->language_name,
                'file_name' => $subtitleData['file_name'],
                'file_path' => $subtitleData['file_path'],
                'file_size' => $subtitleData['file_size'],
            ]);

            // Clean up temp file
            @unlink($tempPath);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم حفظ الترجمة بنجاح',
                'data' => $subtitle,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'فشل حفظ الترجمة: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Summarize text using Gemini AI.
     */
    public function summarize(Request $request, $lessonId)
    {
        $request->validate([
            'text' => 'required|string',
        ]);

        try {
            $summary = $this->geminiService->summarizeText($request->text);

            return response()->json([
                'success' => true,
                'message' => 'تم التلخيص بنجاح',
                'data' => [
                    'summary' => $summary,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء التلخيص: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Detect language of text using Gemini AI.
     */
    public function detectLanguage(Request $request, $lessonId)
    {
        $request->validate([
            'text' => 'required|string',
        ]);

        try {
            $languageInfo = $this->geminiService->detectLanguage($request->text);

            return response()->json([
                'success' => true,
                'message' => 'تم تحديد اللغة بنجاح',
                'data' => [
                    'language_code' => $languageInfo['code'],
                    'language_name' => $languageInfo['name'],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديد اللغة: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Translate text to any language while preserving timestamps.
     */
    public function translate(Request $request, $lessonId)
    {
        $request->validate([
            'text' => 'required|string',
            'target_language' => 'required|string|max:10',
            'target_language_name' => 'required|string|max:50',
        ]);

        try {
            $translatedText = $this->geminiService->translateTextWithTimestamps(
                $request->text,
                $request->target_language,
                $request->target_language_name
            );

            // Track usage
            $user = Auth::user();
            $usage = $user->usage ?: $user->getOrCreateUsage();
            $usage->incrementUsage('text_translation');

            return response()->json([
                'success' => true,
                'message' => 'تمت الترجمة بنجاح',
                'data' => [
                    'translated_text' => $translatedText,
                    'target_language' => $request->target_language,
                    'target_language_name' => $request->target_language_name,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء الترجمة: ' . $e->getMessage(),
            ], 500);
        }
    }
}
