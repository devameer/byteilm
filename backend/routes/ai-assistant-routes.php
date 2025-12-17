<?php

use App\Http\Controllers\AIAssistantController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AI Assistant Routes
|--------------------------------------------------------------------------
|
| Routes for AI-powered features including chatbot, video analysis,
| recommendations, and learning insights
|
*/

Route::prefix('ai')->middleware('auth:sanctum')->group(function () {

    // ========================================
    // AI CHATBOT ROUTES
    // ========================================

    Route::prefix('chat')->group(function () {
        // Conversations
        Route::get('/conversations', [AIAssistantController::class, 'getConversations']);
        Route::post('/conversations', [AIAssistantController::class, 'createConversation']);
        Route::get('/conversations/{id}', [AIAssistantController::class, 'getConversation']);
        Route::delete('/conversations/{id}', [AIAssistantController::class, 'archiveConversation']);

        // Messages
        Route::post('/conversations/{id}/messages', [AIAssistantController::class, 'sendMessage']);
    });

    // ========================================
    // VIDEO ANALYSIS ROUTES
    // ========================================

    Route::prefix('video')->group(function () {
        Route::post('/analyze/{lessonId}', [AIAssistantController::class, 'analyzeVideo']);
        Route::get('/analysis/{lessonId}', [AIAssistantController::class, 'getVideoAnalysis']);
    });

    // ========================================
    // CONTENT SUMMARIZATION ROUTES
    // ========================================

    Route::prefix('summarize')->group(function () {
        Route::post('/course/{id}', [AIAssistantController::class, 'summarizeCourse']);
        Route::post('/lesson/{id}', [AIAssistantController::class, 'summarizeLesson']);
    });

    // ========================================
    // RECOMMENDATIONS ROUTES
    // ========================================

    Route::prefix('recommendations')->group(function () {
        // Get recommendations
        Route::get('/courses', [AIAssistantController::class, 'getCourseRecommendations']);
        Route::get('/tasks', [AIAssistantController::class, 'getPrioritizedTasks']);
        Route::get('/study-times', [AIAssistantController::class, 'getStudyTimeRecommendations']);
        Route::get('/collaboration', [AIAssistantController::class, 'getCollaborationRecommendations']);

        // Interact with recommendations
        Route::post('/{id}/accept', [AIAssistantController::class, 'acceptRecommendation']);
        Route::post('/{id}/dismiss', [AIAssistantController::class, 'dismissRecommendation']);
    });

    // ========================================
    // LEARNING INSIGHTS ROUTES
    // ========================================

    Route::prefix('insights')->group(function () {
        Route::get('/', [AIAssistantController::class, 'getInsights']);
        Route::post('/generate', [AIAssistantController::class, 'generateInsights']);
        Route::post('/{id}/read', [AIAssistantController::class, 'markInsightAsRead']);
    });

    // ========================================
    // DASHBOARD ROUTE
    // ========================================

    Route::get('/dashboard', [AIAssistantController::class, 'getDashboard']);
});

/*
|--------------------------------------------------------------------------
| Usage Examples
|--------------------------------------------------------------------------
|
| === AI CHATBOT ===
|
| 1. Create a new conversation:
|    POST /api/ai/chat/conversations
|    Body: {
|      "title": "مساعدة في الدورة",
|      "context_type": "course",
|      "context_id": 1
|    }
|
| 2. Send message to AI:
|    POST /api/ai/chat/conversations/1/messages
|    Body: {
|      "message": "كيف يمكنني تحسين مهاراتي في البرمجة؟"
|    }
|
| 3. Get all conversations:
|    GET /api/ai/chat/conversations
|
| === VIDEO ANALYSIS ===
|
| 4. Analyze video:
|    POST /api/ai/video/analyze/123
|
| 5. Get video analysis:
|    GET /api/ai/video/analysis/123
|
| === CONTENT SUMMARIZATION ===
|
| 6. Summarize course:
|    POST /api/ai/summarize/course/1
|    Body: { "type": "brief" }  // or "detailed", "bullets"
|
| 7. Summarize lesson:
|    POST /api/ai/summarize/lesson/123
|    Body: { "type": "detailed" }
|
| === RECOMMENDATIONS ===
|
| 8. Get course recommendations:
|    GET /api/ai/recommendations/courses?limit=5
|
| 9. Get prioritized tasks:
|    GET /api/ai/recommendations/tasks
|
| 10. Get study time recommendations:
|     GET /api/ai/recommendations/study-times
|
| 11. Get collaboration partners:
|     GET /api/ai/recommendations/collaboration?limit=5
|
| 12. Accept recommendation:
|     POST /api/ai/recommendations/123/accept
|
| 13. Dismiss recommendation:
|     POST /api/ai/recommendations/123/dismiss
|
| === LEARNING INSIGHTS ===
|
| 14. Get learning insights:
|     GET /api/ai/insights
|
| 15. Generate new insights:
|     POST /api/ai/insights/generate
|
| 16. Mark insight as read:
|     POST /api/ai/insights/123/read
|
| === DASHBOARD ===
|
| 17. Get AI assistant dashboard:
|     GET /api/ai/dashboard
|     Returns: conversations, recommendations, insights, study times, stats
|
*/
