<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Service for extracting audio from video files using FFmpeg.
 * 
 * This service uses the php-ffmpeg library to extract audio tracks
 * from video files for transcription purposes.
 */
class AudioExtractionService
{
    /**
     * FFmpeg instance
     */
    private $ffmpeg;

    /**
     * FFProbe instance
     */
    private $ffprobe;

    /**
     * Maximum audio duration in seconds (20 minutes = ~15MB MP3)
     */
    private int $maxDurationSeconds = 1200;

    /**
     * Audio bitrate for extraction (128kbps for good quality/size balance)
     */
    private int $audioBitrate = 128000;

    public function __construct()
    {
        $this->initializeFFmpeg();
    }

    /**
     * Initialize FFmpeg with proper configuration
     */
    private function initializeFFmpeg(): void
    {
        try {
            // Try to find FFmpeg binaries
            $ffmpegPath = $this->findExecutable('ffmpeg');
            $ffprobePath = $this->findExecutable('ffprobe');

            if ($ffmpegPath && $ffprobePath) {
                $this->ffmpeg = \FFMpeg\FFMpeg::create([
                    'ffmpeg.binaries' => $ffmpegPath,
                    'ffprobe.binaries' => $ffprobePath,
                    'timeout' => 3600, // 1 hour
                    'ffmpeg.threads' => 4,
                ]);
                $this->ffprobe = \FFMpeg\FFProbe::create([
                    'ffprobe.binaries' => $ffprobePath,
                ]);
            } else {
                // Try default system paths
                $this->ffmpeg = \FFMpeg\FFMpeg::create();
                $this->ffprobe = \FFMpeg\FFProbe::create();
            }
        } catch (Exception $e) {
            Log::error('FFmpeg initialization failed', ['error' => $e->getMessage()]);
            throw new Exception('فشل في تهيئة FFmpeg. تأكد من تثبيته على السيرفر.');
        }
    }

