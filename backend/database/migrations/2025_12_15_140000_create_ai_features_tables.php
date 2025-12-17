<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // AI Chat Conversations
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title')->nullable();
            $table->string('context_type')->nullable(); // 'course', 'task', 'project', 'general'
            $table->foreignId('context_id')->nullable(); // ID of course/task/project
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
            $table->index(['context_type', 'context_id']);
        });

        // AI Chat Messages
        Schema::create('ai_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('ai_conversations')->onDelete('cascade');
            $table->enum('role', ['user', 'assistant', 'system']);
            $table->text('content');
            $table->json('metadata')->nullable(); // Attachments, actions, etc.
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
        });

        // AI Recommendations
        Schema::create('ai_recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // 'course', 'task', 'study_time', 'collaboration'
            $table->string('recommendable_type'); // Polymorphic type
            $table->unsignedBigInteger('recommendable_id'); // Polymorphic ID
            $table->text('reason')->nullable(); // AI explanation
            $table->decimal('confidence_score', 5, 2)->default(0); // 0-100
            $table->json('metadata')->nullable(); // Additional data
            $table->boolean('is_accepted')->nullable();
            $table->boolean('is_dismissed')->default(false);
            $table->timestamp('shown_at')->nullable();
            $table->timestamp('interacted_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'type', 'is_dismissed']);
            $table->index(['recommendable_type', 'recommendable_id']);
        });

        // Video Analysis Results
        Schema::create('video_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->foreignId('analyzed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');

            // Analysis Results
            $table->json('main_topics')->nullable(); // Key topics detected
            $table->json('chapters')->nullable(); // Auto-generated chapters with timestamps
            $table->json('keywords')->nullable(); // Extracted keywords
            $table->text('summary')->nullable(); // AI-generated summary
            $table->text('notes')->nullable(); // AI-generated notes
            $table->string('detected_language')->nullable(); // ar, en, mixed
            $table->json('transcript')->nullable(); // Full transcript if available

            // Metadata
            $table->integer('duration_seconds')->nullable();
            $table->string('video_url')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['lesson_id', 'status']);
            $table->index('status');
        });

        // Study Time Recommendations (AI-generated optimal study times)
        Schema::create('study_time_recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('day_of_week'); // monday, tuesday, etc.
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('duration_minutes');
            $table->decimal('productivity_score', 5, 2)->default(0); // Based on user history
            $table->text('reason')->nullable(); // AI explanation
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
        });

        // AI Learning Insights (User behavior analysis)
        Schema::create('learning_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('insight_date');
            $table->string('category'); // 'productivity', 'engagement', 'performance', 'progress'
            $table->string('insight_type'); // 'strength', 'weakness', 'suggestion', 'achievement'
            $table->text('title');
            $table->text('description');
            $table->json('data')->nullable(); // Supporting data/metrics
            $table->integer('priority')->default(5); // 1-10
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'insight_date', 'is_read']);
            $table->index(['category', 'insight_type']);
        });

        // AI Task Prioritization (Smart task ordering)
        Schema::create('ai_task_priorities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->integer('ai_priority_score')->default(50); // 0-100
            $table->json('priority_factors')->nullable(); // Urgency, importance, dependencies, etc.
            $table->text('recommendation')->nullable(); // AI suggestion
            $table->date('calculated_at');
            $table->timestamps();

            $table->unique(['user_id', 'task_id', 'calculated_at']);
            $table->index(['user_id', 'calculated_at']);
        });

        // AI Content Summaries (Cached summaries)
        Schema::create('ai_content_summaries', function (Blueprint $table) {
            $table->id();
            $table->string('summarizable_type'); // Polymorphic
            $table->unsignedBigInteger('summarizable_id');
            $table->enum('summary_type', ['brief', 'detailed', 'bullets'])->default('brief');
            $table->text('summary');
            $table->integer('word_count')->nullable();
            $table->string('language')->default('ar');
            $table->timestamps();

            $table->index(['summarizable_type', 'summarizable_id', 'summary_type'], 'ai_summaries_morph_type_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_content_summaries');
        Schema::dropIfExists('ai_task_priorities');
        Schema::dropIfExists('learning_insights');
        Schema::dropIfExists('study_time_recommendations');
        Schema::dropIfExists('video_analyses');
        Schema::dropIfExists('ai_recommendations');
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('ai_conversations');
    }
};
