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
        // Course Reviews
        Schema::create('course_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('rating')->unsigned(); // 1-5
            $table->text('review')->nullable();
            $table->boolean('is_approved')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->integer('helpful_count')->default(0);
            $table->integer('not_helpful_count')->default(0);
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            // User can only review a course once
            $table->unique(['course_id', 'user_id']);
            $table->index(['course_id', 'is_approved']);
            $table->index(['user_id', 'created_at']);
        });

        // Review Helpfulness Tracking
        Schema::create('review_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->constrained('course_reviews')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('vote_type', ['helpful', 'not_helpful']);
            $table->timestamps();

            $table->unique(['review_id', 'user_id']);
            $table->index(['review_id', 'vote_type']);
        });

        // Lesson Comments
        Schema::create('lesson_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('parent_id')->nullable()->constrained('lesson_comments')->onDelete('cascade');
            $table->text('comment');
            $table->integer('likes_count')->default(0);
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_instructor_reply')->default(false);
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['lesson_id', 'parent_id']);
            $table->index(['user_id', 'created_at']);
            $table->index(['lesson_id', 'is_pinned']);
        });

        // Comment Likes
        Schema::create('comment_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained('lesson_comments')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['comment_id', 'user_id']);
        });

        // Task Comments
        Schema::create('task_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('comment');
            $table->json('attachments')->nullable(); // Array of file URLs
            $table->json('mentions')->nullable(); // Array of mentioned user IDs
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['task_id', 'created_at']);
            $table->index('user_id');
        });

        // Project Comments
        Schema::create('project_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('comment');
            $table->json('attachments')->nullable();
            $table->json('mentions')->nullable();
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'created_at']);
            $table->index('user_id');
        });

        // Content Reports (Moderation)
        Schema::create('content_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reported_by')->constrained('users')->onDelete('cascade');
            $table->string('reportable_type'); // Polymorphic
            $table->unsignedBigInteger('reportable_id');
            $table->string('reason'); // spam, inappropriate, offensive, other
            $table->text('details')->nullable();
            $table->enum('status', ['pending', 'reviewing', 'resolved', 'dismissed'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('resolution_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['reportable_type', 'reportable_id']);
            $table->index(['status', 'created_at']);
            $table->index('reported_by');
        });

        // Rating Summary Cache (for performance)
        Schema::create('course_rating_summary', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->unique()->constrained()->onDelete('cascade');
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->integer('total_reviews')->default(0);
            $table->integer('five_star_count')->default(0);
            $table->integer('four_star_count')->default(0);
            $table->integer('three_star_count')->default(0);
            $table->integer('two_star_count')->default(0);
            $table->integer('one_star_count')->default(0);
            $table->timestamp('last_updated')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_rating_summary');
        Schema::dropIfExists('content_reports');
        Schema::dropIfExists('project_comments');
        Schema::dropIfExists('task_comments');
        Schema::dropIfExists('comment_likes');
        Schema::dropIfExists('lesson_comments');
        Schema::dropIfExists('review_votes');
        Schema::dropIfExists('course_reviews');
    }
};
