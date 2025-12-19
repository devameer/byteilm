<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_usage', function (Blueprint $table) {
            // AI Operation Tracking (detailed breakdown)
            $table->integer('quiz_generations_this_month')->default(0)->after('ai_requests_this_month');
            $table->integer('video_transcriptions_this_month')->default(0)->after('quiz_generations_this_month');
            $table->integer('video_analyses_this_month')->default(0)->after('video_transcriptions_this_month');
            $table->integer('ai_chat_messages_this_month')->default(0)->after('video_analyses_this_month');
            $table->integer('text_translations_this_month')->default(0)->after('ai_chat_messages_this_month');
            $table->integer('text_summarizations_this_month')->default(0)->after('text_translations_this_month');
            $table->integer('ai_recommendations_this_month')->default(0)->after('text_summarizations_this_month');
            $table->integer('learning_insights_this_month')->default(0)->after('ai_recommendations_this_month');

            // Video/Media Usage
            $table->integer('videos_uploaded_this_month')->default(0)->after('learning_insights_this_month');
            $table->integer('total_videos')->default(0)->after('videos_uploaded_this_month');

            // External API Usage (for cost tracking)
            $table->integer('assemblyai_requests_this_month')->default(0)->after('total_videos');
            $table->integer('gemini_api_calls_this_month')->default(0)->after('assemblyai_requests_this_month');

            // Total Usage (all-time)
            $table->bigInteger('total_ai_requests')->default(0)->after('gemini_api_calls_this_month');
            $table->bigInteger('total_quiz_generations')->default(0)->after('total_ai_requests');
            $table->bigInteger('total_transcriptions')->default(0)->after('total_quiz_generations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_usage', function (Blueprint $table) {
            $table->dropColumn([
                'quiz_generations_this_month',
                'video_transcriptions_this_month',
                'video_analyses_this_month',
                'ai_chat_messages_this_month',
                'text_translations_this_month',
                'text_summarizations_this_month',
                'ai_recommendations_this_month',
                'learning_insights_this_month',
                'videos_uploaded_this_month',
                'total_videos',
                'assemblyai_requests_this_month',
                'gemini_api_calls_this_month',
                'total_ai_requests',
                'total_quiz_generations',
                'total_transcriptions',
            ]);
        });
    }
};
