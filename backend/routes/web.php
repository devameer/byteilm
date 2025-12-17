<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\BackupController;
use App\Http\Controllers\Admin\ContentController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ImpersonationController;
use App\Http\Controllers\Admin\LogController;
use App\Http\Controllers\Admin\FaqController as AdminFaqController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\ReferralController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\SubscriptionController;
use App\Http\Controllers\Admin\SupportController;
use App\Http\Controllers\Admin\SupportTicketController as AdminSupportTicketController;
use App\Http\Controllers\Admin\TeamController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Support\FaqController as SupportFaqController;
use App\Http\Controllers\Support\TicketController as SupportTicketController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

// API-only backend - Frontend (React) handles all public routes
// Redirect root to frontend
Route::get('/', function () {
    return redirect(env('FRONTEND_URL', 'http://localhost:5173'));
});

// Keep landing route name for backward compatibility
Route::get('/landing', function () {
    return redirect(env('FRONTEND_URL', 'http://localhost:5173'));
})->name('landing');

// Features page redirects to frontend
Route::get('/features', function () {
    return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/features');
})->name('features');

// Admin Login Routes
Route::get('/admin/login', function () {
    if (Auth::check() && Auth::user()->isAdmin()) {
        return redirect()->route('admin.dashboard');
    }
    return view('auth.admin-login');
})->name('admin.login');

// Alias for Laravel's default authentication redirect
Route::get('/login', function () {
    return redirect()->route('admin.login');
})->name('login');

Route::post('/admin/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (Auth::attempt($credentials, $request->filled('remember'))) {
        $request->session()->regenerate();

        if (Auth::user()->isAdmin()) {
            return redirect()->intended(route('admin.dashboard'));
        }

        Auth::logout();
        return back()->withErrors([
            'email' => 'ليس لديك صلاحيات الوصول لهذه الصفحة.',
        ]);
    }

    return back()->withErrors([
        'email' => 'بيانات الاعتماد غير صحيحة.',
    ]);
})->name('admin.login.post');

Route::post('/admin/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect()->route('admin.login');
})->name('admin.logout');

Route::middleware(['auth', 'admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::put('/users/{user}/roles', [UserController::class, 'updateRoles'])->name('users.roles.update');
        Route::put('/users/{user}/status', [UserController::class, 'updateStatus'])->name('users.status.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::post('/users/{user}/impersonate', [ImpersonationController::class, 'start'])->name('users.impersonate');
        Route::get('/subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions.index');
        Route::get('/subscriptions/create', [SubscriptionController::class, 'create'])->name('subscriptions.create');
        Route::post('/subscriptions', [SubscriptionController::class, 'store'])->name('subscriptions.store');
        Route::get('/subscriptions/{subscription}/edit', [SubscriptionController::class, 'edit'])->name('subscriptions.edit');
        Route::put('/subscriptions/{subscription}', [SubscriptionController::class, 'update'])->name('subscriptions.update');
        Route::delete('/subscriptions/{subscription}', [SubscriptionController::class, 'destroy'])->name('subscriptions.destroy');
        Route::get('/subscriptions/reports', [SubscriptionController::class, 'reports'])->name('subscriptions.reports');
        Route::post('/subscriptions/{subscription}/cancel', [SubscriptionController::class, 'cancel'])->name('subscriptions.cancel');
        Route::post('/subscriptions/{subscription}/resume', [SubscriptionController::class, 'resume'])->name('subscriptions.resume');
        Route::get('/plans', [PlanController::class, 'index'])->name('plans.index');
        Route::get('/plans/create', [PlanController::class, 'create'])->name('plans.create');
        Route::post('/plans', [PlanController::class, 'store'])->name('plans.store');
        Route::get('/plans/{plan}/edit', [PlanController::class, 'edit'])->name('plans.edit');
        Route::put('/plans/{plan}', [PlanController::class, 'update'])->name('plans.update');
        Route::post('/plans/{plan}/toggle', [PlanController::class, 'toggle'])->name('plans.toggle');
        Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
        Route::get('/payments/reports', [PaymentController::class, 'reports'])->name('payments.reports');
        Route::get('/payments/export', [PaymentController::class, 'export'])->name('payments.export');
        Route::get('/content', [ContentController::class, 'index'])->name('content.index');
        Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
        Route::get('/analytics/export', [AnalyticsController::class, 'export'])->name('analytics.export');
        Route::get('/logs', [LogController::class, 'index'])->name('logs.index');
        Route::get('/logs/export', [LogController::class, 'export'])->name('logs.export');
        Route::get('/logs/login', [LogController::class, 'login'])->name('logs.login');
        Route::get('/logs/activity', [LogController::class, 'activity'])->name('logs.activity');
        Route::get('/logs/errors', [LogController::class, 'errors'])->name('logs.errors');
        Route::get('/logs/api', [LogController::class, 'api'])->name('logs.api');
        Route::get('/logs/payments', [LogController::class, 'payments'])->name('logs.payments');
        Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
        Route::get('/support', [SupportController::class, 'index'])->name('support.index');
        Route::get('/support/tickets', [SupportController::class, 'tickets'])->name('support.tickets');
        Route::get('/support/messages', [SupportController::class, 'messages'])->name('support.messages');
        Route::get('/support/faq', [SupportController::class, 'faq'])->name('support.faq');
        Route::get('/support/tickets/{ticket}', [AdminSupportTicketController::class, 'show'])->name('support.tickets.show');
        Route::post('/support/tickets/{ticket}/reply', [AdminSupportTicketController::class, 'reply'])->name('support.tickets.reply');
        Route::patch('/support/tickets/{ticket}/status', [AdminSupportTicketController::class, 'updateStatus'])->name('support.tickets.status');
        Route::post('/support/faq', [AdminFaqController::class, 'store'])->name('support.faq.store');
        Route::put('/support/faq/{faq}', [AdminFaqController::class, 'update'])->name('support.faq.update');
        Route::delete('/support/faq/{faq}', [AdminFaqController::class, 'destroy'])->name('support.faq.destroy');
        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
        Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
        Route::get('/referrals', [ReferralController::class, 'index'])->name('referrals.index');
        Route::resource('teams', TeamController::class)->except(['show']);
        Route::post('/teams/{team}/members', [TeamController::class, 'storeMember'])->name('teams.members.store');
        Route::patch('/teams/{team}/members/{member}', [TeamController::class, 'updateMember'])->name('teams.members.update');
        Route::delete('/teams/{team}/members/{member}', [TeamController::class, 'destroyMember'])->name('teams.members.destroy');
        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('/backups', [BackupController::class, 'index'])->name('backups.index');
    });

Route::middleware('auth')->prefix('support-center')->name('support.')->group(function () {
    Route::get('tickets', [SupportTicketController::class, 'index'])->name('tickets.index');
    Route::get('tickets/create', [SupportTicketController::class, 'create'])->name('tickets.create');
    Route::post('tickets', [SupportTicketController::class, 'store'])->name('tickets.store');
    Route::get('tickets/{ticket}', [SupportTicketController::class, 'show'])->name('tickets.show');
    Route::post('tickets/{ticket}/reply', [SupportTicketController::class, 'reply'])->name('tickets.reply');
});

Route::get('help-center/faq', [SupportFaqController::class, 'index'])->name('support.faq.index');

Route::post('admin/impersonation/leave', [ImpersonationController::class, 'stop'])
    ->middleware('auth')
    ->name('admin.impersonation.leave');
