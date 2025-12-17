<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;
use Illuminate\Http\UploadedFile;

class ImageOptimizationService
{
    // Image sizes configuration
    const SIZES = [
        'thumbnail' => ['width' => 150, 'height' => 150],
        'small' => ['width' => 300, 'height' => 300],
        'medium' => ['width' => 600, 'height' => 600],
        'large' => ['width' => 1200, 'height' => 1200],
    ];

    // Quality settings
    const JPEG_QUALITY = 85;
    const PNG_QUALITY = 90;
    const WEBP_QUALITY = 85;

    // Maximum file size in bytes (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    protected $disk;

    public function __construct($disk = 'public')
    {
        $this->disk = $disk;
    }

    /**
     * Upload and optimize image with multiple sizes
     *
     * @param UploadedFile $file
     * @param string $folder
     * @param array $sizes Array of size names to generate (default: all)
     * @param bool $generateWebP Generate WebP versions
     * @return array Paths to all generated images
     */
    public function uploadAndOptimize(UploadedFile $file, string $folder, array $sizes = ['thumbnail', 'small', 'medium', 'large'], bool $generateWebP = true)
    {
        // Validate file
        $this->validateImage($file);

        // Generate unique filename
        $filename = $this->generateFilename($file);
        $basePath = $folder . '/' . pathinfo($filename, PATHINFO_FILENAME);
        $extension = $file->getClientOriginalExtension();

        $paths = [];

        // Save original
        $originalPath = $basePath . '_original.' . $extension;
        Storage::disk($this->disk)->put($originalPath, file_get_contents($file));
        $paths['original'] = $originalPath;

        // Load image for optimization
        $image = Image::make($file);

        // Auto-orient based on EXIF data
        $image->orientate();

        // Generate different sizes
        foreach ($sizes as $sizeName) {
            if (!isset(self::SIZES[$sizeName])) {
                continue;
            }

            $size = self::SIZES[$sizeName];

            // Resize image maintaining aspect ratio
            $resized = clone $image;
            $resized->resize($size['width'], $size['height'], function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize(); // Prevent upsizing smaller images
            });

            // Save optimized image
            $optimizedPath = $basePath . "_{$sizeName}." . $extension;
            $this->saveOptimizedImage($resized, $optimizedPath, $extension);
            $paths[$sizeName] = $optimizedPath;

            // Generate WebP version if requested
            if ($generateWebP) {
                $webpPath = $basePath . "_{$sizeName}.webp";
                $this->saveAsWebP($resized, $webpPath);
                $paths[$sizeName . '_webp'] = $webpPath;
            }
        }

        // Clean up
        $image->destroy();

