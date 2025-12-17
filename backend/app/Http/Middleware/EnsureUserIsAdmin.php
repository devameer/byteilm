<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin() || !$user->is_active) {
            abort(
                Response::HTTP_FORBIDDEN,
                __('You are not authorized to access the admin dashboard.')
            );
        }

        return $next($request);
    }
}
