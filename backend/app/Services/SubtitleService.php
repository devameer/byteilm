<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SubtitleService
{
    /**
     * Allowed subtitle file extensions.
     */
    protected array $allowedExtensions = ['srt', 'vtt'];

    /**
     * Maximum file size in bytes (5MB).
     */
    protected int $maxFileSize = 5242880;

    /**
     * Validate subtitle file.
     */
    public function validateSubtitle(UploadedFile $file): array
    {
        $errors = [];

        // Check file size
        if ($file->getSize() > $this->maxFileSize) {
            $errors[] = 'حجم ملف الترجمة يجب أن لا يتجاوز 5 ميجابايت.';
        }

        // Check extension
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $this->allowedExtensions)) {
            $errors[] = 'نوع ملف الترجمة غير مدعوم. الأنواع المدعومة: SRT, VTT';
        }

        // Check if file is valid
        if (!$file->isValid()) {
            $errors[] = 'الملف غير صالح أو تم رفعه بشكل غير صحيح.';
        }

        // Validate SRT format
        if ($extension === 'srt' && empty($errors)) {
            $content = file_get_contents($file->getRealPath());
            if (!$this->isValidSrtFormat($content)) {
                $errors[] = 'تنسيق ملف SRT غير صحيح.';
            }
        }

        return $errors;
    }

    /**
     * Validate SRT file format.
     */
    protected function isValidSrtFormat(string $content): bool
    {
        // Basic SRT format validation
        // SRT format: number, timestamp, text, blank line
        $pattern = '/^\d+\s+\d{2}:\d{2}:\d{2},\d{3}\s-->\s\d{2}:\d{2}:\d{2},\d{3}/m';
        return preg_match($pattern, $content) === 1;
    }

    /**
     * Store subtitle file and return path.
     */
    public function storeSubtitle(UploadedFile $file, int $lessonVideoId, string $language): array
    {
        // Generate unique file name
        $extension = $file->getClientOriginalExtension();
        $fileName = 'subtitle_' . $lessonVideoId . '_' . $language . '_' . Str::random(8) . '.' . $extension;

        // Determine which disk to use
        $disk = config('filesystems.default');

        // Store file in subtitles directory
        $path = $file->storeAs('subtitles', $fileName, $disk);

        // Set proper permissions for S3
        if ($disk === 's3') {
            Storage::disk('s3')->setVisibility($path, 'private');
        }

        return [
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
        ];
    }

    /**
     * Convert SRT to VTT format if needed.
     */
    public function convertSrtToVtt(string $srtContent): string
    {
        // Add VTT header
        $vtt = "WEBVTT\n\n";

        // Replace comma with dot in timestamps
        $vtt .= str_replace(',', '.', $srtContent);

        return $vtt;
    }

    /**
     * Get subtitle content.
     */
    public function getSubtitleContent(string $filePath): ?string
    {
        $disk = config('filesystems.default');

        if (Storage::disk($disk)->exists($filePath)) {
            return Storage::disk($disk)->get($filePath);
        }

        return null;
    }

    /**
     * Delete subtitle file.
     */
    public function deleteSubtitle(string $filePath): bool
    {
        $disk = config('filesystems.default');

        if (Storage::disk($disk)->exists($filePath)) {
            return Storage::disk($disk)->delete($filePath);
        }

        return false;
    }

    /**
     * Parse SRT file and return subtitles array.
     */
    public function parseSrtFile(string $content): array
    {
        $subtitles = [];
        $blocks = preg_split('/\n\s*\n/', trim($content));

        foreach ($blocks as $block) {
            $lines = explode("\n", trim($block));
            if (count($lines) >= 3) {
                $index = (int) $lines[0];
                $timestamp = $lines[1];
                $text = implode("\n", array_slice($lines, 2));

                $subtitles[] = [
                    'index' => $index,
                    'timestamp' => $timestamp,
                    'text' => $text,
                ];
            }
        }

        return $subtitles;
    }

    /**
     * Get supported languages.
     */
    public function getSupportedLanguages(): array
    {
        return [
            'ar' => 'العربية',
            'en' => 'English',
            'fr' => 'Français',
            'es' => 'Español',
            'de' => 'Deutsch',
        ];
    }
}
