<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class UserController extends Controller
{
    public function index(Request $request): View
    {
        $usersQuery = User::query()
            ->with(['roles', 'subscription.plan'])
            ->when($request->filled('q'), function ($query) use ($request) {
                $term = '%' . $request->string('q')->trim() . '%';

                $query->where(function ($subQuery) use ($term) {
                    $subQuery->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term);
                });
            })
            ->when($request->filled('role'), function ($query) use ($request) {
                $query->whereHas('roles', fn ($roleQuery) => $roleQuery->where('name', $request->string('role')));
            })
            ->when($request->filled('plan'), function ($query) use ($request) {
                if ($request->string('plan') === 'free') {
                    $query->whereDoesntHave('subscription');
                } else {
                    $query->whereHas('subscription.plan', fn ($planQuery) => $planQuery->where('name', $request->string('plan')));
                }
            })
            ->when($request->filled('status'), function ($query) use ($request) {
                $status = $request->string('status');

                if (in_array($status, ['active', 'inactive'], true)) {
                    $query->where('is_active', $status === 'active');
                } elseif (in_array($status, ['trialing', 'canceled', 'expired'], true)) {
                    $query->whereHas('subscription', fn ($subscriptionQuery) => $subscriptionQuery->where('status', $status));
                }
            })
            ->orderByDesc('created_at');

        $users = $usersQuery->paginate(20)->withQueryString();

        $roles = Role::orderBy('display_name')->get();
        $plans = Plan::orderBy('sort_order')->get();

        return view('admin.users.index', [
            'users' => $users,
            'roles' => $roles,
            'plans' => $plans,
        ]);
    }

    public function create(): View
    {
        $roles = Role::orderBy('display_name')->get();
        $plans = Plan::orderBy('sort_order')->get();

        return view('admin.users.create', [
            'roles' => $roles,
            'plans' => $plans,
            'selectedRoles' => [],
            'selectedPlanId' => null,
            'selectedSubscriptionStatus' => 'active',
            'selectedTrialEndsAt' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'is_active' => ['nullable', 'boolean'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
            'plan_id' => ['nullable', 'integer', 'exists:plans,id'],
            'subscription_status' => ['nullable', 'in:active,trialing'],
            'trial_ends_at' => ['nullable', 'date'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : true,
        ]);

        $user->syncRoles($data['roles'] ?? []);

        $this->syncSubscription(
            $user,
            $data['plan_id'] ?? null,
            $data['subscription_status'] ?? 'active',
            $data['trial_ends_at'] ?? null
        );

        return redirect()
            ->route('admin.users.show', $user)
            ->with('status', __('تم إنشاء المستخدم بنجاح.'));
    }

    public function show(User $user): View
    {
        $user->load(['roles', 'subscription.plan']);

        $statistics = [
            ['label' => __('الدورات'), 'value' => $user->courses()->count()],
            ['label' => __('الدروس'), 'value' => $user->lessons()->count()],
            ['label' => __('المشاريع'), 'value' => $user->projects()->count()],
            ['label' => __('المهام'), 'value' => $user->tasks()->count()],
            ['label' => __('المحفزات'), 'value' => $user->prompts()->count()],
        ];

        $recentSubscriptions = Subscription::query()
            ->with('plan')
            ->where('user_id', $user->id)
            ->latest('starts_at')
            ->limit(5)
            ->get();

        $roles = Role::orderBy('display_name')->get();

        return view('admin.users.show', [
            'user' => $user,
            'statistics' => $statistics,
            'recentSubscriptions' => $recentSubscriptions,
            'roles' => $roles,
        ]);
    }

    public function edit(User $user): View
    {
        $user->load(['roles', 'subscription.plan']);

        $roles = Role::orderBy('display_name')->get();
        $plans = Plan::orderBy('sort_order')->get();
        $selectedRoles = $user->roles->pluck('name')->all();
        $activeSubscription = $user->subscription;

        return view('admin.users.edit', [
            'user' => $user,
            'roles' => $roles,
            'plans' => $plans,
            'selectedRoles' => $selectedRoles,
            'selectedPlanId' => $activeSubscription?->plan_id,
            'selectedSubscriptionStatus' => $activeSubscription?->status ?? 'active',
            'selectedTrialEndsAt' => optional($activeSubscription?->trial_ends_at)->format('Y-m-d'),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'is_active' => ['nullable', 'boolean'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
            'plan_id' => ['nullable', 'integer', 'exists:plans,id'],
            'subscription_status' => ['nullable', 'in:active,trialing'],
            'trial_ends_at' => ['nullable', 'date'],
        ]);

        $user->fill([
            'name' => $data['name'],
            'email' => $data['email'],
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : false,
        ]);

        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        $user->syncRoles($data['roles'] ?? []);

        $this->syncSubscription(
            $user,
            $data['plan_id'] ?? null,
            $data['subscription_status'] ?? 'active',
            $data['trial_ends_at'] ?? null
        );

        return redirect()
            ->route('admin.users.show', $user)
            ->with('status', __('تم تحديث بيانات المستخدم.'));
    }

    public function updateRoles(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'roles' => ['array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ]);

        $user->syncRoles($data['roles'] ?? []);

        return redirect()->route('admin.users.show', $user)->with('status', __('تم تحديث أدوار المستخدم بنجاح.'));
    }

    public function updateStatus(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $user->update(['is_active' => $request->boolean('is_active')]);

        return redirect()->route('admin.users.show', $user)->with('status', __('تم تحديث حالة المستخدم.'));
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return redirect()->route('admin.users.show', $user)
                ->with('status', __('لا يمكنك حذف حسابك أثناء تسجيل الدخول.'));
        }

        $user->delete();

        return redirect()->route('admin.users.index')->with('status', __('تم حذف المستخدم.'));
    }

    protected function syncSubscription(User $user, ?int $planId, ?string $status, ?string $trialEndsAt): void
    {
        $status = in_array($status, ['active', 'trialing'], true) ? $status : 'active';
        $trialDate = $trialEndsAt ? Carbon::parse($trialEndsAt)->endOfDay() : null;

        $current = $user->subscriptions()
            ->whereIn('status', ['active', 'trialing'])
            ->orderByDesc('starts_at')
            ->first();

        if (!$planId) {
            if ($current && in_array($current->status, ['active', 'trialing'], true)) {
                $current->update([
                    'status' => 'canceled',
                    'canceled_at' => Carbon::now(),
                    'ends_at' => Carbon::now(),
                ]);
            }

            return;
        }

        $plan = Plan::find($planId);
        if (!$plan) {
            return;
        }

        if ($current && $current->plan_id === $planId && in_array($current->status, ['active', 'trialing'], true)) {
            $current->update([
                'status' => $status,
                'trial_ends_at' => $status === 'trialing' ? $trialDate : null,
                'ends_at' => null,
                'canceled_at' => null,
            ]);

            return;
        }

        if ($current && in_array($current->status, ['active', 'trialing'], true)) {
            $current->update([
                'status' => 'canceled',
                'canceled_at' => Carbon::now(),
                'ends_at' => Carbon::now(),
            ]);
        }

        Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => $status,
            'trial_ends_at' => $status === 'trialing' ? $trialDate : null,
            'starts_at' => Carbon::now(),
        ]);
    }
}
