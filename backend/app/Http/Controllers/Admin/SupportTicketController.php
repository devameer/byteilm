<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use App\Notifications\TicketReplyNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class SupportTicketController extends Controller
{
    public function show(SupportTicket $ticket): View
    {
        $ticket->load([
            'user',
            'messages' => fn ($query) => $query->with('sender')->orderBy('created_at'),
        ]);

        $ticket->messages()
            ->whereNull('read_at')
            ->whereHasMorph('sender', \App\Models\User::class, function ($query) {
                $query->whereDoesntHave('roles', function ($roleQuery) {
                    $roleQuery->whereIn('name', ['admin', 'super_admin']);
                });
            })
            ->each(fn (SupportMessage $message) => $message->markAsRead());

        return view('admin.support.ticket-show', [
            'ticket' => $ticket,
        ]);
    }

    public function reply(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string'],
            'is_internal' => ['nullable', 'boolean'],
        ]);

        $admin = Auth::user();

        DB::transaction(function () use ($ticket, $admin, $data) {
            $message = $ticket->messages()->create([
                'sender_id' => $admin->getKey(),
                'sender_type' => $admin::class,
                'body' => $data['body'],
                'attachments' => null,
                'is_internal' => (bool) ($data['is_internal'] ?? false),
            ]);

            $ticket->forceFill([
                'status' => $message->is_internal ? $ticket->status : 'pending',
                'last_message_at' => now(),
            ])->save();

            if (!$message->is_internal && $ticket->user) {
                $ticket->user->notify(new TicketReplyNotification($message));
            }
        });

        return redirect()
            ->route('admin.support.tickets.show', $ticket)
            ->with('status', __('تم إرسال الرد بنجاح.'));
    }

    public function updateStatus(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:open,pending,resolved,closed'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
        ]);

        $ticket->fill([
            'status' => $data['status'],
            'priority' => $data['priority'] ?? $ticket->priority,
            'closed_at' => in_array($data['status'], ['resolved', 'closed'], true) ? now() : null,
        ])->save();

        return redirect()
            ->route('admin.support.tickets.show', $ticket)
            ->with('status', __('تم تحديث حالة التذكرة.'));
    }
}
