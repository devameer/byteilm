<?php

namespace App\Listeners;

use App\Services\ActivityLogger;
use Illuminate\Auth\Events\Failed;
use Illuminate\Support\Arr;

class LogFailedLoginAttempt
{
    public function __construct(private ActivityLogger $logger)
    {
    }

    public function handle(Failed $event): void
    {
        $email = Arr::get($event->credentials, 'email', __('غير معروف'));

        $this->logger->log('login_attempt', [
            'user_id' => $event->user?->getKey(),
            'description' => __('محاولة تسجيل دخول فاشلة للبريد :email', ['email' => $email]),
            'metadata' => [
                'status' => 'failed',
                'guard' => $event->guard,
                'email' => $email,
            ],
        ]);
    }
}
