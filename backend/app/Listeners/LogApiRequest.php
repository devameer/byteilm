<?php

namespace App\Listeners;

use App\Services\ActivityLogger;
use Illuminate\Foundation\Http\Events\RequestHandled;
use Illuminate\Support\Arr;

class LogApiRequest
{
    public function __construct(private ActivityLogger $logger)
    {
    }

    public function handle(RequestHandled $event): void
    {
        $request = $event->request;

        if (!$request->is('api/*')) {
            return;
        }

        $durationMs = null;
        $requestStartedAt = $request->server('REQUEST_TIME_FLOAT');

        if ($requestStartedAt) {
            $durationMs = round((microtime(true) - (float) $requestStartedAt) * 1000, 2);
        }

        $this->logger->log('api_request', [
            'user_id' => $request->user()?->getKey(),
            'description' => __('طلب API :method :path (الحالة :status)', [
                'method' => $request->method(),
                'path' => '/' . ltrim($request->path(), '/'),
                'status' => $event->response->getStatusCode(),
            ]),
            'metadata' => [
                'method' => $request->method(),
                'path' => '/' . ltrim($request->path(), '/'),
                'status' => $event->response->getStatusCode(),
                'duration_ms' => $durationMs,
                'route_name' => $request->route()?->getName(),
                'query' => $request->query(),
                'headers' => Arr::only($request->headers->all(), ['user-agent', 'accept', 'content-type']),
            ],
        ]);
    }
}
