<?php

namespace App\Listeners;

use App\Events\UserUsageShouldUpdate;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonVideo;
use App\Models\Project;
use App\Models\User;

class UpdateUserUsageMetrics
{
    public function handle(UserUsageShouldUpdate $event): void
    {
        $user = User::find($event->userId);

        if (!$user) {
            return;
        }

        $usage = $user->getOrCreateUsage();

        $projectsCount = Project::where('user_id', $user->id)->count();
        $coursesCount = Course::where('user_id', $user->id)->count();
        $lessonsCount = Lesson::where('user_id', $user->id)->count();

        $totalBytes = LessonVideo::where('user_id', $user->id)->sum('file_size');

        $usage->projects_count = $projectsCount;
        $usage->courses_count = $coursesCount;
        $usage->lessons_count = $lessonsCount;
        $usage->storage_used_mb = (int) ceil($totalBytes / 1048576);
        $usage->save();
    }
}
