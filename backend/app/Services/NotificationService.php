<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Events\NotificationCreated;
use Illuminate\Support\Facades\Mail;
use App\Mail\NotificationEmail;

class NotificationService
{
    public function create(User $user, string $type, string $title, ?string $message = null, ?array $data = null, bool $sendEmail = false)
    {
        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        event(new NotificationCreated($notification));

        if ($sendEmail && $user->email) {
            $this->sendEmailNotification($user, $notification);
        }

        return $notification;
    }

    public function notifyMultipleUsers(array $userIds, string $type, string $title, ?string $message = null, ?array $data = null, bool $sendEmail = false)
    {
        $users = User::whereIn('id', $userIds)->get();
        $notifications = [];

        foreach ($users as $user) {
            $notifications[] = $this->create($user, $type, $title, $message, $data, $sendEmail);
        }

        return $notifications;
    }

    public function notifyTaskCreated(User $user, $task)
    {
        return $this->create(
            $user,
            'task_created',
            'New Task Created',
            "Task '{$task->title}' has been created",
            ['task_id' => $task->id]
        );
    }

    public function notifyTaskCompleted(User $user, $task)
    {
        return $this->create(
            $user,
            'task_completed',
            'Task Completed',
            "Task '{$task->title}' has been completed",
            ['task_id' => $task->id]
        );
    }

    public function notifyLessonCompleted(User $user, $lesson)
    {
        return $this->create(
            $user,
            'lesson_completed',
            'Lesson Completed',
            "Lesson '{$lesson->title}' has been completed",
            ['lesson_id' => $lesson->id]
        );
    }

    public function notifyCourseCompleted(User $user, $course)
    {
        return $this->create(
            $user,
            'course_completed',
            'Course Completed',
            "Congratulations! You completed the course '{$course->title}'",
            ['course_id' => $course->id],
            true
        );
    }

    public function notifyProjectCreated(User $user, $project)
    {
        return $this->create(
            $user,
            'project_created',
            'New Project Created',
            "Project '{$project->name}' has been created",
            ['project_id' => $project->id]
        );
    }

    public function notifyTeamInvitation(User $user, $team, $inviter)
    {
        return $this->create(
            $user,
            'team_invitation',
            'Team Invitation',
            "{$inviter->name} invited you to join '{$team->name}'",
            [
                'team_id' => $team->id,
                'inviter_id' => $inviter->id
            ],
            true
        );
    }

    public function notifyReferralSuccess(User $user, User $referred)
    {
        return $this->create(
            $user,
            'referral_success',
            'Referral Success',
            "{$referred->name} joined using your referral code!",
            ['referred_user_id' => $referred->id],
            true
        );
    }

    protected function sendEmailNotification(User $user, Notification $notification)
    {
        try {
            Mail::to($user->email)->queue(new NotificationEmail($notification));
        } catch (\Exception $e) {
            \Log::error('Failed to send notification email: ' . $e->getMessage());
        }
    }
}
