<?php

namespace App\Http\Controllers;

use App\Services\ImageOptimizationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ImageOptimizationController extends Controller
{
    protected $imageOptimization;

    public function __construct(ImageOptimizationService $imageOptimization)
    {
        $this->imageOptimization = $imageOptimization;
    }

    /**
     * Upload and optimize image
     */
    public function upload(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB
            'folder' => 'string',
            'sizes' => 'array',
            'sizes.*' => 'in:thumbnail,small,medium,large',
            'generate_webp' => 'boolean'
        ]);

        $folder = $request->input('folder', 'images');
        $sizes = $request->input('sizes', ['thumbnail', 'small', 'medium', 'large']);
        $generateWebP = $request->boolean('generate_webp', true);

        try {
            $paths = $this->imageOptimization->uploadAndOptimize(
                $request->file('image'),
                $folder,
                $sizes,
                $generateWebP
            );

            // Generate full URLs
            $urls = [];
            foreach ($paths as $key => $path) {
                $urls[$key] = Storage::url($path);
            }

            return response()->json([
                'success' => true,
                'message' => 'تم رفع الصورة وتحسينها بنجاح',
                'paths' => $paths,
                'urls' => $urls
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل رفع الصورة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Optimize existing image
     */
    public function optimize(Request $request)
    {
        $request->validate([
            'path' => 'required|string',
            'generate_webp' => 'boolean'
        ]);

        try {
            $result = $this->imageOptimization->optimizeExisting(
                $request->path,
                $request->boolean('generate_webp', true)
            );

            return response()->json([
                'success' => true,
                'message' => 'تم تحسين الصورة بنجاح',
                'result' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل تحسين الصورة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate thumbnail
     */
    public function thumbnail(Request $request)
    {
        $request->validate([
            'path' => 'required|string',
            'width' => 'integer|min:50|max:500',
            'height' => 'integer|min:50|max:500'
        ]);

        try {
            $thumbnailPath = $this->imageOptimization->generateThumbnail(
                $request->path,
                $request->input('width', 150),
                $request->input('height', 150)
            );

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء الصورة المصغرة بنجاح',
                'path' => $thumbnailPath,
                'url' => Storage::url($thumbnailPath)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل إنشاء الصورة المصغرة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Compress image
     */
    public function compress(Request $request)
    {
        $request->validate([
            'path' => 'required|string',
            'quality' => 'integer|min:1|max:100'
        ]);

        try {
            $compressedPath = $this->imageOptimization->compress(
                $request->path,
                $request->input('quality')
            );

            return response()->json([
                'success' => true,
                'message' => 'تم ضغط الصورة بنجاح',
                'path' => $compressedPath,
                'url' => Storage::url($compressedPath)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل ضغط الصورة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Convert to WebP
     */
    public function convertToWebP(Request $request)
    {
        $request->validate([
            'path' => 'required|string'
        ]);

        try {
            $webpPath = $this->imageOptimization->convertToWebP($request->path);

            return response()->json([
                'success' => true,
                'message' => 'تم تحويل الصورة إلى WebP بنجاح',
                'path' => $webpPath,
                'url' => Storage::url($webpPath)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل تحويل الصورة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete image and all versions
     */
    public function delete(Request $request)
    {
        $request->validate([
            'path' => 'required|string'
        ]);

        try {
            $this->imageOptimization->deleteAllVersions($request->path);

            return response()->json([
                'success' => true,
                'message' => 'تم حذف الصورة وجميع الإصدارات بنجاح'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل حذف الصورة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get image information
     */
    public function info(Request $request)
    {
        $request->validate([
            'path' => 'required|string'
        ]);

        try {
            $dimensions = $this->imageOptimization->getDimensions($request->path);
            $fileSize = $this->imageOptimization->getFileSize($request->path);

            return response()->json([
                'success' => true,
                'data' => [
                    'path' => $request->path,
                    'url' => Storage::url($request->path),
                    'dimensions' => $dimensions,
                    'file_size' => $fileSize,
                    'file_size_formatted' => $this->formatBytes($fileSize)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل الحصول على معلومات الصورة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get responsive srcset
     */
    public function srcset(Request $request)
    {
        $request->validate([
            'path' => 'required|string',
            'sizes' => 'array',
            'sizes.*' => 'in:thumbnail,small,medium,large'
        ]);

        $sizes = $request->input('sizes', ['thumbnail', 'small', 'medium', 'large']);

        try {
            $srcset = $this->imageOptimization->getSrcSet($request->path, $sizes);

            return response()->json([
                'success' => true,
                'srcset' => $srcset
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل إنشاء srcset: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format bytes to human readable format
     */
    protected function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
