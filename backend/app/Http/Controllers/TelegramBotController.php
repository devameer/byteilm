<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Telegram\Bot\Laravel\Facades\Telegram;
use App\Models\Lesson;
use App\Models\Course;
use App\Models\Task;
use App\Models\Project;
use App\Models\TelegramUser;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class TelegramBotController extends Controller
{
    private ?TelegramUser $authenticatedTelegramUser = null;

    private const LOGIN_STATE_CACHE_MINUTES = 15;
    private const LOGIN_ATTEMPTS_LIMIT = 5;
    private const LOGIN_ATTEMPTS_TTL_MINUTES = 15;

    private function loginStateCacheKey(string $chatId): string
    {
        return "telegram_login_state_{$chatId}";
    }

    private function loginAttemptsCacheKey(string $chatId): string
    {
        return "telegram_login_attempts_{$chatId}";
    }

    private function getLoginState(string $chatId): array
    {
        return Cache::get($this->loginStateCacheKey($chatId), [
            'step' => null,
            'email' => null,
        ]);
    }

    private function setLoginState(string $chatId, array $state): void
    {
        Cache::put(
            $this->loginStateCacheKey($chatId),
            $state,
            now()->addMinutes(self::LOGIN_STATE_CACHE_MINUTES)
        );
    }

    private function resetLoginState(string $chatId): void
    {
        Cache::forget($this->loginStateCacheKey($chatId));
    }

    private function incrementLoginAttempts(string $chatId): int
    {
        $key = $this->loginAttemptsCacheKey($chatId);
        $attempts = Cache::get($key, 0) + 1;

        Cache::put(
            $key,
            $attempts,
            now()->addMinutes(self::LOGIN_ATTEMPTS_TTL_MINUTES)
        );

        return $attempts;
    }

    private function hasExceededLoginAttempts(string $chatId): bool
    {
        return Cache::get($this->loginAttemptsCacheKey($chatId), 0) >= self::LOGIN_ATTEMPTS_LIMIT;
    }

    private function clearLoginAttempts(string $chatId): void
    {
        Cache::forget($this->loginAttemptsCacheKey($chatId));
    }

    private function isChatAuthenticated(string $chatId): bool
    {
        return TelegramUser::where('chat_id', $chatId)->exists();
    }

    private function getAuthenticatedUser(): ?User
    {
        return $this->authenticatedTelegramUser?->user;
    }

    private function handleAuthenticationFlow(string $chatId, ?string $text, $from): bool
    {
        $text = $text !== null ? trim($text) : '';
        $state = $this->getLoginState($chatId);

        if ($text === '/logout') {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '❗ أنت غير مسجل الدخول حالياً. استخدم /login لتسجيل الدخول.'
            ]);
            return true;
        }

        if ($text === '/start') {
            $this->sendStart($chatId);
            return true;
        }

        if ($text === '/help') {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => "🔐 لتتمكّن من استخدام البوت، يرجى تسجيل الدخول بواسطة الأمر /login.\nيمكنك في أي وقت إرسال /cancel لإلغاء العملية."
            ]);
            return true;
        }

        if ($text === '/login') {
            $this->setLoginState($chatId, [
                'step' => 'awaiting_email',
                'email' => null,
            ]);

            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => "✉️ أرسل البريد الإلكتروني المرتبط بحسابك في المنصّة."
            ]);

            return true;
        }

        if ($text === '/cancel') {
            $this->resetLoginState($chatId);
            $this->clearLoginAttempts($chatId);

            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '🚫 تم إلغاء عملية تسجيل الدخول.'
            ]);

            return true;
        }

        if (($state['step'] ?? null) === 'awaiting_email') {
            if ($text === '') {
                Telegram::sendMessage([
                    'chat_id' => $chatId,
                    'text' => '✉️ الرجاء إرسال البريد الإلكتروني المرتبط بحسابك.'
                ]);
                return true;
            }

            if (!filter_var($text, FILTER_VALIDATE_EMAIL)) {
                Telegram::sendMessage([
                    'chat_id' => $chatId,
                    'text' => '⚠️ البريد الإلكتروني غير صالح. حاول مرة أخرى أو أرسل /cancel لإلغاء العملية.'
                ]);
                return true;
            }

            $this->setLoginState($chatId, [
                'step' => 'awaiting_password',
                'email' => strtolower($text),
            ]);

            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => "🔒 ممتاز! الآن أرسل كلمة المرور الخاصة بحسابك.\n💡 يمكنك إرسال /cancel لإلغاء العملية."
            ]);

            return true;
        }

        if (($state['step'] ?? null) === 'awaiting_password') {
            if ($text === '' || str_starts_with($text, '/')) {
                Telegram::sendMessage([
                    'chat_id' => $chatId,
                    'text' => '🔑 الرجاء إرسال كلمة المرور (بدون أوامر).'
                ]);
                return true;
            }

            if ($this->hasExceededLoginAttempts($chatId)) {
                Telegram::sendMessage([
                    'chat_id' => $chatId,
                    'text' => '⛔ تم تجاوز عدد محاولات تسجيل الدخول. حاول لاحقاً خلال 15 دقيقة.'
                ]);
                return true;
            }

            $email = $state['email'] ?? null;

            if (!$email) {
                $this->resetLoginState($chatId);
                Telegram::sendMessage([
                    'chat_id' => $chatId,
                    'text' => '⚠️ انتهت صلاحية جلسة تسجيل الدخول. أرسل /login لبدء العملية من جديد.'
                ]);
                return true;
            }

            $user = User::where('email', $email)->first();

            if (!$user || !Hash::check($text, $user->password)) {
                $attempts = $this->incrementLoginAttempts($chatId);
                $remaining = max(self::LOGIN_ATTEMPTS_LIMIT - $attempts, 0);

                $this->logIncomingMessage('LOGIN_FAILED', [
                    'chat_id' => $chatId,
                    'email' => $email,
                    'attempts' => $attempts,
                ]);

                if ($remaining === 0) {
                    Telegram::sendMessage([
                        'chat_id' => $chatId,
                        'text' => '⛔ تم تجاوز الحد المسموح لمحاولات تسجيل الدخول. الرجاء المحاولة بعد 15 دقيقة.'
                    ]);
                } else {
                    Telegram::sendMessage([
                        'chat_id' => $chatId,
                        'text' => "⚠️ بيانات الدخول غير صحيحة. تبقّى {$remaining} محاولة قبل الإيقاف المؤقت."
                    ]);
                }

                return true;
            }

            if ($user->is_active === false) {
                Telegram::sendMessage([
                    'chat_id' => $chatId,
                    'text' => '🚫 حسابك غير نشط حالياً. يرجى التواصل مع الدعم.'
                ]);

                $this->resetLoginState($chatId);
                $this->clearLoginAttempts($chatId);

                return true;
            }

            $telegramUser = TelegramUser::updateOrCreate(
                ['chat_id' => $chatId],
                [
                    'user_id' => $user->id,
                    'username' => $from ? $from->getUsername() : null,
                    'first_name' => $from ? $from->getFirstName() : null,
                    'last_name' => $from ? $from->getLastName() : null,
                    'last_authenticated_at' => now(),
                ]
            )->fresh('user');

            $this->logIncomingMessage('LOGIN_SUCCESS', [
                'chat_id' => $chatId,
                'user_id' => $user->id,
                'email' => $user->email,
            ]);

            $this->resetLoginState($chatId);
            $this->clearLoginAttempts($chatId);

            $this->authenticatedTelegramUser = $telegramUser;

            $displayName = !empty($user->name) ? $user->name : $user->email;

            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => "✅ تم تسجيل الدخول بنجاح يا {$displayName}! يمكنك الآن استخدام الأوامر.\nاكتب /help لعرض كل الأوامر المتاحة."
            ]);

            return true;
        }

        if ($text !== '') {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => "🔐 تحتاج إلى تسجيل الدخول قبل استخدام البوت.\nأرسل /login لبدء عملية تسجيل الدخول."
            ]);
            return true;
        }

        return false;
    }

    private function handleLogout($chatId): void
    {
        $chatIdString = (string) $chatId;

        $telegramUser = $this->authenticatedTelegramUser
            ?? TelegramUser::where('chat_id', $chatIdString)->first();

        if ($telegramUser) {
            $this->logIncomingMessage('LOGOUT_SUCCESS', [
                'chat_id' => $chatIdString,
                'user_id' => $telegramUser->user_id,
            ]);

            $telegramUser->delete();
        }

        $this->resetLoginState($chatIdString);
        $this->clearLoginAttempts($chatIdString);
        $this->authenticatedTelegramUser = null;

        Telegram::sendMessage([
            'chat_id' => $chatId,
            'text' => "👋 تم تسجيل الخروج بنجاح.\nإذا رغبت بالعودة، أرسل /login مرة أخرى."
        ]);
    }

    /**
     * Verify Telegram webhook signature
     */
    private function verifyTelegramRequest(Request $request): bool
    {
        // Get the secret token from environment
        $secretToken = env('TELEGRAM_WEBHOOK_SECRET');

        // If no secret token is set, skip verification (not recommended for production)
        if (empty($secretToken)) {
            return true;
        }

        // Get the X-Telegram-Bot-Api-Secret-Token header
        $receivedToken = $request->header('X-Telegram-Bot-Api-Secret-Token');

        // Verify the token matches
        return hash_equals($secretToken, $receivedToken ?? '');
    }

    /**
     * Webhook handler for Telegram
     */
    public function webhook(Request $request)
    {
        try {
            // Verify the request is from Telegram
            if (!$this->verifyTelegramRequest($request)) {
                $this->logIncomingMessage('INVALID_SIGNATURE', [
                    'ip' => $request->ip(),
                    'headers' => $request->headers->all(),
                ]);

                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Log raw incoming request
            $this->logIncomingMessage('RAW_REQUEST', $request->all());

            $update = Telegram::commandsHandler(true);

            if (!$update->getMessage()) {
                $this->logIncomingMessage('NO_MESSAGE', ['update' => $update]);
                return response()->json(['ok' => true]);
            }

            $message = $update->getMessage();
            $chatId = $message->getChat()->getId();
            $text = $message->getText();
            $from = $message->getFrom();
            $chatIdString = (string) $chatId;
            $textString = $text !== null ? trim($text) : null;

            // Log incoming message details
            $this->logIncomingMessage('MESSAGE_RECEIVED', [
                'chat_id' => $chatId,
                'user_id' => $from->getId(),
                'username' => $from->getUsername(),
                'first_name' => $from->getFirstName(),
                'last_name' => $from->getLastName(),
                'text' => $text,
                'date' => date('Y-m-d H:i:s', $message->getDate()),
                'message_id' => $message->getMessageId()
            ]);

            $telegramUser = TelegramUser::with('user')->where('chat_id', $chatIdString)->first();

            if (!$telegramUser) {
                $handled = $this->handleAuthenticationFlow($chatIdString, $textString, $from);

                if (!$handled) {
                    Telegram::sendMessage([
                        'chat_id' => $chatId,
                        'text' => "🔐 قبل استخدام البوت، يرجى تسجيل الدخول عبر الأمر /login.\nيمكنك إرسال /login للبدء أو /help لمعرفة المزيد."
                    ]);
                }

                return response()->json(['ok' => true]);
            }

            $this->authenticatedTelegramUser = $telegramUser;

            if ($textString !== null && str_starts_with($textString, '/')) {
                $this->logIncomingMessage('COMMAND', ['command' => $textString, 'chat_id' => $chatId]);
                $this->handleCommand($textString, $chatId, $message);
            } else {
                $this->logIncomingMessage('TEXT_MESSAGE', ['text' => $text, 'chat_id' => $chatId]);
                // Handle regular messages
                Telegram::sendMessage([
                    'chat_id' => $chatId,
                    'text' => 'استخدم /help لعرض الأوامر المتاحة.'
                ]);
            }

            return response()->json(['ok' => true]);
        } catch (\Exception $e) {
            $this->logIncomingMessage('ERROR', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            Log::error('Telegram Webhook Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Log incoming Telegram messages
     */
    private function logIncomingMessage($type, $data)
    {
        $logEntry = [
            'timestamp' => now()->toDateTimeString(),
            'type' => $type,
            'data' => $data
        ];

        // Log to Laravel log file
        Log::channel('telegram')->info($type, $data);

        // Also save to dedicated file for easy viewing
        $logFile = storage_path('logs/telegram-messages.log');
        $logLine = json_encode($logEntry, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n" . str_repeat('-', 80) . "\n";
        file_put_contents($logFile, $logLine, FILE_APPEND);
    }

    /**
     * Handle bot commands
     */
    private function handleCommand($text, $chatId, $message)
    {
        $parts = explode(' ', $text, 2);
        $command = $parts[0];
        $args = $parts[1] ?? null;

        if (!$this->authenticatedTelegramUser) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '🔐 يجب تسجيل الدخول قبل تنفيذ الأوامر. أرسل /login للبدء.'
            ]);
            return;
        }

        switch ($command) {
            case '/start':
                $this->sendStart($chatId);
                break;
            case '/help':
                $this->sendHelp($chatId);
                break;
            case '/login':
                Telegram::sendMessage([
                    'chat_id' => $chatId,
                    'text' => '✅ أنت مسجل الدخول بالفعل. لاستخدام حساب آخر أرسل /logout أولاً.'
                ]);
                return;
            case '/logout':
                $this->handleLogout($chatId);
                return;
            case '/list':
                $this->sendList($chatId);
                break;
            case '/today':
                $this->sendToday($chatId);
                break;
            case '/tomorrow':
                $this->sendTomorrow($chatId);
                break;
            case '/pending':
                $this->sendPending($chatId);
                break;
            case '/completed':
                $this->sendCompleted($chatId);
                break;
            case '/complete':
                if ($args) {
                    $this->completeLesson($chatId, $args);
                } else {
                    Telegram::sendMessage([
                        'chat_id' => $chatId,
                        'text' => '⚠️ يرجى تحديد رقم الدرس. مثال: /complete 1'
                    ]);
                }
                break;
            case '/uncomplete':
                if ($args) {
                    $this->uncompleteLesson($chatId, $args);
                } else {
                    Telegram::sendMessage([
                        'chat_id' => $chatId,
                        'text' => '⚠️ يرجى تحديد رقم الدرس. مثال: /uncomplete 1'
                    ]);
                }
                break;
            case '/courses':
                $this->sendCourses($chatId);
                break;
            // Tasks commands
            case '/tasks':
                $this->sendTasks($chatId);
                break;
            case '/mytasks':
                $this->sendMyTasks($chatId);
                break;
            case '/tasks_today':
                $this->sendTasksToday($chatId);
                break;
            case '/tasks_pending':
                $this->sendTasksPending($chatId);
                break;
            case '/tasks_overdue':
                $this->sendTasksOverdue($chatId);
                break;
            case '/projects':
                $this->sendProjects($chatId);
                break;
            case '/project':
                if ($args) {
                    $this->sendProject($chatId, $args);
                } else {
                    Telegram::sendMessage([
                        'chat_id' => $chatId,
                        'text' => '⚠️ يرجى تحديد رقم المشروع. مثال: /project 1'
                    ]);
                }
                break;
            case '/task_complete':
                if ($args) {
                    $this->completeTask($chatId, $args);
                } else {
                    Telegram::sendMessage([
                        'chat_id' => $chatId,
                        'text' => '⚠️ يرجى تحديد رقم المهمة. مثال: /task_complete 1'
                    ]);
                }
                break;
            // Calendar commands (unified view)
            case '/calendar':
                $this->sendCalendar($chatId);
                break;
            case '/cal_today':
                $this->sendCalendarToday($chatId);
                break;
            case '/cal_tomorrow':
                $this->sendCalendarTomorrow($chatId);
                break;
            case '/cal_week':
                $this->sendCalendarWeek($chatId);
                break;
            case '/cal_overdue':
                $this->sendCalendarOverdue($chatId);
                break;
            // New enhanced commands
            case '/stats':
                $this->sendStats($chatId);
                break;
            case '/overdue':
                $this->sendOverdue($chatId);
                break;
            case '/urgent':
                $this->sendUrgent($chatId);
                break;
            case '/week':
                $this->sendWeekSummary($chatId);
                break;
            case '/export':
                $this->sendExportLink($chatId);
                break;
            case '/search':
                if ($args) {
                    $this->searchItems($chatId, $args);
                } else {
                    Telegram::sendMessage([
                        'chat_id' => $chatId,
                        'text' => '⚠️ يرجى تحديد نص البحث. مثال: /search Laravel'
                    ]);
                }
                break;
            case '/filter':
                if ($args) {
                    $this->filterItems($chatId, $args);
                } else {
                    Telegram::sendMessage([
                        'chat_id' => $chatId,
                        'text' => "⚠️ يرجى تحديد نوع الفلتر.\nالخيارات: lessons, tasks, urgent, high, medium, low"
                    ]);
                }
                break;
            default:
                Telegram::sendMessage([
                    'chat_id' => $chatId,
                    'text' => '❌ أمر غير معروف. استخدم /help لعرض الأوامر المتاحة.'
                ]);
        }
    }

    /**
     * Send start message
     */
    private function sendStart($chatId)
    {
        $message = "مرحباً بك في بوت إدارة الدروس! 👋\n\n";
        $message .= "هذا البوت يساعدك في إدارة دروسك ومهامك الدراسية.\n\n";
        $message .= "استخدم /help لعرض جميع الأوامر المتاحة.\n\n";

        if ($this->authenticatedTelegramUser || $this->isChatAuthenticated((string) $chatId)) {
            $message .= "✅ أنت مسجل الدخول حالياً. استمتع باستخدام البوت!";
        } else {
            $message .= "🔐 قبل استخدام الأوامر، أرسل /login لتسجيل الدخول.";
        }

        Telegram::sendMessage([
            'chat_id' => $chatId,
            'text' => $message
        ]);
    }

    /**
     * Send help message
     */
    private function sendHelp($chatId)
    {
        $message = "📚 *الأوامر المتاحة:*\n\n";

        $message .= "📋 *الدروس:*\n";
        $message .= "/list - عرض جميع الدروس المجدولة\n";
        $message .= "/today - عرض دروس اليوم\n";
        $message .= "/tomorrow - عرض دروس الغد\n";
        $message .= "/pending - عرض الدروس غير المكتملة\n";
        $message .= "/completed - عرض الدروس المكتملة\n";
        $message .= "/complete [رقم] - تحديد درس كمكتمل\n";
        $message .= "/uncomplete [رقم] - إلغاء اكتمال درس\n\n";

        $message .= "📚 *الدورات:*\n";
        $message .= "/courses - عرض جميع الدورات النشطة\n\n";

        $message .= "✅ *المهام:*\n";
        $message .= "/tasks - عرض جميع المهام\n";
        $message .= "/mytasks - مهامي (حسب الأولوية)\n";
        $message .= "/tasks\\_today - مهام اليوم\n";
        $message .= "/tasks\\_pending - المهام المعلقة\n";
        $message .= "/tasks\\_overdue - المهام المتأخرة\n";
        $message .= "/task\\_complete [رقم] - إكمال مهمة\n\n";

        $message .= "🗂️ *المشاريع:*\n";
        $message .= "/projects - عرض جميع المشاريع\n";
        $message .= "/project [رقم] - عرض تفاصيل مشروع\n\n";

        $message .= "📅 *التقويم الموحد:*\n";
        $message .= "/calendar - عرض ملخص التقويم\n";
        $message .= "/cal\\_today - دروس ومهام اليوم\n";
        $message .= "/cal\\_tomorrow - دروس ومهام الغد\n";
        $message .= "/cal\\_week - دروس ومهام الأسبوع\n";
        $message .= "/cal\\_overdue - العناصر المتأخرة\n\n";

        $message .= "📊 *إحصائيات وتقارير:*\n";
        $message .= "/stats - إحصائيات شاملة للنظام\n";
        $message .= "/overdue - جميع المهام المتأخرة\n";
        $message .= "/urgent - المهام العاجلة فقط\n";
        $message .= "/week - ملخص تفصيلي للأسبوع\n\n";

        $message .= "🔍 *بحث وفلترة:*\n";
        $message .= "/search [نص] - البحث في المهام والدروس\n";
        $message .= "/filter [نوع] - فلترة (lessons/tasks/urgent/high)\n";
        $message .= "/export - الحصول على رابط التصدير CSV\n\n";

        $message .= "🔐 *الحساب:*\n";
        $message .= "/logout - تسجيل الخروج من البوت\n";
        $message .= "/login - إعادة تسجيل الدخول (إن لزم)\n\n";

        $message .= "❓ /help - عرض هذه المساعدة";

        Telegram::sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown'
        ]);
    }

    /**
     * Send all scheduled lessons
     */
    private function sendList($chatId)
    {
        $lessons = Lesson::with('course')
            ->whereNotNull('scheduled_date')
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->get();

        if ($lessons->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '📭 لا توجد دروس مجدولة حالياً.'
            ]);
            return;
        }

        $completed = $lessons->where('completed', true)->count();
        $pending = $lessons->where('completed', false)->count();

        $message = "📋 *جميع الدروس المجدولة:* ({$lessons->count()} درس)\n";
        $message .= "   ✅ مكتملة: {$completed} | ⏳ متبقية: {$pending}\n\n";

        // تجميع حسب التاريخ
        $byDate = $lessons->groupBy(function ($lesson) {
            return $lesson->scheduled_date->format('Y-m-d');
        });

        foreach ($byDate as $date => $dateLessons) {
            $message .= "📅 *{$date}* ({$dateLessons->count()} درس)\n";

            // تجميع حسب الدورة
            $byCourse = $dateLessons->groupBy('course_id');

            foreach ($byCourse as $courseId => $courseLessons) {
                $count = $courseLessons->count();
                $course = $courseLessons->first()->course;

                if ($count > 1) {
                    $completedCount = $courseLessons->where('completed', true)->count();
                    $message .= "   📚 {$course->name} ({$count} درس، {$completedCount} مكتمل)\n";
                    $message .= "      🆔 " . $courseLessons->pluck('id')->join(', ') . "\n";
                } else {
                    $lesson = $courseLessons->first();
                    $emoji = $lesson->completed ? '✅' : '⏳';
                    $name = $lesson->name ?: 'بدون عنوان';
                    $message .= "   {$emoji} #{$lesson->id} - {$name}\n";
                }
            }
            $message .= "\n";
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send today's lessons (غير المكتملة فقط)
     */
    private function sendToday($chatId)
    {
        // جلب الدروس غير المكتملة فقط
        $lessons = Lesson::with('course')
            ->whereDate('scheduled_date', Carbon::today())
            ->where('completed', false)
            ->orderBy('id')
            ->get();

        if ($lessons->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✨ لا توجد دروس متبقية لليوم! أحسنت! 🎉'
            ]);
            return;
        }

        $message = "📅 *دروس اليوم (" . Carbon::today()->format('Y-m-d') . "):*\n";
        $message .= "   ⏳ متبقي: {$lessons->count()} درس\n\n";

        // عرض كل درس بالتفاصيل الكاملة
        foreach ($lessons as $lesson) {
            $message .= $this->formatLesson($lesson) . "\n";
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send tomorrow's lessons (غير المكتملة فقط)
     */
    private function sendTomorrow($chatId)
    {
        // جلب الدروس غير المكتملة فقط
        $lessons = Lesson::with('course')
            ->whereDate('scheduled_date', Carbon::tomorrow())
            ->where('completed', false)
            ->orderBy('id')
            ->get();

        if ($lessons->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✨ لا توجد دروس متبقية للغد!'
            ]);
            return;
        }

        $message = "📅 *دروس الغد (" . Carbon::tomorrow()->format('Y-m-d') . "):*\n";
        $message .= "   ⏳ متبقي: {$lessons->count()} درس\n\n";

        // عرض كل درس بالتفاصيل الكاملة
        foreach ($lessons as $lesson) {
            $message .= $this->formatLesson($lesson) . "\n";
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send pending lessons
     */
    private function sendPending($chatId)
    {
        $lessons = Lesson::with('course')
            ->where('completed', false)
            ->whereNotNull('scheduled_date')
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->get();

        if ($lessons->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✅ جميع الدروس مكتملة! أحسنت!'
            ]);
            return;
        }

        $message = "⏳ *الدروس غير المكتملة:* ({$lessons->count()} درس)\n\n";

        // عرض كل درس بالتفاصيل الكاملة
        foreach ($lessons as $lesson) {
            $message .= $this->formatLesson($lesson) . "\n";
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send completed lessons
     */
    private function sendCompleted($chatId)
    {
        $lessons = Lesson::with('course')
            ->where('completed', true)
            ->whereNotNull('scheduled_date')
            ->orderBy('completed_at', 'desc')
            ->orderBy('id')
            ->limit(20)
            ->get();

        if ($lessons->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '📭 لا توجد دروس مكتملة بعد!'
            ]);
            return;
        }

        $message = "✅ *الدروس المكتملة (آخر 20):*\n\n";
        foreach ($lessons as $lesson) {
            $message .= $this->formatLesson($lesson) . "\n";
        }

        Telegram::sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown'
        ]);
    }

    /**
     * Mark lesson as completed
     */
    private function completeLesson($chatId, $lessonId)
    {
        $lesson = Lesson::find($lessonId);

        if (!$lesson) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '❌ الدرس غير موجود!'
            ]);
            return;
        }

        if ($lesson->completed) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✅ هذا الدرس مكتمل بالفعل!'
            ]);
            return;
        }

        $lesson->markAsCompleted();

        Telegram::sendMessage([
            'chat_id' => $chatId,
            'text' => "✅ *تم اكتمال الدرس!*\n\n" . $this->formatLesson($lesson),
            'parse_mode' => 'Markdown'
        ]);
    }

    /**
     * Mark lesson as not completed
     */
    private function uncompleteLesson($chatId, $lessonId)
    {
        $lesson = Lesson::find($lessonId);

        if (!$lesson) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '❌ الدرس غير موجود!'
            ]);
            return;
        }

        if (!$lesson->completed) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '⏳ هذا الدرس غير مكتمل بالفعل!'
            ]);
            return;
        }

        $lesson->markAsNotCompleted();

        Telegram::sendMessage([
            'chat_id' => $chatId,
            'text' => "⏳ *تم إلغاء اكتمال الدرس!*\n\n" . $this->formatLesson($lesson),
            'parse_mode' => 'Markdown'
        ]);
    }

    /**
     * Send all active courses
     */
    private function sendCourses($chatId)
    {
        $courses = Course::where('active', true)
            ->withCount(['lessons' => function ($query) {
                $query->where('completed', false);
            }])
            ->get();

        if ($courses->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '📭 لا توجد دورات نشطة حالياً!'
            ]);
            return;
        }

        $message = "📚 *الدورات النشطة:*\n\n";
        foreach ($courses as $course) {
            $message .= "▫️ *" . $course->name . "*\n";
            $message .= "   الدروس غير المكتملة: " . $course->lessons_count . "\n\n";
        }

        Telegram::sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown'
        ]);
    }

    /**
     * Format lesson for display
     */
    private function formatLesson($lesson)
    {
        $emoji = $lesson->completed ? '✅' : '⏳';
        $status = $lesson->completed ? 'مكتمل' : 'قيد الانتظار';

        // استخدم name بدلاً من title
        $lessonName = $lesson->name ?: 'درس بدون عنوان';

        $message = "{$emoji} *#{$lesson->id}* - {$lessonName}\n";

        if ($lesson->course) {
            $message .= "   📚 الدورة: {$lesson->course->name}\n";
        }

        if ($lesson->scheduled_date) {
            $date = Carbon::parse($lesson->scheduled_date)->format('Y-m-d');
            $message .= "   📅 التاريخ: {$date}\n";
        }

        // إضافة النوع إذا كان موجود
        if ($lesson->type) {
            $typeEmoji = $this->getTypeEmoji($lesson->type);
            $message .= "   {$typeEmoji} النوع: {$lesson->type}\n";
        }

        // إضافة المدة إذا كانت موجودة
        if ($lesson->duration) {
            $message .= "   ⏱️ المدة: {$lesson->duration}\n";
        }

        $message .= "   ✔️ الحالة: {$status}\n";

        if ($lesson->description && !empty(trim($lesson->description))) {
            // قص الوصف إذا كان طويل جداً
            $desc = strlen($lesson->description) > 100
                ? substr($lesson->description, 0, 100) . '...'
                : $lesson->description;
            $message .= "   📝 الوصف: {$desc}\n";
        }

        if ($lesson->link) {
            $message .= "   🔗 [الرابط]({$lesson->link})\n";
        }

        return $message;
    }

    /**
     * Get emoji for lesson type
     */
    private function getTypeEmoji($type)
    {
        return match (strtolower($type)) {
            'video' => '🎥',
            'reading' => '📖',
            'quiz' => '📝',
            'practice' => '💻',
            'project' => '🚀',
            default => '📌'
        };
    }

    /**
     * Send long message (split if needed)
     * Telegram has a 4096 character limit per message
     */
    private function sendLongMessage($chatId, $message, $parseMode = 'Markdown')
    {
        $maxLength = 4000; // نترك مساحة للأمان

        if (strlen($message) <= $maxLength) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => $parseMode
            ]);
            return;
        }

        // تقسيم الرسالة إلى أجزاء
        $parts = [];
        $currentPart = '';
        $lines = explode("\n", $message);

        foreach ($lines as $line) {
            if (strlen($currentPart . $line . "\n") > $maxLength) {
                if (!empty($currentPart)) {
                    $parts[] = $currentPart;
                    $currentPart = '';
                }
            }
            $currentPart .= $line . "\n";
        }

        if (!empty($currentPart)) {
            $parts[] = $currentPart;
        }

        // إرسال كل جزء
        foreach ($parts as $index => $part) {
            $partNumber = $index + 1;
            $totalParts = count($parts);
            $header = $totalParts > 1 ? "*[جزء {$partNumber}/{$totalParts}]*\n\n" : '';

            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => $header . $part,
                'parse_mode' => $parseMode
            ]);

            // تأخير بسيط بين الرسائل لتجنب rate limiting
            if ($index < count($parts) - 1) {
                usleep(100000); // 0.1 ثانية
            }
        }
    }

    /**
     * Set webhook URL
     */
    public function setWebhook(Request $request)
    {
        try {
            $url = $request->input('url') ?? url('/api/telegram/webhook');

            $response = Telegram::setWebhook(['url' => $url]);

            return response()->json([
                'success' => true,
                'message' => 'Webhook set successfully',
                'url' => $url,
                'response' => $response
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to set webhook',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get webhook info
     */
    public function getWebhookInfo()
    {
        try {
            $response = Telegram::getWebhookInfo();

            return response()->json([
                'success' => true,
                'webhook_info' => $response
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove webhook
     */
    public function removeWebhook()
    {
        try {
            $response = Telegram::removeWebhook();

            return response()->json([
                'success' => true,
                'message' => 'Webhook removed successfully',
                'response' => $response
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Set bot commands (for Telegram menu)
     */
    public function setMyCommands()
    {
        try {
            $commands = [
                // General commands
                ['command' => 'start', 'description' => 'بدء استخدام البوت'],
                ['command' => 'help', 'description' => 'عرض المساعدة والأوامر'],

                // Lessons commands
                // ['command' => 'list', 'description' => 'عرض جميع الدروس المجدولة'],
                // ['command' => 'today', 'description' => 'عرض دروس اليوم'],
                // ['command' => 'tomorrow', 'description' => 'عرض دروس الغد'],
                // ['command' => 'pending', 'description' => 'عرض الدروس غير المكتملة'],
                // ['command' => 'completed', 'description' => 'عرض الدروس المكتملة'],
                // ['command' => 'complete', 'description' => 'تحديد درس كمكتمل'],
                // ['command' => 'uncomplete', 'description' => 'إلغاء اكتمال درس'],
                // ['command' => 'courses', 'description' => 'عرض جميع الدورات النشطة'],

                // Tasks commands
                ['command' => 'tasks', 'description' => 'عرض جميع المهام'],
                ['command' => 'mytasks', 'description' => 'مهامي حسب الأولوية'],
                ['command' => 'tasks_today', 'description' => 'مهام اليوم'],
                ['command' => 'tasks_pending', 'description' => 'المهام المعلقة'],
                ['command' => 'tasks_overdue', 'description' => 'المهام المتأخرة'],
                ['command' => 'task_complete', 'description' => 'إكمال مهمة'],

                // Projects commands
                // ['command' => 'projects', 'description' => 'عرض جميع المشاريع'],
                // ['command' => 'project', 'description' => 'عرض تفاصيل مشروع'],

                // Calendar commands (unified)
                ['command' => 'calendar', 'description' => 'ملخص التقويم الموحد'],
                ['command' => 'cal_today', 'description' => 'دروس ومهام اليوم'],
                ['command' => 'cal_tomorrow', 'description' => 'دروس ومهام الغد'],
                ['command' => 'cal_week', 'description' => 'دروس ومهام الأسبوع'],
                ['command' => 'cal_overdue', 'description' => 'العناصر المتأخرة'],

                // Enhanced commands - Statistics & Reports
                ['command' => 'stats', 'description' => 'إحصائيات شاملة للنظام'],
                ['command' => 'overdue', 'description' => 'جميع المهام المتأخرة'],
                ['command' => 'urgent', 'description' => 'المهام العاجلة فقط'],
                ['command' => 'week', 'description' => 'ملخص تفصيلي للأسبوع'],

                // Enhanced commands - Search & Filter
                ['command' => 'search', 'description' => 'البحث في المهام والدروس'],
                ['command' => 'filter', 'description' => 'فلترة حسب النوع/الأولوية'],
                ['command' => 'export', 'description' => 'رابط تصدير البيانات CSV'],
            ];

            $response = Telegram::setMyCommands(['commands' => $commands]);

            return response()->json([
                'success' => true,
                'message' => 'Bot commands set successfully',
                'commands' => $commands,
                'response' => $response
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get bot commands
     */
    public function getMyCommands()
    {
        try {
            $response = Telegram::getMyCommands();

            return response()->json([
                'success' => true,
                'commands' => $response
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete bot commands
     */
    public function deleteMyCommands()
    {
        try {
            $response = Telegram::deleteMyCommands();

            return response()->json([
                'success' => true,
                'message' => 'Bot commands deleted successfully',
                'response' => $response
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * View Telegram message logs
     */
    public function viewLogs(Request $request)
    {
        $logFile = storage_path('logs/telegram-messages.log');

        if (!file_exists($logFile)) {
            return response()->json([
                'success' => false,
                'message' => 'No logs found yet. Send a message to the bot to start logging.'
            ]);
        }

        $lines = $request->input('lines', 50); // عدد الأسطر المراد عرضها
        $content = file_get_contents($logFile);

        // Get last N entries
        $entries = explode(str_repeat('-', 80), $content);
        $entries = array_filter($entries, fn($e) => !empty(trim($e)));
        $entries = array_slice(array_reverse($entries), 0, $lines);

        return response()->json([
            'success' => true,
            'total_entries' => count($entries),
            'logs' => array_reverse($entries),
            'raw_content' => $request->input('raw') ? $content : null
        ]);
    }

    /**
     * Clear Telegram logs
     */
    public function clearLogs()
    {
        $logFile = storage_path('logs/telegram-messages.log');

        if (file_exists($logFile)) {
            file_put_contents($logFile, '');
            return response()->json([
                'success' => true,
                'message' => 'Logs cleared successfully'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No log file found'
        ]);
    }

    /**
     * Download logs file
     */
    public function downloadLogs()
    {
        $logFile = storage_path('logs/telegram-messages.log');

        if (!file_exists($logFile)) {
            return response()->json([
                'success' => false,
                'message' => 'No logs found'
            ], 404);
        }

        return response()->download($logFile, 'telegram-messages-' . date('Y-m-d-His') . '.log');
    }

    // ==================== Tasks Commands ====================

    /**
     * Send all tasks
     */
    private function sendTasks($chatId)
    {
        $tasks = Task::with(['project', 'lesson.course', 'course'])
            ->orderBy('scheduled_date')
            ->where('status', '!=', 'completed')
            ->orderBy('priority')
            ->get();

        if ($tasks->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '📋 لا توجد مهام حالياً.'
            ]);
            return;
        }

        $message = "📋 *جميع المهام* (" . $tasks->count() . "):\n\n";

        foreach ($tasks as $task) {
            $message .= $this->formatTask($task) . "\n";
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send my tasks (organized by priority)
     */
    private function sendMyTasks($chatId)
    {
        $tasks = Task::with(['project', 'lesson.course', 'course'])
            ->where('status', '!=', 'completed')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->orderBy('due_date')
            ->get();

        if ($tasks->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✨ لا توجد مهام معلقة! أحسنت! 🎉'
            ]);
            return;
        }

        $message = "📝 *مهامي* (" . $tasks->count() . " متبقية):\n\n";

        // Group by priority
        $grouped = $tasks->groupBy('priority');

        foreach (['urgent', 'high', 'medium', 'low', null] as $priority) {
            if (!isset($grouped[$priority])) continue;

            $priorityIcon = match ($priority) {
                'urgent' => '🔴',
                'high' => '🟠',
                'medium' => '🟡',
                'low' => '🟢',
                default => '⚪'
            };

            $priorityName = match ($priority) {
                'urgent' => 'عاجل',
                'high' => 'عالية',
                'medium' => 'متوسطة',
                'low' => 'منخفضة',
                default => 'بدون أولوية'
            };

            $message .= "*{$priorityIcon} {$priorityName}:*\n";

            foreach ($grouped[$priority] as $task) {
                $message .= $this->formatTask($task, true) . "\n";
            }

            $message .= "\n";
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send today's tasks
     */
    private function sendTasksToday($chatId)
    {
        $tasks = Task::with(['project', 'lesson.course', 'course'])
            ->whereDate('scheduled_date', Carbon::today())
            ->where('status', '!=', 'completed')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->get();

        if ($tasks->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✨ لا توجد مهام لليوم! 🎉'
            ]);
            return;
        }

        $message = "📅 *مهام اليوم* (" . Carbon::today()->format('Y-m-d') . "):\n";
        $message .= "   📊 المتبقي: {$tasks->count()} مهمة\n\n";

        foreach ($tasks as $task) {
            $message .= $this->formatTask($task) . "\n";
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send pending tasks
     */
    private function sendTasksPending($chatId)
    {
        $tasks = Task::with(['project', 'lesson.course', 'course'])
            ->where('status', 'pending')
            ->orderBy('due_date')
            ->get();

        if ($tasks->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✅ لا توجد مهام معلقة!'
            ]);
            return;
        }

        $message = "⏳ *المهام المعلقة* (" . $tasks->count() . "):\n\n";

        foreach ($tasks as $task) {
            $message .= $this->formatTask($task) . "\n";
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send overdue tasks
     */
    private function sendTasksOverdue($chatId)
    {
        $tasks = Task::with(['project', 'lesson.course', 'course'])
            ->where('status', '!=', 'completed')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', Carbon::today())
            ->orderBy('due_date')
            ->get();

        if ($tasks->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✅ لا توجد مهام متأخرة! رائع! 🎉'
            ]);
            return;
        }

        $message = "⚠️ *المهام المتأخرة* (" . $tasks->count() . "):\n\n";

        foreach ($tasks as $task) {
            $daysOverdue = Carbon::parse($task->due_date)->diffInDays(Carbon::today());
            $message .= "🚨 *متأخر {$daysOverdue} يوم*\n";
            $message .= $this->formatTask($task) . "\n";
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Complete a task
     */
    private function completeTask($chatId, $taskId)
    {
        $task = Task::find($taskId);

        if (!$task) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '❌ لم يتم العثور على المهمة رقم ' . $taskId
            ]);
            return;
        }

        if ($task->status === 'completed') {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✅ المهمة مكتملة مسبقاً: ' . $task->title
            ]);
            return;
        }

        $task->markAsCompleted();

        Telegram::sendMessage([
            'chat_id' => $chatId,
            'text' => "✅ تم إكمال المهمة بنجاح!\n\n" . $this->formatTask($task),
            'parse_mode' => 'Markdown'
        ]);
    }

    /**
     * Format task for display
     */
    private function formatTask($task, $compact = false)
    {
        $message = "";

        // Status icon
        $statusIcon = match ($task->status) {
            'pending' => '⏳',
            'in_progress' => '🔄',
            'completed' => '✅',
            'cancelled' => '❌',
            default => '❓'
        };

        // Priority icon
        $priorityIcon = match ($task->priority) {
            'urgent' => '🔴',
            'high' => '🟠',
            'medium' => '🟡',
            'low' => '🟢',
            default => ''
        };

        // Title with icons
        $message .= "{$statusIcon} ";
        if ($priorityIcon) $message .= "{$priorityIcon} ";
        $message .= "*" . $task->title . "* (#{$task->id})\n";
        if ($task->lesson && $task->lesson->course) {
            $message .= "   ✔️ الدورة: " . ucfirst(str_replace('_', ' ', $task->lesson->course->name)) . "\n";
        } elseif ($task->course) {
            // في حالة وجود علاقة مباشرة (إذا كانت موجودة)
            $message .= "   ✔️ الدورة: " . ucfirst(str_replace('_', ' ', $task->course->name)) . "\n";
        }
        if (!$compact) {
            // Description
            if ($task->description) {
                $desc = mb_strlen($task->description) > 100
                    ? mb_substr($task->description, 0, 100) . '...'
                    : $task->description;
                $message .= "   📝 {$desc}\n";
            }

            // Source
            if ($task->project) {
                $message .= "   🗂️ مشروع: {$task->project->name}\n";
            } elseif ($task->lesson) {
                $message .= "   📚 درس: {$task->lesson->name}";
                if ($task->lesson->course) {
                    $message .= " ({$task->lesson->course->name})";
                }
                $message .= "\n";
            } elseif ($task->course) {
                $message .= "   📖 دورة: {$task->course->name}\n";
            } else {
                $message .= "   ⭐ مهمة مستقلة\n";
            }

            // Dates
            if ($task->scheduled_date) {
                $message .= "   📅 مجدولة: {$task->scheduled_date->format('Y-m-d')}\n";
            }

            if ($task->due_date) {
                $isOverdue = $task->due_date->isPast() && $task->status !== 'completed';
                $dateIcon = $isOverdue ? '🚨' : '⏰';
                $message .= "   {$dateIcon} موعد: {$task->due_date->format('Y-m-d')}";
                if ($isOverdue) {
                    $message .= " (متأخر!)";
                }
                $message .= "\n";
            }

            // Tags
            if ($task->tags && count($task->tags) > 0) {
                $message .= "   🏷️ " . implode(', ', array_slice($task->tags, 0, 3));
                if (count($task->tags) > 3) {
                    $message .= " +" . (count($task->tags) - 3);
                }
                $message .= "\n";
            }
        } else {
            // Compact: just due date if exists
            if ($task->due_date) {
                $isOverdue = $task->due_date->isPast() && $task->status !== 'completed';
                if ($isOverdue) {
                    $message .= "   🚨 متأخر! ({$task->due_date->format('Y-m-d')})\n";
                } else {
                    $message .= "   ⏰ {$task->due_date->format('Y-m-d')}\n";
                }
            }
        }

        return $message;
    }

    // ==================== Projects Commands ====================

    /**
     * Send all projects
     */
    private function sendProjects($chatId)
    {
        $projects = Project::withCount('tasks')
            ->orderBy('priority')
            ->orderBy('created_at', 'desc')
            ->get();

        if ($projects->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '📂 لا توجد مشاريع حالياً.'
            ]);
            return;
        }

        $message = "🗂️ *المشاريع* (" . $projects->count() . "):\n\n";

        // Group by status
        $grouped = $projects->groupBy('status');

        foreach (['active', 'on_hold', 'completed', 'cancelled'] as $status) {
            if (!isset($grouped[$status])) continue;

            $statusIcon = match ($status) {
                'active' => '🟢',
                'on_hold' => '🟡',
                'completed' => '✅',
                'cancelled' => '❌',
                default => '⚪'
            };

            $statusName = match ($status) {
                'active' => 'نشط',
                'on_hold' => 'متوقف مؤقتاً',
                'completed' => 'مكتمل',
                'cancelled' => 'ملغي',
                default => 'غير معروف'
            };

            $message .= "*{$statusIcon} {$statusName}:*\n";

            foreach ($grouped[$status] as $project) {
                $message .= $this->formatProject($project, true) . "\n";
            }

            $message .= "\n";
        }

        $message .= "\n💡 استخدم /project [رقم] لعرض تفاصيل المشروع";

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send project details
     */
    private function sendProject($chatId, $projectId)
    {
        $project = Project::with('tasks')->find($projectId);

        if (!$project) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '❌ لم يتم العثور على المشروع رقم ' . $projectId
            ]);
            return;
        }

        $message = $this->formatProject($project, false);

        // Add tasks
        if ($project->tasks->count() > 0) {
            $message .= "\n\n📋 *المهام* ({$project->tasks->count()}):\n";

            $pending = $project->tasks->where('status', '!=', 'completed')->count();
            $completed = $project->tasks->where('status', 'completed')->count();

            $message .= "   ✅ مكتملة: {$completed}\n";
            $message .= "   ⏳ متبقية: {$pending}\n\n";

            // Show first 5 tasks
            foreach ($project->tasks->take(5) as $task) {
                $message .= $this->formatTask($task, true);
            }

            if ($project->tasks->count() > 5) {
                $message .= "\n... و " . ($project->tasks->count() - 5) . " مهمة أخرى";
            }
        } else {
            $message .= "\n\n📋 لا توجد مهام في هذا المشروع.";
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Format project for display
     */
    private function formatProject($project, $compact = false)
    {
        $message = "";

        // Status icon
        $statusIcon = match ($project->status) {
            'active' => '🟢',
            'on_hold' => '🟡',
            'completed' => '✅',
            'cancelled' => '❌',
            default => '⚪'
        };

        // Priority icon
        $priorityIcon = match ($project->priority) {
            'urgent' => '🔴',
            'high' => '🟠',
            'medium' => '🟡',
            'low' => '🟢',
            default => ''
        };

        // Title
        $message .= "{$statusIcon} ";
        if ($priorityIcon) $message .= "{$priorityIcon} ";
        $message .= "*" . $project->name . "* (#{$project->id})\n";

        if (!$compact) {
            // Description
            if ($project->description) {
                $message .= "   📝 {$project->description}\n";
            }

            // Progress
            $message .= "   📊 التقدم: {$project->progress}%\n";

            // Dates
            if ($project->start_date) {
                $message .= "   🚀 البداية: {$project->start_date->format('Y-m-d')}\n";
            }

            if ($project->due_date) {
                $isOverdue = $project->due_date->isPast() && $project->status !== 'completed';
                $dateIcon = $isOverdue ? '🚨' : '🎯';
                $message .= "   {$dateIcon} النهاية: {$project->due_date->format('Y-m-d')}";
                if ($isOverdue) {
                    $message .= " (متأخر!)";
                }
                $message .= "\n";
            }

            // Stats
            $totalTasks = $project->tasks()->count();
            $completedTasks = $project->tasks()->where('status', 'completed')->count();
            $message .= "   ✅ المهام: {$completedTasks}/{$totalTasks}\n";
        } else {
            // Compact: just progress
            $message .= "   📊 {$project->progress}% | المهام: {$project->tasks_count}\n";
        }

        return $message;
    }

    // ==================== Calendar Commands (Unified) ====================

    /**
     * Send calendar summary
     */
    private function sendCalendar($chatId)
    {
        // Get today's items
        $todayLessons = Lesson::with('course')
            ->whereDate('scheduled_date', Carbon::today())
            ->where('completed', false)
            ->count();

        $todayTasks = Task::with(['project', 'lesson.course', 'course'])
            ->whereDate('scheduled_date', Carbon::today())
            ->where('status', '!=', 'completed')
            ->count();

        // Get tomorrow's items
        $tomorrowLessons = Lesson::with('course')
            ->whereDate('scheduled_date', Carbon::tomorrow())
            ->where('completed', false)
            ->count();

        $tomorrowTasks = Task::with(['project', 'lesson.course', 'course'])
            ->whereDate('scheduled_date', Carbon::tomorrow())
            ->where('status', '!=', 'completed')
            ->count();

        // Get week items
        $weekStart = Carbon::today();
        $weekEnd = Carbon::today()->addWeek();

        $weekLessons = Lesson::whereBetween('scheduled_date', [$weekStart, $weekEnd])
            ->where('completed', false)
            ->count();

        $weekTasks = Task::whereBetween('scheduled_date', [$weekStart, $weekEnd])
            ->where('status', '!=', 'completed')
            ->count();

        // Get overdue tasks
        $overdueTasks = Task::where('status', '!=', 'completed')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', Carbon::today())
            ->count();

        $message = "📅 *ملخص التقويم*\n\n";

        $message .= "📌 *اليوم* (" . Carbon::today()->format('Y-m-d') . "):\n";
        $message .= "   📚 دروس: {$todayLessons}\n";
        $message .= "   ✅ مهام: {$todayTasks}\n";
        $message .= "   📊 الإجمالي: " . ($todayLessons + $todayTasks) . "\n\n";

        $message .= "📌 *الغد* (" . Carbon::tomorrow()->format('Y-m-d') . "):\n";
        $message .= "   📚 دروس: {$tomorrowLessons}\n";
        $message .= "   ✅ مهام: {$tomorrowTasks}\n";
        $message .= "   📊 الإجمالي: " . ($tomorrowLessons + $tomorrowTasks) . "\n\n";

        $message .= "📌 *هذا الأسبوع*:\n";
        $message .= "   📚 دروس: {$weekLessons}\n";
        $message .= "   ✅ مهام: {$weekTasks}\n";
        $message .= "   📊 الإجمالي: " . ($weekLessons + $weekTasks) . "\n\n";

        if ($overdueTasks > 0) {
            $message .= "⚠️ *مهام متأخرة*: {$overdueTasks}\n\n";
        }

        $message .= "💡 *الأوامر المتاحة:*\n";
        $message .= "/cal\\_today - تفاصيل اليوم\n";
        $message .= "/cal\\_tomorrow - تفاصيل الغد\n";
        $message .= "/cal\\_week - تفاصيل الأسبوع";

        Telegram::sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown'
        ]);
    }

    /**
     * Send today's calendar (lessons + tasks combined)
     */
    private function sendCalendarToday($chatId)
    {
        $lessons = Lesson::with('course')
            ->whereDate('scheduled_date', Carbon::today())
            ->where('completed', false)
            ->get();

        $tasks = Task::with(['project', 'lesson.course', 'course'])
            ->whereDate('scheduled_date', Carbon::today())
            ->where('status', '!=', 'completed')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->get();

        if ($lessons->isEmpty() && $tasks->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✨ لا توجد دروس أو مهام لليوم! استمتع بيومك! 🎉'
            ]);
            return;
        }

        $message = "📅 *اليوم* (" . Carbon::today()->format('Y-m-d') . ")\n\n";
        $message .= "📊 الإجمالي: " . ($lessons->count() + $tasks->count()) . " عنصر\n\n";

        // Show lessons
        if ($lessons->count() > 0) {
            $message .= "📚 *الدروس* ({$lessons->count()}):\n\n";
            foreach ($lessons as $lesson) {
                $message .= $this->formatLesson($lesson) . "\n";
            }
        }

        // Show tasks
        if ($tasks->count() > 0) {
            $message .= "✅ *المهام* ({$tasks->count()}):\n\n";
            foreach ($tasks as $task) {
                $message .= $this->formatTask($task) . "\n";
            }
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send tomorrow's calendar (lessons + tasks combined)
     */
    private function sendCalendarTomorrow($chatId)
    {
        $lessons = Lesson::with('course')
            ->whereDate('scheduled_date', Carbon::tomorrow())
            ->where('completed', false)
            ->get();

        $tasks = Task::with(['project', 'lesson.course', 'course'])
            ->whereDate('scheduled_date', Carbon::tomorrow())
            ->where('status', '!=', 'completed')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->get();

        if ($lessons->isEmpty() && $tasks->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✨ لا توجد دروس أو مهام للغد!'
            ]);
            return;
        }

        $message = "📅 *الغد* (" . Carbon::tomorrow()->format('Y-m-d') . ")\n\n";
        $message .= "📊 الإجمالي: " . ($lessons->count() + $tasks->count()) . " عنصر\n\n";

        // Show lessons
        if ($lessons->count() > 0) {
            $message .= "📚 *الدروس* ({$lessons->count()}):\n\n";
            foreach ($lessons as $lesson) {
                $message .= $this->formatLesson($lesson) . "\n";
            }
        }

        // Show tasks
        if ($tasks->count() > 0) {
            $message .= "✅ *المهام* ({$tasks->count()}):\n\n";
            foreach ($tasks as $task) {
                $message .= $this->formatTask($task) . "\n";
            }
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send this week's calendar (lessons + tasks combined)
     */
    private function sendCalendarWeek($chatId)
    {
        $weekStart = Carbon::today();
        $weekEnd = Carbon::today()->addWeek();

        $lessons = Lesson::with('course')
            ->whereBetween('scheduled_date', [$weekStart, $weekEnd])
            ->where('completed', false)
            ->orderBy('scheduled_date')
            ->get();

        $tasks = Task::with(['project', 'lesson.course', 'course'])
            ->whereBetween('scheduled_date', [$weekStart, $weekEnd])
            ->where('status', '!=', 'completed')
            ->orderBy('scheduled_date')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->get();

        if ($lessons->isEmpty() && $tasks->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✨ لا توجد دروس أو مهام لهذا الأسبوع!'
            ]);
            return;
        }

        $message = "📅 *هذا الأسبوع*\n";
        $message .= "من: " . $weekStart->format('Y-m-d') . "\n";
        $message .= "إلى: " . $weekEnd->format('Y-m-d') . "\n\n";
        $message .= "📊 الإجمالي: " . ($lessons->count() + $tasks->count()) . " عنصر\n\n";

        // Combine and group by date
        $itemsByDate = [];

        foreach ($lessons as $lesson) {
            $date = $lesson->scheduled_date->format('Y-m-d');
            if (!isset($itemsByDate[$date])) {
                $itemsByDate[$date] = ['lessons' => [], 'tasks' => []];
            }
            $itemsByDate[$date]['lessons'][] = $lesson;
        }

        foreach ($tasks as $task) {
            $date = $task->scheduled_date->format('Y-m-d');
            if (!isset($itemsByDate[$date])) {
                $itemsByDate[$date] = ['lessons' => [], 'tasks' => []];
            }
            $itemsByDate[$date]['tasks'][] = $task;
        }

        // Sort by date
        ksort($itemsByDate);

        // Display items grouped by date
        foreach ($itemsByDate as $date => $items) {
            $dateObj = Carbon::parse($date);
            $dayName = $dateObj->locale('ar')->dayName;
            $isToday = $dateObj->isToday();
            $isTomorrow = $dateObj->isTomorrow();

            $dateLabel = $date;
            if ($isToday) {
                $dateLabel .= " (اليوم)";
            } elseif ($isTomorrow) {
                $dateLabel .= " (الغد)";
            }

            $lessonsCount = count($items['lessons']);
            $tasksCount = count($items['tasks']);
            $totalCount = $lessonsCount + $tasksCount;

            $message .= "📅 *{$dayName} - {$dateLabel}*\n";
            $message .= "   📊 {$totalCount} عنصر ({$lessonsCount} درس، {$tasksCount} مهمة)\n\n";

            // Show lessons (compact)
            if ($lessonsCount > 0) {
                $message .= "   📚 الدروس:\n";
                foreach ($items['lessons'] as $lesson) {
                    $courseName = $lesson->course ? $lesson->course->name : 'بدون دورة';
                    $message .= "      • {$lesson->name} ({$courseName})\n";
                }
                $message .= "\n";
            }

            // Show tasks (compact with priority)
            if ($tasksCount > 0) {
                $message .= "   ✅ المهام:\n";
                foreach ($items['tasks'] as $task) {
                    $priorityIcon = match ($task->priority) {
                        'urgent' => '🔴',
                        'high' => '🟠',
                        'medium' => '🟡',
                        'low' => '🟢',
                        default => '⚪'
                    };
                    $message .= "      {$priorityIcon} {$task->title}\n";
                }
                $message .= "\n";
            }
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send calendar overdue items
     */
    private function sendCalendarOverdue($chatId)
    {
        $overdueItems = Task::with(['project', 'lesson.course', 'course'])
            ->where('status', '!=', 'completed')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', Carbon::today())
            ->orderBy('due_date')
            ->get();

        if ($overdueItems->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✨ رائع! لا توجد عناصر متأخرة! 🎉'
            ]);
            return;
        }

        $message = "⚠️ *العناصر المتأخرة* ({$overdueItems->count()})\n\n";

        foreach ($overdueItems as $item) {
            $type = $item->is_lesson ? '📚' : '✅';
            $priorityIcon = match ($item->priority) {
                'urgent' => '🔴',
                'high' => '🟠',
                'medium' => '🟡',
                'low' => '🟢',
                default => '⚪'
            };

            $daysLate = Carbon::parse($item->due_date)->diffInDays(Carbon::today());
            $source = '';
            if ($item->course) {
                $source = "📖 {$item->course->name}";
            } elseif ($item->project) {
                $source = "🗂️ {$item->project->name}";
            }

            $message .= "{$type} {$priorityIcon} #{$item->id} - {$item->title}\n";
            if ($source) {
                $message .= "   {$source}\n";
            }
            $message .= "   📅 الموعد: {$item->due_date->format('Y-m-d')} (متأخر {$daysLate} يوم)\n\n";
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send comprehensive statistics
     */
    private function sendStats($chatId)
    {
        // Get all tasks statistics
        $allTasks = Task::all();
        $totalTasks = $allTasks->count();
        $lessons = $allTasks->where('is_lesson', true);
        $tasks = $allTasks->where('is_lesson', false);

        // Status breakdown
        $pending = $allTasks->where('status', 'pending')->count();
        $inProgress = $allTasks->where('status', 'in_progress')->count();
        $completed = $allTasks->where('status', 'completed')->count();
        $cancelled = $allTasks->where('status', 'cancelled')->count();

        // Priority breakdown
        $urgent = $allTasks->where('priority', 'urgent')->count();
        $high = $allTasks->where('priority', 'high')->count();
        $medium = $allTasks->where('priority', 'medium')->count();
        $low = $allTasks->where('priority', 'low')->count();

        // Time-based statistics
        $today = Task::whereDate('scheduled_date', Carbon::today())->count();
        $tomorrow = Task::whereDate('scheduled_date', Carbon::tomorrow())->count();
        $thisWeek = Task::whereBetween('scheduled_date', [Carbon::today(), Carbon::today()->addWeek()])->count();
        $overdue = Task::where('status', '!=', 'completed')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', Carbon::today())
            ->count();

        // Courses and Projects
        $activeCourses = Course::where('active', true)->count();
        $activeProjects = Project::where('status', 'active')->count();

        // Completion rate
        $completionRate = $totalTasks > 0 ? round(($completed / $totalTasks) * 100, 1) : 0;

        $message = "📊 *إحصائيات النظام الشاملة*\n\n";

        $message .= "📈 *الإجمالي:*\n";
        $message .= "   • المجموع: {$totalTasks}\n";
        $message .= "   • الدروس: {$lessons->count()}\n";
        $message .= "   • المهام: {$tasks->count()}\n";
        $message .= "   • معدل الإنجاز: {$completionRate}%\n\n";

        $message .= "🔄 *حسب الحالة:*\n";
        $message .= "   ⏳ قيد الانتظار: {$pending}\n";
        $message .= "   🔄 قيد التنفيذ: {$inProgress}\n";
        $message .= "   ✅ مكتملة: {$completed}\n";
        $message .= "   ❌ ملغاة: {$cancelled}\n\n";

        $message .= "🎯 *حسب الأولوية:*\n";
        $message .= "   🔴 عاجل: {$urgent}\n";
        $message .= "   🟠 عالي: {$high}\n";
        $message .= "   🟡 متوسط: {$medium}\n";
        $message .= "   🟢 منخفض: {$low}\n\n";

        $message .= "📅 *حسب الوقت:*\n";
        $message .= "   • اليوم: {$today}\n";
        $message .= "   • غداً: {$tomorrow}\n";
        $message .= "   • هذا الأسبوع: {$thisWeek}\n";
        $message .= "   ⚠️ متأخرة: {$overdue}\n\n";

        $message .= "📚 *المصادر:*\n";
        $message .= "   • دورات نشطة: {$activeCourses}\n";
        $message .= "   • مشاريع نشطة: {$activeProjects}\n";

        Telegram::sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown'
        ]);
    }

    /**
     * Send all overdue tasks
     */
    private function sendOverdue($chatId)
    {
        $overdueTasks = Task::with(['project', 'lesson.course', 'course'])
            ->where('status', '!=', 'completed')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', Carbon::today())
            ->orderBy('due_date')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->get();

        if ($overdueTasks->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✨ ممتاز! لا توجد مهام متأخرة! 🎉'
            ]);
            return;
        }

        $message = "⚠️ *المهام المتأخرة* ({$overdueTasks->count()})\n\n";
        $message .= "مرتبة حسب الأولوية والتاريخ:\n\n";

        foreach ($overdueTasks as $task) {
            $type = $task->is_lesson ? '📚 درس' : '✅ مهمة';
            $priorityIcon = match ($task->priority) {
                'urgent' => '🔴 عاجل',
                'high' => '🟠 عالي',
                'medium' => '🟡 متوسط',
                'low' => '🟢 منخفض',
                default => '⚪ عادي'
            };

            $daysLate = Carbon::parse($task->due_date)->diffInDays(Carbon::today());

            $source = '';
            if ($task->course) {
                $source = "\n   📖 {$task->course->name}";
            } elseif ($task->project) {
                $source = "\n   🗂️ {$task->project->name}";
            }

            $message .= "{$priorityIcon} {$type}\n";
            $message .= "📌 #{$task->id} - *{$task->title}*{$source}\n";
            $message .= "📅 الموعد: {$task->due_date->format('Y-m-d')} (⏰ متأخر {$daysLate} يوم)\n";

            if ($task->description) {
                $description = \Illuminate\Support\Str::limit($task->description, 60);
                $message .= "📝 {$description}\n";
            }

            $message .= "\n";
        }

        $message .= "💡 استخدم /task\\_complete [رقم] لإكمال مهمة";

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send all urgent tasks
     */
    private function sendUrgent($chatId)
    {
        $urgentTasks = Task::with(['project', 'lesson.course', 'course'])
            ->where('priority', 'urgent')
            ->where('status', '!=', 'completed')
            ->orderBy('scheduled_date')
            ->get();

        if ($urgentTasks->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => '✅ لا توجد مهام عاجلة حالياً!'
            ]);
            return;
        }

        $message = "🔴 *المهام العاجلة* ({$urgentTasks->count()})\n\n";

        foreach ($urgentTasks as $task) {
            $type = $task->is_lesson ? '📚 درس' : '✅ مهمة';
            $status = match ($task->status) {
                'pending' => '⏳ قيد الانتظار',
                'in_progress' => '🔄 قيد التنفيذ',
                default => $task->status
            };

            $source = '';
            if ($task->course) {
                $source = "\n   📖 {$task->course->name}";
            } elseif ($task->project) {
                $source = "\n   🗂️ {$task->project->name}";
            }

            $isOverdue = $task->due_date && Carbon::parse($task->due_date)->isPast();
            $dateInfo = '';
            if ($task->scheduled_date) {
                $dateInfo = "📅 {$task->scheduled_date->format('Y-m-d')}";
                if ($task->scheduled_date->isToday()) {
                    $dateInfo .= ' (اليوم!)';
                } elseif ($task->scheduled_date->isTomorrow()) {
                    $dateInfo .= ' (غداً)';
                }
            }

            $message .= "🔴 {$type} - {$status}\n";
            $message .= "📌 #{$task->id} - *{$task->title}*{$source}\n";
            if ($dateInfo) {
                $message .= "{$dateInfo}\n";
            }
            if ($isOverdue) {
                $daysLate = Carbon::parse($task->due_date)->diffInDays(Carbon::today());
                $message .= "⚠️ متأخر {$daysLate} يوم!\n";
            }
            $message .= "\n";
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Send detailed week summary
     */
    private function sendWeekSummary($chatId)
    {
        $weekStart = Carbon::today();
        $weekEnd = Carbon::today()->addWeek();

        $weekItems = Task::with(['project', 'lesson.course', 'course'])
            ->whereBetween('scheduled_date', [$weekStart, $weekEnd])
            ->where('status', '!=', 'completed')
            ->orderBy('scheduled_date')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->get();

        $lessons = $weekItems->where('is_lesson', true);
        $tasks = $weekItems->where('is_lesson', false);

        $message = "📅 *ملخص الأسبوع*\n";
        $message .= "من {$weekStart->format('Y-m-d')} إلى {$weekEnd->format('Y-m-d')}\n\n";

        $message .= "📊 *الإحصائيات:*\n";
        $message .= "   • المجموع: {$weekItems->count()}\n";
        $message .= "   • الدروس: {$lessons->count()}\n";
        $message .= "   • المهام: {$tasks->count()}\n\n";

        // Group by day
        $byDay = $weekItems->groupBy(function ($item) {
            return $item->scheduled_date->format('Y-m-d');
        });

        $message .= "📋 *التفصيل اليومي:*\n\n";

        foreach ($byDay as $date => $dayItems) {
            $carbonDate = Carbon::parse($date);
            $dayName = $carbonDate->locale('ar')->dayName;
            $isToday = $carbonDate->isToday();
            $isTomorrow = $carbonDate->isTomorrow();

            $dateLabel = $date;
            if ($isToday) {
                $dateLabel .= ' (اليوم)';
            } elseif ($isTomorrow) {
                $dateLabel .= ' (غداً)';
            }

            $lessonsCount = $dayItems->where('is_lesson', true)->count();
            $tasksCount = $dayItems->where('is_lesson', false)->count();

            $message .= "📅 *{$dayName} - {$dateLabel}*\n";
            $message .= "   {$dayItems->count()} عنصر ({$lessonsCount} درس، {$tasksCount} مهمة)\n";

            // Show urgent/high priority items
            $urgentItems = $dayItems->whereIn('priority', ['urgent', 'high']);
            if ($urgentItems->count() > 0) {
                $message .= "   🔴 {$urgentItems->count()} عاجل/عالي الأولوية\n";
            }

            $message .= "\n";
        }

        // Priority breakdown
        $urgent = $weekItems->where('priority', 'urgent')->count();
        $high = $weekItems->where('priority', 'high')->count();
        if ($urgent > 0 || $high > 0) {
            $message .= "⚠️ *تنبيهات الأولوية:*\n";
            if ($urgent > 0) {
                $message .= "   🔴 {$urgent} عاجل\n";
            }
            if ($high > 0) {
                $message .= "   🟠 {$high} عالي\n";
            }
        }

        Telegram::sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown'
        ]);
    }

    /**
     * Send export link
     */
    private function sendExportLink($chatId)
    {
        $exportUrl = config('app.url') . '/calendar/export';

        $message = "📥 *تصدير البيانات*\n\n";
        $message .= "يمكنك تصدير بيانات التقويم بصيغة CSV من الرابط التالي:\n\n";
        $message .= "🔗 {$exportUrl}\n\n";
        $message .= "📝 الملف يحتوي على:\n";
        $message .= "   • التاريخ\n";
        $message .= "   • العنوان\n";
        $message .= "   • النوع (درس/مهمة)\n";
        $message .= "   • الحالة\n";
        $message .= "   • الأولوية\n";
        $message .= "   • المصدر (دورة/مشروع)\n";
        $message .= "   • الوصف\n\n";
        $message .= "💡 يمكنك فتح الملف في Excel أو Google Sheets";

        Telegram::sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown'
        ]);
    }

    /**
     * Search in tasks and lessons
     */
    private function searchItems($chatId, $query)
    {
        $results = Task::with(['project', 'lesson.course', 'course'])
            ->where(function ($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                    ->orWhere('description', 'like', "%{$query}%");
            })
            ->orderBy('scheduled_date')
            ->limit(20)
            ->get();

        if ($results->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => "🔍 لم يتم العثور على نتائج لـ \"{$query}\""
            ]);
            return;
        }

        $message = "🔍 *نتائج البحث عن:* \"{$query}\"\n";
        $message .= "وجدنا {$results->count()} نتيجة\n\n";

        foreach ($results as $item) {
            $type = $item->is_lesson ? '📚' : '✅';
            $status = $item->status === 'completed' ? '✅' : '⏳';

            $source = '';
            if ($item->course) {
                $source = " | 📖 {$item->course->name}";
            } elseif ($item->project) {
                $source = " | 🗂️ {$item->project->name}";
            }

            $message .= "{$type} {$status} #{$item->id} - {$item->title}{$source}\n";

            if ($item->scheduled_date) {
                $message .= "   📅 {$item->scheduled_date->format('Y-m-d')}";
                if ($item->scheduled_date->isToday()) {
                    $message .= ' (اليوم)';
                }
                $message .= "\n";
            }

            $message .= "\n";
        }

        if ($results->count() === 20) {
            $message .= "💡 عرض أول 20 نتيجة فقط. حاول البحث بشكل أكثر تحديداً.";
        }

        $this->sendLongMessage($chatId, $message);
    }

    /**
     * Filter items by type/priority
     */
    private function filterItems($chatId, $filter)
    {
        $query = Task::with(['project', 'lesson.course', 'course'])
            ->where('status', '!=', 'completed');

        $filterName = '';

        switch (strtolower($filter)) {
            case 'lessons':
            case 'دروس':
                $query->where('is_lesson', true);
                $filterName = 'الدروس';
                break;
            case 'tasks':
            case 'مهام':
                $query->where('is_lesson', false);
                $filterName = 'المهام';
                break;
            case 'urgent':
            case 'عاجل':
                $query->where('priority', 'urgent');
                $filterName = 'العاجل';
                break;
            case 'high':
            case 'عالي':
                $query->where('priority', 'high');
                $filterName = 'عالي الأولوية';
                break;
            case 'medium':
            case 'متوسط':
                $query->where('priority', 'medium');
                $filterName = 'متوسط الأولوية';
                break;
            case 'low':
            case 'منخفض':
                $query->where('priority', 'low');
                $filterName = 'منخفض الأولوية';
                break;
            default:
                Telegram::sendMessage([
                    'chat_id' => $chatId,
                    'text' => "⚠️ فلتر غير معروف: {$filter}\n\nالخيارات المتاحة:\n• lessons (دروس)\n• tasks (مهام)\n• urgent (عاجل)\n• high (عالي)\n• medium (متوسط)\n• low (منخفض)"
                ]);
                return;
        }

        $results = $query->orderBy('scheduled_date')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->limit(30)
            ->get();

        if ($results->isEmpty()) {
            Telegram::sendMessage([
                'chat_id' => $chatId,
                'text' => "📭 لا توجد نتائج في فلتر: {$filterName}"
            ]);
            return;
        }

        $message = "🔍 *فلتر: {$filterName}*\n";
        $message .= "وجدنا {$results->count()} نتيجة\n\n";

        foreach ($results as $item) {
            $type = $item->is_lesson ? '📚' : '✅';
            $priorityIcon = match ($item->priority) {
                'urgent' => '🔴',
                'high' => '🟠',
                'medium' => '🟡',
                'low' => '🟢',
                default => '⚪'
            };

            $source = '';
            if ($item->course) {
                $source = " | {$item->course->name}";
            } elseif ($item->project) {
                $source = " | {$item->project->name}";
            }

            $message .= "{$type} {$priorityIcon} #{$item->id} - {$item->title}{$source}\n";

            if ($item->scheduled_date) {
                $message .= "   📅 {$item->scheduled_date->format('Y-m-d')}";
                if ($item->scheduled_date->isToday()) {
                    $message .= ' (اليوم)';
                } elseif ($item->scheduled_date->isTomorrow()) {
                    $message .= ' (غداً)';
                }
                $message .= "\n";
            }

            $message .= "\n";
        }

        if ($results->count() === 30) {
            $message .= "💡 عرض أول 30 نتيجة فقط.";
        }

        $this->sendLongMessage($chatId, $message);
    }
}
