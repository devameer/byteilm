<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TelegramBotController;
use App\Http\Controllers\CalendarController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Telegram Bot Routes
Route::prefix('telegram')->group(function () {
    // Webhook endpoint (لاستقبال رسائل Telegram) - Public endpoint
    Route::post('/webhook', [TelegramBotController::class, 'webhook']);

    // Protected admin routes - require authentication
    Route::middleware('auth:sanctum')->group(function () {
        // Webhook management routes (لإدارة الـ webhook)
        Route::post('/set-webhook', [TelegramBotController::class, 'setWebhook']);
        Route::get('/webhook-info', [TelegramBotController::class, 'getWebhookInfo']);
        Route::post('/remove-webhook', [TelegramBotController::class, 'removeWebhook']);

        // Bot commands management routes (لإدارة أوامر البوت)
        Route::post('/set-commands', [TelegramBotController::class, 'setMyCommands']);
        Route::get('/get-commands', [TelegramBotController::class, 'getMyCommands']);
        Route::post('/delete-commands', [TelegramBotController::class, 'deleteMyCommands']);

        // Logs management routes (لإدارة سجلات الرسائل)
        Route::get('/logs', [TelegramBotController::class, 'viewLogs']);
        Route::get('/logs/download', [TelegramBotController::class, 'downloadLogs']);
        Route::post('/logs/clear', [TelegramBotController::class, 'clearLogs']);
    });
});

// API Routes for React SPA
use App\Http\Controllers\Api\CalendarApiController;
use App\Http\Controllers\Api\TaskApiController;
use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\CourseApiController;
use App\Http\Controllers\Api\ProjectApiController;
use App\Http\Controllers\Api\LessonApiController;
use App\Http\Controllers\Api\CategoryApiController;
use App\Http\Controllers\Api\PromptApiController;
use App\Http\Controllers\Api\GitApiController;
use App\Http\Controllers\Api\DashboardApiController;
use App\Http\Controllers\Api\LessonVideoApiController;
use App\Http\Controllers\Api\LessonSubtitleApiController;
use App\Http\Controllers\Api\MediaLibraryApiController;
use App\Http\Controllers\Api\ReferralApiController;
use App\Http\Controllers\Api\TeamApiController;
use App\Http\Controllers\Api\TeamMemberApiController;
use App\Http\Controllers\Api\TeamResourceController;
use App\Http\Controllers\Api\TeamInvitationController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\SubtaskController;
use App\Http\Controllers\Api\FileAttachmentController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\NotificationApiController;
use App\Http\Controllers\Api\MediaProxyController;

// Media Proxy Routes (public - with CORS support for video streaming)
Route::prefix('media')->group(function () {
    Route::get('/video/{lesson}', [MediaProxyController::class, 'video'])->name('media.video');
    Route::get('/subtitle/{subtitle}', [MediaProxyController::class, 'subtitle'])->name('media.subtitle');
    Route::options('/video/{lesson}', [MediaProxyController::class, 'options']);
    Route::options('/subtitle/{subtitle}', [MediaProxyController::class, 'options']);
});

// Authentication Routes (public) - with rate limiting
Route::prefix('auth')->group(function () {
    // Strict rate limiting for login to prevent brute force attacks (5 attempts per minute)
    Route::middleware('throttle:5,1')->post('/login', [AuthApiController::class, 'login']);

    // Moderate rate limiting for registration (10 attempts per minute)
    Route::middleware('throttle:10,1')->post('/register', [AuthApiController::class, 'register']);

    // Password reset routes
    Route::middleware('throttle:5,1')->post('/forgot-password', [AuthApiController::class, 'forgotPassword']);
    Route::middleware('throttle:5,1')->post('/reset-password', [AuthApiController::class, 'resetPassword']);

    // CSRF token endpoint
    Route::get('/csrf', [AuthApiController::class, 'csrf']);
});

