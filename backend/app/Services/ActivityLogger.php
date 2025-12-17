<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class ActivityLogger
{
    /**
     * Persist an activity log entry with the given context.
     */
    public function log(string $action, array $context = []): ?ActivityLog
    {
        if (!Schema::hasTable('activity_logs')) {
            return null;
        }

        $request = request();
        $metadata = $context['metadata'] ?? null;

        if ($metadata instanceof Model) {
            $metadata = $metadata->toArray();
        } elseif (!is_array($metadata) && !is_null($metadata)) {
            $metadata = Arr::wrap($metadata);
        }

        $payload = [
            'user_id' => $context['user_id'] ?? optional(Auth::user())->getKey(),
            'action' => $action,
            'model_type' => $context['model_type'] ?? null,
            'model_id' => $context['model_id'] ?? null,
            'description' => $context['description'] ?? null,
            'ip_address' => $context['ip_address'] ?? ($request?->ip()),
            'user_agent' => $context['user_agent'] ?? ($request?->userAgent()),
            'metadata' => $metadata,
        ];

        return ActivityLog::create($payload);
    }

    /**
     * Convenience helper for logging model-bound actions.
     */
    public function forModel(string $action, Model $model, array $context = []): ?ActivityLog
    {
        return $this->log($action, array_merge([
            'model_type' => $context['model_type'] ?? $model::class,
            'model_id' => $context['model_id'] ?? $model->getKey(),
        ], $context));
    }
}
