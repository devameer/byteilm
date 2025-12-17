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
        // Quizzes table
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('duration_minutes')->default(15); // Quiz duration
            $table->integer('passing_score')->default(70); // Percentage to pass
            $table->integer('max_attempts')->default(3); // Maximum attempts allowed
            $table->boolean('randomize_questions')->default(true);
            $table->boolean('show_correct_answers')->default(true); // After submission
            $table->boolean('is_active')->default(true);
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium');
            $table->json('metadata')->nullable(); // AI generation info, etc.
            $table->timestamps();
            $table->softDeletes();

            $table->index('lesson_id');
            $table->index('is_active');
        });

        // Quiz questions table
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['multiple_choice', 'true_false', 'fill_blank', 'short_answer']);
            $table->text('question');
            $table->json('options')->nullable(); // For multiple choice: ["option1", "option2", ...]
            $table->text('correct_answer'); // For multiple choice: index, for others: text
            $table->text('explanation')->nullable(); // Explain why this is correct
            $table->integer('points')->default(1);
            $table->integer('order')->default(0);
            $table->json('metadata')->nullable(); // Timestamp in video, AI confidence, etc.
            $table->timestamps();

            $table->index('quiz_id');
            $table->index('order');
        });

        // Quiz attempts table (student attempts)
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('attempt_number')->default(1);
            $table->enum('status', ['in_progress', 'completed', 'abandoned'])->default('in_progress');
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->integer('score')->nullable(); // Percentage score
            $table->integer('total_points')->nullable();
            $table->integer('earned_points')->nullable();
            $table->boolean('passed')->default(false);
            $table->integer('time_spent_seconds')->nullable();
            $table->json('answers')->nullable(); // User's answers
            $table->timestamps();

            $table->index('quiz_id');
            $table->index('user_id');
            $table->index(['user_id', 'quiz_id']);
            $table->index('status');
        });

        // Quiz answers table (individual question answers)
        Schema::create('quiz_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_attempt_id')->constrained()->onDelete('cascade');
            $table->foreignId('quiz_question_id')->constrained()->onDelete('cascade');
            $table->text('answer'); // User's answer
            $table->boolean('is_correct')->default(false);
            $table->integer('points_earned')->default(0);
            $table->integer('time_spent_seconds')->nullable();
            $table->timestamps();

            $table->index('quiz_attempt_id');
            $table->index('quiz_question_id');
        });

        // AI generation logs (track AI-generated quizzes)
        Schema::create('quiz_generation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->foreignId('quiz_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Who triggered generation
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->string('ai_model')->default('gemini-pro'); // Which AI model used
            $table->text('video_transcript')->nullable(); // Extracted transcript
            $table->integer('questions_generated')->default(0);
            $table->json('ai_response')->nullable(); // Raw AI response
            $table->text('error_message')->nullable();
            $table->integer('processing_time_seconds')->nullable();
            $table->timestamps();

            $table->index('lesson_id');
            $table->index('user_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_answers');
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('quiz_questions');
        Schema::dropIfExists('quiz_generation_logs');
        Schema::dropIfExists('quizzes');
    }
};
