<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

/**
 * Google Cloud Speech-to-Text V2 Service
 * 
 * Provides accurate transcription with word-level timestamps.
 * Supports both synchronous (short audio) and asynchronous (long audio) recognition.
 */
class GoogleSpeechToTextService
{
    /**
     * Google Cloud Project ID
     */
    private string $projectId;

    /**
     * Service Account credentials path
     */
    private string $credentialsPath;

    /**
     * API Base URL
     */
    private string $baseUrl = 'https://speech.googleapis.com/v2';

    /**
     * Maximum audio duration for sync recognition (60 seconds)
     */
    private int $maxSyncDuration = 60;

    /**
     * Language code for recognition
     */
    private string $languageCode = 'en-US'; // English (US)

    public function __construct()
    {
        $this->projectId = config('services.google.project_id', env('GOOGLE_CLOUD_PROJECT_ID'));
        $credentialsPath = config('services.google.credentials', env('GOOGLE_APPLICATION_CREDENTIALS'));

        // Support relative paths (resolve from Laravel base path)
        if ($credentialsPath && !str_starts_with($credentialsPath, '/') && !preg_match('/^[A-Z]:/i', $credentialsPath)) {
            $this->credentialsPath = base_path($credentialsPath);
        } else {
            $this->credentialsPath = $credentialsPath;
        }

        if (empty($this->projectId)) {
            throw new Exception('GOOGLE_CLOUD_PROJECT_ID is not configured');
        }
    }

