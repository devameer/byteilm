<?php

namespace App\Http\Controllers\Support;

use App\Http\Controllers\Controller;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use App\Notifications\TicketReplyNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class TicketController extends Controller
{
    public function index(Request $request): View
    {
        $tickets = SupportTicket::query()
            ->where('user_id', Auth::id())
            ->withCount([
                'messages as unread_count' => function ($query) {
                    $query->whereNull('read_at')
                        ->whereHasMorph('sender', \App\Models\User::class, function ($inner) {
                            $inner->where('id', '!=', Auth::id());
                        });
                },
            ])
            ->orderByDesc('last_message_at')
            ->paginate(10)
            ->withQueryString();

        return view('support.tickets.index', [
            'tickets' => $tickets,
        ]);
    }

    public function create(): View
    {
        return view('support.tickets.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'message' => ['required', 'string'],
        ]);

        $user = Auth::user();

        $ticket = null;
        $message = null;

        DB::transaction(function () use ($user, $data, &$ticket, &$message) {
            /** @var SupportTicket $ticket */
            $ticket = SupportTicket::create([
                'user_id' => $user->getKey(),
                'subject' => $data['subject'],
                'category' => $data['category'] ?? null,
                'priority' => $data['priority'] ?? 'medium',
                'status' => 'open',
                'last_message_at' => now(),
            ]);

            /** @var SupportMessage $message */
            $message = $ticket->messages()->create([
                'sender_id' => $user->getKey(),
                'sender_type' => $user::class,
                'body' => $data['message'],
            ]);
        });

        $this->notifyAdminsOfReply($message);

        return redirect()
            ->route('support.tickets.show', $ticket)
            ->with('status', __('تم إنشاء التذكرة بنجاح.'));
    }

    public function show(SupportTicket $ticket): View
    {
        abort_unless($ticket->user_id === Auth::id(), 403);

        $ticket->load([
            'messages' => fn ($query) => $query->with('sender')->orderBy('created_at'),
        ]);

        $ticket->messages()
            ->whereNull('read_at')
            ->whereHasMorph('sender', \App\Models\User::class, function ($query) {
                $query->where('id', '!=', Auth::id());
            })
            ->each(function (SupportMessage $message) {
                $message->markAsRead();
            });

        return view('support.tickets.show', [
            'ticket' => $ticket,
        ]);
    }

    public function reply(Request $request, SupportTicket $ticket): RedirectResponse
    {
        abort_unless($ticket->user_id === Auth::id(), 403);

        $data = $request->validate([
            'message' => ['required', 'string'],
        ]);

        $user = Auth::user();

        $message = null;
        DB::transaction(function () use ($ticket, $user, $data, &$message) {
            /** @var SupportMessage $message */
            $message = $ticket->messages()->create([
                'sender_id' => $user->getKey(),
                'sender_type' => $user::class,
                'body' => $data['message'],
            ]);

            $ticket->forceFill([
                'status' => 'open',
                'last_message_at' => now(),
            ])->save();
        });

        $this->notifyAdminsOfReply($message);

        return redirect()
            ->route('support.tickets.show', $ticket)
            ->with('status', __('تم إرسال ردك بنجاح.'));
    }

    protected function notifyAdminsOfReply(?SupportMessage $message): void
    {
        if (!$message) {
            return;
        }

        $admins = \App\Models\User::query()
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['super_admin', 'admin']);
            })
            ->get();

        if ($admins->isEmpty()) {
            return;
        }

        foreach ($admins as $admin) {
            $admin->notify(new TicketReplyNotification($message));
        }
    }
}
