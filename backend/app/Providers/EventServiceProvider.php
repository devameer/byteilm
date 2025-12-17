<?php

namespace App\Providers;

use App\Events\UserUsageShouldUpdate;
use App\Listeners\LogApiRequest;
use App\Listeners\LogFailedLoginAttempt;
use App\Listeners\LogSuccessfulLogin;
use App\Listeners\LogUserLogout;
use App\Listeners\UpdateUserUsageMetrics;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Plan;
use App\Models\Project;
use App\Models\Subscription;
use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use App\Observers\ModelActivityObserver;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Foundation\Http\Events\RequestHandled;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        UserUsageShouldUpdate::class => [
            UpdateUserUsageMetrics::class,
        ],
        Login::class => [
            LogSuccessfulLogin::class,
        ],
        Failed::class => [
            LogFailedLoginAttempt::class,
        ],
        Logout::class => [
            LogUserLogout::class,
        ],
        RequestHandled::class => [
            LogApiRequest::class,
        ],
    ];

    protected $observers = [
        User::class => [ModelActivityObserver::class],
        Plan::class => [ModelActivityObserver::class],
        Subscription::class => [ModelActivityObserver::class],
        Team::class => [ModelActivityObserver::class],
        Course::class => [ModelActivityObserver::class],
        Lesson::class => [ModelActivityObserver::class],
        Project::class => [ModelActivityObserver::class],
        Task::class => [ModelActivityObserver::class],
    ];

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
