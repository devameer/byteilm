<?php

namespace App\Observers;

use App\Services\ActivityLogger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class ModelActivityObserver
{
    protected array $sensitiveAttributes = [
        'password',
        'remember_token',
        'secret',
        'token',
        'api_token',
        'access_token',
        'refresh_token',
    ];

    public function __construct(private ActivityLogger $logger)
    {
    }

    public function created(Model $model): void
    {
        if ($this->shouldSkip()) {
            return;
        }

        $this->logger->forModel('model_created', $model, [
            'description' => __('تم إنشاء :model بالمعرف #:id', [
                'model' => $this->modelLabel($model),
                'id' => $model->getKey(),
            ]),
            'metadata' => [
                'attributes' => $this->sanitizeAttributes($model, $model->getAttributes()),
            ],
        ]);
    }

    public function updated(Model $model): void
    {
        if ($this->shouldSkip()) {
            return;
        }

        $changes = Arr::except($model->getChanges(), ['updated_at', 'created_at']);

        if (empty($changes)) {
            return;
        }

        $original = Arr::only($model->getOriginal(), array_keys($changes));

        $this->logger->forModel('model_updated', $model, [
            'description' => __('تم تحديث :model بالمعرف #:id', [
                'model' => $this->modelLabel($model),
                'id' => $model->getKey(),
            ]),
            'metadata' => [
                'changes' => $this->sanitizeAttributes($model, $changes),
                'original' => $this->sanitizeAttributes($model, $original),
            ],
        ]);
    }

    public function deleted(Model $model): void
    {
        if ($this->shouldSkip()) {
            return;
        }

        $this->logger->forModel('model_deleted', $model, [
            'description' => __('تم حذف :model بالمعرف #:id', [
                'model' => $this->modelLabel($model),
                'id' => $model->getKey(),
            ]),
            'metadata' => [
                'attributes' => $this->sanitizeAttributes($model, $model->getOriginal()),
            ],
        ]);
    }

    public function restored(Model $model): void
    {
        if ($this->shouldSkip()) {
            return;
        }

        $this->logger->forModel('model_restored', $model, [
            'description' => __('تمت استعادة :model بالمعرف #:id', [
                'model' => $this->modelLabel($model),
                'id' => $model->getKey(),
            ]),
            'metadata' => [
                'attributes' => $this->sanitizeAttributes($model, $model->getAttributes()),
            ],
        ]);
    }

    protected function shouldSkip(): bool
    {
        return app()->runningInConsole() && !app()->runningUnitTests();
    }

    protected function modelLabel(Model $model): string
    {
        return Str::headline(class_basename($model));
    }

    protected function sanitizeAttributes(Model $model, array $attributes): array
    {
        $hidden = array_merge($model->getHidden(), $this->sensitiveAttributes);

        return Arr::except($attributes, $hidden);
    }
}
