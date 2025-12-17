<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateRequestSize
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Maximum request size: 10MB (for file uploads, adjust as needed)
        $maxSize = 10 * 1024 * 1024; // 10MB in bytes

        if ($request->header('Content-Length')) {
            $contentLength = (int) $request->header('Content-Length');
            
            if ($contentLength > $maxSize) {
                return response()->json([
                    'success' => false,
                    'message' => 'حجم الطلب كبير جداً. الحد الأقصى المسموح: ' . ($maxSize / 1024 / 1024) . ' ميجابايت',
                    'error' => 'Request too large',
                ], 413);
            }
        }

        return $next($request);
    }
}

