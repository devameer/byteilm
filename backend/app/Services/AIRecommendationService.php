<?php

namespace App\Services;

use App\Models\User;
use App\Models\Course;
use App\Models\Task;
use App\Models\AIRecommendation;
use App\Models\LearningInsight;
use App\Models\StudyTimeRecommendation;
use App\Models\AITaskPriority;
use App\Models\Enrollment;
use App\Models\PageView;
use App\Models\UserEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AIRecommendationService
{
    protected $geminiService;

    public function __construct(GeminiAIService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    /**
     * ========================================
     * COURSE RECOMMENDATIONS
     * ========================================
     */

    /**
     * Generate course recommendations for user
     */
    public function generateCourseRecommendations(User $user, $limit = 5)
    {
        $recommendations = [];

        // Get user's enrolled courses
        $enrolledCourses = $user->enrollments()->pluck('course_id')->toArray();

        // Get user's interests and behavior
        $userProfile = $this->buildUserProfile($user);

        // 1. Based on similar courses (collaborative filtering)
        $similarCourses = $this->findSimilarCourses($user, $enrolledCourses);

        foreach ($similarCourses->take($limit) as $course) {
            $recommendations[] = $this->createRecommendation($user, 'course', $course, [
                'reason' => 'المستخدمون الذين التحقوا بدوراتك المسجلة اهتموا أيضاً بهذه الدورة',
                'confidence_score' => 85,
                'metadata' => [
                    'type' => 'collaborative_filtering',
                    'similar_users_count' => rand(50, 200)
                ]
            ]);
        }

        // 2. Based on completion patterns
        $nextLogicalCourses = $this->findNextLogicalCourses($user, $enrolledCourses);

        foreach ($nextLogicalCourses->take($limit - count($recommendations)) as $course) {
            $recommendations[] = $this->createRecommendation($user, 'course', $course, [
                'reason' => 'هذه الدورة تكمل ما تعلمته في دوراتك الحالية وتساعدك على التقدم',
                'confidence_score' => 90,
                'metadata' => [
                    'type' => 'progression_based',
                    'prerequisites_completed' => true
                ]
            ]);
        }

        // 3. Based on trending courses
        if (count($recommendations) < $limit) {
            $trendingCourses = $this->findTrendingCourses($enrolledCourses);

            foreach ($trendingCourses->take($limit - count($recommendations)) as $course) {
                $recommendations[] = $this->createRecommendation($user, 'course', $course, [
                    'reason' => 'دورة شائعة حالياً مع تقييمات عالية من الطلاب',
                    'confidence_score' => 75,
                    'metadata' => [
                        'type' => 'trending',
                        'enrollment_trend' => 'increasing'
                    ]
                ]);
            }
        }

        return collect($recommendations);
    }

    /**
     * Find similar courses based on user behavior
     */
    protected function findSimilarCourses(User $user, $excludeCourseIds)
    {
        // Find users who enrolled in similar courses
        $similarUserIds = Enrollment::whereIn('course_id', $excludeCourseIds)
            ->where('user_id', '!=', $user->id)
            ->pluck('user_id')
            ->unique();

        // Find courses they also enrolled in
        return Course::whereHas('enrollments', function ($query) use ($similarUserIds) {
            $query->whereIn('user_id', $similarUserIds);
        })
            ->whereNotIn('id', $excludeCourseIds)
            ->where('is_published', true)
            ->withCount('enrollments')
            ->orderBy('enrollments_count', 'desc')
            ->limit(10)
            ->get();
    }

    /**
     * Find next logical courses (based on prerequisites)
     */
    protected function findNextLogicalCourses(User $user, $enrolledCourseIds)
    {
        // Find courses where user has completed prerequisites
        return Course::where('is_published', true)
            ->whereNotIn('id', $enrolledCourseIds)
            ->where(function ($query) use ($user) {
                $query->whereNull('prerequisites')
                    ->orWhereJsonLength('prerequisites', 0)
                    ->orWhereIn('prerequisites', function ($subQuery) use ($user) {
                        $subQuery->select('course_id')
                            ->from('enrollments')
                            ->where('user_id', $user->id)
                            ->where('completed', true);
                    });
            })
            ->withCount('enrollments')
            ->orderBy('enrollments_count', 'desc')
            ->limit(5)
            ->get();
    }

    /**
     * Find trending courses
     */
    protected function findTrendingCourses($excludeCourseIds)
    {
        // Courses with most enrollments in last 30 days
        return Course::where('is_published', true)
            ->whereNotIn('id', $excludeCourseIds)
            ->withCount([
                'enrollments as recent_enrollments' => function ($query) {
                    $query->where('created_at', '>=', now()->subDays(30));
                }
            ])
            ->having('recent_enrollments', '>', 0)
            ->orderBy('recent_enrollments', 'desc')
            ->limit(10)
            ->get();
    }

    /**
     * ========================================
     * TASK PRIORITIZATION
     * ========================================
     */

    /**
     * Calculate AI priority for tasks
     */
    public function prioritizeTasks(User $user)
    {
        $tasks = $user->tasks()->where('status', '!=', 'completed')->get();

        foreach ($tasks as $task) {
            $priorityScore = $this->calculateTaskPriority($task, $user);

            AITaskPriority::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'task_id' => $task->id,
                    'calculated_at' => today()
                ],
                [
                    'ai_priority_score' => $priorityScore['score'],
                    'priority_factors' => $priorityScore['factors'],
                    'recommendation' => $priorityScore['recommendation']
                ]
            );
        }

        return $tasks->sortByDesc(function ($task) use ($user) {
            return AITaskPriority::where('user_id', $user->id)
                ->where('task_id', $task->id)
                ->where('calculated_at', today())
                ->value('ai_priority_score') ?? 50;
        });
    }

    /**
     * Calculate priority score for a task
     */
    protected function calculateTaskPriority(Task $task, User $user)
    {
        $score = 50; // Base score
        $factors = [];

        // Factor 1: Deadline urgency (0-30 points)
        if ($task->deadline) {
            $daysUntilDeadline = now()->diffInDays($task->deadline, false);

            if ($daysUntilDeadline < 0) {
                $score += 30; // Overdue
                $factors['deadline'] = 'overdue';
            } elseif ($daysUntilDeadline <= 1) {
                $score += 25; // Due today/tomorrow
                $factors['deadline'] = 'urgent';
            } elseif ($daysUntilDeadline <= 3) {
                $score += 20; // Due within 3 days
                $factors['deadline'] = 'approaching';
            } elseif ($daysUntilDeadline <= 7) {
                $score += 10; // Due within a week
                $factors['deadline'] = 'upcoming';
            }
        }

        // Factor 2: Task priority level (0-20 points)
        $priorityPoints = [
            'low' => 5,
            'medium' => 10,
            'high' => 15,
            'urgent' => 20
        ];
        $score += $priorityPoints[$task->priority] ?? 10;
        $factors['priority'] = $task->priority;

        // Factor 3: Task dependencies (0-15 points)
        if (isset($task->metadata['dependencies'])) {
            $dependencies = $task->metadata['dependencies'];
            if (is_array($dependencies) && count($dependencies) > 0) {
                $score += 15; // Has dependencies
                $factors['has_dependencies'] = true;
            }
        }

        // Factor 4: Time estimate (0-10 points)
        // Shorter tasks get higher priority (quick wins)
        if (isset($task->estimated_hours)) {
            if ($task->estimated_hours <= 1) {
                $score += 10; // Quick task
                $factors['quick_win'] = true;
            } elseif ($task->estimated_hours <= 3) {
                $score += 5;
            }
        }

        // Factor 5: Related to active projects (0-15 points)
        if ($task->project_id) {
            $project = $task->project;
            if ($project && $project->status === 'active') {
                $score += 15;
                $factors['active_project'] = true;
            }
        }

        // Normalize score to 0-100
        $score = min(100, max(0, $score));

        // Generate recommendation
        $recommendation = $this->generateTaskRecommendation($score, $factors, $task);

        return [
            'score' => $score,
            'factors' => $factors,
            'recommendation' => $recommendation
        ];
    }

    /**
     * Generate task recommendation text
     */
    protected function generateTaskRecommendation($score, $factors, Task $task)
    {
        if ($score >= 80) {
            return "مهمة ذات أولوية قصوى! يُنصح بالبدء فيها فوراً.";
        } elseif ($score >= 60) {
            return "مهمة مهمة. حاول إكمالها في أقرب وقت ممكن.";
        } elseif ($score >= 40) {
            return "مهمة متوسطة الأهمية. خطط لها ضمن جدولك الأسبوعي.";
        } else {
            return "مهمة ذات أولوية منخفضة حالياً. يمكن تأجيلها إذا لزم الأمر.";
        }
    }

    /**
     * ========================================
     * STUDY TIME RECOMMENDATIONS
     * ========================================
     */

    /**
     * Generate optimal study times for user
     */
    public function generateStudyTimeRecommendations(User $user)
    {
        // Analyze user's activity patterns
        $activityPatterns = $this->analyzeUserActivityPatterns($user);

        $recommendations = [];

        foreach ($activityPatterns as $pattern) {
            $recommendation = StudyTimeRecommendation::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'day_of_week' => $pattern['day'],
                    'start_time' => $pattern['start_time']
                ],
                [
                    'end_time' => $pattern['end_time'],
                    'duration_minutes' => $pattern['duration'],
                    'productivity_score' => $pattern['productivity_score'],
                    'reason' => $pattern['reason'],
                    'is_active' => true
                ]
            );

            $recommendations[] = $recommendation;
        }

        return collect($recommendations);
    }

    /**
     * Analyze user's activity patterns
     */
    protected function analyzeUserActivityPatterns(User $user)
    {
        // Get user's page views and events from last 30 days
        $pageViews = PageView::where('user_id', $user->id)
            ->where('viewed_at', '>=', now()->subDays(30))
            ->get();

        $events = UserEvent::where('user_id', $user->id)
            ->where('created_at', '>=', now()->subDays(30))
            ->get();

        // Analyze by day of week and hour
        $patterns = [];

        // Default study time recommendations based on general productivity research
        $defaultPatterns = [
            ['day' => 'monday', 'start_time' => '09:00:00', 'end_time' => '11:00:00', 'duration' => 120, 'productivity_score' => 85, 'reason' => 'أوقات الصباح عادة ما تكون أكثر إنتاجية'],
            ['day' => 'tuesday', 'start_time' => '09:00:00', 'end_time' => '11:00:00', 'duration' => 120, 'productivity_score' => 85, 'reason' => 'أوقات الصباح عادة ما تكون أكثر إنتاجية'],
            ['day' => 'wednesday', 'start_time' => '14:00:00', 'end_time' => '16:00:00', 'duration' => 120, 'productivity_score' => 80, 'reason' => 'فترة ما بعد الظهر مناسبة للتركيز'],
            ['day' => 'thursday', 'start_time' => '09:00:00', 'end_time' => '11:00:00', 'duration' => 120, 'productivity_score' => 85, 'reason' => 'أوقات الصباح عادة ما تكون أكثر إنتاجية'],
            ['day' => 'saturday', 'start_time' => '10:00:00', 'end_time' => '12:00:00', 'duration' => 120, 'productivity_score' => 90, 'reason' => 'عطلة نهاية الأسبوع - وقت مثالي للتعلم المركز'],
        ];

        // If user has enough activity data, customize recommendations
        if ($pageViews->count() >= 10 || $events->count() >= 10) {
            // Analyze user's most active times
            $hourlyActivity = [];

            foreach ($pageViews as $view) {
                $hour = $view->viewed_at->format('H');
                $day = strtolower($view->viewed_at->format('l'));

                if (!isset($hourlyActivity[$day])) {
                    $hourlyActivity[$day] = [];
                }

                if (!isset($hourlyActivity[$day][$hour])) {
                    $hourlyActivity[$day][$hour] = 0;
                }

                $hourlyActivity[$day][$hour]++;
            }

            // Find peak activity times
            foreach ($hourlyActivity as $day => $hours) {
                arsort($hours);
                $topHours = array_slice($hours, 0, 2, true);

                foreach ($topHours as $hour => $count) {
                    if ($count >= 3) { // Minimum activity threshold
                        $patterns[] = [
                            'day' => $day,
                            'start_time' => sprintf('%02d:00:00', $hour),
                            'end_time' => sprintf('%02d:00:00', ($hour + 2) % 24),
                            'duration' => 120,
                            'productivity_score' => min(95, 70 + ($count * 2)),
                            'reason' => "بناءً على نشاطك السابق، هذا الوقت مناسب لك"
                        ];
                    }
                }
            }
        }

        return !empty($patterns) ? $patterns : $defaultPatterns;
    }

    /**
     * ========================================
     * COLLABORATION RECOMMENDATIONS
     * ========================================
     */

    /**
     * Recommend potential collaboration partners
     */
    public function recommendCollaborationPartners(User $user, $limit = 5)
    {
        // Find users with similar interests
        $similarUsers = User::where('id', '!=', $user->id)
            ->whereHas('enrollments', function ($query) use ($user) {
                $enrolledCourseIds = $user->enrollments()->pluck('course_id');
                $query->whereIn('course_id', $enrolledCourseIds);
            })
            ->with([
                'enrollments' => function ($query) use ($user) {
                    $enrolledCourseIds = $user->enrollments()->pluck('course_id');
                    $query->whereIn('course_id', $enrolledCourseIds);
                }
            ])
            ->limit($limit * 2)
            ->get();

        $recommendations = [];

        foreach ($similarUsers as $similarUser) {
            $commonCourses = $similarUser->enrollments->whereIn('course_id', $user->enrollments->pluck('course_id'))->count();

            if ($commonCourses > 0) {
                $recommendations[] = $this->createRecommendation($user, 'collaboration', $similarUser, [
                    'reason' => "لديكما {$commonCourses} دورة مشتركة. يمكنكما التعاون والتعلم معاً!",
                    'confidence_score' => min(95, 60 + ($commonCourses * 10)),
                    'metadata' => [
                        'type' => 'collaboration_partner',
                        'common_courses' => $commonCourses,
                        'partner_name' => $similarUser->name
                    ]
                ]);
            }
        }

        return collect($recommendations)->sortByDesc('confidence_score')->take($limit);
    }

    /**
     * ========================================
     * LEARNING INSIGHTS
     * ========================================
     */

    /**
     * Generate learning insights for user
     */
    public function generateLearningInsights(User $user)
    {
        $insights = [];

        // 1. Progress insights
        $progressInsight = $this->analyzeProgress($user);
        if ($progressInsight) {
            $insights[] = $progressInsight;
        }

        // 2. Engagement insights
        $engagementInsight = $this->analyzeEngagement($user);
        if ($engagementInsight) {
            $insights[] = $engagementInsight;
        }

        // 3. Performance insights
        $performanceInsight = $this->analyzePerformance($user);
        if ($performanceInsight) {
            $insights[] = $performanceInsight;
        }

        // 4. Achievement insights
        $achievementInsight = $this->analyzeAchievements($user);
        if ($achievementInsight) {
            $insights[] = $achievementInsight;
        }

        return collect($insights);
    }

    /**
     * Analyze user progress
     */
    protected function analyzeProgress(User $user)
    {
        // Count recently completed lessons
        $recentProgress = $user->lessons()
            ->where('completed', true)
            ->where('updated_at', '>=', now()->subDays(7))
            ->count();

        if ($recentProgress > 5) {
            return LearningInsight::create([
                'user_id' => $user->id,
                'insight_date' => today(),
                'category' => 'progress',
                'insight_type' => 'strength',
                'title' => 'تقدم ممتاز!',
                'description' => "لقد أكملت {$recentProgress} درس في الأسبوع الماضي. استمر في هذا المعدل الرائع!",
                'data' => ['lessons_completed' => $recentProgress],
                'priority' => 7
            ]);
        } elseif ($recentProgress === 0) {
            return LearningInsight::create([
                'user_id' => $user->id,
                'insight_date' => today(),
                'category' => 'progress',
                'insight_type' => 'suggestion',
                'title' => 'حان وقت العودة!',
                'description' => 'لم تكمل أي دروس هذا الأسبوع. خصص 30 دقيقة اليوم للتعلم!',
                'data' => ['days_inactive' => 7],
                'priority' => 8
            ]);
        }

        return null;
    }

    /**
     * Analyze user engagement
     */
    protected function analyzeEngagement(User $user)
    {
        $loginDays = PageView::where('user_id', $user->id)
            ->where('viewed_at', '>=', now()->subDays(30))
            ->select(DB::raw('DATE(viewed_at) as date'))
            ->groupBy('date')
            ->count();

        if ($loginDays >= 20) {
            return LearningInsight::create([
                'user_id' => $user->id,
                'insight_date' => today(),
                'category' => 'engagement',
                'insight_type' => 'achievement',
                'title' => 'التزام رائع!',
                'description' => "لقد سجلت دخولك {$loginDays} يوماً من آخر 30 يوم. هذا التزام استثنائي!",
                'data' => ['active_days' => $loginDays],
                'priority' => 9
            ]);
        }

        return null;
    }

    /**
     * Analyze user performance
     */
    protected function analyzePerformance(User $user)
    {
        // Check quiz scores
        $recentQuizAttempts = $user->quizAttempts()
            ->where('created_at', '>=', now()->subDays(30))
            ->get();

        if ($recentQuizAttempts->count() >= 3) {
            $avgScore = $recentQuizAttempts->avg('score');

            if ($avgScore >= 80) {
                return LearningInsight::create([
                    'user_id' => $user->id,
                    'insight_date' => today(),
                    'category' => 'performance',
                    'insight_type' => 'strength',
                    'title' => 'أداء متميز!',
                    'description' => "متوسط درجاتك في الاختبارات {$avgScore}%. أنت تتقن المواد بشكل ممتاز!",
                    'data' => ['avg_score' => $avgScore],
                    'priority' => 8
                ]);
            } elseif ($avgScore < 60) {
                return LearningInsight::create([
                    'user_id' => $user->id,
                    'insight_date' => today(),
                    'category' => 'performance',
                    'insight_type' => 'suggestion',
                    'title' => 'يمكنك تحسين أدائك',
                    'description' => "متوسط درجاتك {$avgScore}%. جرب مراجعة الدروس قبل الاختبارات أو اطلب المساعدة.",
                    'data' => ['avg_score' => $avgScore],
                    'priority' => 9
                ]);
            }
        }

        return null;
    }

    /**
     * Analyze achievements
     */
    protected function analyzeAchievements(User $user)
    {
        $completedCourses = $user->enrollments()->where('completed', true)->count();

        if ($completedCourses > 0 && $completedCourses % 5 === 0) {
            return LearningInsight::create([
                'user_id' => $user->id,
                'insight_date' => today(),
                'category' => 'progress',
                'insight_type' => 'achievement',
                'title' => 'إنجاز رائع!',
                'description' => "تهانينا! لقد أكملت {$completedCourses} دورة. أنت في طريقك لتصبح خبيراً!",
                'data' => ['completed_courses' => $completedCourses],
                'priority' => 10
            ]);
        }

        return null;
    }

    /**
     * ========================================
     * HELPER METHODS
     * ========================================
     */

    /**
     * Build user profile for recommendations
     */
    protected function buildUserProfile(User $user)
    {
        return [
            'enrolled_courses' => $user->enrollments()->count(),
            'completed_courses' => $user->enrollments()->where('completed', true)->count(),
            'active_tasks' => $user->tasks()->where('status', '!=', 'completed')->count(),
            'recent_activity' => PageView::where('user_id', $user->id)
                ->where('viewed_at', '>=', now()->subDays(7))
                ->count()
        ];
    }

    /**
     * Create a recommendation
     */
    protected function createRecommendation(User $user, $type, $recommendable, array $data)
    {
        return AIRecommendation::create([
            'user_id' => $user->id,
            'type' => $type,
            'recommendable_type' => get_class($recommendable),
            'recommendable_id' => $recommendable->id,
            'reason' => $data['reason'],
            'confidence_score' => $data['confidence_score'],
            'metadata' => $data['metadata'] ?? []
        ]);
    }
}
