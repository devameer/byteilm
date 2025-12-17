<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class SubscriptionController extends Controller
{
    private const STATUSES = ['active', 'trialing', 'canceled', 'expired'];

    public function index(Request $request)
    {
        $subscriptions = Subscription::query()
            ->with(['user', 'plan'])
            ->latest('starts_at')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->paginate(20)
            ->withQueryString();

        return view('admin.subscriptions.index', compact('subscriptions'));
    }

    public function create(): View
    {
        $plans = Plan::orderBy('sort_order')->get();
        $users = User::orderBy('name')->get();

        return view('admin.subscriptions.create', [
            'plans' => $plans,
            'users' => $users,
            'statusOptions' => $this->statusOptions(),
            'subscription' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateInput($request);

        [$startsAt, $trialEndsAt, $endsAt, $canceledAt] = $this->prepareDates(
            $data['starts_at'] ?? null,
            $data['trial_ends_at'] ?? null,
            $data['ends_at'] ?? null,
            $data['canceled_at'] ?? null,
            $data['status']
        );

        $subscription = Subscription::create([
            'user_id' => $data['user_id'],
            'plan_id' => $data['plan_id'],
            'status' => $data['status'],
            'trial_ends_at' => $trialEndsAt,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'canceled_at' => $canceledAt,
        ]);

        return redirect()
            ->route('admin.subscriptions.index')
            ->with('status', __('تم إنشاء الاشتراك للمستخدم :name.', ['name' => $subscription->user?->name]));
    }

    public function reports(): View
    {
        $statusBreakdown = Subscription::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->orderByDesc('total')
            ->get();

        $planDistribution = Subscription::query()
            ->select('plan_id', DB::raw('COUNT(*) as total'))
            ->with('plan')
            ->groupBy('plan_id')
            ->orderByDesc('total')
            ->get();

        $trialEndingSoon = Subscription::query()
            ->where('status', 'trialing')
            ->whereNotNull('trial_ends_at')
            ->orderBy('trial_ends_at')
            ->limit(10)
            ->get();

        $monthlyRevenue = collect(range(0, 5))->map(function ($offset) {
            $start = Carbon::now()->subMonths($offset)->startOfMonth();
            $end = (clone $start)->endOfMonth();

            return [
                'label' => $start->format('M Y'),
                'total' => Payment::where('status', 'completed')
                    ->whereBetween('created_at', [$start, $end])
                    ->sum('amount'),
            ];
        })->reverse()->values();

        $mrr = Subscription::query()
            ->where('status', 'active')
            ->with('plan')
            ->get()
            ->sum(static fn ($subscription) => $subscription->plan?->price ?? 0);

        return view('admin.subscriptions.reports', [
            'statusBreakdown' => $statusBreakdown,
            'planDistribution' => $planDistribution,
            'trialEndingSoon' => $trialEndingSoon,
            'monthlyRevenue' => $monthlyRevenue,
            'mrr' => $mrr,
        ]);
    }

    public function edit(Subscription $subscription): View
    {
        $subscription->load(['user', 'plan']);

        $plans = Plan::orderBy('sort_order')->get();
        $users = User::orderBy('name')->get();

        return view('admin.subscriptions.edit', [
            'subscription' => $subscription,
            'plans' => $plans,
            'users' => $users,
            'statusOptions' => $this->statusOptions(),
        ]);
    }

    public function update(Request $request, Subscription $subscription): RedirectResponse
    {
        $data = $this->validateInput($request);

        [$startsAt, $trialEndsAt, $endsAt, $canceledAt] = $this->prepareDates(
            $data['starts_at'] ?? null,
            $data['trial_ends_at'] ?? null,
            $data['ends_at'] ?? null,
            $data['canceled_at'] ?? null,
            $data['status']
        );

        $subscription->update([
            'user_id' => $data['user_id'],
            'plan_id' => $data['plan_id'],
            'status' => $data['status'],
            'trial_ends_at' => $trialEndsAt,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'canceled_at' => $canceledAt,
        ]);

        return redirect()
            ->route('admin.subscriptions.index')
            ->with('status', __('تم تحديث الاشتراك بنجاح.'));
    }

    public function cancel(Subscription $subscription): RedirectResponse
    {
        $subscription->update([
            'status' => 'canceled',
            'canceled_at' => Carbon::now(),
            'ends_at' => Carbon::now(),
        ]);

        return back()->with('status', __('تم إلغاء الاشتراك.'));
    }

    public function resume(Subscription $subscription): RedirectResponse
    {
        $subscription->update([
            'status' => 'active',
            'starts_at' => Carbon::now(),
            'ends_at' => null,
            'canceled_at' => null,
        ]);

        return back()->with('status', __('تم إعادة تفعيل الاشتراك.'));
    }

    public function destroy(Subscription $subscription): RedirectResponse
    {
        $subscription->delete();

        return redirect()
            ->route('admin.subscriptions.index')
            ->with('status', __('تم حذف الاشتراك.'));
    }

    protected function validateInput(Request $request): array
    {
        return $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
            'status' => ['required', Rule::in(self::STATUSES)],
            'starts_at' => ['nullable', 'date'],
            'trial_ends_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'canceled_at' => ['nullable', 'date'],
        ]);
    }

    protected function prepareDates(
        $startsAt,
        $trialEndsAt,
        $endsAt,
        $canceledAt,
        string $status
    ): array {
        $starts = $startsAt ? Carbon::parse($startsAt) : Carbon::now();
        $trial = $trialEndsAt ? Carbon::parse($trialEndsAt)->endOfDay() : null;
        $ends = $endsAt ? Carbon::parse($endsAt)->endOfDay() : null;
        $canceled = $canceledAt ? Carbon::parse($canceledAt) : null;

        $messages = [];

        if ($trial && $trial->lt($starts)) {
            $messages['trial_ends_at'] = __('تاريخ نهاية الفترة التجريبية يجب أن يكون بعد تاريخ البداية.');
        }

        if ($ends && $ends->lt($starts)) {
            $messages['ends_at'] = __('تاريخ انتهاء الاشتراك يجب أن يكون بعد تاريخ البداية.');
        }

        if (!empty($messages)) {
            throw ValidationException::withMessages($messages);
        }

        if (!$canceled && in_array($status, ['canceled', 'expired'], true)) {
            $canceled = Carbon::now();
        }

        if (in_array($status, ['active', 'trialing'], true)) {
            $ends = null;
        }

        if ($status === 'trialing' && !$trial) {
            $trial = Carbon::now()->addDays(14)->endOfDay();
        }

        return [$starts, $trial, $ends, $canceled];
    }

    protected function statusOptions(): array
    {
        return [
            'active' => __('اشتراك نشط'),
            'trialing' => __('فترة تجريبية'),
            'canceled' => __('اشتراك ملغى'),
            'expired' => __('اشتراك منتهي'),
        ];
    }
}
