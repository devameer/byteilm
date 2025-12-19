<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserUsage extends Model
{
    protected $table = 'user_usage';

    protected $fillable = [
        'user_id',
        'projects_count',
        'courses_count',
        'lessons_count',
        'storage_used_mb',
        'ai_requests_this_month',

        // Detailed AI Operation Tracking
        'quiz_generations_this_month',
        'video_transcriptions_this_month',
        'video_analyses_this_month',
        'ai_chat_messages_this_month',
        'text_translations_this_month',
        'text_summarizations_this_month',
        'ai_recommendations_this_month',
        'learning_insights_this_month',

        // Video/Media Usage
        'videos_uploaded_this_month',
        'total_videos',

        // External API Usage
        'assemblyai_requests_this_month',
        'gemini_api_calls_this_month',

        // Total Usage (all-time)
        'total_ai_requests',
        'total_quiz_generations',
        'total_transcriptions',

        'last_reset_at',
    ];

    protected $casts = [
        'last_reset_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Increment a specific usage counter
     */
    public function incrementUsage(string $type, int $amount = 1): void
    {
        $this->resetIfNeeded();

        // Map usage types to their columns
        $monthlyCounters = [
            'quiz_generation' => ['quiz_generations_this_month', 'total_quiz_generations', 'ai_requests_this_month', 'total_ai_requests', 'gemini_api_calls_this_month'],
            'video_transcription' => ['video_transcriptions_this_month', 'total_transcriptions', 'ai_requests_this_month', 'total_ai_requests', 'assemblyai_requests_this_month'],
            'video_transcription_gemini' => ['video_transcriptions_this_month', 'total_transcriptions', 'ai_requests_this_month', 'total_ai_requests', 'gemini_api_calls_this_month'],
            'video_analysis' => ['video_analyses_this_month', 'ai_requests_this_month', 'total_ai_requests', 'gemini_api_calls_this_month'],
            'ai_chat_message' => ['ai_chat_messages_this_month', 'ai_requests_this_month', 'total_ai_requests', 'gemini_api_calls_this_month'],
            'text_translation' => ['text_translations_this_month', 'ai_requests_this_month', 'total_ai_requests', 'gemini_api_calls_this_month'],
            'text_summarization' => ['text_summarizations_this_month', 'ai_requests_this_month', 'total_ai_requests', 'gemini_api_calls_this_month'],
            'ai_recommendation' => ['ai_recommendations_this_month', 'ai_requests_this_month', 'total_ai_requests'],
            'learning_insight' => ['learning_insights_this_month', 'ai_requests_this_month', 'total_ai_requests'],
            'video_upload' => ['videos_uploaded_this_month', 'total_videos'],
        ];

        if (isset($monthlyCounters[$type])) {
            foreach ($monthlyCounters[$type] as $column) {
                $this->increment($column, $amount);
            }
        }
    }

    /**
     * Reset monthly counters if it's a new month
     */
    public function resetIfNeeded(): void
    {
        $lastReset = $this->last_reset_at;
        $now = now();

        // If last reset was in a different month, reset monthly counters
        if (!$lastReset || $lastReset->month !== $now->month || $lastReset->year !== $now->year) {
            $this->update([
                'ai_requests_this_month' => 0,
                'quiz_generations_this_month' => 0,
                'video_transcriptions_this_month' => 0,
                'video_analyses_this_month' => 0,
                'ai_chat_messages_this_month' => 0,
                'text_translations_this_month' => 0,
                'text_summarizations_this_month' => 0,
                'ai_recommendations_this_month' => 0,
                'learning_insights_this_month' => 0,
                'videos_uploaded_this_month' => 0,
                'assemblyai_requests_this_month' => 0,
                'gemini_api_calls_this_month' => 0,
                'last_reset_at' => $now,
            ]);
        }
    }

    /**
     * Get usage percentage for a specific resource
     */
    public function getUsagePercentage(string $resource, int $limit): float
    {
        if ($limit === -1) {
            return 0; // Unlimited
        }

        $current = $this->$resource ?? 0;
        return $limit > 0 ? round(($current / $limit) * 100, 2) : 0;
    }

    /**
     * Check if a specific resource limit is reached
     */
    public function isLimitReached(string $resource, int $limit): bool
    {
        if ($limit === -1) {
            return false; // Unlimited
        }

        $current = $this->$resource ?? 0;
        return $current >= $limit;
    }

    /**
     * Get comprehensive usage statistics
     */
    public function getStats(): array
    {
        $this->resetIfNeeded();

        return [
            'projects' => [
                'current' => $this->projects_count,
                'label' => 'Projects',
            ],
            'courses' => [
                'current' => $this->courses_count,
                'label' => 'Courses',
            ],
            'storage' => [
                'current' => $this->storage_used_mb,
                'label' => 'Storage (MB)',
            ],
            'ai_requests' => [
                'current' => $this->ai_requests_this_month,
                'total' => $this->total_ai_requests,
                'label' => 'AI Requests (This Month)',
            ],
            'quiz_generations' => [
                'current' => $this->quiz_generations_this_month,
                'total' => $this->total_quiz_generations,
                'label' => 'Quiz Generations (This Month)',
            ],
            'video_transcriptions' => [
                'current' => $this->video_transcriptions_this_month,
                'total' => $this->total_transcriptions,
                'label' => 'Video Transcriptions (This Month)',
            ],
            'video_analyses' => [
                'current' => $this->video_analyses_this_month,
                'label' => 'Video Analyses (This Month)',
            ],
            'ai_chat_messages' => [
                'current' => $this->ai_chat_messages_this_month,
                'label' => 'AI Chat Messages (This Month)',
            ],
            'text_translations' => [
                'current' => $this->text_translations_this_month,
                'label' => 'Text Translations (This Month)',
            ],
            'text_summarizations' => [
                'current' => $this->text_summarizations_this_month,
                'label' => 'Text Summarizations (This Month)',
            ],
            'videos_uploaded' => [
                'current' => $this->videos_uploaded_this_month,
                'total' => $this->total_videos,
                'label' => 'Videos Uploaded (This Month)',
            ],
        ];
    }
}
