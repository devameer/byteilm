<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\TrackReferral;
use App\Services\ActivityLogger;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withProviders([
        \App\Providers\EventServiceProvider::class,
    ])
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
            'usage.limit' => \App\Http\Middleware\EnforceUsageLimits::class,
            'rate.limit' => \App\Http\Middleware\CustomRateLimiter::class,
        ]);

        // Add global security headers to all routes
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);

        // Add Sanctum middleware to API routes
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \App\Http\Middleware\ValidateRequestSize::class,
        ]);

        // Redirect unauthenticated users to admin login
        $middleware->redirectGuestsTo(fn ($request) => route('admin.login'));

        // Track referral visits on all web requests
        $middleware->web(append: [
            TrackReferral::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Handle custom exceptions
        $exceptions->render(function (\App\Exceptions\BaseException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return $e->render();
            }
        });

        $exceptions->report(function (Throwable $throwable) {
            if (app()->runningInConsole()) {
                return;
            }

            if ($throwable instanceof HttpExceptionInterface && $throwable->getStatusCode() < 500) {
                return;
            }

            try {
                app(ActivityLogger::class)->log('system_error', [
                    'description' => $throwable->getMessage(),
                    'metadata' => [
                        'level' => 'error',
                        'exception' => $throwable::class,
                        'file' => $throwable->getFile(),
                        'line' => $throwable->getLine(),
                        'url' => request()?->fullUrl(),
                        'method' => request()?->method(),
                    ],
                ]);
            } catch (Throwable) {
                // Silently ignore logging failures to avoid cascading errors.
            }
        });
    })->create();
