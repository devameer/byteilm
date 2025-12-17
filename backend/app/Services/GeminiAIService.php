<?php

namespace App\Services;

use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizGenerationLog;
use App\Models\VideoAnalysis;
use App\Models\Course;
use App\Models\Task;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class GeminiAIService
{
    protected $apiKey;
    protected $apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
    }

    /**
     * Generate quiz from video content
     */
    public function generateQuizFromVideo(Lesson $lesson, $userId, array $options = [])
    {
        $startTime = microtime(true);

        // Create generation log
        $log = QuizGenerationLog::create([
            'lesson_id' => $lesson->id,
            'user_id' => $userId,
            'status' => 'processing',
            'ai_model' => 'gemini-pro'
        ]);

        try {
            // Get video content/transcript
            $videoContent = $this->extractVideoContent($lesson);

            $log->update(['video_transcript' => $videoContent]);

            // Generate questions using Gemini AI
            $questionsData = $this->generateQuestions(
                $videoContent,
                $options['num_questions'] ?? 10,
                $options['difficulty'] ?? 'medium',
                $options['question_types'] ?? ['multiple_choice', 'true_false']
            );

            // Create quiz
            $quiz = Quiz::create([
                'lesson_id' => $lesson->id,
                'title' => $options['title'] ?? "اختبار: {$lesson->title}",
                'description' => $options['description'] ?? "تم إنشاء هذا الاختبار تلقائياً بواسطة الذكاء الاصطناعي",
                'duration_minutes' => $options['duration'] ?? 15,
                'passing_score' => $options['passing_score'] ?? 70,
                'max_attempts' => $options['max_attempts'] ?? 3,
                'randomize_questions' => $options['randomize'] ?? true,
                'show_correct_answers' => $options['show_answers'] ?? true,
                'difficulty' => $options['difficulty'] ?? 'medium',
                'is_active' => $options['is_active'] ?? true,
                'metadata' => [
                    'ai_generated' => true,
                    'generation_date' => now()->toDateTimeString(),
                    'ai_model' => 'gemini-pro'
                ]
            ]);

            // Create questions
            $questionOrder = 1;
            foreach ($questionsData as $questionData) {
                QuizQuestion::create([
                    'quiz_id' => $quiz->id,
                    'type' => $questionData['type'],
                    'question' => $questionData['question'],
                    'options' => $questionData['options'] ?? null,
                    'correct_answer' => $questionData['correct_answer'],
                    'explanation' => $questionData['explanation'] ?? null,
                    'points' => $questionData['points'] ?? 1,
                    'order' => $questionOrder++,
                    'metadata' => [
                        'ai_generated' => true,
                        'confidence' => $questionData['confidence'] ?? null,
                        'video_timestamp' => $questionData['timestamp'] ?? null
                    ]
                ]);
            }

            $processingTime = round(microtime(true) - $startTime);

            // Update log
            $log->update([
                'quiz_id' => $quiz->id,
                'status' => 'completed',
                'questions_generated' => count($questionsData),
                'processing_time_seconds' => $processingTime
            ]);

            return [
                'success' => true,
                'quiz' => $quiz->load('questions'),
                'questions_generated' => count($questionsData),
                'processing_time' => $processingTime
            ];
        } catch (\Exception $e) {
            $processingTime = round(microtime(true) - $startTime);

            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'processing_time_seconds' => $processingTime
            ]);

            Log::error('Quiz generation failed', [
                'lesson_id' => $lesson->id,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Extract video content/transcript
     */
    protected function extractVideoContent(Lesson $lesson)
    {
        // Option 1: If transcript is stored in lesson
        if (isset($lesson->metadata['transcript'])) {
            return $lesson->metadata['transcript'];
        }

        // Option 2: Use lesson description and content
        $content = $lesson->title . "\n\n";

        if ($lesson->description) {
            $content .= $lesson->description . "\n\n";
        }

        if ($lesson->content) {
            $content .= $lesson->content;
        }

        // Option 3: In production, integrate with YouTube API or video transcription service
        // For now, return available content
        return $content;
    }

    /**
     * Generate questions using Gemini AI
     */
    protected function generateQuestions($content, $numQuestions = 10, $difficulty = 'medium', $questionTypes = ['multiple_choice', 'true_false'])
    {
        $prompt = $this->buildPrompt($content, $numQuestions, $difficulty, $questionTypes);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post($this->apiUrl . '?key=' . $this->apiKey, [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.7,
                'topK' => 40,
                'topP' => 0.95,
                'maxOutputTokens' => 2048,
            ]
        ]);

        if (!$response->successful()) {
            throw new \Exception('Gemini API request failed: ' . $response->body());
        }

        $responseData = $response->json();

        // Parse AI response
        return $this->parseGeminiResponse($responseData, $questionTypes);
    }

    /**
     * Build prompt for Gemini AI
     */
    protected function buildPrompt($content, $numQuestions, $difficulty, $questionTypes)
    {
        $typesStr = implode(', ', $questionTypes);
        $difficultyDescriptions = [
            'easy' => 'أسئلة سهلة تركز على المفاهيم الأساسية والحقائق المباشرة',
            'medium' => 'أسئلة متوسطة تتطلب فهم المفاهيم وتطبيقها',
            'hard' => 'أسئلة صعبة تتطلب تحليل عميق وتفكير نقدي'
        ];

        $prompt = <<<PROMPT
أنت خبير في إنشاء الاختبارات التعليمية. بناءً على المحتوى التالي، قم بإنشاء {$numQuestions} سؤال اختبار.

**المحتوى:**
{$content}

**متطلبات الأسئلة:**
- المستوى: {$difficulty} ({$difficultyDescriptions[$difficulty]})
- أنواع الأسئلة المطلوبة: {$typesStr}
- يجب أن تكون الأسئلة واضحة ومباشرة
- يجب أن تغطي الأسئلة جوانب مختلفة من المحتوى
- قدم تفسيراً للإجابة الصحيحة

**تنسيق الإخراج (JSON):**
```json
[
  {
    "type": "multiple_choice",
    "question": "السؤال هنا؟",
    "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
    "correct_answer": "0",
    "explanation": "التفسير هنا",
    "points": 1,
    "confidence": 0.95
  },
  {
    "type": "true_false",
    "question": "العبارة هنا؟",
    "options": ["صح", "خطأ"],
    "correct_answer": "0",
    "explanation": "التفسير هنا",
    "points": 1,
    "confidence": 0.90
  }
]
```

**ملاحظات مهمة:**
1. للأسئلة من نوع multiple_choice: ضع 4 خيارات، correct_answer هو رقم الخيار (0-3)
2. للأسئلة من نوع true_false: ضع خيارين فقط ["صح", "خطأ"]، correct_answer هو 0 أو 1
3. للأسئلة من نوع fill_blank: correct_answer هو النص المطلوب
4. للأسئلة من نوع short_answer: correct_answer هو الإجابة المتوقعة
5. confidence يجب أن يكون بين 0 و 1 ويعبر عن ثقتك في السؤال

**قم بإرجاع JSON فقط، بدون أي نص إضافي قبله أو بعده.**
PROMPT;

        return $prompt;
    }

    /**
     * Parse Gemini AI response
     */
    protected function parseGeminiResponse($response, $questionTypes)
    {
        try {
            // Extract text from Gemini response
            $text = $response['candidates'][0]['content']['parts'][0]['text'] ?? '';

            // Remove markdown code blocks if present
            $text = preg_replace('/```json\s*/', '', $text);
            $text = preg_replace('/```\s*/', '', $text);
            $text = trim($text);

            // Parse JSON
            $questions = json_decode($text, true);

            if (!is_array($questions)) {
                throw new \Exception('Failed to parse AI response as JSON');
            }

            // Validate and filter questions
            $validQuestions = [];
            foreach ($questions as $question) {
                if ($this->validateQuestion($question, $questionTypes)) {
                    $validQuestions[] = $question;
                }
            }

            if (empty($validQuestions)) {
                throw new \Exception('No valid questions generated');
            }

            return $validQuestions;
        } catch (\Exception $e) {
            Log::error('Failed to parse Gemini response', [
                'error' => $e->getMessage(),
                'response' => $response
            ]);

            // Fallback: Generate basic questions
            return $this->generateFallbackQuestions($questionTypes);
        }
    }

    /**
     * Validate question structure
     */
    protected function validateQuestion($question, $allowedTypes)
    {
        if (!isset($question['type']) || !in_array($question['type'], $allowedTypes)) {
            return false;
        }

        if (!isset($question['question']) || empty($question['question'])) {
            return false;
        }

        if (!isset($question['correct_answer'])) {
            return false;
        }

        // Validate based on type
        if ($question['type'] === 'multiple_choice' || $question['type'] === 'true_false') {
            if (!isset($question['options']) || !is_array($question['options'])) {
                return false;
            }

            if ($question['type'] === 'multiple_choice' && count($question['options']) < 2) {
                return false;
            }
        }

        return true;
    }

    /**
     * Generate fallback questions if AI fails
     */
    protected function generateFallbackQuestions($questionTypes)
    {
        $fallbackQuestions = [];

        if (in_array('true_false', $questionTypes)) {
            $fallbackQuestions[] = [
                'type' => 'true_false',
                'question' => 'هل فهمت محتوى هذا الدرس؟',
                'options' => ['صح', 'خطأ'],
                'correct_answer' => '0',
                'explanation' => 'هذا سؤال تقييمي عام',
                'points' => 1,
                'confidence' => 0.5
            ];
        }

        if (in_array('multiple_choice', $questionTypes)) {
            $fallbackQuestions[] = [
                'type' => 'multiple_choice',
                'question' => 'ما هو الموضوع الرئيسي لهذا الدرس؟',
                'options' => ['الموضوع أ', 'الموضوع ب', 'الموضوع ج', 'الموضوع د'],
                'correct_answer' => '0',
                'explanation' => 'الموضوع الرئيسي يتضح من العنوان والمحتوى',
                'points' => 1,
                'confidence' => 0.5
            ];
        }

        return $fallbackQuestions;
    }

    /**
     * Regenerate specific question
     */
    public function regenerateQuestion(QuizQuestion $question, $content)
    {
        $prompt = <<<PROMPT
بناءً على المحتوى التالي، قم بإنشاء سؤال بديل من نوع {$question->type}:

**المحتوى:**
{$content}

**السؤال الحالي:**
{$question->question}

قم بإنشاء سؤال جديد مختلف يغطي جانباً آخر من المحتوى بنفس التنسيق JSON المطلوب.
PROMPT;

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post($this->apiUrl . '?key=' . $this->apiKey, [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ]
        ]);

        if ($response->successful()) {
            $responseData = $response->json();
            $questions = $this->parseGeminiResponse($responseData, [$question->type]);

            if (!empty($questions)) {
                return $questions[0];
            }
        }

        throw new \Exception('Failed to regenerate question');
    }

    /**
     * Test API connection
     */
    public function testConnection()
    {
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl . '?key=' . $this->apiKey, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => 'Hello, are you working?']
                        ]
                    ]
                ]
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * ========================================
     * AI CHATBOT & ASSISTANT METHODS
     * ========================================
     */

    /**
     * Chat with AI assistant
     */
    public function chat($message, array $context = [], array $conversationHistory = [])
    {
        $prompt = $this->buildChatPrompt($message, $context, $conversationHistory);

        try {
            $response = Http::timeout(30)->withHeaders([
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl . '?key=' . $this->apiKey, [
                'contents' => $this->formatConversationForGemini($conversationHistory, $message),
                'generationConfig' => [
                    'temperature' => 0.8,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 1024,
                ]
            ]);

            if (!$response->successful()) {
                throw new \Exception('Gemini API request failed: ' . $response->body());
            }

            $responseData = $response->json();
            $aiReply = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? 'عذراً، لم أتمكن من فهم سؤالك.';

            return $aiReply;
        } catch (\Exception $e) {
            Log::error('AI Chat failed', ['error' => $e->getMessage()]);
            return 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.';
        }
    }

    /**
     * Build chat prompt with context
     */
    protected function buildChatPrompt($message, array $context, array $conversationHistory)
    {
        $systemPrompt = "أنت مساعد ذكي متخصص في التعليم وإدارة المشاريع. مهمتك مساعدة المستخدمين في:\n";
        $systemPrompt .= "- الإجابة على أسئلتهم حول الدورات والدروس\n";
        $systemPrompt .= "- تقديم نصائح لإدارة المهام والمشاريع\n";
        $systemPrompt .= "- اقتراح جداول دراسية\n";
        $systemPrompt .= "- تلخيص المحتوى\n";
        $systemPrompt .= "- توليد أفكار وحلول\n\n";

        if (!empty($context)) {
            $systemPrompt .= "**معلومات السياق:**\n";

            if (isset($context['course'])) {
                $systemPrompt .= "- الدورة الحالية: {$context['course']['title']}\n";
            }

            if (isset($context['lesson'])) {
                $systemPrompt .= "- الدرس الحالي: {$context['lesson']['title']}\n";
            }

            if (isset($context['tasks_count'])) {
                $systemPrompt .= "- عدد المهام: {$context['tasks_count']}\n";
            }
        }

        return $systemPrompt;
    }

    /**
     * Format conversation for Gemini API
     */
    protected function formatConversationForGemini(array $history, $newMessage)
    {
        $contents = [];

        // Add conversation history
        foreach ($history as $msg) {
            $contents[] = [
                'role' => $msg['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $msg['content']]]
            ];
        }

        // Add new message
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $newMessage]]
        ];

        return $contents;
    }

    /**
     * ========================================
     * VIDEO ANALYSIS METHODS
     * ========================================
     */

    /**
     * Analyze video content
     */
    public function analyzeVideo(Lesson $lesson, $userId)
    {
        // Create or get existing analysis
        $analysis = VideoAnalysis::firstOrCreate(
            ['lesson_id' => $lesson->id],
            [
                'analyzed_by' => $userId,
                'status' => 'pending',
                'video_url' => $lesson->video_url ?? null,
                'duration_seconds' => $lesson->duration ?? null
            ]
        );

        // If already completed, return existing
        if ($analysis->isCompleted()) {
            return $analysis;
        }

        // Start processing
        $analysis->markAsProcessing();

        try {
            $content = $this->extractVideoContent($lesson);

            // Run all analyses in parallel
            $mainTopics = $this->extractMainTopics($content);
            $chapters = $this->generateChapters($content, $lesson->duration ?? 0);
            $keywords = $this->extractKeywords($content);
            $summary = $this->generateSummary($content);
            $notes = $this->generateNotes($content);
            $language = $this->detectLanguage($content);

            // Save results
            $analysis->markAsCompleted([
                'main_topics' => $mainTopics,
                'chapters' => $chapters,
                'keywords' => $keywords,
                'summary' => $summary,
                'notes' => $notes,
                'detected_language' => $language
            ]);

            return $analysis;
        } catch (\Exception $e) {
            $analysis->markAsFailed($e->getMessage());
            throw $e;
        }
    }

    /**
     * Extract main topics from content
     */
    protected function extractMainTopics($content)
    {
        $prompt = <<<PROMPT
قم بتحليل المحتوى التالي واستخراج المواضيع الرئيسية (5-10 مواضيع):

{$content}

أرجع النتيجة بتنسيق JSON:
```json
[
  {
    "topic": "اسم الموضوع",
    "importance": "high/medium/low",
    "description": "وصف قصير"
  }
]
```
PROMPT;

        $response = $this->makeAIRequest($prompt);
        return $this->parseJsonResponse($response, []);
    }

    /**
     * Generate chapters with timestamps
     */
    protected function generateChapters($content, $duration)
    {
        $prompt = <<<PROMPT
قم بتقسيم المحتوى التالي إلى فصول (Chapters) مع أوقات تقريبية:

**المحتوى:**
{$content}

**مدة الفيديو:** {$duration} ثانية

أرجع النتيجة بتنسيق JSON:
```json
[
  {
    "title": "عنوان الفصل",
    "start_time": 0,
    "end_time": 120,
    "description": "وصف قصير"
  }
]
```
PROMPT;

        $response = $this->makeAIRequest($prompt);
        return $this->parseJsonResponse($response, []);
    }

    /**
     * Extract keywords
     */
    protected function extractKeywords($content)
    {
        $prompt = <<<PROMPT
استخرج الكلمات المفتاحية الأكثر أهمية من المحتوى التالي (10-20 كلمة):

{$content}

أرجع النتيجة بتنسيق JSON:
```json
[
  {
    "keyword": "الكلمة المفتاحية",
    "relevance": 0.95,
    "category": "technical/concept/tool/other"
  }
]
```
PROMPT;

        $response = $this->makeAIRequest($prompt);
        return $this->parseJsonResponse($response, []);
    }

    /**
     * Generate content summary
     */
    public function generateSummary($content, $type = 'brief')
    {
        $lengthGuide = [
            'brief' => 'ملخص قصير في 2-3 جمل',
            'detailed' => 'ملخص تفصيلي في فقرة واحدة (5-7 جمل)',
            'bullets' => 'نقاط رئيسية في شكل قائمة (5-8 نقاط)'
        ];

        $prompt = <<<PROMPT
قم بتلخيص المحتوى التالي:

{$content}

**نوع الملخص المطلوب:** {$lengthGuide[$type]}

قدم ملخصاً واضحاً ومفيداً يغطي النقاط الأساسية.
PROMPT;

        $response = $this->makeAIRequest($prompt);

        // Extract text directly (not JSON for summaries)
        return $response['candidates'][0]['content']['parts'][0]['text'] ?? 'فشل في توليد الملخص';
    }

    /**
     * Generate study notes
     */
    protected function generateNotes($content)
    {
        $prompt = <<<PROMPT
قم بإنشاء ملاحظات دراسية منظمة من المحتوى التالي:

{$content}

**تنسيق الملاحظات:**
- استخدم عناوين واضحة
- قسم المحتوى إلى أقسام
- أضف نقاط مهمة
- أضف أمثلة إن وجدت

قدم الملاحظات بتنسيق Markdown.
PROMPT;

        $response = $this->makeAIRequest($prompt);
        return $response['candidates'][0]['content']['parts'][0]['text'] ?? null;
    }

    /**
     * Detect content language
     */
    protected function detectLanguage($content)
    {
        // Simple detection based on character sets
        $arabicChars = preg_match_all('/[\x{0600}-\x{06FF}]/u', $content);
        $englishChars = preg_match_all('/[a-zA-Z]/', $content);

        if ($arabicChars > $englishChars * 2) {
            return 'ar';
        } elseif ($englishChars > $arabicChars * 2) {
            return 'en';
        } else {
            return 'mixed';
        }
    }

    /**
     * ========================================
     * CONTENT SUMMARIZATION
     * ========================================
     */

    /**
     * Summarize course content
     */
    public function summarizeCourse(Course $course, $type = 'brief')
    {
        $content = $course->title . "\n\n" . $course->description;

        // Add lessons info
        $lessons = $course->lessons;
        if ($lessons->count() > 0) {
            $content .= "\n\nالدروس:\n";
            foreach ($lessons as $lesson) {
                $content .= "- {$lesson->title}\n";
            }
        }

        return $this->generateSummary($content, $type);
    }

    /**
     * Summarize task
     */
    public function summarizeTask(Task $task)
    {
        $content = $task->title . "\n\n";
        if ($task->description) {
            $content .= $task->description;
        }

        return $this->generateSummary($content, 'brief');
    }

    /**
     * ========================================
     * HELPER METHODS
     * ========================================
     */

    /**
     * Make AI request
     */
    protected function makeAIRequest($prompt, array $config = [])
    {
        $defaultConfig = [
            'temperature' => 0.7,
            'topK' => 40,
            'topP' => 0.95,
            'maxOutputTokens' => 2048,
        ];

        $response = Http::timeout(30)->withHeaders([
            'Content-Type' => 'application/json',
        ])->post($this->apiUrl . '?key=' . $this->apiKey, [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => array_merge($defaultConfig, $config)
        ]);

        if (!$response->successful()) {
            throw new \Exception('Gemini API request failed: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Parse JSON response from AI
     */
    protected function parseJsonResponse($response, $default = null)
    {
        try {
            $text = $response['candidates'][0]['content']['parts'][0]['text'] ?? '';

            // Remove markdown code blocks
            $text = preg_replace('/```json\s*/', '', $text);
            $text = preg_replace('/```\s*/', '', $text);
            $text = trim($text);

            $data = json_decode($text, true);

            return is_array($data) ? $data : $default;
        } catch (\Exception $e) {
            Log::error('Failed to parse AI JSON response', ['error' => $e->getMessage()]);
            return $default;
        }
    }
}
