<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class SubtitleController extends Controller
{
    protected GeminiService $geminiService;

    public function __construct(GeminiService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    /**
     * Upload video and store it
     */
    public function uploadVideo(Request $request, $lessonId)
    {
        $request->validate([
            'video' => 'required|file|mimes:mp4,avi,mov,wmv,flv,mkv|max:512000' // max 500MB
        ]);

        try {
            $lesson = Lesson::findOrFail($lessonId);

            // Delete old video if exists
            if ($lesson->video_path && Storage::exists($lesson->video_path)) {
                Storage::delete($lesson->video_path);
            }

            // Store the video
            $path = $request->file('video')->store('lesson_videos', 'public');

            // Update lesson with video path
            $lesson->video_path = $path;
            $lesson->save();

            return response()->json([
                'success' => true,
                'message' => 'تم رفع الفيديو بنجاح',
                'video_path' => $path
            ]);
        } catch (\Exception $e) {
            Log::error('Video upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء رفع الفيديو: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Transcribe video to text with timestamps
     */
    public function transcribe(Request $request, $lessonId)
    {
        try {
            $lesson = Lesson::findOrFail($lessonId);

            // Check if video exists
            if (!$lesson->video_path || !Storage::exists($lesson->video_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'لم يتم العثور على ملف الفيديو. الرجاء رفع الفيديو أولاً.'
                ], 404);
            }

            // Get video file
            $videoPath = Storage::path($lesson->video_path);
            $videoContent = file_get_contents($videoPath);
            $base64Video = base64_encode($videoContent);

            // Get MIME type
            $mimeType = Storage::mimeType($lesson->video_path);

            // Transcribe using Gemini
            $transcript = $this->geminiService->transcribeMedia($base64Video, $mimeType);

            return response()->json([
                'success' => true,
                'transcript' => $transcript,
                'message' => 'تم التفريغ بنجاح'
            ]);
        } catch (\Exception $e) {
            Log::error('Transcription error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء التفريغ: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Translate transcription to Arabic while preserving timestamps
     */
    public function translateToArabic(Request $request)
    {
        $request->validate([
            'text' => 'required|string'
        ]);

        try {
            $translatedText = $this->geminiService->translateToArabicWithTimestamps($request->text);

            return response()->json([
                'success' => true,
                'translated_text' => $translatedText,
                'message' => 'تمت الترجمة بنجاح'
            ]);
        } catch (\Exception $e) {
            Log::error('Translation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء الترجمة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Convert text to VTT format and download
     */
    public function downloadVTT(Request $request, $lessonId)
    {
        $request->validate([
            'text' => 'required|string',
            'type' => 'required|in:original,translated'
        ]);

        try {
            $lesson = Lesson::findOrFail($lessonId);

            // Convert to VTT format
            $vttContent = $this->geminiService->convertToVTT($request->text);

            // Generate filename
            $filename = $lesson->name . '_' . $request->type . '_subtitles.vtt';
            $filename = preg_replace('/[^a-z0-9_.-]/i', '_', $filename);

            return response($vttContent)
                ->header('Content-Type', 'text/vtt; charset=utf-8')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Exception $e) {
            Log::error('VTT download error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء ملف VTT: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Transcribe from uploaded video file (for direct upload without saving)
     */
    public function transcribeUploadedFile(Request $request)
    {
        $request->validate([
            'video' => 'required|file|mimes:mp4,avi,mov,wmv,flv,mkv|max:512000' // max 500MB
        ]);

        try {
            $videoFile = $request->file('video');
            $videoContent = file_get_contents($videoFile->getRealPath());
            $base64Video = base64_encode($videoContent);
            $mimeType = $videoFile->getMimeType();

            // Transcribe using Gemini
            $transcript = $this->geminiService->transcribeMedia($base64Video, $mimeType);

            return response()->json([
                'success' => true,
                'transcript' => $transcript,
                'message' => 'تم التفريغ بنجاح'
            ]);
        } catch (\Exception $e) {
            Log::error('Direct transcription error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء التفريغ: ' . $e->getMessage()
            ], 500);
        }
    }
}
