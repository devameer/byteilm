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
        // User events tracking
        Schema::create('user_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('session_id')->index();
            $table->string('event_name')->index(); // page_view, button_click, form_submit, etc.
            $table->string('event_category')->index(); // navigation, engagement, conversion
            $table->json('event_data')->nullable(); // Additional event properties
            $table->string('page_url');
            $table->string('referrer')->nullable();
            $table->string('user_agent')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('device_type')->nullable(); // desktop, mobile, tablet
            $table->string('browser')->nullable();
            $table->string('os')->nullable();
            $table->integer('screen_width')->nullable();
            $table->integer('screen_height')->nullable();
            $table->timestamp('created_at')->index();

            $table->index(['event_name', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });

        // Page views with detailed tracking
        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('session_id')->index();
            $table->string('page_url')->index();
            $table->string('page_title')->nullable();
            $table->string('referrer')->nullable();
            $table->integer('time_on_page')->nullable(); // seconds
            $table->integer('scroll_depth')->nullable(); // percentage
            $table->boolean('bounced')->default(false);
            $table->string('exit_page')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('viewed_at')->index();

            $table->index(['page_url', 'viewed_at']);
            $table->index(['user_id', 'viewed_at']);
        });

        // Heatmap data (clicks, scrolls, mouse movements)
        Schema::create('heatmap_data', function (Blueprint $table) {
            $table->id();
            $table->string('page_url')->index();
            $table->enum('type', ['click', 'scroll', 'move'])->index();
            $table->integer('x_position')->nullable();
            $table->integer('y_position')->nullable();
            $table->integer('scroll_depth')->nullable(); // for scroll type
            $table->string('element_selector')->nullable(); // CSS selector
            $table->string('element_text')->nullable();
            $table->integer('viewport_width');
            $table->integer('viewport_height');
            $table->string('device_type')->index();
            $table->timestamp('created_at')->index();

            $table->index(['page_url', 'type', 'created_at']);
        });

        // Funnels definition
        Schema::create('funnels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('steps'); // Array of steps with URLs/events
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
        });

        // Funnel sessions tracking
        Schema::create('funnel_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('funnel_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('session_id')->index();
            $table->integer('current_step')->default(0);
            $table->integer('completed_steps')->default(0);
            $table->boolean('completed')->default(false);
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->integer('time_to_complete')->nullable(); // seconds
            $table->json('step_timestamps')->nullable();
            $table->timestamps();

            $table->index(['funnel_id', 'completed']);
            $table->index(['user_id', 'funnel_id']);
        });

        // A/B Testing experiments
        Schema::create('ab_experiments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('type'); // url_redirect, content_change, feature_flag
            $table->json('variants'); // Array of variant configs
            $table->integer('traffic_allocation')->default(100); // percentage
            $table->string('success_metric'); // event_name to track
            $table->enum('status', ['draft', 'running', 'paused', 'completed'])->default('draft');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('status');
        });

        // A/B Test assignments (which user got which variant)
        Schema::create('ab_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('experiment_id')->constrained('ab_experiments')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('session_id')->index();
            $table->string('variant_id'); // Which variant they got
            $table->timestamp('assigned_at');

            $table->unique(['experiment_id', 'user_id']);
            $table->index(['experiment_id', 'variant_id']);
        });

        // A/B Test conversions
        Schema::create('ab_conversions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('experiment_id')->constrained('ab_experiments')->onDelete('cascade');
            $table->foreignId('assignment_id')->constrained('ab_assignments')->onDelete('cascade');
            $table->string('variant_id');
            $table->string('metric_name'); // What converted
            $table->decimal('value', 10, 2)->nullable(); // Optional conversion value
            $table->timestamp('converted_at');

            $table->index(['experiment_id', 'variant_id']);
        });

        // User sessions
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('session_id')->unique();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration')->nullable(); // seconds
            $table->integer('page_views')->default(0);
            $table->integer('events_count')->default(0);
            $table->string('landing_page')->nullable();
            $table->string('exit_page')->nullable();
            $table->string('referrer')->nullable();
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->string('device_type')->nullable();
            $table->string('browser')->nullable();
            $table->string('os')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();

            $table->index(['user_id', 'started_at']);
            $table->index('started_at');
        });

        // Custom events definition
        Schema::create('custom_events', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('display_name');
            $table->text('description')->nullable();
            $table->string('category');
            $table->json('properties_schema')->nullable(); // Expected properties
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Aggregated daily metrics
        Schema::create('daily_metrics', function (Blueprint $table) {
            $table->id();
            $table->date('date')->index();
            $table->string('metric_type')->index(); // users, sessions, page_views, events
            $table->string('metric_name')->nullable()->index();
            $table->bigInteger('count')->default(0);
            $table->decimal('value', 15, 2)->nullable();
            $table->json('breakdown')->nullable(); // By device, browser, etc.
            $table->timestamps();

            $table->unique(['date', 'metric_type', 'metric_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_metrics');
        Schema::dropIfExists('custom_events');
        Schema::dropIfExists('user_sessions');
        Schema::dropIfExists('ab_conversions');
        Schema::dropIfExists('ab_assignments');
        Schema::dropIfExists('ab_experiments');
        Schema::dropIfExists('funnel_sessions');
        Schema::dropIfExists('funnels');
        Schema::dropIfExists('heatmap_data');
        Schema::dropIfExists('page_views');
        Schema::dropIfExists('user_events');
    }
};
