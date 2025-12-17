<?php

namespace App\Notifications;

use App\Models\SupportMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class TicketReplyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private SupportMessage $message)
    {
    }

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (!empty(config('mail.mailers.' . config('mail.default')))) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $ticket = $this->message->ticket;

        $url = $notifiable instanceof \App\Models\User && $notifiable->isAdmin()
            ? route('admin.support.tickets.show', $ticket)
            : route('support.tickets.show', $ticket);

        return (new MailMessage)
            ->subject(__('رد جديد على تذكرتك #:reference', ['reference' => $ticket->reference]))
            ->line(__('تم إضافة رد جديد على تذكرتك بالعنوان ":subject".', ['subject' => $ticket->subject]))
            ->line(__('مقتطف من الرد:'))
            ->line(Str::limit(strip_tags($this->message->body), 120))
            ->action(__('عرض التذكرة'), $url);
    }

    public function toArray(object $notifiable): array
    {
        $ticket = $this->message->ticket;

        return [
            'ticket_id' => $ticket->id,
            'reference' => $ticket->reference,
            'subject' => $ticket->subject,
            'message_preview' => Str::limit(strip_tags($this->message->body), 120),
            'sender_name' => optional($this->message->sender)->name,
        ];
    }
}
