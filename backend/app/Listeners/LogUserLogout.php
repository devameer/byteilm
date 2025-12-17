<?php

namespace App\Listeners;

use App\Services\ActivityLogger;
use Illuminate\Auth\Events\Logout;

class LogUserLogout
{
    public function __construct(private ActivityLogger $logger)
    {
    }

    public function handle(Logout $event): void
    {
        $user = $event->user;

        if (!$user) {
            return;
        }

        $this->logger->log('logout', [
            'user_id' => $user->getKey(),
            'description' => __('قام المستخدم :name بتسجيل الخروج.', [
                'name' => $user->name ?? $user->email ?? __('مستخدم'),
            ]),
            'metadata' => [
                'guard' => $event->guard,
            ],
        ]);
    }
}
