<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTokenIsValid
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            // Check if the current access token exists and is valid
            $token = $user->currentAccessToken();

            if (!$token) {
                // No valid token found
                return response()->json([
                    'success' => false,
                    'message' => 'الرمز غير صالح. يرجى تسجيل الدخول مرة أخرى.',
                ], 401);
            }

            // Check token expiration (if using Sanctum expiration)
            $expirationMinutes = config('sanctum.expiration');
            if ($expirationMinutes && $token->created_at) {
                $expiresAt = $token->created_at->addMinutes($expirationMinutes);

                if (now()->greaterThan($expiresAt)) {
                    // Token has expired
                    $token->delete();

                    return response()->json([
                        'success' => false,
                        'message' => 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.',
                    ], 401);
                }
            }
        }

        return $next($request);
    }
}
