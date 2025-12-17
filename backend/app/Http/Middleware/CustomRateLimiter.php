<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class CustomRateLimiter
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $key = 'default', int $maxAttempts = 60, int $decayMinutes = 1): Response
    {
        $user = $request->user();
        
        // Different rate limits based on user type
        if ($user) {
            // Admin users get higher limits
            if ($user->hasRole('admin')) {
                $maxAttempts = $maxAttempts * 3; // 3x limit for admins
            } elseif ($user->hasRole('premium')) {
                $maxAttempts = $maxAttempts * 2; // 2x limit for premium users
            }
            
            // Use user ID for rate limiting key
            $key = "rate_limit:{$key}:user:{$user->id}";
        } else {
            // Use IP address for guests
            $key = "rate_limit:{$key}:ip:" . $request->ip();
        }

        $executed = RateLimiter::attempt(
            $key,
            $maxAttempts,
            function () use ($next, $request) {
                return $next($request);
            },
            $decayMinutes * 60
        );

        if (!$executed) {
            return response()->json([
                'success' => false,
                'message' => 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً',
                'error' => 'Rate limit exceeded',
                'retry_after' => RateLimiter::availableIn($key),
            ], 429);
        }

        return $executed;
    }
}

