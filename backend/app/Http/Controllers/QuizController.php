<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use App\Models\Lesson;
use App\Services\GeminiAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    protected $geminiService;

    public function __construct(GeminiAIService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    /**
     * Get all quizzes for a lesson
     * GET /api/lessons/{lessonId}/quizzes
     */
    public function index($lessonId)
    {
        $lesson = Lesson::findOrFail($lessonId);
        $user = Auth::user();
        $userId = $user->id;

        // Optimized query with eager loading and counts
        $quizzes = Quiz::forLesson($lessonId)
            ->active()
            ->withCount('questions')
            ->with([
                'attempts' => function ($query) use ($userId) {
                    $query->where('user_id', $userId)
                        ->select('id', 'quiz_id', 'score', 'passed', 'completed_at')
                        ->orderBy('score', 'desc');
                }
            ])
            ->get()
            ->map(function ($quiz) use ($userId) {
                $userAttempts = $quiz->attempts;
                $attemptCount = $userAttempts->count();
                $bestAttempt = $userAttempts->first();
                $hasPassed = $userAttempts->where('passed', true)->isNotEmpty();
                $remainingAttempts = $quiz->max_attempts ? max(0, $quiz->max_attempts - $attemptCount) : null;
                $canTake = $quiz->max_attempts === null || $remainingAttempts > 0;

                return [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'description' => $quiz->description,
                    'duration_minutes' => $quiz->duration_minutes,
                    'passing_score' => $quiz->passing_score,
                    'max_attempts' => $quiz->max_attempts,
                    'difficulty' => $quiz->difficulty,
                    'questions_count' => $quiz->questions_count,
                    'total_points' => $quiz->total_points,
                    'user_attempts' => $attemptCount,
                    'remaining_attempts' => $remainingAttempts,
                    'can_take' => $canTake,
                    'has_passed' => $hasPassed,
                    'best_score' => $bestAttempt?->score,
                    'created_at' => $quiz->created_at
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $quizzes
        ]);
    }

    /**
     * Get single quiz details
     * GET /api/quizzes/{id}
     */
    public function show($id)
    {
        $quiz = Quiz::with(['lesson', 'questions'])->findOrFail($id);
        $user = Auth::user();

        $quizData = [
            'id' => $quiz->id,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'duration_minutes' => $quiz->duration_minutes,
            'passing_score' => $quiz->passing_score,
            'max_attempts' => $quiz->max_attempts,
            'randomize_questions' => $quiz->randomize_questions,
            'show_correct_answers' => $quiz->show_correct_answers,
            'difficulty' => $quiz->difficulty,
            'lesson' => [
                'id' => $quiz->lesson->id,
                'title' => $quiz->lesson->title
            ],
            'questions_count' => $quiz->questions()->count(),
            'total_points' => $quiz->total_points,
            'user_attempts' => $quiz->userAttempts($user->id)->count(),
            'remaining_attempts' => $quiz->getRemainingAttempts($user->id),
            'can_take' => $quiz->canUserTakeQuiz($user->id),
            'has_passed' => $quiz->hasUserPassed($user->id),
            'best_attempt' => $quiz->getBestAttempt($user->id),
            'latest_attempt' => $quiz->getLatestAttempt($user->id),
            'statistics' => [
                'average_score' => $quiz->average_score,
                'completion_rate' => $quiz->completion_rate,
                'pass_rate' => $quiz->pass_rate
            ]
        ];

        return response()->json([
            'success' => true,
            'data' => $quizData
        ]);
    }

    /**
     * Generate quiz using AI
     * POST /api/lessons/{lessonId}/quizzes/generate
     */
    public function generateWithAI($lessonId, Request $request)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'num_questions' => 'integer|min:1|max:50',
            'difficulty' => 'in:easy,medium,hard',
            'duration' => 'integer|min:5|max:180',
            'passing_score' => 'integer|min:0|max:100',
            'max_attempts' => 'integer|min:1|max:10',
            'question_types' => 'array',
            'question_types.*' => 'in:multiple_choice,true_false,fill_blank,short_answer',
            'language' => 'in:ar,en,fr,de,es,tr,ur'
        ]);

        $lesson = Lesson::findOrFail($lessonId);
        $user = Auth::user();

        try {
            $result = $this->geminiService->generateQuizFromVideo($lesson, $user->id, [
                'title' => $request->title,
                'description' => $request->description,
                'num_questions' => $request->num_questions ?? 10,
                'difficulty' => $request->difficulty ?? 'medium',
                'duration' => $request->duration ?? 15,
                'passing_score' => $request->passing_score ?? 70,
                'max_attempts' => $request->max_attempts ?? 3,
                'question_types' => $request->question_types ?? ['multiple_choice', 'true_false'],
                'language' => $request->language ?? 'ar',
                'randomize' => $request->randomize ?? true,
                'show_answers' => $request->show_answers ?? true,
                'is_active' => $request->is_active ?? true
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء الاختبار بنجاح باستخدام الذكاء الاصطناعي',
                'data' => $result
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل إنشاء الاختبار: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create quiz manually
     * POST /api/lessons/{lessonId}/quizzes
     */
    public function store($lessonId, Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration_minutes' => 'required|integer|min:5|max:180',
            'passing_score' => 'required|integer|min:0|max:100',
            'max_attempts' => 'required|integer|min:1|max:10',
            'difficulty' => 'required|in:easy,medium,hard',
            'questions' => 'required|array|min:1',
            'questions.*.type' => 'required|in:multiple_choice,true_false,fill_blank,short_answer',
            'questions.*.question' => 'required|string',
            'questions.*.options' => 'required_if:questions.*.type,multiple_choice,true_false|array',
            'questions.*.correct_answer' => 'required',
            'questions.*.explanation' => 'nullable|string',
            'questions.*.points' => 'integer|min:1'
        ]);

        $lesson = Lesson::findOrFail($lessonId);

        DB::beginTransaction();
        try {
            $quiz = Quiz::create([
                'lesson_id' => $lesson->id,
                'title' => $request->title,
                'description' => $request->description,
                'duration_minutes' => $request->duration_minutes,
                'passing_score' => $request->passing_score,
                'max_attempts' => $request->max_attempts,
                'randomize_questions' => $request->randomize_questions ?? true,
                'show_correct_answers' => $request->show_correct_answers ?? true,
                'difficulty' => $request->difficulty,
                'is_active' => $request->is_active ?? true
            ]);

            $order = 1;
            foreach ($request->questions as $questionData) {
                QuizQuestion::create([
                    'quiz_id' => $quiz->id,
                    'type' => $questionData['type'],
                    'question' => $questionData['question'],
                    'options' => $questionData['options'] ?? null,
                    'correct_answer' => $questionData['correct_answer'],
                    'explanation' => $questionData['explanation'] ?? null,
                    'points' => $questionData['points'] ?? 1,
                    'order' => $order++
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء الاختبار بنجاح',
                'data' => $quiz->load('questions')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'فشل إنشاء الاختبار: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start quiz attempt
     * POST /api/quizzes/{id}/start
     */
    public function startAttempt($id)
    {
        $quiz = Quiz::with('questions')->findOrFail($id);
        $user = Auth::user();

        // Check if user can take quiz
        if (!$quiz->canUserTakeQuiz($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'لقد استنفذت جميع المحاولات المتاحة'
            ], 403);
        }

        // Check for existing in-progress attempt
        $existingAttempt = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->first();

        if ($existingAttempt) {
            // Check if expired
            if ($existingAttempt->isExpired()) {
                $existingAttempt->update(['status' => 'abandoned']);
            } else {
                return response()->json([
                    'success' => true,
                    'message' => 'لديك محاولة قيد التنفيذ',
                    'data' => $this->formatAttemptWithQuestions($existingAttempt)
                ]);
            }
        }

        // Create new attempt
        $attemptNumber = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->max('attempt_number') + 1;

        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'attempt_number' => $attemptNumber,
            'status' => 'in_progress',
            'started_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم بدء الاختبار',
            'data' => $this->formatAttemptWithQuestions($attempt)
        ], 201);
    }

    /**
     * Submit answer to question
     * POST /api/quiz-attempts/{attemptId}/answer
     */
    public function submitAnswer($attemptId, Request $request)
    {
        $request->validate([
            'question_id' => 'required|exists:quiz_questions,id',
            'answer' => 'required',
            'time_spent' => 'integer|min:0'
        ]);

        $attempt = QuizAttempt::findOrFail($attemptId);
        $user = Auth::user();

        // Log for debugging
        \Log::info('QuizController@submitAnswer', [
            'attempt_id' => $attemptId,
            'attempt_user_id' => $attempt->user_id,
            'authenticated_user_id' => $user->id,
            'authenticated_user_email' => $user->email,
            'question_id' => $request->question_id
        ]);

        // Verify ownership
        if ((int) $attempt->user_id !== (int) $user->id) {
            \Log::warning('Attempt ownership mismatch', [
                'attempt_id' => $attemptId,
                'attempt_user_id' => $attempt->user_id,
                'authenticated_user_id' => $user->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'هذه المحاولة لا تنتمي لحسابك. يرجى بدء محاولة جديدة.',
                'error' => 'attempt_ownership_mismatch',
                'details' => [
                    'attempt_user_id' => $attempt->user_id,
                    'current_user_id' => $user->id
                ]
            ], 403);
        }

        // Check if attempt is still in progress
        if ($attempt->status !== 'in_progress') {
            return response()->json([
                'success' => false,
                'message' => 'هذه المحاولة قد انتهت'
            ], 400);
        }

        // Check if expired
        if ($attempt->isExpired()) {
            $attempt->update(['status' => 'abandoned']);

            return response()->json([
                'success' => false,
                'message' => 'انتهى وقت الاختبار'
            ], 400);
        }

        $question = QuizQuestion::findOrFail($request->question_id);

        // Check if question belongs to this quiz
        if ($question->quiz_id !== $attempt->quiz_id) {
            return response()->json([
                'success' => false,
                'message' => 'السؤال لا ينتمي لهذا الاختبار'
            ], 400);
        }

        // Check if already answered
        $existingAnswer = QuizAnswer::where('quiz_attempt_id', $attempt->id)
            ->where('quiz_question_id', $question->id)
            ->first();

        if ($existingAnswer) {
            // Update existing answer
            $existingAnswer->update([
                'answer' => $request->answer,
                'time_spent_seconds' => $request->time_spent ?? 0
            ]);
            $existingAnswer->checkCorrectness();
            $answer = $existingAnswer;
        } else {
            // Create new answer
            $answer = QuizAnswer::create([
                'quiz_attempt_id' => $attempt->id,
                'quiz_question_id' => $question->id,
                'answer' => $request->answer,
                'time_spent_seconds' => $request->time_spent ?? 0
            ]);
            $answer->checkCorrectness();
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ الإجابة',
            'data' => [
                'is_correct' => $answer->is_correct,
                'points_earned' => $answer->points_earned
            ]
        ]);
    }

    /**
     * Submit quiz (complete attempt)
     * POST /api/quiz-attempts/{attemptId}/submit
     */
    public function submitQuiz($attemptId)
    {
        $attempt = QuizAttempt::with(['quiz', 'quizAnswers.question'])->findOrFail($attemptId);
        $user = Auth::user();

        // Verify ownership
        if ($attempt->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بهذا الإجراء'
            ], 403);
        }

        // Check if already completed
        if ($attempt->status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'هذه المحاولة قد تم تسليمها بالفعل'
            ], 400);
        }

        // Complete attempt
        $attempt->complete();

        return response()->json([
            'success' => true,
            'message' => 'تم تسليم الاختبار بنجاح',
            'data' => $this->formatCompletedAttempt($attempt)
        ]);
    }

    /**
     * Get attempt results
     * GET /api/quiz-attempts/{attemptId}/results
     */
    public function getResults($attemptId)
    {
        $attempt = QuizAttempt::with(['quiz', 'quizAnswers.question'])->findOrFail($attemptId);
        $user = Auth::user();

        // Verify ownership
        if ($attempt->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بهذا الإجراء'
            ], 403);
        }

        if ($attempt->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'المحاولة لم تكتمل بعد'
            ], 400);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatCompletedAttempt($attempt)
        ]);
    }

    /**
     * Get user's quiz history
     * GET /api/quizzes/{id}/attempts
     */
    public function getUserAttempts($id)
    {
        $quiz = Quiz::findOrFail($id);
        $user = Auth::user();

        $attempts = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($attempt) {
                return [
                    'id' => $attempt->id,
                    'attempt_number' => $attempt->attempt_number,
                    'status' => $attempt->status,
                    'score' => $attempt->score,
                    'grade' => $attempt->grade,
                    'passed' => $attempt->passed,
                    'started_at' => $attempt->started_at,
                    'completed_at' => $attempt->completed_at,
                    'time_spent' => $attempt->formatted_time_spent
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $attempts
        ]);
    }

    /**
     * Delete quiz
     * DELETE /api/quizzes/{id}
     */
    public function destroy($id)
    {
        $quiz = Quiz::findOrFail($id);
        $user = Auth::user();

        // Check if user is instructor/owner
        if ($quiz->lesson->course->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بحذف هذا الاختبار'
            ], 403);
        }

        $quiz->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الاختبار بنجاح'
        ]);
    }

    /**
     * Format attempt with questions
     */
    protected function formatAttemptWithQuestions(QuizAttempt $attempt)
    {
        $quiz = $attempt->quiz()->with('questions')->first();
        $questions = $quiz->questions;

        if ($quiz->randomize_questions) {
            $questions = $questions->shuffle();
        } else {
            $questions = $questions->sortBy('order');
        }

        return [
            'attempt_id' => $attempt->id,
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'duration_minutes' => $quiz->duration_minutes,
                'passing_score' => $quiz->passing_score
            ],
            'attempt_number' => $attempt->attempt_number,
            'started_at' => $attempt->started_at,
            'remaining_time' => $attempt->remaining_time,
            'questions' => $questions->values()->map(function ($question) {
                return [
                    'id' => $question->id,
                    'type' => $question->type,
                    'question' => $question->question,
                    'options' => $question->options,
                    'points' => $question->points
                ];
            })
        ];
    }

    /**
     * Format completed attempt
     */
    protected function formatCompletedAttempt(QuizAttempt $attempt)
    {
        $quiz = $attempt->quiz;
        $answers = $attempt->quizAnswers()->with('question')->get();

        $questionsWithAnswers = $answers->map(function ($answer) use ($quiz) {
            $data = [
                'question_id' => $answer->question->id,
                'question' => $answer->question->question,
                'type' => $answer->question->type,
                'options' => $answer->question->options,
                'user_answer' => $answer->answer,
                'is_correct' => $answer->is_correct,
                'points' => $answer->question->points,
                'points_earned' => $answer->points_earned
            ];

            // Show correct answer if allowed
            if ($quiz->show_correct_answers) {
                $data['correct_answer'] = $answer->question->correct_answer;
                $data['explanation'] = $answer->question->explanation;
            }

            return $data;
        });

        return [
            'attempt_id' => $attempt->id,
            'quiz_title' => $quiz->title,
            'attempt_number' => $attempt->attempt_number,
            'status' => $attempt->status,
            'score' => $attempt->score,
            'grade' => $attempt->grade,
            'passed' => $attempt->passed,
            'total_points' => $attempt->total_points,
            'earned_points' => $attempt->earned_points,
            'passing_score' => $quiz->passing_score,
            'started_at' => $attempt->started_at,
            'completed_at' => $attempt->completed_at,
            'time_spent' => $attempt->formatted_time_spent,
            'questions_count' => $answers->count(),
            'correct_answers' => $answers->where('is_correct', true)->count(),
            'incorrect_answers' => $answers->where('is_correct', false)->count(),
            'questions' => $questionsWithAnswers
        ];
    }
}