// Protected Routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {

    // Auth routes (authenticated)
    Route::prefix('auth')->group(function () {
        Route::get('/user', [AuthApiController::class, 'user']);
        Route::post('/logout', [AuthApiController::class, 'logout']);
        Route::post('/logout-all', [AuthApiController::class, 'logoutAll']);
    });

    // Dashboard summary
    Route::get('/dashboard', DashboardApiController::class);

    // Calendar API Routes
    Route::prefix('calendar')->group(function () {
        Route::get('/data', [CalendarApiController::class, 'getCalendarData']);
        Route::get('/items/{date}', [CalendarApiController::class, 'getItemsForDate']);
        Route::get('/search', [CalendarApiController::class, 'search']);
        Route::get('/statistics', [CalendarApiController::class, 'getStatistics']);
        Route::get('/metadata', [CalendarApiController::class, 'getMetadata']);
        Route::post('/move', [CalendarApiController::class, 'moveItem']);
        Route::post('/complete', [CalendarApiController::class, 'completeItem']);
        Route::post('/quick-add', [CalendarApiController::class, 'quickAdd']);
    });

    // Task API Routes (RESTful)
    Route::apiResource('tasks', TaskApiController::class);
    Route::post('tasks/{id}/complete', [TaskApiController::class, 'complete']);
    Route::post('tasks/reorder', [TaskApiController::class, 'reorder']);

    // Subtasks API Routes
    Route::prefix('tasks/{task}/subtasks')->group(function () {
        Route::get('/', [SubtaskController::class, 'index']);
        Route::post('/', [SubtaskController::class, 'store']);
        Route::put('/{subtask}', [SubtaskController::class, 'update']);
        Route::delete('/{subtask}', [SubtaskController::class, 'destroy']);
        Route::post('/reorder', [SubtaskController::class, 'reorder']);
    });

    // File attachments API Routes
    Route::prefix('tasks/{task}/attachments')->group(function () {
        Route::get('/', [FileAttachmentController::class, 'index']);
        Route::post('/', [FileAttachmentController::class, 'store']);
        Route::get('/{attachment}/download', [FileAttachmentController::class, 'download']);
        Route::delete('/{attachment}', [FileAttachmentController::class, 'destroy']);
    });

    // Comments API Routes
    Route::prefix('tasks/{task}/comments')->group(function () {
        Route::get('/', [CommentController::class, 'index']);
        Route::post('/', [CommentController::class, 'store']);
        Route::put('/{comment}', [CommentController::class, 'update']);
        Route::delete('/{comment}', [CommentController::class, 'destroy']);
    });

    // Course API Routes
    Route::apiResource('courses', CourseApiController::class);
    Route::post('courses/{id}/toggle-active', [CourseApiController::class, 'toggleActive']);
    Route::post('courses/{id}/lessons/number', [CourseApiController::class, 'numberLessons']);
    Route::get('courses/{id}/lessons', [CourseApiController::class, 'lessons']);
    Route::get('courses/{id}/statistics', [CourseApiController::class, 'statistics']);

    // Project API Routes
    // IMPORTANT: Specific routes must come before parameterized routes
    Route::get('projects/statistics', [ProjectApiController::class, 'getAllStatistics']);
    Route::apiResource('projects', ProjectApiController::class);
    Route::post('projects/{id}/toggle-status', [ProjectApiController::class, 'toggleStatus']);
    Route::post('projects/{id}/update-progress', [ProjectApiController::class, 'updateProgress']);
    Route::get('projects/{id}/statistics', [ProjectApiController::class, 'statistics']);
    Route::post('projects/{id}/archive', [ProjectApiController::class, 'archive']);
    Route::post('projects/{id}/duplicate', [ProjectApiController::class, 'duplicate']);

    // Lesson API Routes
    Route::apiResource('lessons', LessonApiController::class);
    Route::post('lessons/{id}/toggle-completion', [LessonApiController::class, 'toggleCompletion']);

    // Lesson Video Routes
    Route::prefix('lessons/{lesson}')->group(function () {
        Route::post('/video', [LessonVideoApiController::class, 'upload']);
        Route::get('/video', [LessonVideoApiController::class, 'show']);
        Route::get('/video/stream', [LessonVideoApiController::class, 'stream']);
        Route::put('/video', [LessonVideoApiController::class, 'update']);
        Route::delete('/video', [LessonVideoApiController::class, 'destroy']);

        // Chunked Upload Routes
        Route::post('/video/chunked/start', [LessonVideoApiController::class, 'startChunkedUpload']);
        Route::post('/video/chunked/{uploadId}/chunk', [LessonVideoApiController::class, 'uploadChunk']);
        Route::post('/video/chunked/{uploadId}/complete', [LessonVideoApiController::class, 'completeChunkedUpload']);
        Route::get('/video/chunked/{uploadId}/status', [LessonVideoApiController::class, 'getUploadStatus']);
        Route::delete('/video/chunked/{uploadId}', [LessonVideoApiController::class, 'cancelChunkedUpload']);
        Route::post('/video/youtube', [LessonVideoApiController::class, 'importFromYoutube']);

        // Subtitle Routes
        Route::post('/video/subtitles', [LessonSubtitleApiController::class, 'upload']);
        Route::get('/video/subtitles', [LessonSubtitleApiController::class, 'index']);

        // Subtitle Generation Routes (AI-powered)
        Route::post('/video/transcribe', [LessonSubtitleApiController::class, 'transcribe']);
        Route::post('/video/transcribe/start', [LessonSubtitleApiController::class, 'startTranscription']); // Async start
        Route::get('/video/transcribe/status', [LessonSubtitleApiController::class, 'getTranscriptionStatus']); // Polling status
        Route::post('/video/translate-arabic', [LessonSubtitleApiController::class, 'translateToArabic']); // Kept for backward compatibility
        Route::post('/video/translate', [LessonSubtitleApiController::class, 'translate']); // New: translate to any language
        Route::post('/video/detect-language', [LessonSubtitleApiController::class, 'detectLanguage']); // New: detect language
        Route::post('/video/save-as-subtitle', [LessonSubtitleApiController::class, 'saveAsSubtitle']);
        Route::post('/video/summarize', [LessonSubtitleApiController::class, 'summarize']);
    });

    // Quiz Routes (AI-Powered Quiz System)
    require __DIR__ . '/quizzes-routes.php';

    // Integrations Routes
    require __DIR__ . '/integrations-routes.php';

    // AI Assistant Routes
    require __DIR__ . '/ai-assistant-routes.php';

    // Goals Routes
    require __DIR__ . '/goals-routes.php';

    // Reports Routes
    require __DIR__ . '/reports-routes.php';

    // Analytics Routes
    require __DIR__ . '/analytics-routes.php';

    // Performance Routes
    require __DIR__ . '/performance-routes.php';

    // Comments Routes
    require __DIR__ . '/comments-routes.php';

    // Media Library Routes
    Route::prefix('media-library')->group(function () {
        Route::get('/videos', [MediaLibraryApiController::class, 'index']);
        Route::post('/videos', [MediaLibraryApiController::class, 'store']);
        Route::post('/videos/chunked/start', [MediaLibraryApiController::class, 'startChunkedUpload']);
        Route::post('/videos/chunked/{uploadId}/chunk', [MediaLibraryApiController::class, 'uploadChunk']);
        Route::post('/videos/chunked/{uploadId}/complete', [MediaLibraryApiController::class, 'completeChunkedUpload']);
        Route::get('/videos/chunked/{uploadId}/status', [MediaLibraryApiController::class, 'getUploadStatus']);
        Route::delete('/videos/chunked/{uploadId}', [MediaLibraryApiController::class, 'cancelChunkedUpload']);
        Route::post('/videos/{video}/assign', [MediaLibraryApiController::class, 'assign']);
        Route::post('/videos/{video}/detach', [MediaLibraryApiController::class, 'detach']);
        Route::delete('/videos/{video}', [MediaLibraryApiController::class, 'destroy']);
    });

    // Subtitle Management Routes
    Route::prefix('subtitles')->group(function () {
        Route::get('/{subtitle}', [LessonSubtitleApiController::class, 'show']);
        Route::get('/{subtitle}/vtt', [LessonSubtitleApiController::class, 'getVtt']);
        Route::patch('/{subtitle}/language', [LessonSubtitleApiController::class, 'updateLanguage']);
        Route::delete('/{subtitle}', [LessonSubtitleApiController::class, 'destroy']);
        Route::get('/languages/supported', [LessonSubtitleApiController::class, 'getSupportedLanguages']);
    });

    // Category API Routes
    Route::apiResource('categories', CategoryApiController::class);

    // Prompt API Routes
    Route::apiResource('prompts', PromptApiController::class);

    // Git utility route
    Route::post('git/pull', [GitApiController::class, 'pull']);
    Route::post('git/composer-install', [GitApiController::class, 'composerInstall']);
    Route::post('git/migrate', [GitApiController::class, 'migrate']);
    Route::post('git/migrate-fresh', [GitApiController::class, 'migrateFresh']);
    Route::get('git/check-status', [GitApiController::class, 'checkStatus']);

    // Referral program routes
    Route::prefix('referrals')->group(function () {
        Route::get('/summary', [ReferralApiController::class, 'summary']);
    });

    // Team collaboration routes
    Route::prefix('teams')->group(function () {
        Route::get('/', [TeamApiController::class, 'index']);
        Route::post('/', [TeamApiController::class, 'store']);
        Route::get('/{team}', [TeamApiController::class, 'show']);
        Route::put('/{team}', [TeamApiController::class, 'update']);
        Route::delete('/{team}', [TeamApiController::class, 'destroy']);

        Route::post('/{team}/members', [TeamMemberApiController::class, 'store']);
        Route::patch('/{team}/members/{member}', [TeamMemberApiController::class, 'update']);
        Route::delete('/{team}/members/{member}', [TeamMemberApiController::class, 'destroy']);

        Route::get('/{team}/resources/options', [TeamResourceController::class, 'options']);
        Route::post('/{team}/resources/courses', [TeamResourceController::class, 'shareCourse']);
        Route::delete('/{team}/resources/courses/{course}', [TeamResourceController::class, 'unshareCourse']);
        Route::post('/{team}/resources/projects', [TeamResourceController::class, 'shareProject']);
        Route::delete('/{team}/resources/projects/{project}', [TeamResourceController::class, 'unshareProject']);

        // Team invitations
        Route::post('/{team}/invitations', [TeamInvitationController::class, 'sendInvitation']);
        Route::delete('/{team}/invitations/{invitationId}', [TeamInvitationController::class, 'cancelInvitation']);

        // Task sharing
        Route::post('/{team}/resources/tasks', [TeamResourceController::class, 'shareTask']);
        Route::delete('/{team}/resources/tasks/{task}', [TeamResourceController::class, 'unshareTask']);
    });

    // User invitations
    Route::prefix('invitations')->group(function () {
        Route::get('/pending', [TeamInvitationController::class, 'pendingInvitations']);
        Route::post('/accept/{token}', [TeamInvitationController::class, 'acceptInvitation']);
    });

    // Notification routes
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationApiController::class, 'index']);
        Route::get('/unread', [NotificationApiController::class, 'unread']);
        Route::post('/{id}/read', [NotificationApiController::class, 'markAsRead']);
        Route::post('/read-all', [NotificationApiController::class, 'markAllAsRead']);
        Route::delete('/{id}', [NotificationApiController::class, 'destroy']);
        Route::post('/clear', [NotificationApiController::class, 'clear']);
    });

    // Activity logs
    Route::prefix('activity')->group(function () {
        Route::get('/', [ActivityLogController::class, 'index']);
        Route::get('/teams/{teamId}', [ActivityLogController::class, 'teamActivity']);
    });
});
