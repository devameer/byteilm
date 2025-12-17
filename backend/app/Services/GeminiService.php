<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private string $apiKey;
    private string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    private string $uploadBaseUrl = 'https://generativelanguage.googleapis.com/upload/v1beta';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');

        if (empty($this->apiKey)) {
            throw new Exception('Gemini API key is not configured');
        }
    }

    /**
     * Upload a file to Gemini File API from a URL using streaming (no memory bloat)
     * 
     * This method streams the video directly from source (S3/storage) to Gemini
     * without loading the entire file into PHP memory.
     */
    public function uploadFileFromUrl(string $videoUrl, string $mimeType, string $displayName = 'video'): array
    {
        try {
            // Step 1: Start resumable upload
            $startResponse = Http::timeout(60)
                ->withHeaders([
                    'X-Goog-Upload-Protocol' => 'resumable',
                    'X-Goog-Upload-Command' => 'start',
                    'X-Goog-Upload-Header-Content-Type' => $mimeType,
                ])
                ->post("{$this->uploadBaseUrl}/files?key={$this->apiKey}", [
                    'file' => [
                        'display_name' => $displayName
                    ]
                ]);

            if (!$startResponse->successful()) {
                Log::error('Gemini File API upload start error', [
                    'status' => $startResponse->status(),
                    'body' => $startResponse->body()
                ]);
                throw new Exception('فشل في بدء رفع الملف: ' . $startResponse->body());
            }

            $uploadUrl = $startResponse->header('X-Goog-Upload-URL');
            if (!$uploadUrl) {
                throw new Exception('لم يتم الحصول على رابط الرفع');
            }

            // Step 2: Get file size from source
            $headResponse = Http::timeout(30)->head($videoUrl);
            $fileSize = (int) ($headResponse->header('Content-Length') ?? 0);

            if ($fileSize == 0) {
                // Try getting file size from actual GET request headers
                Log::warning('Could not get file size from HEAD, trying GET...');
                $fileSize = $this->getFileSizeFromUrl($videoUrl);
            }

            Log::info('Starting streaming upload to Gemini', [
                'file_size' => number_format($fileSize / 1024 / 1024, 2) . ' MB',
                'display_name' => $displayName
            ]);

            // Step 3: Stream upload using cURL (memory efficient)
            $uploadResult = $this->streamUploadToGemini($videoUrl, $uploadUrl, $fileSize, $mimeType);

            if (!$uploadResult['success']) {
                throw new Exception('فشل في رفع الملف: ' . ($uploadResult['error'] ?? 'خطأ غير معروف'));
            }

            $fileData = $uploadResult['data'];

            if (!isset($fileData['file']['uri'])) {
                throw new Exception('لم يتم الحصول على معرف الملف');
            }

            // Step 4: Wait for file to be processed
            $fileUri = $fileData['file']['uri'];
            $fileName = $fileData['file']['name'] ?? '';

            // Poll file status until it's ACTIVE
            $maxAttempts = 60;
            $attempt = 0;

            while ($attempt < $maxAttempts) {
                $sleepTime = min(5, 2 + floor($attempt / 5));
                sleep($sleepTime);

                // Use cURL for more reliable timeout handling
                $statusResult = $this->checkFileStatus($fileName);

                if ($statusResult['success']) {
                    $state = $statusResult['state'];

                    Log::info("Gemini file processing status", [
                        'attempt' => $attempt + 1,
                        'state' => $state,
                        'file_name' => $fileName
                    ]);

                    if ($state === 'ACTIVE') {
                        return [
                            'uri' => $fileUri,
                            'name' => $fileName,
                            'mime_type' => $statusResult['mime_type'] ?? $mimeType,
                        ];
                    } elseif ($state === 'FAILED') {
                        throw new Exception('فشل معالجة الملف في Gemini');
                    }
                } else {
                    Log::warning("Status check failed, retrying...", ['attempt' => $attempt + 1]);
                }

                $attempt++;
            }

            throw new Exception('انتهت مهلة انتظار معالجة الملف. يرجى المحاولة مع فيديو أصغر.');
        } catch (Exception $e) {
            Log::error('Gemini file upload error: ' . $e->getMessage());
            throw new Exception('حدث خطأ أثناء رفع الملف: ' . $e->getMessage());
        }
    }

    /**
     * Check file status using cURL (more reliable timeout)
     */
    private function checkFileStatus(string $fileName): array
    {
        $url = "{$this->baseUrl}/{$fileName}?key={$this->apiKey}";

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15, // 15 second timeout
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300 && $response) {
            $data = json_decode($response, true);
            return [
                'success' => true,
                'state' => $data['file']['state'] ?? 'PROCESSING',
                'mime_type' => $data['file']['mimeType'] ?? null,
            ];
        }

        return ['success' => false, 'error' => $error ?: "HTTP $httpCode"];
    }

    /**
     * Stream upload video from source URL to Gemini using cURL (memory efficient)
     */
    private function streamUploadToGemini(string $sourceUrl, string $uploadUrl, int $fileSize, string $mimeType): array
    {
        $ch = curl_init();

        // Open source URL as a stream
        $sourceStream = fopen($sourceUrl, 'rb', false, stream_context_create([
            'http' => [
                'timeout' => 600,
                'ignore_errors' => true
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ]));

        if (!$sourceStream) {
            return ['success' => false, 'error' => 'فشل في فتح مصدر الفيديو'];
        }

        // Create a temp file to stream through (more reliable than direct stream)
        $tempFile = tmpfile();
        $tempPath = stream_get_meta_data($tempFile)['uri'];

        // Stream copy in chunks (8MB at a time)
        $chunkSize = 8 * 1024 * 1024;
        $bytesWritten = 0;
        $lastLoggedMB = 0;

        while (!feof($sourceStream)) {
            $chunk = fread($sourceStream, $chunkSize);
            if ($chunk === false)
                break;
            fwrite($tempFile, $chunk);
            $bytesWritten += strlen($chunk);

            // Log progress every 10MB
            $currentMB = floor($bytesWritten / (10 * 1024 * 1024));
            if ($currentMB > $lastLoggedMB) {
                Log::info('Download progress: ' . number_format($bytesWritten / 1024 / 1024, 1) . ' MB');
                $lastLoggedMB = $currentMB;
            }
        }
        fclose($sourceStream);


        // Rewind temp file for upload
        rewind($tempFile);
        $actualSize = $bytesWritten > 0 ? $bytesWritten : $fileSize;

        Log::info('Starting Gemini upload', ['size' => number_format($actualSize / 1024 / 1024, 2) . ' MB']);

        // Set up cURL for upload
        curl_setopt_array($ch, [
            CURLOPT_URL => $uploadUrl,
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 600,
            CURLOPT_HTTPHEADER => [
                'Content-Length: ' . $actualSize,
                'Content-Type: ' . $mimeType,
                'X-Goog-Upload-Offset: 0',
                'X-Goog-Upload-Command: upload, finalize',
            ],
            CURLOPT_INFILE => $tempFile,
            CURLOPT_INFILESIZE => $actualSize,
            CURLOPT_UPLOAD => true,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        fclose($tempFile);

        if ($httpCode >= 200 && $httpCode < 300) {
            $data = json_decode($response, true);
            return ['success' => true, 'data' => $data];
        }

        Log::error('Gemini upload failed', [
            'http_code' => $httpCode,
            'error' => $error,
            'response' => $response
        ]);

        return ['success' => false, 'error' => "HTTP $httpCode: $error"];
    }

    /**
     * Get file size from URL by reading Content-Length from GET response
     */
    private function getFileSizeFromUrl(string $url): int
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => true,
            CURLOPT_NOBODY => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 30,
        ]);
        curl_exec($ch);
        $size = curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
        curl_close($ch);

        return (int) max(0, $size);
    }


    /**
     * Transcribe media from uploaded file URI
     */
    public function transcribeMediaFromFile(string $fileUri): string
    {
        try {
            $response = Http::timeout(300)
                ->post("{$this->baseUrl}/models/gemini-2.0-flash-exp:generateContent?key={$this->apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                [
                                    'file_data' => [
                                        'mime_type' => 'video/mp4', // Will be overridden by Gemini based on actual file
                                        'file_uri' => $fileUri
                                    ]
                                ],
                                [
                                    'text' => "

Please transcribe this audio or video clip into text.

Strict Rules:

Add a timestamp [HH:MM:SS] at the beginning of each new sentence or paragraph.

The timestamp must match the exact beginning of the spoken sentence, with no delay.

Try to distinguish speakers if possible (e.g., Speaker 1, Speaker 2).

Do not add any introductions or notes—only the transcribed text with timestamps.

Every line of text you return must contain a timestamp.
"
                                ]
                            ]
                        ]
                    ]
                ]);

            if (!$response->successful()) {
                Log::error('Gemini API transcription from file error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new Exception('فشل في تفريغ الفيديو: ' . $response->body());
            }

            $data = $response->json();

            if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                return $data['candidates'][0]['content']['parts'][0]['text'];
            }

            throw new Exception('لم يتم العثور على نص في استجابة API');
        } catch (Exception $e) {
            Log::error('Gemini transcription from file error: ' . $e->getMessage());
            throw new Exception('حدث خطأ أثناء التفريغ: ' . $e->getMessage());
        }
    }

    /**
     * Transcribe media (audio/video) to text with timestamps using Base64
     *
     * NOTE: This method is kept for backward compatibility and small files only.
     * For better performance and larger files, use uploadFileFromUrl() + transcribeMediaFromFile()
     *
     * @deprecated This method has memory limitations. Use File API methods instead.
     */
    public function transcribeMedia(string $base64Data, string $mimeType): string
    {
        Log::warning('⚠️ Using deprecated transcribeMedia() with Base64. Consider using File API for better performance.');

        try {
            $response = Http::timeout(300)
                ->post("{$this->baseUrl}/models/gemini-2.0-flash-exp:generateContent?key={$this->apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                [
                                    'inline_data' => [
                                        'mime_type' => $mimeType,
                                        'data' => $base64Data
                                    ]
                                ],
                                [
                                    'text' => "

Please transcribe this audio or video clip into text.

Strict Rules:

Add a timestamp [HH:MM:SS] at the beginning of each new sentence or paragraph.

The timestamp must match the exact beginning of the spoken sentence, with no delay.

Try to distinguish speakers if possible (e.g., Speaker 1, Speaker 2).

Do not add any introductions or notes—only the transcribed text with timestamps.

Every line of text you return must contain a timestamp.
"

                                ]
                            ]
                        ]
                    ]
                ]);

            if (!$response->successful()) {
                Log::error('Gemini API transcription error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new Exception('فشل في تفريغ الفيديو: ' . $response->body());
            }

            $data = $response->json();

            if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                return $data['candidates'][0]['content']['parts'][0]['text'];
            }

            throw new Exception('لم يتم العثور على نص في استجابة API');
        } catch (Exception $e) {
            Log::error('Gemini transcription error: ' . $e->getMessage());
            throw new Exception('حدث خطأ أثناء التفريغ: ' . $e->getMessage());
        }
    }

    /**
     * Detect the language of the given text
     */
    public function detectLanguage(string $text): array
    {
        try {
            $prompt = "حدد لغة النص التالي. أرجع فقط كود اللغة المكون من حرفين (مثال: en, ar, fr, es, de, etc.) واسم اللغة بالعربية.

أرجع الإجابة في هذا الشكل بالضبط بدون أي نص إضافي:
CODE: XX
NAME: اسم اللغة

النص:
{$text}";

            $response = Http::timeout(60)
                ->post("{$this->baseUrl}/models/gemini-2.0-flash-exp:generateContent?key={$this->apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ]
                ]);

            if (!$response->successful()) {
                Log::error('Gemini API language detection error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new Exception('فشل في تحديد اللغة: ' . $response->body());
            }

            $data = $response->json();

            if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                $result = $data['candidates'][0]['content']['parts'][0]['text'];

                // Parse the response
                preg_match('/CODE:\s*([a-z]{2})/i', $result, $codeMatch);
                preg_match('/NAME:\s*(.+)/i', $result, $nameMatch);

                $languageCode = $codeMatch[1] ?? 'en';
                $languageName = trim($nameMatch[1] ?? 'English');

                return [
                    'code' => strtolower($languageCode),
                    'name' => $languageName
                ];
            }

            throw new Exception('لم يتم العثور على نتيجة تحديد اللغة');
        } catch (Exception $e) {
            Log::error('Gemini language detection error: ' . $e->getMessage());
            // Default to English if detection fails
            return ['code' => 'en', 'name' => 'English'];
        }
    }

    /**
     * Translate text to Arabic while preserving timestamps (kept for backward compatibility)
     */
    public function translateToArabicWithTimestamps(string $text): string
    {
        return $this->translateTextWithTimestamps($text, 'ar', 'العربية');
    }

    /**
     * Translate text to any language while preserving timestamps
     */
    public function translateTextWithTimestamps(string $text, string $targetLanguageCode, string $targetLanguageName): string
    {
        try {
            $languageInstructions = $this->getLanguageInstructions($targetLanguageCode, $targetLanguageName);

            $prompt = "قم بترجمة النص التالي {$languageInstructions} مع الحفاظ على الطوابع الزمنية [HH:MM:SS] أو [MM:SS] في نفس المكان بالضبط.

قواعد مهمة:
1. احتفظ بالطوابع الزمنية [HH:MM:SS] أو [MM:SS] كما هي بالضبط دون تغيير
2. ترجم النص فقط {$languageInstructions}
3. حافظ على تنسيق الفقرات والأسطر كما هي
4. لا تضف أي شروحات أو مقدمات، فقط النص المترجم مع الطوابع الزمنية

النص:

...

{$text}";

            // تم التحديث: استخدام نموذج gemini-2.0-flash-exp
            $response = Http::timeout(120)
                ->post("{$this->baseUrl}/models/gemini-2.0-flash-exp:generateContent?key={$this->apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ]
                ]);

            if (!$response->successful()) {
                Log::error('Gemini API translation error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new Exception('فشل في الترجمة: ' . $response->body());
            }

            $data = $response->json();

            if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                return $data['candidates'][0]['content']['parts'][0]['text'];
            }

            throw new Exception('لم يتم العثور على نص مترجم في استجابة API');
        } catch (Exception $e) {
            Log::error('Gemini translation error: ' . $e->getMessage());
            throw new Exception('حدث خطأ أثناء الترجمة: ' . $e->getMessage());
        }
    }

    /**
     * Get language-specific translation instructions
     */
    private function getLanguageInstructions(string $languageCode, string $languageName): string
    {
        $instructions = [
            'ar' => 'إلى اللغة العربية الفصحى',
            'en' => 'to English',
            'fr' => 'to French (Français)',
            'es' => 'to Spanish (Español)',
            'de' => 'to German (Deutsch)',
            'it' => 'to Italian (Italiano)',
            'pt' => 'to Portuguese (Português)',
            'ru' => 'to Russian (Русский)',
            'zh' => 'to Chinese (中文)',
            'ja' => 'to Japanese (日本語)',
            'ko' => 'to Korean (한국어)',
            'tr' => 'to Turkish (Türkçe)',
            'hi' => 'to Hindi (हिन्दी)',
            'ur' => 'to Urdu (اردو)',
        ];

        return $instructions[$languageCode] ?? "to {$languageName}";
    }

    /**
     * Convert timestamped text to VTT format
     */
    public function convertToVTT(string $text): string
    {
        // VTT header
        $vtt = "WEBVTT\n\n";

        // 3. إصلاح المنطق بالكامل
        $lines = explode("\n", $text);
        $counter = 1;
        $currentTime = '00:00:00.000';
        $pendingText = []; // لتجميع النص بين الطوابع الزمنية

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line))
                continue;

            // التحقق من وجود طابع زمني
            if (preg_match('/\[(\d{1,2}):(\d{2}):(\d{2})\]|\[(\d{1,2}):(\d{2})\]/', $line, $matches)) {
                $hours = $minutes = $seconds = '00';

                if (!empty($matches[1])) { // [HH:MM:SS]
                    $hours = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
                    $minutes = $matches[2];
                    $seconds = $matches[3];
                } else if (!empty($matches[4])) { // [MM:SS]
                    $hours = '00';
                    $minutes = str_pad($matches[4], 2, '0', STR_PAD_LEFT);
                    $seconds = $matches[5];
                }

                $nextTime = "{$hours}:{$minutes}:{$seconds}.000";

                // إذا كان هناك نص معلق من الطابع الزمني السابق، قم بإضافته الآن
                // تأكد من أن الوقت الجديد لا يساوي الوقت القديم (لتجنب مقاطع بمدة صفر)
                if (!empty($pendingText) && $currentTime != $nextTime) {
                    $vtt .= "{$counter}\n";
                    $vtt .= "{$currentTime} --> {$nextTime}\n";
                    $vtt .= implode("\n", $pendingText) . "\n\n";

                    $counter++;
                    $pendingText = []; // أفرغ النص المعلق
                }

                // حدّث الوقت الحالي وابدأ بتجميع النص الجديد
                $currentTime = $nextTime;
                $textContent = trim(preg_replace('/\[[\d:]+\]\s*/', '', $line));
                if (!empty($textContent)) {
                    $pendingText[] = $textContent;
                }
            } else if (!empty($line) && $counter > 1) {
                // إذا كان السطر بدون طابع زمني (وهو ليس السطر الأول)، أضفه إلى النص المعلق الحالي
                $pendingText[] = $line;
            }
        }

        // لإضافة المقطع الأخير بمدة افتراضية (مثلاً 5 ثوانٍ) إذا تبقى نص
        if (!empty($pendingText)) {
            $timeParts = explode(':', str_replace('.000', '', $currentTime));
            $totalSeconds = ((int) $timeParts[0] * 3600) + ((int) $timeParts[1] * 60) + (int) $timeParts[2] + 5; // إضافة 5 ثوانٍ افتراضية

            $nextHours = floor($totalSeconds / 3600);
            $totalSeconds %= 3600;
            $nextMinutes = floor($totalSeconds / 60);
            $nextSeconds = $totalSeconds % 60;
            $nextTime = sprintf('%02d:%02d:%02d.000', $nextHours, $nextMinutes, $nextSeconds);

            $vtt .= "{$counter}\n";
            $vtt .= "{$currentTime} --> {$nextTime}\n";
            $vtt .= implode("\n", $pendingText) . "\n\n";
        }

        return $vtt;
    }

    /**
     * Summarize text using Gemini AI
     */
    public function summarizeText(string $text): string
    {
        try {
            $prompt = "قم بتلخيص النص التالي بشكل مفصل. اجعل الملخص شاملاً وواضحاً، ويفضل أن يكون حوالي 1000 كلمة إذا سمح طول النص الأصلي بذلك. قم بتنسيق الملخص في فقرات واضحة ومنظمة لتحسين القراءة:\n\n---\n\n{$text}";

            // 4. تم التحديث: استخدام نموذج gemini-2.0-flash-exp وزيادة المهلة
            $response = Http::timeout(180)
                ->post("{$this->baseUrl}/models/gemini-2.0-flash-exp:generateContent?key={$this->apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ]
                ]);

            if (!$response->successful()) {
                Log::error('Gemini API summarization error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new Exception('فشل في التلخيص: ' . $response->body());
            }

            $data = $response->json();

            if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                return $data['candidates'][0]['content']['parts'][0]['text'];
            }

            throw new Exception('لم يتم العثور على ملخص في استجابة API');
        } catch (Exception $e) {
            Log::error('Gemini summarization error: ' . $e->getMessage());
            throw new Exception('حدث خطأ أثناء التلخيص: ' . $e->getMessage());
        }
    }
}