        return $paths;
    }

    /**
     * Optimize existing image
     */
    public function optimizeExisting(string $path, bool $generateWebP = true)
    {
        if (!Storage::disk($this->disk)->exists($path)) {
            throw new \Exception("Image not found: {$path}");
        }

        $image = Image::make(Storage::disk($this->disk)->get($path));
        $extension = pathinfo($path, PATHINFO_EXTENSION);

        // Save optimized version
        $this->saveOptimizedImage($image, $path, $extension);

        $result = ['optimized' => $path];

        // Generate WebP version
        if ($generateWebP) {
            $webpPath = preg_replace('/\.[^.]+$/', '.webp', $path);
            $this->saveAsWebP($image, $webpPath);
            $result['webp'] = $webpPath;
        }

        $image->destroy();

        return $result;
    }

    /**
     * Generate thumbnail from existing image
     */
    public function generateThumbnail(string $path, int $width = 150, int $height = 150)
    {
        if (!Storage::disk($this->disk)->exists($path)) {
            throw new \Exception("Image not found: {$path}");
        }

        $image = Image::make(Storage::disk($this->disk)->get($path));

        $image->fit($width, $height, function ($constraint) {
            $constraint->upsize();
        });

        $thumbnailPath = preg_replace('/(\.[^.]+)$/', '_thumb$1', $path);
        $extension = pathinfo($path, PATHINFO_EXTENSION);

        $this->saveOptimizedImage($image, $thumbnailPath, $extension);

        $image->destroy();

        return $thumbnailPath;
    }

    /**
     * Compress image without resizing
     */
    public function compress(string $path, int $quality = null)
    {
        if (!Storage::disk($this->disk)->exists($path)) {
            throw new \Exception("Image not found: {$path}");
        }

        $image = Image::make(Storage::disk($this->disk)->get($path));
        $extension = pathinfo($path, PATHINFO_EXTENSION);

        $quality = $quality ?? $this->getQualityForExtension($extension);

        $this->saveOptimizedImage($image, $path, $extension, $quality);

        $image->destroy();

        return $path;
    }

    /**
     * Convert image to WebP format
     */
    public function convertToWebP(string $path)
    {
        if (!Storage::disk($this->disk)->exists($path)) {
            throw new \Exception("Image not found: {$path}");
        }

        $image = Image::make(Storage::disk($this->disk)->get($path));
        $webpPath = preg_replace('/\.[^.]+$/', '.webp', $path);

        $this->saveAsWebP($image, $webpPath);

        $image->destroy();

        return $webpPath;
    }

    /**
     * Delete image and all its versions
     */
    public function deleteAllVersions(string $basePath)
    {
        $pattern = preg_replace('/\.[^.]+$/', '', $basePath);

        // Delete all files matching pattern
        $allFiles = Storage::disk($this->disk)->files(dirname($pattern));
        $basename = basename($pattern);

        foreach ($allFiles as $file) {
            if (strpos(basename($file), $basename) === 0) {
                Storage::disk($this->disk)->delete($file);
            }
        }

        return true;
    }

    /**
     * Get image dimensions
     */
    public function getDimensions(string $path)
    {
        if (!Storage::disk($this->disk)->exists($path)) {
            throw new \Exception("Image not found: {$path}");
        }

        $image = Image::make(Storage::disk($this->disk)->get($path));

        $dimensions = [
            'width' => $image->width(),
            'height' => $image->height(),
        ];

        $image->destroy();

        return $dimensions;
    }

    /**
     * Get file size in bytes
     */
    public function getFileSize(string $path)
    {
        if (!Storage::disk($this->disk)->exists($path)) {
            throw new \Exception("Image not found: {$path}");
        }

        return Storage::disk($this->disk)->size($path);
    }

    /**
     * Validate uploaded image
     */
    protected function validateImage(UploadedFile $file)
    {
        // Check if file is an image
        if (!in_array($file->getMimeType(), ['image/jpeg', 'image/png', 'image/gif', 'image/webp'])) {
            throw new \Exception('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
        }

        // Check file size
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new \Exception('File size exceeds maximum allowed size of 5MB.');
        }

        return true;
    }

    /**
     * Generate unique filename
     */
    protected function generateFilename(UploadedFile $file)
    {
        $extension = $file->getClientOriginalExtension();
        $filename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $filename = \Illuminate\Support\Str::slug($filename);

        return $filename . '_' . time() . '.' . $extension;
    }

    /**
     * Save optimized image
     */
    protected function saveOptimizedImage($image, string $path, string $extension, int $quality = null)
    {
        $quality = $quality ?? $this->getQualityForExtension($extension);

        // Encode image with optimization
        $encoded = $image->encode($extension, $quality);

        // Save to storage
        Storage::disk($this->disk)->put($path, $encoded);

        return $path;
    }

    /**
     * Save image as WebP
     */
    protected function saveAsWebP($image, string $path)
    {
        // Check if WebP is supported
        if (!function_exists('imagewebp')) {
            return null;
        }

        $encoded = $image->encode('webp', self::WEBP_QUALITY);
        Storage::disk($this->disk)->put($path, $encoded);

        return $path;
    }

    /**
     * Get quality setting based on file extension
     */
    protected function getQualityForExtension(string $extension)
    {
        $extension = strtolower($extension);

        return match ($extension) {
            'jpg', 'jpeg' => self::JPEG_QUALITY,
            'png' => self::PNG_QUALITY,
            'webp' => self::WEBP_QUALITY,
            default => self::JPEG_QUALITY,
        };
    }

    /**
     * Get responsive image srcset string
     */
    public function getSrcSet(string $basePath, array $sizes = ['thumbnail', 'small', 'medium', 'large'])
    {
        $srcset = [];
        $baseUrl = Storage::disk($this->disk)->url('');
        $pattern = preg_replace('/\.[^.]+$/', '', $basePath);
        $extension = pathinfo($basePath, PATHINFO_EXTENSION);

        foreach ($sizes as $sizeName) {
            if (!isset(self::SIZES[$sizeName])) {
                continue;
            }

            $imagePath = $pattern . "_{$sizeName}.{$extension}";
            if (Storage::disk($this->disk)->exists($imagePath)) {
                $width = self::SIZES[$sizeName]['width'];
                $srcset[] = $baseUrl . $imagePath . " {$width}w";
            }
        }

        return implode(', ', $srcset);
    }

    /**
     * Get picture element HTML with WebP fallback
     */
    public function getPictureElement(string $basePath, string $alt = '', string $class = '', string $size = 'medium')
    {
        $baseUrl = Storage::disk($this->disk)->url('');
        $pattern = preg_replace('/\.[^.]+$/', '', $basePath);
        $extension = pathinfo($basePath, PATHINFO_EXTENSION);

        $webpPath = $pattern . "_{$size}.webp";
        $imagePath = $pattern . "_{$size}.{$extension}";

        $html = '<picture>';

        // WebP source
        if (Storage::disk($this->disk)->exists($webpPath)) {
            $html .= '<source srcset="' . $baseUrl . $webpPath . '" type="image/webp">';
        }

        // Fallback image
        $html .= '<img src="' . $baseUrl . $imagePath . '" alt="' . htmlspecialchars($alt) . '" class="' . htmlspecialchars($class) . '" loading="lazy">';
        $html .= '</picture>';

        return $html;
    }
}
