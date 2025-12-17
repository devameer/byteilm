<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Payment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LogController extends Controller
{
    protected array $activityExclusions = [
        'login_attempt',
        'system_error',
        'api_request',
    ];

    public function index(): View
    {
        $sections = collect([
            [
                'title' => __('سجلات تسجيل الدخول'),
                'description' => __('تتبع محاولات تسجيل الدخول الناجحة والفاشلة مع تفاصيل الجهاز وعنوان الـ IP.'),
                'route' => route('admin.logs.login'),
            ],
            [
                'title' => __('سجلات الأنشطة'),
                'description' => __('عرض أحداث النظام المهمة مثل إدارة المستخدمين، التحديثات، والحذف.'),
                'route' => route('admin.logs.activity'),
            ],
            [
                'title' => __('سجلات الأخطاء'),
                'description' => __('مراجعة الأخطاء غير المتوقعة والاستثناءات التي تم التقاطها.'),
                'route' => route('admin.logs.errors'),
            ],
            [
                'title' => __('سجلات API'),
                'description' => __('تحليل الطلبات القادمة من التكاملات الخارجية وعمليات الـ Webhooks.'),
                'route' => route('admin.logs.api'),
            ],
            [
                'title' => __('سجلات المدفوعات'),
                'description' => __('تتبع عمليات الدفع الواردة، الاستردادات، وحالات الإلغاء.'),
                'route' => route('admin.logs.payments'),
            ],
        ]);

        $recentLogs = $this->logsAvailable()
            ? ActivityLog::query()
                ->with('user')
                ->latest()
                ->limit(8)
                ->get()
            : collect();

        return view('admin.logs.index', [
            'sections' => $sections,
            'recentLogs' => $recentLogs,
        ]);
    }

    public function login(Request $request): View
    {
        $loginLogs = $this->paginateLogs($request, function (Builder $query) use ($request) {
            $query->where('action', 'login_attempt')
                ->when($request->filled('status'), fn (Builder $q) => $q->where('metadata->status', $request->string('status')));
        });

        $statusCounts = $this->logsAvailable()
            ? $this->collectStatusCounts('login_attempt')
            : [];

        return view('admin.logs.login', [
            'loginLogs' => $loginLogs,
            'availableStatuses' => ['success', 'failed'],
            'statusCounts' => $statusCounts,
        ]);
    }

    public function activity(Request $request): View
    {
        $activityLogs = $this->paginateLogs($request, function (Builder $query) use ($request) {
            $query->whereNotIn('action', $this->activityExclusions)
                ->when($request->filled('action'), fn (Builder $q) => $q->where('action', $request->string('action')))
                ->when($request->filled('model_type'), fn (Builder $q) => $q->where('model_type', $request->string('model_type')));
        });

        return view('admin.logs.activity', [
            'activityLogs' => $activityLogs,
            'actions' => $this->availableActivityActions(),
            'modelTypes' => $this->availableModelTypes(),
        ]);
    }

    public function errors(Request $request): View
    {
        $errorLogs = $this->paginateLogs($request, function (Builder $query) use ($request) {
            $query->where('action', 'system_error')
                ->when($request->filled('level'), fn (Builder $q) => $q->where('metadata->level', $request->string('level')));
        });

        return view('admin.logs.errors', [
            'errorLogs' => $errorLogs,
            'levels' => $this->availableErrorLevels(),
        ]);
    }

    public function api(Request $request): View
    {
        $apiLogs = $this->paginateLogs($request, function (Builder $query) use ($request) {
            $query->where('action', 'api_request')
                ->when($request->filled('method'), fn (Builder $q) => $q->where('metadata->method', strtoupper($request->string('method'))))
                ->when($request->filled('status'), fn (Builder $q) => $q->where('metadata->status', (int) $request->integer('status')))
                ->when($request->filled('route_name'), fn (Builder $q) => $q->where('metadata->route_name', $request->string('route_name')));
        });

        return view('admin.logs.api', [
            'apiLogs' => $apiLogs,
            'methods' => $this->availableApiMethods(),
            'routes' => $this->availableApiRoutes(),
        ]);
    }

    public function payments(Request $request): View
    {
        $paymentLogs = Payment::query()
            ->with(['user', 'subscription.plan'])
            ->when($request->filled('status'), fn (Builder $query) => $query->where('status', $request->string('status')))
            ->when($request->filled('gateway'), fn (Builder $query) => $query->where('payment_gateway', $request->string('gateway')))
            ->when($request->filled('search'), function (Builder $query) use ($request) {
                $term = '%' . $request->string('search')->trim() . '%';

                $query->where(function (Builder $builder) use ($term) {
                    $builder->where('transaction_id', 'like', $term)
                        ->orWhere('payment_gateway', 'like', $term)
                        ->orWhereHas('user', function (Builder $userQuery) use ($term) {
                            $userQuery->where('name', 'like', $term)
                                ->orWhere('email', 'like', $term);
                        });
                });
            })
            ->when($request->filled('date_from'), function (Builder $query) use ($request) {
                $query->where('created_at', '>=', Carbon::parse($request->string('date_from'))->startOfDay());
            })
            ->when($request->filled('date_to'), function (Builder $query) use ($request) {
                $query->where('created_at', '<=', Carbon::parse($request->string('date_to'))->endOfDay());
            })
            ->orderByDesc('created_at')
            ->paginate($this->resolvePerPage($request))
            ->withQueryString();

        return view('admin.logs.payments', [
            'paymentLogs' => $paymentLogs,
            'gateways' => $this->availablePaymentGateways(),
            'statusBreakdown' => $this->paymentStatusCounts(),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $type = $request->string('type', 'activity');

        return match ($type) {
            'login' => $this->exportLogs($request, 'login_attempt'),
            'errors' => $this->exportLogs($request, 'system_error'),
            'api' => $this->exportLogs($request, 'api_request'),
            'payments' => $this->exportPayments($request),
            default => $this->exportLogs($request, null),
        };
    }

    protected function paginateLogs(Request $request, callable $scope): LengthAwarePaginator
    {
        if (!$this->logsAvailable()) {
            return $this->emptyPaginator($request);
        }

        $query = $this->buildLogQuery($request, $scope);

        return $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($this->resolvePerPage($request))
            ->withQueryString();
    }

    protected function buildLogQuery(Request $request, callable $scope): Builder
    {
        $query = ActivityLog::query()->with('user');

        $scope($query);

        $this->applyDateFilters($query, $request);
        $this->applyUserFilter($query, $request);
        $this->applySearchFilter($query, $request);

        return $query;
    }

    protected function exportLogs(Request $request, ?string $action): StreamedResponse
    {
        if (!$this->logsAvailable()) {
            abort(404);
        }

        $query = $this->buildLogQuery($request, function (Builder $query) use ($request, $action) {
            if ($action) {
                $query->where('action', $action);
            } else {
                $query->whereNotIn('action', $this->activityExclusions)
                    ->when($request->filled('action'), fn (Builder $q) => $q->where('action', $request->string('action')))
                    ->when($request->filled('model_type'), fn (Builder $q) => $q->where('model_type', $request->string('model_type')));
            }

            if ($action === 'login_attempt' && $request->filled('status')) {
                $query->where('metadata->status', $request->string('status'));
            }

            if ($action === 'system_error' && $request->filled('level')) {
                $query->where('metadata->level', $request->string('level'));
            }

            if ($action === 'api_request') {
                $query
                    ->when($request->filled('method'), fn (Builder $q) => $q->where('metadata->method', strtoupper($request->string('method'))))
                    ->when($request->filled('status'), fn (Builder $q) => $q->where('metadata->status', (int) $request->integer('status')))
                    ->when($request->filled('route_name'), fn (Builder $q) => $q->where('metadata->route_name', $request->string('route_name')));
            }
        });

        $headers = match ($action) {
            'login_attempt' => ['التاريخ', 'اسم المستخدم', 'البريد', 'الحالة', 'IP', 'المتصفح'],
            'system_error' => ['التاريخ', 'الاستثناء', 'الرسالة', 'الملف', 'المسار', 'المستخدم'],
            'api_request' => ['التاريخ', 'المستخدم', 'الطريقة', 'المسار', 'الحالة', 'المدة (مللي)', 'اسم المسار'],
            default => ['التاريخ', 'المستخدم', 'البريد', 'الإجراء', 'النطاق', 'الوصف'],
        };

        $transformer = match ($action) {
            'login_attempt' => fn (ActivityLog $log) => [
                optional($log->created_at)->format('Y-m-d H:i:s'),
                $log->user?->name ?? __('غير معروف'),
                $log->user?->email ?? data_get($log->metadata, 'email'),
                data_get($log->metadata, 'status', 'unknown'),
                $log->ip_address,
                $log->user_agent,
            ],
            'system_error' => fn (ActivityLog $log) => [
                optional($log->created_at)->format('Y-m-d H:i:s'),
                data_get($log->metadata, 'exception'),
                $log->description,
                sprintf('%s:%s', data_get($log->metadata, 'file'), data_get($log->metadata, 'line')),
                data_get($log->metadata, 'url'),
                $log->user?->email,
            ],
            'api_request' => fn (ActivityLog $log) => [
                optional($log->created_at)->format('Y-m-d H:i:s'),
                $log->user?->email ?? __('مجهول'),
                data_get($log->metadata, 'method'),
                data_get($log->metadata, 'path'),
                data_get($log->metadata, 'status'),
                data_get($log->metadata, 'duration_ms'),
                data_get($log->metadata, 'route_name'),
            ],
            default => fn (ActivityLog $log) => [
                optional($log->created_at)->format('Y-m-d H:i:s'),
                $log->user?->name ?? __('غير معروف'),
                $log->user?->email,
                $log->action,
                $log->model_type ? class_basename($log->model_type) . '#' . $log->model_id : '—',
                $log->description,
            ],
        };

        $filename = match ($action) {
            'login_attempt' => 'login-logs',
            'system_error' => 'error-logs',
            'api_request' => 'api-logs',
            default => 'activity-logs',
        };

        return $this->streamCsv($query, $headers, $transformer, $filename);
    }

    protected function exportPayments(Request $request): StreamedResponse
    {
        $query = Payment::query()
            ->with(['user', 'subscription.plan'])
            ->when($request->filled('status'), fn (Builder $q) => $q->where('status', $request->string('status')))
            ->when($request->filled('gateway'), fn (Builder $q) => $q->where('payment_gateway', $request->string('gateway')))
            ->when($request->filled('search'), function (Builder $q) use ($request) {
                $term = '%' . $request->string('search')->trim() . '%';

                $q->where(function (Builder $builder) use ($term) {
                    $builder->where('transaction_id', 'like', $term)
                        ->orWhere('payment_gateway', 'like', $term)
                        ->orWhereHas('user', function (Builder $userQuery) use ($term) {
                            $userQuery->where('name', 'like', $term)
                                ->orWhere('email', 'like', $term);
                        });
                });
            })
            ->when($request->filled('date_from'), fn (Builder $q) => $q->where('created_at', '>=', Carbon::parse($request->string('date_from'))->startOfDay()))
            ->when($request->filled('date_to'), fn (Builder $q) => $q->where('created_at', '<=', Carbon::parse($request->string('date_to'))->endOfDay()));

        $headers = ['التاريخ', 'المستخدم', 'البريد', 'الباقة', 'المبلغ', 'العملة', 'الحالة', 'البوابة', 'المعرف المرجعي'];

        $transformer = fn (Payment $payment) => [
            optional($payment->created_at)->format('Y-m-d H:i:s'),
            $payment->user?->name,
            $payment->user?->email,
            $payment->subscription?->plan?->display_name,
            number_format($payment->amount, 2),
            $payment->currency,
            $payment->status,
            $payment->payment_gateway,
            $payment->transaction_id,
        ];

        return $this->streamCsv($query, $headers, $transformer, 'payment-logs');
    }

    protected function streamCsv(Builder $query, array $headers, callable $transformer, string $filenamePrefix): StreamedResponse
    {
        $filename = sprintf('%s_%s.csv', $filenamePrefix, now()->format('Ymd_His'));

        return response()->streamDownload(function () use ($query, $headers, $transformer) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);

            $query->orderBy('id')->chunkById(200, function ($rows) use ($handle, $transformer) {
                foreach ($rows as $row) {
                    fputcsv($handle, $transformer($row));
                }
            });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    protected function applyDateFilters(Builder $query, Request $request): void
    {
        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', Carbon::parse($request->string('date_from'))->startOfDay());
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', Carbon::parse($request->string('date_to'))->endOfDay());
        }
    }

    protected function applyUserFilter(Builder $query, Request $request): void
    {
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));

            return;
        }

        if ($request->filled('user')) {
            $term = '%' . $request->string('user')->trim() . '%';

            $query->where(function (Builder $builder) use ($term) {
                $builder->whereHas('user', function (Builder $userQuery) use ($term) {
                    $userQuery->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term);
                });
            });
        }
    }

    protected function applySearchFilter(Builder $query, Request $request): void
    {
        if (!$request->filled('search')) {
            return;
        }

        $term = '%' . $request->string('search')->trim() . '%';

        $query->where(function (Builder $builder) use ($term) {
            $builder->where('description', 'like', $term)
                ->orWhere('action', 'like', $term)
                ->orWhere('model_type', 'like', $term)
                ->orWhere('ip_address', 'like', $term)
                ->orWhere('metadata->status', 'like', $term)
                ->orWhere('metadata->message', 'like', $term)
                ->orWhere('metadata->exception', 'like', $term)
                ->orWhere('metadata->path', 'like', $term)
                ->orWhere('metadata->route_name', 'like', $term)
                ->orWhereHas('user', function (Builder $userQuery) use ($term) {
                    $userQuery->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term);
                });
        });
    }

    protected function resolvePerPage(Request $request): int
    {
        $perPage = (int) $request->integer('per_page', 25);

        return in_array($perPage, [25, 50, 100], true) ? $perPage : 25;
    }

    protected function emptyPaginator(Request $request): LengthAwarePaginator
    {
        return new \Illuminate\Pagination\LengthAwarePaginator(
            collect(),
            0,
            $this->resolvePerPage($request),
            max(1, (int) $request->integer('page', 1)),
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );
    }

    protected function logsAvailable(): bool
    {
        return Schema::hasTable('activity_logs');
    }

    protected function collectStatusCounts(string $action): array
    {
        return ActivityLog::query()
            ->where('action', $action)
            ->get()
            ->groupBy(fn (ActivityLog $log) => data_get($log->metadata, 'status', 'unknown'))
            ->map->count()
            ->toArray();
    }

    protected function availableActivityActions(): array
    {
        if (!$this->logsAvailable()) {
            return [];
        }

        return ActivityLog::query()
            ->whereNotIn('action', $this->activityExclusions)
            ->distinct()
            ->orderBy('action')
            ->pluck('action')
            ->toArray();
    }

    protected function availableModelTypes(): array
    {
        if (!$this->logsAvailable()) {
            return [];
        }

        return ActivityLog::query()
            ->whereNotIn('action', $this->activityExclusions)
            ->whereNotNull('model_type')
            ->distinct()
            ->orderBy('model_type')
            ->pluck('model_type')
            ->map(fn (string $class) => [
                'class' => $class,
                'label' => class_basename($class),
            ])
            ->values()
            ->toArray();
    }

    protected function availableErrorLevels(): array
    {
        if (!$this->logsAvailable()) {
            return [];
        }

        return ActivityLog::query()
            ->where('action', 'system_error')
            ->get()
            ->pluck('metadata.level')
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    protected function availableApiMethods(): array
    {
        if (!$this->logsAvailable()) {
            return [];
        }

        return ActivityLog::query()
            ->where('action', 'api_request')
            ->get()
            ->pluck('metadata.method')
            ->filter()
            ->map(fn ($method) => strtoupper((string) $method))
            ->unique()
            ->values()
            ->all();
    }

    protected function availableApiRoutes(): array
    {
        if (!$this->logsAvailable()) {
            return [];
        }

        return ActivityLog::query()
            ->where('action', 'api_request')
            ->get()
            ->pluck('metadata.route_name')
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();
    }

    protected function availablePaymentGateways(): array
    {
        return Payment::query()
            ->select('payment_gateway')
            ->distinct()
            ->pluck('payment_gateway')
            ->filter()
            ->sort()
            ->values()
            ->all();
    }

    protected function paymentStatusCounts(): array
    {
        return Payment::query()
            ->select('status')
            ->selectRaw('count(*) as total')
            ->groupBy('status')
            ->get()
            ->pluck('total', 'status')
            ->toArray();
    }
}
