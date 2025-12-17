<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Prevent clickjacking attacks
        $response->headers->set('X-Frame-Options', 'DENY');

        // Prevent MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Enable XSS protection in older browsers
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Control referrer information
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // في بيئة التطوير، نعطل CSP لتجنب مشاكل Vite
        if (app()->environment('local')) {
            // استخدام CSP أكثر تساهلاً في التطوير
            $response->headers->set('Content-Security-Policy',
                "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " .
                "script-src * 'unsafe-inline' 'unsafe-eval'; " .
                "style-src * 'unsafe-inline'; " .
                "img-src * data: blob: 'unsafe-inline'; " .
                "font-src * data:; " .
                "connect-src * ws: wss:;"
            );
        } else {
            // في الإنتاج، نستخدم CSP صارمة
            $defaultSrc = ["'self'"];
            $scriptSrc = ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdnjs.cloudflare.com'];
            $styleSrc = ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'];
            $imgSrc = ["'self'", 'data:', 'https:', 'blob:'];
            $fontSrc = ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'];
            $connectSrc = ["'self'", 'https:'];

            $directives = [
                'default-src '.implode(' ', $defaultSrc),
                'script-src '.implode(' ', $scriptSrc),
                'script-src-elem '.implode(' ', $scriptSrc),
                'style-src '.implode(' ', $styleSrc),
                'style-src-elem '.implode(' ', $styleSrc),
                'img-src '.implode(' ', $imgSrc),
                'font-src '.implode(' ', $fontSrc),
                'connect-src '.implode(' ', $connectSrc),
            ];

            $response->headers->set('Content-Security-Policy', implode('; ', $directives));
        }

        // Only add HSTS in production over HTTPS
        if (app()->environment('production') && $request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // Remove server information
        $response->headers->remove('X-Powered-By');
        $response->headers->set('Server', 'Webserver');

        return $response;
    }
}
