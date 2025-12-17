<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class YouTubeDownloadService
{
    protected string $baseUrl;
    protected string $host;
    protected string $apiKey;
    protected string $defaultFormat;
    protected string $defaultQuality;
    protected string $userAgent;
    protected int $downloadTimeout;

    public function __construct()
    {
        $config = config('services.youtube_downloader', []);

        $this->baseUrl = rtrim($config['rapidapi_base_url'] ?? 'https://ytstream-download-youtube-videos.p.rapidapi.com', '/');
        $this->host = $config['rapidapi_host'] ?? 'ytstream-download-youtube-videos.p.rapidapi.com';
        $this->apiKey = $config['rapidapi_key'] ?? '68ba875342msh74ab29a71f6ccb0p19509djsndf31a2493de2';
        $this->defaultFormat = strtolower($config['default_format'] ?? 'mp4');
        $this->defaultQuality = (string) ($config['default_quality'] ?? '720');
        $this->userAgent = $config['user_agent'] ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36';
        $this->downloadTimeout = (int) ($config['download_timeout'] ?? 300);

        if (empty($this->apiKey)) {
            throw new Exception('لم يتم ضبط مفتاح RapidAPI. يرجى تعريف RAPIDAPI_KEY في ملف البيئة.');
        }
    }

    /**
     * Download a YouTube video using the RapidAPI YTStream endpoint.
     *
     * @return array{
     *     temp_dir: string,
     *     file_path: string,
     *     original_name: string,
     *     mime_type: string,
     *     duration?: int|null,
     *     size: int,
     *     thumbnail_local_path?: string|null
     * }
     */
    public function download(string $url, ?string $format = null, ?string $quality = null): array
    {
        $format = strtolower($format ?? $this->defaultFormat);
        $quality = (string) ($quality ?? $this->defaultQuality);

        if ($format !== 'mp4') {
            throw new Exception('التنسيق المدعوم هو MP4 فقط في الوقت الحالي.');
        }

        $videoId = $this->extractVideoId($url);
        if (!$videoId) {
            throw new Exception('رابط YouTube غير صالح.');
        }

        $videoInfo = $this->fetchVideoInfo($videoId);
        $downloadUrl = $this->resolveDownloadUrl($videoInfo, $format, $quality);

        if (!$downloadUrl) {
            throw new Exception('تعذر الحصول على رابط تحميل مناسب للفيديو.');
        }

        $tempDir = storage_path('app/temp/youtube/' . Str::uuid());
        File::makeDirectory($tempDir, 0755, true, true);

        $title = $videoInfo['title'] ?? 'youtube_video';
        $safeTitle = Str::slug($title, '_') ?: 'youtube_video';
        $extension = 'mp4';
        $tempPath = $tempDir . '/' . $safeTitle . '.' . $extension;

        $this->downloadBinary($downloadUrl, $tempPath);

        if (!File::exists($tempPath)) {
            File::deleteDirectory($tempDir);
            throw new Exception('فشل تنزيل ملف الفيديو من الرابط المباشر.');
        }

        $thumbnailLocalPath = null;
        $thumbnailUrl = $this->extractThumbnail($videoInfo);
        if ($thumbnailUrl) {
            $thumbnailLocalPath = $this->downloadThumbnail($thumbnailUrl, $tempDir);
        }

        $mimeType = 'video/mp4';

        return [
            'temp_dir' => $tempDir,
            'file_path' => $tempPath,
            'original_name' => $safeTitle . '.' . $extension,
            'mime_type' => $mimeType,
            'duration' => isset($videoInfo['lengthSeconds']) ? (int) $videoInfo['lengthSeconds'] : null,
            'size' => File::size($tempPath),
            'thumbnail_local_path' => $thumbnailLocalPath,
        ];
    }

    protected function extractVideoId(string $url): ?string
    {
        $query = parse_url($url, PHP_URL_QUERY);
        if ($query) {
            parse_str($query, $params);
            if (!empty($params['v'])) {
                return $params['v'];
            }
        }

        $patterns = [
            '/youtu\.be\/([a-zA-Z0-9_-]+)/',
            '/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/',
            '/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    protected function fetchVideoInfo(string $videoId): array
    {
        $response = Http::withHeaders($this->defaultHeaders())
            ->timeout(30)
            ->get($this->baseUrl . '/dl', ['id' => $videoId, 'quality' => '720p']);

        if ($response->failed()) {
            $message = $response->json('message') ?? $response->body() ?? 'فشل جلب بيانات الفيديو من API.';
            throw new Exception($message);
        }

        $json = $response->json();

        if (!is_array($json) || ($json['status'] ?? null) !== 'OK') {
            throw new Exception('استجابة غير صالحة من YTStream API.');
        }

        return $json;
    }

    protected function resolveDownloadUrl(array $videoInfo, string $format, string $quality): ?string
    {
        $qualityLabel = $quality . 'p';

        $formats = $videoInfo['formats'] ?? [];
        $adaptiveFormats = $videoInfo['adaptiveFormats'] ?? [];

        // Prefer muxed formats (video+audio) with requested quality
        foreach ($formats as $f) {
            if (($f['qualityLabel'] ?? '') === $qualityLabel && !empty($f['url'])) {
                return $f['url'];
            }
        }

        // Fallback to first muxed format
        foreach ($formats as $f) {
            if (!empty($f['url'])) {
                return $f['url'];
            }
        }

        // Fallback to adaptive video streams
        foreach ($adaptiveFormats as $f) {
            $mime = $f['mimeType'] ?? '';
            if (str_contains($mime, 'video') && (($f['qualityLabel'] ?? '') === $qualityLabel) && !empty($f['url'])) {
                return $f['url'];
            }
        }

        foreach ($adaptiveFormats as $f) {
            $mime = $f['mimeType'] ?? '';
            if (str_contains($mime, 'video') && !empty($f['url'])) {
                return $f['url'];
            }
        }

        return null;
    }

    protected function downloadBinary(string $url, string $destination): void
    {
        $response = Http::withHeaders([
            'User-Agent' => $this->userAgent,
        ])
            ->withOptions([
                'stream' => true,
                'timeout' => max(30, $this->downloadTimeout),
            ])
            ->get($url);

        if ($response->failed()) {
            throw new Exception('فشل تنزيل ملف الفيديو من الرابط المباشر.');
        }

        $stream = $response->toPsrResponse()->getBody();
        $resource = fopen($destination, 'w');

        if (!$resource) {
            throw new Exception('تعذر إنشاء ملف التخزين المؤقت للفيديو.');
        }

        while (!$stream->eof()) {
            fwrite($resource, $stream->read(1024 * 1024));
        }

        fclose($resource);
    }

    protected function extractThumbnail(array $videoInfo): ?string
    {
        $thumbnail = $videoInfo['thumbnail'] ?? null;
        if (is_array($thumbnail)) {
            // API sometimes returns array of objects with url property
            $first = $thumbnail[0] ?? null;
            if (is_array($first) && !empty($first['url'])) {
                return $first['url'];
            }
        } elseif (is_string($thumbnail)) {
            return $thumbnail;
        }

        $details = $videoInfo['videoDetails'] ?? [];
        if (is_array($details) && !empty($details['thumbnail']['thumbnails'])) {
            $thumbs = $details['thumbnail']['thumbnails'];
            $last = end($thumbs);
            if (!empty($last['url'])) {
                return $last['url'];
            }
        }

        return null;
    }

    protected function downloadThumbnail(string $url, string $tempDir): ?string
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => $this->userAgent,
            ])->timeout(15)->get($url);
            if ($response->failed()) {
                return null;
            }

            $extension = pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION);
            $extension = $extension ?: 'jpg';
            $thumbnailPath = $tempDir . '/thumbnail.' . $extension;

            File::put($thumbnailPath, $response->body());

            return $thumbnailPath;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Common headers required by RapidAPI.
     */
    protected function defaultHeaders(): array
    {
        return [
            'X-RapidAPI-Key' => $this->apiKey,
            'X-RapidAPI-Host' => $this->host,
        ];
    }
}
