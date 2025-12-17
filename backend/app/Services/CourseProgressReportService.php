<?php

namespace App\Services;

use App\Models\User;
use App\Models\Course;
use App\Models\CourseEnrollment;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CourseProgressReportService
{
    protected $cacheService;

    public function __construct(CacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * Generate Course Progress Report
     */
    public function generateCourseProgressReport(User $user, $startDate = null, $endDate = null)
    {
        $startDate = $startDate ?? Carbon::now()->subMonths(3);
        $endDate = $endDate ?? Carbon::now();

        $cacheKey = "course_progress_report:{$user->id}:{$startDate}:{$endDate}";

        return $this->cacheService->remember($cacheKey, CacheService::CACHE_MEDIUM, function () use ($user, $startDate, $endDate) {
            // Get user enrollments
            $enrollments = CourseEnrollment::where('user_id', $user->id)
                ->with(['course', 'course.lessons'])
                ->whereBetween('enrolled_at', [$startDate, $endDate])
                ->get();

            $completedCourses = $enrollments->where('completed', true);

            return [
                'summary' => [
                    'total_courses' => $enrollments->count(),
                    'completed_courses' => $completedCourses->count(),
                    'in_progress_courses' => $enrollments->where('completed', false)->count(),
                    'completion_rate' => $enrollments->count() > 0
                        ? round(($completedCourses->count() / $enrollments->count()) * 100, 2)
                        : 0,
                    'total_lessons_completed' => $this->getTotalLessonsCompleted($enrollments),
                    'total_time_spent' => $this->getTotalTimeSpent($enrollments),
                    'average_progress' => $this->getAverageProgress($enrollments),
                    'period' => [
                        'start' => $startDate,
                        'end' => $endDate
                    ]
                ],
                'course_breakdown' => $this->getCourseBreakdown($enrollments),
                'learning_velocity' => $this->getLearningVelocity($user, $startDate, $endDate),
                'category_distribution' => $this->getCategoryDistribution($enrollments),
                'upcoming_completions' => $this->getUpcomingCompletions($enrollments),
                'learning_streak' => $this->getLearningStreak($user),
                'recommendations' => $this->getRecommendations($enrollments, $user)
            ];
        });
    }

    /**
     * Get total lessons completed
     */
    protected function getTotalLessonsCompleted($enrollments)
    {
        $total = 0;

        foreach ($enrollments as $enrollment) {
            if ($enrollment->progress) {
                $progress = json_decode($enrollment->progress, true);
                $total += count($progress['completed_lessons'] ?? []);
            }
        }

        return $total;
    }

    /**
     * Get total time spent learning
     */
    protected function getTotalTimeSpent($enrollments)
    {
        $totalMinutes = 0;

        foreach ($enrollments as $enrollment) {
            if ($enrollment->time_spent) {
                $totalMinutes += $enrollment->time_spent;
            }
        }

        return [
            'minutes' => $totalMinutes,
            'hours' => round($totalMinutes / 60, 2),
            'days' => round($totalMinutes / 1440, 2),
            'formatted' => $this->formatMinutes($totalMinutes)
        ];
    }

    /**
     * Get average progress across all courses
     */
    protected function getAverageProgress($enrollments)
    {
        if ($enrollments->isEmpty()) {
            return 0;
        }

        $totalProgress = 0;

        foreach ($enrollments as $enrollment) {
            $totalProgress += $enrollment->progress_percentage ?? 0;
        }

        return round($totalProgress / $enrollments->count(), 2);
    }

    /**
     * Get detailed breakdown for each course
     */
    protected function getCourseBreakdown($enrollments)
    {
        return $enrollments->map(function ($enrollment) {
            $course = $enrollment->course;
            $totalLessons = $course->lessons->count();

            $progress = json_decode($enrollment->progress, true) ?? [];
            $completedLessons = count($progress['completed_lessons'] ?? []);

            $progressPercentage = $totalLessons > 0
                ? round(($completedLessons / $totalLessons) * 100, 2)
                : 0;

            return [
                'course_id' => $course->id,
                'title' => $course->title,
                'description' => $course->description,
                'image' => $course->image,
                'category' => $course->category->name ?? null,
                'instructor' => $course->user->name,
                'enrollment_date' => $enrollment->enrolled_at,
                'completion_status' => $enrollment->completed ? 'completed' : 'in_progress',
                'completed_at' => $enrollment->completed_at,
                'progress' => [
                    'percentage' => $progressPercentage,
                    'completed_lessons' => $completedLessons,
                    'total_lessons' => $totalLessons,
                    'remaining_lessons' => $totalLessons - $completedLessons
                ],
                'time_spent' => [
                    'minutes' => $enrollment->time_spent ?? 0,
                    'hours' => round(($enrollment->time_spent ?? 0) / 60, 2)
                ],
                'estimated_completion' => $this->estimateCompletion($enrollment, $progressPercentage),
                'status' => $this->getCourseStatus($enrollment, $progressPercentage)
            ];
        })->sortByDesc('progress.percentage')->values();
    }

    /**
     * Get learning velocity (lessons completed per week)
     */
    protected function getLearningVelocity(User $user, $startDate, $endDate)
    {
        // This would require a lessons_completed tracking table
        // For now, we'll use a simplified version

        $enrollments = CourseEnrollment::where('user_id', $user->id)
            ->whereBetween('enrolled_at', [$startDate, $endDate])
            ->get();

        $weeks = Carbon::parse($startDate)->diffInWeeks($endDate) + 1;
        $totalLessons = $this->getTotalLessonsCompleted($enrollments);

        $avgPerWeek = $weeks > 0 ? round($totalLessons / $weeks, 2) : 0;

        return [
            'total_lessons' => $totalLessons,
            'total_weeks' => $weeks,
            'lessons_per_week' => $avgPerWeek,
            'lessons_per_day' => round($avgPerWeek / 7, 2),
            'trend' => $this->getVelocityTrend($user, $startDate, $endDate)
        ];
    }

    /**
     * Get category distribution
     */
    protected function getCategoryDistribution($enrollments)
    {
        $distribution = [];

        foreach ($enrollments as $enrollment) {
            $category = $enrollment->course->category->name ?? 'Uncategorized';

            if (!isset($distribution[$category])) {
                $distribution[$category] = [
                    'name' => $category,
                    'count' => 0,
                    'completed' => 0,
                    'in_progress' => 0
                ];
            }

            $distribution[$category]['count']++;

            if ($enrollment->completed) {
                $distribution[$category]['completed']++;
            } else {
                $distribution[$category]['in_progress']++;
            }
        }

        // Calculate percentages
        $total = $enrollments->count();

        foreach ($distribution as &$category) {
            $category['percentage'] = $total > 0
                ? round(($category['count'] / $total) * 100, 2)
                : 0;
        }

        return array_values($distribution);
    }

    /**
     * Get courses close to completion
     */
    protected function getUpcomingCompletions($enrollments)
    {
        return $enrollments
            ->filter(function ($enrollment) {
                if ($enrollment->completed) {
                    return false;
                }

                $progress = json_decode($enrollment->progress, true) ?? [];
                $completedLessons = count($progress['completed_lessons'] ?? []);
                $totalLessons = $enrollment->course->lessons->count();

                $progressPercentage = $totalLessons > 0
                    ? ($completedLessons / $totalLessons) * 100
                    : 0;

                return $progressPercentage >= 70; // 70% or more
            })
            ->map(function ($enrollment) {
                $course = $enrollment->course;
                $totalLessons = $course->lessons->count();

                $progress = json_decode($enrollment->progress, true) ?? [];
                $completedLessons = count($progress['completed_lessons'] ?? []);

                $progressPercentage = $totalLessons > 0
                    ? round(($completedLessons / $totalLessons) * 100, 2)
                    : 0;

                return [
                    'course_id' => $course->id,
                    'title' => $course->title,
                    'progress_percentage' => $progressPercentage,
                    'remaining_lessons' => $totalLessons - $completedLessons,
                    'estimated_completion' => $this->estimateCompletion($enrollment, $progressPercentage)
                ];
            })
            ->sortByDesc('progress_percentage')
            ->values();
    }

    /**
     * Get learning streak
     */
    protected function getLearningStreak(User $user)
    {
        // This would require daily activity tracking
        // Simplified version for now

        $streak = 0;
        $currentDate = now();

        // Check last 365 days
        for ($i = 0; $i < 365; $i++) {
            $hasActivity = CourseEnrollment::where('user_id', $user->id)
                ->whereDate('last_accessed_at', $currentDate)
                ->exists();

            if (!$hasActivity) {
                break;
            }

            $streak++;
            $currentDate = $currentDate->subDay();
        }

        return [
            'current_streak' => $streak,
            'status' => $this->getStreakStatus($streak),
            'motivation' => $this->getStreakMotivation($streak)
        ];
    }

    /**
     * Get course recommendations
     */
    protected function getRecommendations($enrollments, $user)
    {
        $recommendations = [];

        // Recommend completing near-finished courses
        $nearComplete = $enrollments->filter(function ($enrollment) {
            if ($enrollment->completed) {
                return false;
            }

            $progress = json_decode($enrollment->progress, true) ?? [];
            $completedLessons = count($progress['completed_lessons'] ?? []);
            $totalLessons = $enrollment->course->lessons->count();

            $progressPercentage = $totalLessons > 0
                ? ($completedLessons / $totalLessons) * 100
                : 0;

            return $progressPercentage >= 70 && $progressPercentage < 100;
        });

        if ($nearComplete->isNotEmpty()) {
            $recommendations[] = [
                'type' => 'complete_course',
                'priority' => 'high',
                'title' => 'أكمل دوراتك القريبة من الإنجاز',
                'description' => 'لديك ' . $nearComplete->count() . ' دورة قريبة من الإنجاز',
                'courses' => $nearComplete->pluck('course.title')->toArray()
            ];
        }

        // Recommend stalled courses
        $stalled = $enrollments->filter(function ($enrollment) {
            if ($enrollment->completed) {
                return false;
            }

            $lastAccessed = $enrollment->last_accessed_at;
            return $lastAccessed && Carbon::parse($lastAccessed)->diffInDays(now()) > 14;
        });

        if ($stalled->isNotEmpty()) {
            $recommendations[] = [
                'type' => 'resume_learning',
                'priority' => 'medium',
                'title' => 'استأنف تعلمك',
                'description' => 'لديك ' . $stalled->count() . ' دورة لم تصل إليها منذ أسبوعين',
                'courses' => $stalled->pluck('course.title')->toArray()
            ];
        }

        // Recommend new courses based on completed ones
        if ($enrollments->where('completed', true)->isNotEmpty()) {
            $categories = $enrollments->where('completed', true)
                ->pluck('course.category.name')
                ->unique()
                ->toArray();

            $recommendations[] = [
                'type' => 'explore_similar',
                'priority' => 'low',
                'title' => 'استكشف دورات مشابهة',
                'description' => 'بناءً على الدورات التي أكملتها في: ' . implode(', ', $categories),
                'categories' => $categories
            ];
        }

        return $recommendations;
    }

    /**
     * Estimate completion date
     */
    protected function estimateCompletion($enrollment, $progressPercentage)
    {
        if ($enrollment->completed) {
            return null;
        }

        if ($progressPercentage === 0) {
            return 'غير محدد';
        }

        $enrolledDate = Carbon::parse($enrollment->enrolled_at);
        $daysElapsed = $enrolledDate->diffInDays(now());

        if ($daysElapsed === 0) {
            return 'غير محدد';
        }

        $progressRate = $progressPercentage / $daysElapsed; // % per day
        $remainingProgress = 100 - $progressPercentage;
        $daysToComplete = round($remainingProgress / $progressRate);

        $estimatedDate = now()->addDays($daysToComplete);

        return [
            'days' => $daysToComplete,
            'date' => $estimatedDate->format('Y-m-d'),
            'formatted' => $estimatedDate->format('d M Y')
        ];
    }

    /**
     * Get course status
     */
    protected function getCourseStatus($enrollment, $progressPercentage)
    {
        if ($enrollment->completed) {
            return 'completed';
        }

        if ($progressPercentage === 0) {
            return 'not_started';
        }

        if ($progressPercentage < 30) {
            return 'just_started';
        }

        if ($progressPercentage < 70) {
            return 'in_progress';
        }

        return 'near_completion';
    }

    /**
     * Get velocity trend
     */
    protected function getVelocityTrend(User $user, $startDate, $endDate)
    {
        // Simplified: compare first half vs second half
        $midpoint = Carbon::parse($startDate)->addDays(
            Carbon::parse($startDate)->diffInDays($endDate) / 2
        );

        $firstHalf = CourseEnrollment::where('user_id', $user->id)
            ->whereBetween('enrolled_at', [$startDate, $midpoint])
            ->count();

        $secondHalf = CourseEnrollment::where('user_id', $user->id)
            ->whereBetween('enrolled_at', [$midpoint, $endDate])
            ->count();

        if ($secondHalf > $firstHalf * 1.2) {
            return 'increasing';
        } elseif ($secondHalf < $firstHalf * 0.8) {
            return 'decreasing';
        } else {
            return 'stable';
        }
    }

    /**
     * Get streak status
     */
    protected function getStreakStatus($streak)
    {
        if ($streak === 0) {
            return 'inactive';
        } elseif ($streak < 7) {
            return 'building';
        } elseif ($streak < 30) {
            return 'good';
        } elseif ($streak < 90) {
            return 'excellent';
        } else {
            return 'legendary';
        }
    }

    /**
     * Get streak motivation message
     */
    protected function getStreakMotivation($streak)
    {
        if ($streak === 0) {
            return 'ابدأ رحلة تعلمك اليوم!';
        } elseif ($streak < 7) {
            return 'استمر! أنت في طريقك لبناء عادة رائعة';
        } elseif ($streak < 30) {
            return 'رائع! حافظ على هذا الزخم';
        } elseif ($streak < 90) {
            return 'ممتاز! أنت ملتزم جداً بالتعلم';
        } else {
            return 'أسطوري! أنت مصدر إلهام للجميع';
        }
    }

    /**
     * Format minutes
     */
    protected function formatMinutes($minutes)
    {
        if ($minutes < 60) {
            return round($minutes) . ' دقيقة';
        } elseif ($minutes < 1440) {
            $hours = floor($minutes / 60);
            $mins = $minutes % 60;
            return $hours . ' ساعة و ' . round($mins) . ' دقيقة';
        } else {
            $days = floor($minutes / 1440);
            $hours = floor(($minutes % 1440) / 60);
            return $days . ' يوم و ' . $hours . ' ساعة';
        }
    }
}
