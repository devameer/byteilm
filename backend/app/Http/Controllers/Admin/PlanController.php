<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class PlanController extends Controller
{
    public function index(): View
    {
        $plans = Plan::query()
            ->withCount([
                'subscriptions as active_subscriptions_count' => function ($query) {
                    $query->whereIn('status', ['active', 'trialing']);
                },
                'subscriptions as total_subscriptions_count',
            ])
            ->orderBy('sort_order')
            ->get();

        return view('admin.plans.index', compact('plans'));
    }

    public function create(): View
    {
        return view('admin.plans.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateData($request);

        Plan::create($data);

        return redirect()->route('admin.plans.index')->with('status', __('تم إنشاء الباقة بنجاح.'));
    }

    public function edit(Plan $plan): View
    {
        return view('admin.plans.edit', compact('plan'));
    }

    public function update(Request $request, Plan $plan): RedirectResponse
    {
        $data = $this->validateData($request, $plan);

        $plan->update($data);

        return redirect()->route('admin.plans.index')->with('status', __('تم تحديث الباقة.'));
    }

    public function toggle(Plan $plan): RedirectResponse
    {
        $plan->update(['is_active' => !$plan->is_active]);

        return back()->with('status', __('تم تحديث حالة الباقة.'));
    }

    protected function validateData(Request $request, ?Plan $plan = null): array
    {
        $uniqueNameRule = Rule::unique('plans', 'name');

        if ($plan) {
            $uniqueNameRule->ignore($plan->id);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50', $uniqueNameRule],
            'display_name' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'billing_period' => ['required', 'in:monthly,yearly,lifetime'],
            'features' => ['nullable', 'array'],
            'features.*' => ['nullable', 'string', 'max:255'],
            'limits_keys' => ['nullable', 'array'],
            'limits_keys.*' => ['nullable', 'string', 'max:100'],
            'limits_values' => ['nullable', 'array'],
            'limits_values.*' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $validated['features'] = collect($validated['features'] ?? [])
            ->map(fn ($feature) => trim((string) $feature))
            ->filter()
            ->values()
            ->all();

        $limits = [];
        $keys = $validated['limits_keys'] ?? [];
        $values = $validated['limits_values'] ?? [];

        foreach ($keys as $index => $key) {
            $key = trim((string) $key);
            $value = $values[$index] ?? null;

            if ($key === '' || ($value === null || $value === '')) {
                continue;
            }

            $limits[$key] = is_numeric($value) ? (float) $value : $value;
        }

        $validated['limits'] = $limits;

        $validated['currency'] = strtoupper($validated['currency']);
        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = $validated['sort_order'] ?? 0;

        unset($validated['limits_keys'], $validated['limits_values']);

        return $validated;
    }
}