    /**
     * Find executable path for FFmpeg/FFprobe
     */
    private function findExecutable(string $name): ?string
    {
        // Common paths to check
        $paths = [
            // Windows
            "C:\\ffmpeg\\bin\\{$name}.exe",
            "C:\\Program Files\\ffmpeg\\bin\\{$name}.exe",
            getenv('FFMPEG_PATH') ?: '',
            // Linux/Mac
            "/usr/bin/{$name}",
            "/usr/local/bin/{$name}",
            "/opt/homebrew/bin/{$name}",
        ];

        foreach ($paths as $path) {
            if (!empty($path) && file_exists($path)) {
                return $path;
            }
        }

        // Try system path
        $command = PHP_OS_FAMILY === 'Windows' ? "where {$name}" : "which {$name}";
        $result = @shell_exec($command);

        if ($result) {
            $path = trim(explode("\n", $result)[0]);
            if (file_exists($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Extract audio from video file.
     * 
     * @param string $videoPath Path to video file (relative to storage disk)
     * @param string|null $disk Storage disk name (null = default)
     * @return array Contains: path (temp file path), duration, size, mime_type
     */
    public function extractAudioFromVideo(string $videoPath, ?string $disk = null): array
    {
        $disk = $disk ?? config('filesystems.default');

        Log::info('🎵 Starting audio extraction', [
            'video_path' => $videoPath,
            'disk' => $disk,
        ]);

        // Download video to temp if on S3
        $localVideoPath = $this->getLocalVideoPath($videoPath, $disk);

        try {
            // Get video duration
            $videoDuration = $this->getVideoDuration($localVideoPath);
            $extractDuration = min($videoDuration, $this->maxDurationSeconds);

            Log::info('📊 Video info', [
                'total_duration' => $videoDuration,
                'extract_duration' => $extractDuration,
                'will_truncate' => $videoDuration > $this->maxDurationSeconds,
            ]);

            // Create temp file for audio
            $tempAudioPath = sys_get_temp_dir() . '/audio_' . Str::random(10) . '.mp3';

            // Open video with FFmpeg
            $video = $this->ffmpeg->open($localVideoPath);

            // Extract audio
            $audioFormat = new \FFMpeg\Format\Audio\Mp3();
            $audioFormat->setAudioKiloBitrate(128);

            // Apply duration limit if needed
            if ($extractDuration < $videoDuration) {
                $video->filters()->clip(
                    \FFMpeg\Coordinate\TimeCode::fromSeconds(0),
                    \FFMpeg\Coordinate\TimeCode::fromSeconds($extractDuration)
                );
            }

            // Save audio
            $video->save($audioFormat, $tempAudioPath);

            // Get extracted audio info
            $audioSize = filesize($tempAudioPath);

            Log::info('✅ Audio extraction completed', [
                'audio_path' => $tempAudioPath,
                'audio_size' => number_format($audioSize / 1024 / 1024, 2) . ' MB',
                'duration' => $extractDuration,
            ]);

            return [
                'path' => $tempAudioPath,
                'duration' => $extractDuration,
                'size' => $audioSize,
                'mime_type' => 'audio/mpeg',
                'truncated' => $videoDuration > $this->maxDurationSeconds,
                'original_duration' => $videoDuration,
            ];

        } finally {
            // Cleanup temp video file if downloaded from S3
            if ($disk === 's3' && isset($localVideoPath) && file_exists($localVideoPath)) {
                @unlink($localVideoPath);
            }
        }
    }

    /**
     * Get local path to video, downloading from S3 if necessary.
     */
    private function getLocalVideoPath(string $videoPath, string $disk): string
    {
        if ($disk === 's3') {
            // Download from S3 to temp
            $tempPath = sys_get_temp_dir() . '/video_' . Str::random(10) . '.mp4';

            Log::info('📥 Downloading video from S3 to temp', ['temp_path' => $tempPath]);

            $stream = Storage::disk('s3')->readStream($videoPath);
            if (!$stream) {
                throw new Exception('فشل في قراءة الفيديو من S3');
            }

            $localFile = fopen($tempPath, 'wb');
            stream_copy_to_stream($stream, $localFile);
            fclose($localFile);
            fclose($stream);

            return $tempPath;
        }

        // Local storage - return full path
        return Storage::disk($disk)->path($videoPath);
    }

    /**
     * Get video duration in seconds.
     */
    private function getVideoDuration(string $videoPath): float
    {
        try {
            $duration = $this->ffprobe
                ->format($videoPath)
                ->get('duration');

            return (float) $duration;
        } catch (Exception $e) {
            Log::warning('Could not get video duration', ['error' => $e->getMessage()]);
            return $this->maxDurationSeconds; // Default to max
        }
    }

    /**
     * Cleanup temporary audio file.
     */
    public function cleanup(string $audioPath): void
    {
        if (file_exists($audioPath)) {
            @unlink($audioPath);
        }
    }

    /**
     * Check if FFmpeg is available.
     */
    public function isAvailable(): bool
    {
        return $this->ffmpeg !== null && $this->ffprobe !== null;
    }

    /**
     * Get maximum duration limit.
     */
    public function getMaxDurationSeconds(): int
    {
        return $this->maxDurationSeconds;
    }

    /**
     * Extract audio optimized for Google Speech-to-Text.
     * Produces Mono WAV at 16kHz - optimal for STT accuracy.
     * 
     * @param string $videoPath Path to video file (relative to storage disk)
     * @param string|null $disk Storage disk name (null = default)
     * @param int|null $maxDuration Maximum duration in seconds (null = 60 minutes)
     * @return array Contains: path, duration, size, mime_type, sample_rate
     */
    public function extractAudioForSTT(string $videoPath, ?string $disk = null, ?int $maxDuration = null): array
    {
        $disk = $disk ?? config('filesystems.default');
        // Default 60 seconds for sync STT to stay under 10MB limit
        $maxDuration = $maxDuration ?? 60;

        Log::info('🎵 Starting STT audio extraction (Mono FLAC 16kHz)', [
            'video_path' => $videoPath,
            'disk' => $disk,
            'max_duration' => $maxDuration,
        ]);

        // Download video to temp if on S3
        $localVideoPath = $this->getLocalVideoPath($videoPath, $disk);

        try {
            // Get video duration
            $videoDuration = $this->getVideoDuration($localVideoPath);
            $extractDuration = min($videoDuration, $maxDuration);

            Log::info('📊 Video info for STT', [
                'total_duration' => $videoDuration,
                'extract_duration' => $extractDuration,
                'will_truncate' => $videoDuration > $maxDuration,
            ]);

            // Create temp file for audio (FLAC format - 50% smaller than WAV)
            $tempAudioPath = sys_get_temp_dir() . '/stt_audio_' . Str::random(10) . '.flac';

            // Use FFmpeg directly for better control
            $ffmpegPath = $this->findExecutable('ffmpeg') ?? 'ffmpeg';

            // Build FFmpeg command for STT-optimized FLAC
            // -vn: no video
            // -ac 1: mono
            // -ar 16000: 16kHz sample rate
            // -c:a flac: FLAC codec (lossless but compressed)
            // -t: duration limit
            $command = sprintf(
                '%s -i %s -vn -ac 1 -ar 16000 -c:a flac -t %d %s -y 2>&1',
                escapeshellarg($ffmpegPath),
                escapeshellarg($localVideoPath),
                $extractDuration,
                escapeshellarg($tempAudioPath)
            );

            $output = shell_exec($command);

            if (!file_exists($tempAudioPath)) {
                Log::error('FFmpeg STT extraction failed', ['output' => $output]);
                throw new Exception('فشل في استخراج الصوت للتفريغ');
            }

            $audioSize = filesize($tempAudioPath);

            Log::info('✅ STT audio extraction completed', [
                'audio_path' => $tempAudioPath,
                'audio_size' => number_format($audioSize / 1024 / 1024, 2) . ' MB',
                'duration' => $extractDuration,
                'format' => 'FLAC Mono 16kHz',
            ]);

            return [
                'path' => $tempAudioPath,
                'duration' => $extractDuration,
                'size' => $audioSize,
                'mime_type' => 'audio/flac',
                'sample_rate' => 16000,
                'channels' => 1,
                'encoding' => 'FLAC',
                'truncated' => $videoDuration > $maxDuration,
                'original_duration' => $videoDuration,
            ];

        } finally {
            // Cleanup temp video file if downloaded from S3
            if ($disk === 's3' && isset($localVideoPath) && file_exists($localVideoPath)) {
                @unlink($localVideoPath);
            }
        }
    }
}