    /**
     * Get OAuth2 access token from service account
     */
    private function getAccessToken(): string
    {
        // Cache the token for 50 minutes (tokens are valid for 60 minutes)
        return Cache::remember('google_stt_access_token', 3000, function () {
            if (!file_exists($this->credentialsPath)) {
                throw new Exception("Service account credentials file not found: {$this->credentialsPath}");
            }

            $credentials = json_decode(file_get_contents($this->credentialsPath), true);

            // Create JWT
            $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));

            $now = time();
            $claims = [
                'iss' => $credentials['client_email'],
                'scope' => 'https://www.googleapis.com/auth/cloud-platform',
                'aud' => 'https://oauth2.googleapis.com/token',
                'iat' => $now,
                'exp' => $now + 3600,
            ];
            $payload = base64_encode(json_encode($claims));

            // Sign with private key
            $privateKey = openssl_pkey_get_private($credentials['private_key']);
            $signature = '';
            openssl_sign("$header.$payload", $signature, $privateKey, OPENSSL_ALGO_SHA256);
            $jwt = "$header.$payload." . base64_encode($signature);

            // Exchange JWT for access token
            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            if (!$response->successful()) {
                throw new Exception('Failed to get access token: ' . $response->body());
            }

            return $response->json()['access_token'];
        });
    }

    /**
     * Synchronous recognition for short audio (< 60 seconds)
     * 
     * @param string $audioPath Path to audio file (WAV or FLAC)
     * @param string|null $languageCode Override language code
     * @return array Contains 'transcript', 'words', 'segments', 'vtt'
     */
    public function recognizeSync(string $audioPath, ?string $languageCode = null): array
    {
        $languageCode = $languageCode ?? $this->languageCode;

        Log::info('🎤 Starting Google STT sync recognition', [
            'audio_path' => $audioPath,
            'language' => $languageCode,
        ]);

        if (!file_exists($audioPath)) {
            throw new Exception("Audio file not found: {$audioPath}");
        }

        $audioContent = base64_encode(file_get_contents($audioPath));
        $accessToken = $this->getAccessToken();

        // Use the default recognizer
        $recognizerPath = "projects/{$this->projectId}/locations/global/recognizers/_";
        $url = "{$this->baseUrl}/{$recognizerPath}:recognize";

        $response = Http::withToken($accessToken)
            ->timeout(120)
            ->post($url, [
                'config' => [
                    'languageCodes' => [$languageCode],
                    'model' => 'long', // or 'chirp_2' for best quality
                    'features' => [
                        'enableWordTimeOffsets' => true,
                        'enableAutomaticPunctuation' => true,
                    ],
                    'autoDecodingConfig' => new \stdClass(), // Auto-detect encoding
                ],
                'content' => $audioContent,
            ]);

        if (!$response->successful()) {
            Log::error('Google STT API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new Exception('فشل في التفريغ: ' . $response->body());
        }

        $data = $response->json();
        return $this->processRecognitionResult($data);
    }

    /**
     * Asynchronous recognition for long audio (> 60 seconds)
     * Audio must be uploaded to Google Cloud Storage first.
     * 
     * @param string $gcsUri GCS URI (gs://bucket/path/to/audio.wav)
     * @param string|null $languageCode Override language code
     * @return string Operation ID for status checking
     */
    public function recognizeAsync(string $gcsUri, ?string $languageCode = null): string
    {
        $languageCode = $languageCode ?? $this->languageCode;

        Log::info('🎤 Starting Google STT async recognition', [
            'gcs_uri' => $gcsUri,
            'language' => $languageCode,
        ]);

        $accessToken = $this->getAccessToken();

        // Use batch recognize for long audio
        $recognizerPath = "projects/{$this->projectId}/locations/global/recognizers/_";
        $url = "{$this->baseUrl}/{$recognizerPath}:batchRecognize";

        $response = Http::withToken($accessToken)
            ->timeout(60)
            ->post($url, [
                'config' => [
                    'languageCodes' => [$languageCode],
                    'model' => 'long',
                    'features' => [
                        'enableWordTimeOffsets' => true,
                        'enableAutomaticPunctuation' => true,
                    ],
                    'autoDecodingConfig' => new \stdClass(),
                ],
                'files' => [
                    [
                        'uri' => $gcsUri,
                    ]
                ],
                'recognitionOutputConfig' => [
                    'inlineResponseConfig' => new \stdClass(),
                ],
            ]);

        if (!$response->successful()) {
            Log::error('Google STT batch API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new Exception('فشل في بدء التفريغ غير المتزامن: ' . $response->body());
        }

        $data = $response->json();
        $operationName = $data['name'] ?? null;

        if (!$operationName) {
            throw new Exception('No operation ID returned');
        }

        Log::info('✅ Async recognition started', ['operation' => $operationName]);
        return $operationName;
    }

    /**
     * Check status of async recognition operation
     * 
     * @param string $operationName Operation ID from recognizeAsync
     * @return array|null Result if complete, null if still processing
     */
    public function getAsyncResult(string $operationName): ?array
    {
        $accessToken = $this->getAccessToken();
        $url = "{$this->baseUrl}/{$operationName}";

        $response = Http::withToken($accessToken)
            ->timeout(30)
            ->get($url);

        if (!$response->successful()) {
            throw new Exception('Failed to check operation status: ' . $response->body());
        }

        $data = $response->json();

        if (!($data['done'] ?? false)) {
            Log::info('⏳ Async recognition still processing', [
                'operation' => $operationName,
            ]);
            return null;
        }

        if (isset($data['error'])) {
            throw new Exception('Recognition failed: ' . json_encode($data['error']));
        }

        // Extract results from batch response
        $results = $data['response']['results'] ?? [];
        return $this->processRecognitionResult(['results' => $results]);
    }

    /**
     * Process recognition result and extract words with timestamps
     */
    private function processRecognitionResult(array $data): array
    {
        $allWords = [];
        $fullTranscript = '';

        $results = $data['results'] ?? [];

        foreach ($results as $result) {
            $alternatives = $result['alternatives'] ?? [];
            if (empty($alternatives))
                continue;

            $best = $alternatives[0];
            $fullTranscript .= ($best['transcript'] ?? '') . ' ';

            $words = $best['words'] ?? [];
            foreach ($words as $word) {
                $allWords[] = [
                    'word' => $word['word'] ?? '',
                    'start' => $this->parseOffset($word['startOffset'] ?? '0s'),
                    'end' => $this->parseOffset($word['endOffset'] ?? '0s'),
                ];
            }
        }

        $fullTranscript = trim($fullTranscript);
        $segments = $this->wordsToSegments($allWords);
        $vtt = $this->wordsToVTT($allWords);

        Log::info('✅ Recognition result processed', [
            'word_count' => count($allWords),
            'transcript_length' => strlen($fullTranscript),
        ]);

        return [
            'transcript' => $fullTranscript,
            'words' => $allWords,
            'segments' => $segments,
            'vtt' => $vtt,
        ];
    }

    /**
     * Parse time offset string (e.g., "1.500s") to seconds
     */
    private function parseOffset(string $offset): float
    {
        return (float) str_replace('s', '', $offset);
    }

    /**
     * Convert word timestamps to segments with [HH:MM:SS] format
     * 
     * @param array $words Array of words with start/end times
     * @param int $segmentDuration Max duration per segment in seconds
     * @return string Formatted transcript with timestamps
     */
    public function wordsToSegments(array $words, int $segmentDuration = 5): string
    {
        if (empty($words)) {
            return '';
        }

        $segments = [];
        $currentSegment = [];
        $segmentStart = $words[0]['start'] ?? 0;

        foreach ($words as $word) {
            $wordStart = $word['start'];

            // Check if we need to start a new segment
            if (($wordStart - $segmentStart) >= $segmentDuration && !empty($currentSegment)) {
                $segments[] = [
                    'start' => $segmentStart,
                    'text' => implode(' ', array_column($currentSegment, 'word')),
                ];
                $currentSegment = [];
                $segmentStart = $wordStart;
            }

            $currentSegment[] = $word;
        }

        // Add remaining words
        if (!empty($currentSegment)) {
            $segments[] = [
                'start' => $segmentStart,
                'text' => implode(' ', array_column($currentSegment, 'word')),
            ];
        }

        // Format segments
        $output = '';
        foreach ($segments as $segment) {
            $timestamp = $this->secondsToTimestamp($segment['start']);
            $output .= "[{$timestamp}] {$segment['text']}\n";
        }

        return trim($output);
    }

    /**
     * Convert word timestamps to VTT format
     */
    public function wordsToVTT(array $words, int $segmentDuration = 5): string
    {
        if (empty($words)) {
            return "WEBVTT\n\n";
        }

        $vtt = "WEBVTT\n\n";
        $counter = 1;

        $segments = [];
        $currentSegment = [];
        $segmentStart = $words[0]['start'] ?? 0;
        $segmentEnd = $segmentStart;

        foreach ($words as $word) {
            $wordStart = $word['start'];
            $wordEnd = $word['end'];

            // Check if we need to start a new segment
            if (($wordStart - $segmentStart) >= $segmentDuration && !empty($currentSegment)) {
                $segments[] = [
                    'start' => $segmentStart,
                    'end' => $segmentEnd,
                    'text' => implode(' ', array_column($currentSegment, 'word')),
                ];
                $currentSegment = [];
                $segmentStart = $wordStart;
            }

            $currentSegment[] = $word;
            $segmentEnd = $wordEnd;
        }

        // Add remaining words
        if (!empty($currentSegment)) {
            $segments[] = [
                'start' => $segmentStart,
                'end' => $segmentEnd,
                'text' => implode(' ', array_column($currentSegment, 'word')),
            ];
        }

        // Format as VTT
        foreach ($segments as $segment) {
            $startTime = $this->secondsToVTTTimestamp($segment['start']);
            $endTime = $this->secondsToVTTTimestamp($segment['end']);

            $vtt .= "{$counter}\n";
            $vtt .= "{$startTime} --> {$endTime}\n";
            $vtt .= "{$segment['text']}\n\n";
            $counter++;
        }

        return $vtt;
    }

    /**
     * Convert seconds to [HH:MM:SS] format
     */
    private function secondsToTimestamp(float $seconds): string
    {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $secs = floor($seconds % 60);

        return sprintf('%02d:%02d:%02d', $hours, $minutes, $secs);
    }

    /**
     * Convert seconds to VTT timestamp format (HH:MM:SS.mmm)
     */
    private function secondsToVTTTimestamp(float $seconds): string
    {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $secs = $seconds - ($hours * 3600) - ($minutes * 60);

        return sprintf('%02d:%02d:%06.3f', $hours, $minutes, $secs);
    }

    /**
     * Get maximum sync duration
     */
    public function getMaxSyncDuration(): int
    {
        return $this->maxSyncDuration;
    }

    /**
     * Check if audio duration is suitable for sync recognition
     */
    public function shouldUseAsync(float $durationSeconds): bool
    {
        return $durationSeconds > $this->maxSyncDuration;
    }
}
