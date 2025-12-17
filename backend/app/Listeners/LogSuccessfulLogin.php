<?php

namespace App\Listeners;

use App\Services\ActivityLogger;
use Illuminate\Auth\Events\Login;

class LogSuccessfulLogin
{
    public function __construct(private ActivityLogger $logger)
    {
    }

    public function handle(Login $event): void
    {
        $user = $event->user;

        $this->logger->log('login_attempt', [
            'user_id' => $user?->getKey(),
            'description' => __('تسجيل دخول ناجح للمستخدم :name', [
                'name' => $user?->name ?? $user?->email ?? __('مستخدم'),
            ]),
            'metadata' => [
                'status' => 'success',
                'guard' => $event->guard,
                'remember' => (bool) $event->remember,
            ],
        ]);
    }
}
