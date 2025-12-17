<?php

namespace App\Http\Controllers;

use App\Services\GeminiAIService;
use App\Services\AIRecommendationService;
use App\Models\AIConversation;
use App\Models\AIRecommendation;
use App\Models\LearningInsight;
use App\Models\VideoAnalysis;
use App\Models\Lesson;
use App\Models\Course;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AIAssistantController extends Controller
{
    protected $geminiService;
    protected $recommendationService;

    public function __construct(
        GeminiAIService $geminiService,
        AIRecommendationService $recommendationService
    ) {
        $this->geminiService = $geminiService;
        $this->recommendationService = $recommendationService;
    }

    /**
     * ========================================
     * AI CHATBOT ENDPOINTS
     * ========================================
     */

    /**
     * Start new conversation
     * POST /api/ai/chat/conversations
     */
    public function createConversation(Request $request)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'context_type' => 'nullable|string|in:course,task,project,general',
            'context_id' => 'nullable|integer'
        ]);

        $conversation = AIConversation::create([
            'user_id' => Auth::id(),
            'title' => $request->title ?? 'محادثة جديدة',
            'context_type' => $request->context_type,
            'context_id' => $request->context_id,
            'is_active' => true
        ]);

        return response()->json([
            'success' => true,
            'data' => $conversation
        ], 201);
    }

    /**
     * Get user's conversations
     * GET /api/ai/chat/conversations
     */
    public function getConversations()
    {
        $conversations = AIConversation::where('user_id', Auth::id())
            ->where('is_active', true)
            ->with('messages')
            ->orderBy('last_message_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $conversations
        ]);
    }

    /**
     * Get specific conversation
     * GET /api/ai/chat/conversations/{id}
     */
    public function getConversation($id)
    {
        $conversation = AIConversation::where('user_id', Auth::id())
            ->where('id', $id)
            ->with('messages')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $conversation
        ]);
    }

    /**
     * Send message to AI
     * POST /api/ai/chat/conversations/{id}/messages
     */
    public function sendMessage(Request $request, $id)
    {
        $request->validate([
            'message' => 'required|string|max:5000'
        ]);

        $conversation = AIConversation::where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        // Add user message
        $userMessage = $conversation->addUserMessage($request->message);

        // Build context
        $context = $this->buildConversationContext($conversation);

        // Get conversation history
        $history = $conversation->getHistoryForAI(10);

        // Get AI response
        $aiReply = $this->geminiService->chat($request->message, $context, $history);

        // Add assistant message
        $assistantMessage = $conversation->addAssistantMessage($aiReply);

        return response()->json([
            'success' => true,
            'data' => [
                'user_message' => $userMessage,
                'assistant_message' => $assistantMessage
            ]
        ]);
    }

    /**
     * Archive conversation
     * DELETE /api/ai/chat/conversations/{id}
     */
    public function archiveConversation($id)
    {
        $conversation = AIConversation::where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        $conversation->archive();

        return response()->json([
            'success' => true,
            'message' => 'تم أرشفة المحادثة بنجاح'
        ]);
    }

    /**
     * Build conversation context
     */
    protected function buildConversationContext(AIConversation $conversation)
    {
        $context = [
            'user' => Auth::user()->only(['name', 'email'])
        ];

        if ($conversation->context_type && $conversation->context_id) {
            switch ($conversation->context_type) {
                case 'course':
                    $course = Course::find($conversation->context_id);
                    if ($course) {
                        $context['course'] = $course->only(['title', 'description']);
                    }
                    break;

                case 'task':
                    $task = Task::find($conversation->context_id);
                    if ($task) {
                        $context['task'] = $task->only(['title', 'description', 'priority', 'deadline']);
                    }
                    break;

                case 'lesson':
                    $lesson = Lesson::find($conversation->context_id);
                    if ($lesson) {
                        $context['lesson'] = $lesson->only(['title', 'description']);
                    }
                    break;
            }
        }

        // Add user's task count
        $context['tasks_count'] = Auth::user()->tasks()->where('status', '!=', 'completed')->count();

        return $context;
    }

    /**
     * ========================================
     * VIDEO ANALYSIS ENDPOINTS
     * ========================================
     */

    /**
     * Analyze video
     * POST /api/ai/video/analyze/{lessonId}
     */
    public function analyzeVideo($lessonId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        // Check if user has access to this lesson's course
        $enrollment = Auth::user()->enrollments()
            ->where('course_id', $lesson->course_id)
            ->first();

        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'ليس لديك صلاحية للوصول إلى هذا الدرس'
            ], 403);
        }

        try {
            $analysis = $this->geminiService->analyzeVideo($lesson, Auth::id());

            return response()->json([
                'success' => true,
                'data' => $analysis
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل تحليل الفيديو: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get video analysis
     * GET /api/ai/video/analysis/{lessonId}
     */
    public function getVideoAnalysis($lessonId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        // Check access
        $enrollment = Auth::user()->enrollments()
            ->where('course_id', $lesson->course_id)
            ->first();

        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'ليس لديك صلاحية للوصول إلى هذا الدرس'
            ], 403);
        }

        $analysis = VideoAnalysis::where('lesson_id', $lessonId)
            ->completed()
            ->first();

        if (!$analysis) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد تحليل متاح لهذا الفيديو'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $analysis
        ]);
    }

    /**
     * ========================================
     * CONTENT SUMMARIZATION ENDPOINTS
     * ========================================
     */

    /**
     * Summarize course
     * POST /api/ai/summarize/course/{id}
     */
    public function summarizeCourse(Request $request, $id)
    {
        $request->validate([
            'type' => 'nullable|in:brief,detailed,bullets'
        ]);

        $course = Course::findOrFail($id);

        // Check if user is enrolled
        $enrollment = Auth::user()->enrollments()->where('course_id', $id)->first();
        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'يجب أن تكون مسجلاً في الدورة لتلخيصها'
            ], 403);
        }

        $summary = $this->geminiService->summarizeCourse($course, $request->type ?? 'brief');

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'type' => $request->type ?? 'brief'
            ]
        ]);
    }

    /**
     * Summarize lesson
     * POST /api/ai/summarize/lesson/{id}
     */
    public function summarizeLesson(Request $request, $id)
    {
        $request->validate([
            'type' => 'nullable|in:brief,detailed,bullets'
        ]);

        $lesson = Lesson::findOrFail($id);

        // Check access
        $enrollment = Auth::user()->enrollments()
            ->where('course_id', $lesson->course_id)
            ->first();

        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'ليس لديك صلاحية للوصول إلى هذا الدرس'
            ], 403);
        }

        $content = $lesson->title . "\n\n" . ($lesson->description ?? '') . "\n\n" . ($lesson->content ?? '');
        $summary = $this->geminiService->generateSummary($content, $request->type ?? 'brief');

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'type' => $request->type ?? 'brief'
            ]
        ]);
    }

    /**
     * ========================================
     * RECOMMENDATIONS ENDPOINTS
     * ========================================
     */

    /**
     * Get course recommendations
     * GET /api/ai/recommendations/courses
     */
    public function getCourseRecommendations(Request $request)
    {
        $limit = $request->input('limit', 5);

        $recommendations = $this->recommendationService->generateCourseRecommendations(
            Auth::user(),
            $limit
        );

        return response()->json([
            'success' => true,
            'data' => $recommendations
        ]);
    }

    /**
     * Get prioritized tasks
     * GET /api/ai/recommendations/tasks
     */
    public function getPrioritizedTasks()
    {
        $tasks = $this->recommendationService->prioritizeTasks(Auth::user());

        return response()->json([
            'success' => true,
            'data' => $tasks->values()
        ]);
    }

    /**
     * Get study time recommendations
     * GET /api/ai/recommendations/study-times
     */
    public function getStudyTimeRecommendations()
    {
        $recommendations = $this->recommendationService->generateStudyTimeRecommendations(Auth::user());

        return response()->json([
            'success' => true,
            'data' => $recommendations
        ]);
    }

    /**
     * Get collaboration recommendations
     * GET /api/ai/recommendations/collaboration
     */
    public function getCollaborationRecommendations(Request $request)
    {
        $limit = $request->input('limit', 5);

        $recommendations = $this->recommendationService->recommendCollaborationPartners(
            Auth::user(),
            $limit
        );

        return response()->json([
            'success' => true,
            'data' => $recommendations
        ]);
    }

    /**
     * Accept recommendation
     * POST /api/ai/recommendations/{id}/accept
     */
    public function acceptRecommendation($id)
    {
        $recommendation = AIRecommendation::where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        $recommendation->accept();

        return response()->json([
            'success' => true,
            'message' => 'تم قبول التوصية'
        ]);
    }

    /**
     * Dismiss recommendation
     * POST /api/ai/recommendations/{id}/dismiss
     */
    public function dismissRecommendation($id)
    {
        $recommendation = AIRecommendation::where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        $recommendation->dismiss();

        return response()->json([
            'success' => true,
            'message' => 'تم تجاهل التوصية'
        ]);
    }

    /**
     * ========================================
     * LEARNING INSIGHTS ENDPOINTS
     * ========================================
     */

    /**
     * Get learning insights
     * GET /api/ai/insights
     */
    public function getInsights()
    {
        $insights = LearningInsight::where('user_id', Auth::id())
            ->orderBy('insight_date', 'desc')
            ->orderBy('priority', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $insights
        ]);
    }

    /**
     * Generate new insights
     * POST /api/ai/insights/generate
     */
    public function generateInsights()
    {
        $insights = $this->recommendationService->generateLearningInsights(Auth::user());

        return response()->json([
            'success' => true,
            'data' => $insights,
            'message' => 'تم إنشاء رؤى التعلم الجديدة'
        ]);
    }

    /**
     * Mark insight as read
     * POST /api/ai/insights/{id}/read
     */
    public function markInsightAsRead($id)
    {
        $insight = LearningInsight::where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        $insight->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'تم وضع علامة مقروء على الرؤية'
        ]);
    }

    /**
     * ========================================
     * DASHBOARD ENDPOINT
     * ========================================
     */

    /**
     * Get AI assistant dashboard
     * GET /api/ai/dashboard
     */
    public function getDashboard()
    {
        $user = Auth::user();

        // Get recent conversations
        $recentConversations = AIConversation::where('user_id', $user->id)
            ->where('is_active', true)
            ->orderBy('last_message_at', 'desc')
            ->limit(5)
            ->get();

        // Get active recommendations
        $recommendations = AIRecommendation::where('user_id', $user->id)
            ->active()
            ->orderBy('confidence_score', 'desc')
            ->limit(5)
            ->with('recommendable')
            ->get();

        // Get unread insights
        $insights = LearningInsight::where('user_id', $user->id)
            ->unread()
            ->orderBy('priority', 'desc')
            ->limit(5)
            ->get();

        // Get study time recommendations for today
        $today = strtolower(now()->format('l'));
        $studyTimes = Auth::user()->studyTimeRecommendations()
            ->where('day_of_week', $today)
            ->where('is_active', true)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'recent_conversations' => $recentConversations,
                'recommendations' => $recommendations,
                'insights' => $insights,
                'study_times_today' => $studyTimes,
                'stats' => [
                    'total_conversations' => AIConversation::where('user_id', $user->id)->count(),
                    'pending_recommendations' => AIRecommendation::where('user_id', $user->id)->active()->count(),
                    'unread_insights' => LearningInsight::where('user_id', $user->id)->unread()->count()
                ]
            ]
        ]);
    }
}
