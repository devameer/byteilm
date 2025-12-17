<?php

use App\Http\Controllers\QuizController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Quizzes Routes
|--------------------------------------------------------------------------
|
| Routes for AI-Powered Quiz System
| يجب إضافتها في routes/api.php داخل middleware('auth:sanctum')
|
*/

Route::middleware('auth:sanctum')->group(function () {

    // Lesson quizzes
    Route::prefix('lessons/{lessonId}')->group(function () {
        // Get all quizzes for a lesson
        Route::get('/quizzes', [QuizController::class, 'index']);

        // Generate quiz using AI
        Route::post('/quizzes/generate', [QuizController::class, 'generateWithAI']);

        // Create quiz manually
        Route::post('/quizzes', [QuizController::class, 'store']);
    });

    // Quiz management
    Route::prefix('quizzes')->group(function () {
        // Get quiz details
        Route::get('/{id}', [QuizController::class, 'show']);

        // Delete quiz
        Route::delete('/{id}', [QuizController::class, 'destroy']);

        // Start quiz attempt
        Route::post('/{id}/start', [QuizController::class, 'startAttempt']);

        // Get user's attempts for quiz
        Route::get('/{id}/attempts', [QuizController::class, 'getUserAttempts']);
    });

    // Quiz attempts
    Route::prefix('quiz-attempts')->group(function () {
        // Submit answer to question
        Route::post('/{attemptId}/answer', [QuizController::class, 'submitAnswer']);

        // Submit/Complete quiz
        Route::post('/{attemptId}/submit', [QuizController::class, 'submitQuiz']);

        // Get attempt results
        Route::get('/{attemptId}/results', [QuizController::class, 'getResults']);
    });
});

/*
|--------------------------------------------------------------------------
| كيفية الاستخدام
|--------------------------------------------------------------------------
|
| في plan-backend/routes/api.php:
|
| Route::middleware('auth:sanctum')->group(function () {
|     // ... الـ Routes الموجودة
|
|     // Quiz Routes
|     require __DIR__.'/quizzes-routes.php';
| });
|
|--------------------------------------------------------------------------
| أمثلة على الاستخدام
|--------------------------------------------------------------------------
|
| 1. إنشاء اختبار بالذكاء الاصطناعي:
| POST /api/lessons/1/quizzes/generate
| Body: {
|   "num_questions": 10,
|   "difficulty": "medium",
|   "duration": 15,
|   "question_types": ["multiple_choice", "true_false"]
| }
|
| 2. إنشاء اختبار يدوياً:
| POST /api/lessons/1/quizzes
| Body: {
|   "title": "اختبار الدرس الأول",
|   "duration_minutes": 15,
|   "passing_score": 70,
|   "max_attempts": 3,
|   "difficulty": "medium",
|   "questions": [
|     {
|       "type": "multiple_choice",
|       "question": "ما هو...؟",
|       "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
|       "correct_answer": "0",
|       "explanation": "التفسير...",
|       "points": 1
|     }
|   ]
| }
|
| 3. الحصول على اختبارات الدرس:
| GET /api/lessons/1/quizzes
|
| 4. عرض تفاصيل اختبار:
| GET /api/quizzes/1
|
| 5. بدء محاولة اختبار:
| POST /api/quizzes/1/start
|
| 6. الإجابة على سؤال:
| POST /api/quiz-attempts/1/answer
| Body: {
|   "question_id": 1,
|   "answer": "0",
|   "time_spent": 30
| }
|
| 7. تسليم الاختبار:
| POST /api/quiz-attempts/1/submit
|
| 8. عرض نتائج المحاولة:
| GET /api/quiz-attempts/1/results
|
| 9. عرض محاولات المستخدم للاختبار:
| GET /api/quizzes/1/attempts
|
| 10. حذف اختبار:
| DELETE /api/quizzes/1
|
*/
