<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FaqArticle;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class SupportController extends Controller
{
    public function index(): View
    {
        $aggregates = SupportTicket::query()
            ->selectRaw("SUM(CASE WHEN status IN ('open','pending') THEN 1 ELSE 0 END) as tickets_open")
            ->selectRaw("SUM(CASE WHEN status IN ('resolved','closed') THEN 1 ELSE 0 END) as tickets_resolved")
            ->first();

        $stats = [
            'tickets_open' => (int) ($aggregates?->tickets_open ?? 0),
            'tickets_resolved' => (int) ($aggregates?->tickets_resolved ?? 0),
            'unread_messages' => SupportMessage::query()
                ->whereNull('read_at')
                ->whereHasMorph('sender', \App\Models\User::class, function ($query) {
                    $query->whereDoesntHave('roles', function ($roleQuery) {
                        $roleQuery->whereIn('name', ['admin', 'super_admin']);
                    });
                })
                ->count(),
        ];

        $sections = collect([
            [
                'title' => __('التذاكر'),
                'description' => __('إدارة طلبات الدعم حسب الحالة والأولوية ووقت الاستجابة.'),
                'route' => route('admin.support.tickets'),
            ],
            [
                'title' => __('الرسائل'),
                'description' => __('مراجعة محادثات المستخدمين وردود فريق الدعم.'),
                'route' => route('admin.support.messages'),
            ],
            [
                'title' => __('إدارة الأسئلة الشائعة'),
                'description' => __('تنظيم مقالات الأسئلة الشائعة وتحديثها بالتصنيفات.'),
                'route' => route('admin.support.faq'),
            ],
        ]);

        return view('admin.support.index', compact('stats', 'sections'));
    }

    public function tickets(Request $request): View
    {
        $tickets = SupportTicket::query()
            ->with(['user', 'messages' => fn ($query) => $query->latest()->limit(1)])
            ->status($request->string('status')->toString() ?: null)
            ->priority($request->string('priority')->toString() ?: null)
            ->category($request->string('category')->toString() ?: null)
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = '%' . $request->string('search')->trim() . '%';

                $query->where(function ($subQuery) use ($term) {
                    $subQuery
                        ->where('subject', 'like', $term)
                        ->orWhere('reference', 'like', $term);
                });
            })
            ->orderByDesc('last_message_at')
            ->paginate(15)
            ->withQueryString();

        $summary = SupportTicket::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $categories = SupportTicket::query()
            ->select('category')
            ->distinct()
            ->pluck('category')
            ->filter()
            ->values();

        return view('admin.support.tickets', [
            'tickets' => $tickets,
            'summary' => $summary,
            'categories' => $categories,
        ]);
    }

    public function messages(Request $request): View
    {
        $conversations = SupportTicket::query()
            ->with(['user', 'messages' => fn ($query) => $query->latest()->limit(1)])
            ->withCount([
                'messages as unread_count' => function ($query) {
                    $query->whereNull('read_at')
                        ->whereHasMorph('sender', \App\Models\User::class, function ($subQuery) {
                            $subQuery->whereDoesntHave('roles', function ($roleQuery) {
                                $roleQuery->whereIn('name', ['admin', 'super_admin']);
                            });
                        });
                },
            ])
            ->orderByDesc('last_message_at')
            ->paginate(15)
            ->withQueryString();

        return view('admin.support.messages', [
            'conversations' => $conversations,
        ]);
    }

    public function faq(): View
    {
        $articles = FaqArticle::query()
            ->orderByDesc('is_published')
            ->orderBy('sort_order')
            ->orderBy('question')
            ->paginate(20);

        return view('admin.support.faq', [
            'articles' => $articles,
        ]);
    }
}
