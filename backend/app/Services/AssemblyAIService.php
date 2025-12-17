<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AssemblyAI Service for accurate audio transcription with word-level timestamps.
 * 
 * AssemblyAI provides much more accurate timestamps than Gemini (~400ms accuracy).
 */
class AssemblyAIService
{
    private string $apiKey;
    private string $baseUrl = 'https://api.assemblyai.com/v2';

    /**
     * Maximum polling attempts (30 seconds each = 15 minutes max)
     */
    private int $maxPollingAttempts = 30;

    /**
     * Polling interval in seconds
     */
    private int $pollingInterval = 10;

    public function __construct()
    {
        $this->apiKey = config('services.assemblyai.api_key', env('ASSEMBLYAI_API_KEY', ''));

        if (empty($this->apiKey)) {
            Log::warning('AssemblyAI API key not configured');
        }
    }

    /**
     * Check if service is available (API key configured)
     */
    public function isAvailable(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Transcribe audio from Base64 data.
     * 
     * @param string $base64Data Base64 encoded audio
     * @param string $mimeType Audio MIME type
     * @param string|null $languageCode Optional language code (e.g., 'ar', 'en')
     * @return array Contains 'text' (formatted transcript) and 'words' (word-level data)
     */
    public function transcribeFromBase64(string $base64Data, string $mimeType = 'audio/mpeg', ?string $languageCode = null): array
    {
        if (!$this->isAvailable()) {
            throw new Exception('AssemblyAI API key not configured. Add ASSEMBLYAI_API_KEY to .env');
        }

        Log::info('🎤 Starting AssemblyAI transcription', [
            'data_size' => strlen($base64Data),
            'mime_type' => $mimeType,
            'language' => $languageCode,
        ]);

        // Step 1: Upload audio to AssemblyAI
        $uploadUrl = $this->uploadAudio($base64Data);

        // Step 2: Start transcription
        $transcriptId = $this->startTranscription($uploadUrl, $languageCode);

        // Step 3: Poll for completion
        $result = $this->waitForCompletion($transcriptId);

        // Step 4: Format output with timestamps
        $formattedText = $this->formatTranscriptWithTimestamps($result);

        Log::info('✅ AssemblyAI transcription completed', [
            'transcript_length' => strlen($formattedText),
            'word_count' => count($result['words'] ?? []),
        ]);

        return [
            'text' => $formattedText,
            'words' => $result['words'] ?? [],
            'raw' => $result,
        ];
    }

    /**
     * Transcribe audio from URL.
     */
    public function transcribeFromUrl(string $audioUrl, ?string $languageCode = null): array
    {
        if (!$this->isAvailable()) {
            throw new Exception('AssemblyAI API key not configured');
        }

        Log::info('🎤 Starting AssemblyAI transcription from URL', [
            'url' => $audioUrl,
            'language' => $languageCode,
        ]);

        // Start transcription directly with URL
        $transcriptId = $this->startTranscription($audioUrl, $languageCode);

        // Poll for completion
        $result = $this->waitForCompletion($transcriptId);

        // Format output
        $formattedText = $this->formatTranscriptWithTimestamps($result);

        return [
            'text' => $formattedText,
            'words' => $result['words'] ?? [],
            'raw' => $result,
        ];
    }

    /**
     * Upload audio data to AssemblyAI.
     */
    private function uploadAudio(string $base64Data): string
    {
        Log::info('📤 Uploading audio to AssemblyAI...');

        $binaryData = base64_decode($base64Data);

        $response = Http::withHeaders([
            'Authorization' => $this->apiKey,
            'Content-Type' => 'application/octet-stream',
        ])
            ->timeout(120)
            ->withBody($binaryData, 'application/octet-stream')
            ->post("{$this->baseUrl}/upload");

        if (!$response->successful()) {
            Log::error('AssemblyAI upload failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new Exception('فشل في رفع الصوت إلى AssemblyAI: ' . $response->body());
        }

        $uploadUrl = $response->json('upload_url');

        Log::info('✅ Audio uploaded successfully', ['upload_url' => substr($uploadUrl, 0, 50) . '...']);

        return $uploadUrl;
    }

    /**
     * Start transcription job.
     */
    private function startTranscription(string $audioUrl, ?string $languageCode = null): string
    {
        Log::info('🚀 Starting transcription job...');

        $payload = [
            'audio_url' => $audioUrl,
            'word_boost' => [], // Can add specific words to boost recognition
            'punctuate' => true,
            'format_text' => true,
        ];

        // Language detection or specific language
        if ($languageCode) {
            // Map common codes to AssemblyAI format
            $languageMap = [
                'ar' => 'ar', // Arabic (not in standard list, but AssemblyAI may support)
                'en' => 'en',
                'es' => 'es',
                'fr' => 'fr',
                'de' => 'de',
                'it' => 'it',
                'pt' => 'pt',
                'nl' => 'nl',
                'hi' => 'hi',
                'ja' => 'ja',
                'zh' => 'zh',
                'ko' => 'ko',
                'tr' => 'tr',
                'ru' => 'ru',
                'uk' => 'uk',
                'vi' => 'vi',
                'pl' => 'pl',
            ];

            if (isset($languageMap[$languageCode])) {
                $payload['language_code'] = $languageMap[$languageCode];
            }
        } else {
            // Auto-detect language
            $payload['language_detection'] = true;
        }

        // Speaker diarization (identify different speakers)
        $payload['speaker_labels'] = true;

        $response = Http::withHeaders([
            'Authorization' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])
            ->timeout(30)
            ->post("{$this->baseUrl}/transcript", $payload);

        if (!$response->successful()) {
            Log::error('AssemblyAI transcription start failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new Exception('فشل في بدء التفريغ: ' . $response->body());
        }

        $transcriptId = $response->json('id');

        Log::info('✅ Transcription job started', ['transcript_id' => $transcriptId]);

        return $transcriptId;
    }

    /**
     * Poll for transcription completion.
     */
    private function waitForCompletion(string $transcriptId): array
    {
        Log::info('⏳ Waiting for transcription to complete...', ['transcript_id' => $transcriptId]);

        for ($attempt = 0; $attempt < $this->maxPollingAttempts; $attempt++) {
            $response = Http::withHeaders([
                'Authorization' => $this->apiKey,
            ])
                ->timeout(30)
                ->get("{$this->baseUrl}/transcript/{$transcriptId}");

            if (!$response->successful()) {
                throw new Exception('فشل في الحصول على حالة التفريغ');
            }

            $data = $response->json();
            $status = $data['status'] ?? 'unknown';

            Log::info("📊 Transcription status: {$status}", [
                'attempt' => $attempt + 1,
                'max_attempts' => $this->maxPollingAttempts,
            ]);

            if ($status === 'completed') {
                return $data;
            }

            if ($status === 'error') {
                $error = $data['error'] ?? 'Unknown error';
                throw new Exception("فشل التفريغ: {$error}");
            }

            // Wait before next poll
            sleep($this->pollingInterval);
        }

        throw new Exception('انتهت مهلة التفريغ. حاول مرة أخرى.');
    }

    /**
     * Format transcript with timestamps from word-level data.
     * Only shows speaker labels when there are multiple speakers.
     */
    private function formatTranscriptWithTimestamps(array $data): string
    {
        $words = $data['words'] ?? [];

        if (empty($words)) {
            return $data['text'] ?? '';
        }

        // First, check if there are multiple speakers
        $uniqueSpeakers = [];
        foreach ($words as $word) {
            $speaker = $word['speaker'] ?? null;
            if ($speaker !== null && !in_array($speaker, $uniqueSpeakers)) {
                $uniqueSpeakers[] = $speaker;
            }
        }
        $hasMultipleSpeakers = count($uniqueSpeakers) > 1;

        $lines = [];
        $currentLine = [];
        $currentLineStart = null;
        $lastEndTime = 0;
        $currentSpeaker = null;

        foreach ($words as $word) {
            $wordText = $word['text'] ?? '';
            $startMs = $word['start'] ?? 0;
            $endMs = $word['end'] ?? 0;
            $speaker = $word['speaker'] ?? null;

            // Check if we should start a new line
            $shouldStartNewLine = false;

            // New speaker (only if multiple speakers)
            if ($hasMultipleSpeakers && $speaker !== null && $speaker !== $currentSpeaker) {
                $shouldStartNewLine = true;
            }

            // Pause of more than 500ms
            if ($startMs - $lastEndTime > 500) {
                $shouldStartNewLine = true;
            }

            // Line is getting too long (more than 5 seconds)
            if ($currentLineStart !== null && ($startMs - $currentLineStart) > 5000) {
                $shouldStartNewLine = true;
            }

            // End of sentence (punctuation)
            if (!empty($currentLine)) {
                $lastWord = end($currentLine);
                if (preg_match('/[.!?؟。]$/', $lastWord)) {
                    $shouldStartNewLine = true;
                }
            }

            // Save current line and start new one
            if ($shouldStartNewLine && !empty($currentLine)) {
                $timestamp = $this->formatTimestamp($currentLineStart);
                $lineText = implode(' ', $currentLine);

                // Only add speaker label if there are multiple speakers
                if ($hasMultipleSpeakers && $currentSpeaker !== null) {
                    $lines[] = "[{$timestamp}] Speaker {$currentSpeaker}: {$lineText}";
                } else {
                    $lines[] = "[{$timestamp}] {$lineText}";
                }

                $currentLine = [];
                $currentLineStart = null;
            }

            // Add word to current line
            if ($currentLineStart === null) {
                $currentLineStart = $startMs;
            }
            $currentLine[] = $wordText;
            $lastEndTime = $endMs;
            $currentSpeaker = $speaker;
        }

        // Don't forget the last line
        if (!empty($currentLine)) {
            $timestamp = $this->formatTimestamp($currentLineStart);
            $lineText = implode(' ', $currentLine);

            if ($hasMultipleSpeakers && $currentSpeaker !== null) {
                $lines[] = "[{$timestamp}] Speaker {$currentSpeaker}: {$lineText}";
            } else {
                $lines[] = "[{$timestamp}] {$lineText}";
            }
        }

        return implode("\n", $lines);
    }

    /**
     * Convert milliseconds to HH:MM:SS format.
     */
    private function formatTimestamp(int $milliseconds): string
    {
        $seconds = floor($milliseconds / 1000);
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $secs = $seconds % 60;

        return sprintf('%02d:%02d:%02d', $hours, $minutes, $secs);
    }

    /**
     * Get supported languages.
     */
    public function getSupportedLanguages(): array
    {
        return [
            'en' => 'English',
            'es' => 'Spanish',
            'fr' => 'French',
            'de' => 'German',
            'it' => 'Italian',
            'pt' => 'Portuguese',
            'nl' => 'Dutch',
            'hi' => 'Hindi',
            'ja' => 'Japanese',
            'zh' => 'Chinese',
            'ko' => 'Korean',
            'tr' => 'Turkish',
            'ru' => 'Russian',
            'uk' => 'Ukrainian',
            'vi' => 'Vietnamese',
            'pl' => 'Polish',
            'ar' => 'Arabic (experimental)',
        ];
    }
}
