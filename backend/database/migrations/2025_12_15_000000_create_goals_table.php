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
        Schema::create('goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('team_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['personal', 'team'])->default('personal');
            $table->enum('category', ['tasks', 'projects', 'courses', 'learning', 'productivity', 'custom'])->default('custom');

            // Target metrics
            $table->string('metric_type'); // e.g., 'tasks_completed', 'hours_worked', 'courses_completed'
            $table->integer('target_value'); // e.g., 100 tasks, 40 hours, 5 courses
            $table->integer('current_value')->default(0);

            // Dates
            $table->date('start_date');
            $table->date('end_date');

            // Status
            $table->enum('status', ['active', 'completed', 'failed', 'cancelled'])->default('active');
            $table->timestamp('completed_at')->nullable();

            // Rewards
            $table->integer('reward_points')->default(0);
            $table->string('reward_badge')->nullable();
            $table->text('reward_description')->nullable();

            // Reminders
            $table->boolean('reminders_enabled')->default(true);
            $table->enum('reminder_frequency', ['daily', 'weekly', 'milestone'])->default('weekly');
            $table->timestamp('last_reminder_at')->nullable();

            // Milestones (JSON)
            $table->json('milestones')->nullable(); // [25%, 50%, 75%, 100%]

            // Visibility
            $table->enum('visibility', ['private', 'team', 'public'])->default('private');

            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index('team_id');
            $table->index('type');
            $table->index('status');
            $table->index('start_date');
            $table->index('end_date');
        });

        Schema::create('goal_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goal_id')->constrained()->onDelete('cascade');
            $table->integer('value');
            $table->text('note')->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index('goal_id');
            $table->index('recorded_at');
        });

        Schema::create('goal_collaborators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goal_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('contribution')->default(0); // Contribution value
            $table->timestamps();

            $table->unique(['goal_id', 'user_id']);
            $table->index('goal_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goal_collaborators');
        Schema::dropIfExists('goal_progress');
        Schema::dropIfExists('goals');
    }
};
