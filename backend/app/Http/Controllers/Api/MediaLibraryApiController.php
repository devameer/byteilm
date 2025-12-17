<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonVideo;
use App\Services\VideoProcessingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MediaLibraryApiController extends Controller
{
    protected VideoProcessingService $videoService;

    public function __construct(VideoProcessingService $videoService)
    {
        $this->videoService = $videoService;
    }

    /**
     * Get paginated list of videos in the media library with optional filters.
     */
    public function index(Request $request)
    {
        try {
            $allowedSorts = ['created_at', 'file_name', 'file_size'];
            $sort = $request->input('sort', 'created_at');
            $sort = in_array($sort, $allowedSorts, true) ? $sort : 'created_at';
            $direction = $request->input('direction', 'desc') === 'asc' ? 'asc' : 'desc';
            $perPage = (int) $request->input('per_page', 20);
            $perPage = $perPage > 0 ? min($perPage, 100) : 20;

            $query = LessonVideo::query()->with(['lesson:id,name']);

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($inner) use ($search) {
                    $inner->where('file_name', 'like', "%{$search}%")
                        ->orWhere('source_url', 'like', "%{$search}%");
                });
            }

            if ($request->filled('course_id')) {
                $courseId = $request->input('course_id');
                $query->whereHas('lesson', function ($lessonQuery) use ($courseId) {
                    $lessonQuery->where('course_id', $courseId);
                });
            }

            if ($request->filled('category_id')) {
                $categoryId = $request->input('category_id');
                if ($categoryId === '__uncategorized__') {
                    $query->whereHas('lesson', function ($lessonQuery) {
                        $lessonQuery->whereNull('lesson_category_id');
                    });
                } else {
                    $query->whereHas('lesson', function ($lessonQuery) use ($categoryId) {
                        $lessonQuery->where('lesson_category_id', $categoryId);
                    });
                }
            }

            $assigned = $request->boolean('assigned');
            $unassigned = $request->boolean('unassigned');

            if ($assigned && !$unassigned) {
                $query->whereNotNull('lesson_id');
            }

            if ($unassigned && !$assigned) {
                $query->whereNull('lesson_id');
            }

            $videos = $query
                ->orderBy($sort, $direction)
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $videos->items(),
                'meta' => [
                    'current_page' => $videos->currentPage(),
                    'per_page' => $videos->perPage(),
                    'total' => $videos->total(),
                    'last_page' => $videos->lastPage(),
                ],
            ]);
        } catch (\Throwable $e) {
            \Log::error('Media library index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'فشل تحميل مكتبة الوسائط: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Start chunked upload session for the media library.
     */
    public function startChunkedUpload(Request $request)
    {
        $request->validate([
            'file_name' => 'required|string',
            'file_size' => 'required|integer|min:1',
            'total_chunks' => 'required|integer|min:1',
            'file_type' => 'required|string',
        ]);

        $allowedMimes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm'];
        if (!in_array($request->file_type, $allowedMimes, true)) {
            return response()->json([
                'success' => false,
                'message' => 'نوع الفيديو غير مدعوم. الأنواع المدعومة: MP4, AVI, MOV, WMV, WebM',
            ], 422);
        }

        $uploadId = uniqid('upload_', true);

        cache()->put("upload_session_{$uploadId}", [
            'context' => 'library',
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
     * Upload one chunk for a library upload session.
     */
    public function uploadChunk(Request $request, $uploadId)
    {
        $request->validate([
            'chunk' => 'required|file',
            'chunk_index' => 'required|integer|min:0',
        ]);

        $session = cache()->get("upload_session_{$uploadId}");
        if (!$session || ($session['context'] ?? 'library') !== 'library') {
            return response()->json([
                'success' => false,
                'message' => 'جلسة الرفع غير موجودة أو منتهية الصلاحية',
            ], 404);
        }

        $chunkIndex = (int) $request->chunk_index;
        $totalChunks = (int) $session['total_chunks'];

        if ($chunkIndex < 0 || $chunkIndex >= $totalChunks) {
            return response()->json([
                'success' => false,
                'message' => 'رقم الجزء المرسل غير صالح',
            ], 422);
        }

        $tempDir = storage_path("app/temp/uploads/{$uploadId}");
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $request->file('chunk')->move($tempDir, "chunk_{$chunkIndex}");

        $session['uploaded_chunks'] = array_values(array_unique(array_merge(
            $session['uploaded_chunks'],
            [$chunkIndex]
        )));

        cache()->put("upload_session_{$uploadId}", $session, now()->addHours(24));

        return response()->json([
            'success' => true,
            'message' => 'تم رفع الجزء بنجاح',
            'uploaded_chunks' => count($session['uploaded_chunks']),
            'total_chunks' => $totalChunks,
        ]);
    }

    /**
     * Complete chunked upload, merge chunks, and create a library video.
     */
    public function completeChunkedUpload($uploadId)
    {
        $session = cache()->get("upload_session_{$uploadId}");
        if (!$session || ($session['context'] ?? 'library') !== 'library') {
            return response()->json([
                'success' => false,
                'message' => 'جلسة الرفع غير موجودة أو منتهية الصلاحية',
            ], 404);
        }

        $totalChunks = (int) $session['total_chunks'];
        if (count(array_unique($session['uploaded_chunks'])) !== $totalChunks) {
            return response()->json([
                'success' => false,
                'message' => 'لم يتم رفع جميع الأجزاء',
            ], 422);
        }

        $tempDir = storage_path("app/temp/uploads/{$uploadId}");
        if (!file_exists($tempDir)) {
            return response()->json([
                'success' => false,
                'message' => 'الملفات المؤقتة غير موجودة',
            ], 500);
        }

        $disk = config('filesystems.default');
        $extension = pathinfo($session['file_name'], PATHINFO_EXTENSION) ?: 'mp4';
        $fileName = uniqid('library_', true) . '_' . time() . '.' . $extension;
        $storagePath = "videos/library/{$fileName}";

        try {
            DB::beginTransaction();

            // Create temporary merged file
            $tempMergedPath = storage_path("app/temp/{$fileName}");
            $output = fopen($tempMergedPath, 'wb');

            for ($i = 0; $i < $totalChunks; $i++) {
                $chunkPath = "{$tempDir}/chunk_{$i}";
                if (!file_exists($chunkPath)) {
                    throw new \Exception("الجزء {$i} غير موجود");
                }

                $chunk = fopen($chunkPath, 'rb');
                stream_copy_to_stream($chunk, $output);
                fclose($chunk);
            }
            fclose($output);

            // Upload merged file to storage (S3 or local)
            $fileContent = file_get_contents($tempMergedPath);
            Storage::disk($disk)->put($storagePath, $fileContent);

            // Set permissions for S3
            if ($disk === 's3') {
                Storage::disk('s3')->setVisibility($storagePath, 'private');
            }

            // Get file size
            $fileSize = filesize($tempMergedPath);

            // Clean up temp files
            $this->cleanupTempFiles($tempDir);
            if (file_exists($tempMergedPath)) {
                unlink($tempMergedPath);
            }

            $videoData = [
                'lesson_id' => null,
                'file_name' => $session['file_name'],
                'file_path' => $storagePath,
                'file_size' => $fileSize,
                'mime_type' => $session['file_type'],
                'source_url' => null,
            ];

            try {
                $duration = $this->videoService->extractDuration($videoData['file_path']);
                if ($duration) {
                    $videoData['duration'] = $duration;
                }
            } catch (\Throwable $e) {
                // Ignore duration extraction errors
            }

            $video = LessonVideo::create($videoData)->fresh(['lesson', 'subtitles']);

            cache()->forget("upload_session_{$uploadId}");

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم رفع الفيديو بنجاح إلى مكتبة الوسائط',
                'data' => $video,
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            // Clean up on error
            if (isset($tempMergedPath) && file_exists($tempMergedPath)) {
                unlink($tempMergedPath);
            }
            if (isset($storagePath)) {
                Storage::disk($disk)->delete($storagePath);
            }
            $this->cleanupTempFiles($tempDir);

            return response()->json([
                'success' => false,
                'message' => 'فشل دمج الفيديو: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get chunked upload status.
     */
    public function getUploadStatus($uploadId)
    {
        $session = cache()->get("upload_session_{$uploadId}");
        if (!$session || ($session['context'] ?? 'library') !== 'library') {
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
     * Cancel chunked upload session.
     */
    public function cancelChunkedUpload($uploadId)
    {
        $session = cache()->get("upload_session_{$uploadId}");
        if ($session && ($session['context'] ?? 'library') === 'library') {
            $tempDir = storage_path("app/temp/uploads/{$uploadId}");
            $this->cleanupTempFiles($tempDir);
            cache()->forget("upload_session_{$uploadId}");
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء عملية الرفع',
        ]);
    }

    /**
     * Upload one or more videos into the media library.
     */
    public function store(Request $request)
    {
        $request->validate([
            'videos' => ['required', 'array', 'min:1', 'max:10'],
            'videos.*' => ['required', 'file', 'mimes:mp4,avi,mov,wmv,webm'],
        ], [
            'videos.required' => 'يرجى اختيار ملفات الفيديو',
            'videos.array' => 'صيغة الملفات المرسلة غير صحيحة',
            'videos.min' => 'يرجى اختيار ملف فيديو واحد على الأقل',
            'videos.max' => 'يمكن رفع 10 ملفات كحد أقصى في المرة الواحدة',
            'videos.*.required' => 'يرجى التأكد من اختيار ملفات صالحة',
            'videos.*.file' => 'عنصر المرفوع يجب أن يكون ملف فيديو',
            'videos.*.mimes' => 'نوع الفيديو غير مدعوم. الأنواع المدعومة: MP4, AVI, MOV, WMV, WebM',
        ]);

        if (!$request->hasFile('videos')) {
            return response()->json([
                'success' => false,
                'message' => 'لم يتم العثور على ملفات فيديو مرفوعة',
            ], 422);
        }

        $validationErrors = [];
        foreach ($request->file('videos') as $index => $file) {
            $errors = $this->videoService->validateVideo($file);
            if (!empty($errors)) {
                $validationErrors[$index] = $errors;
            }
        }

        if (!empty($validationErrors)) {
            return response()->json([
                'success' => false,
                'message' => 'فشل التحقق من بعض ملفات الفيديو',
                'errors' => $validationErrors,
            ], 422);
        }

        $createdVideos = [];
        $storedPaths = [];

        try {
            DB::beginTransaction();

            foreach ($request->file('videos') as $file) {
                $videoData = $this->videoService->storeVideo($file, null);
                $storedPaths[] = $videoData['file_path'];
                $videoData['lesson_id'] = null;
                $videoData['source_url'] = null;

                try {
                    $duration = $this->videoService->extractDuration($videoData['file_path']);
                    if ($duration) {
                        $videoData['duration'] = $duration;
                    }
                } catch (\Throwable $e) {
                    // Ignore duration extraction errors
                }

                $video = LessonVideo::create($videoData);
                $createdVideos[] = $video->fresh(['lesson', 'subtitles']);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            foreach ($storedPaths as $path) {
                $this->videoService->deleteVideo($path);
            }
            return response()->json([
                'success' => false,
                'message' => 'فشل رفع الفيديوهات: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم رفع الفيديوهات إلى مكتبة الوسائط بنجاح',
            'data' => $createdVideos,
        ], 201);
    }

    /**
     * Assign a library video to a lesson.
     */
    public function assign(Request $request, LessonVideo $video)
    {
        $request->validate([
            'lesson_id' => ['required', 'exists:lessons,id'],
        ], [
            'lesson_id.required' => 'يرجى اختيار الدرس المراد ربط الفيديو به',
            'lesson_id.exists' => 'الدرس المحدد غير موجود',
        ]);

        $lesson = Lesson::findOrFail($request->input('lesson_id'));

        try {
            DB::beginTransaction();

            $currentLessonVideo = $lesson->video;
            if ($currentLessonVideo && $currentLessonVideo->id !== $video->id) {
                $currentLessonVideo->lesson_id = null;
                $currentLessonVideo->save();
            }

            $video->lesson_id = $lesson->id;
            $video->save();

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'فشل ربط الفيديو بالدرس: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم ربط الفيديو بالدرس بنجاح',
            'data' => $video->fresh(['lesson', 'subtitles']),
        ]);
    }

    /**
     * Detach a video from its associated lesson (keeps it in the library).
     */
    public function detach(LessonVideo $video)
    {
        if ($video->lesson_id === null) {
            return response()->json([
                'success' => false,
                'message' => 'الفيديو غير مرتبط بأي درس',
            ], 422);
        }

        $video->lesson_id = null;
        $video->save();

        return response()->json([
            'success' => true,
            'message' => 'تم فصل الفيديو عن الدرس مع الاحتفاظ به في المكتبة',
            'data' => $video->fresh(['lesson', 'subtitles']),
        ]);
    }

    /**
     * Remove a video from the media library entirely.
     */
    public function destroy(LessonVideo $video)
    {
        $video->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الفيديو من مكتبة الوسائط',
        ]);
    }

    /**
     * Clean up temporary chunk files.
     */
    private function cleanupTempFiles(string $directory): void
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
        @rmdir($directory);
    }
}
