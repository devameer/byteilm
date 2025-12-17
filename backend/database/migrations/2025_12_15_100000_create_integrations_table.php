<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('provider'); // google_calendar, slack, discord, trello, notion, github
            $table->string('name')->nullable(); // User-friendly name
            $table->boolean('active')->default(true);

            // OAuth tokens
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();

            // Provider-specific data (JSON)
            $table->json('settings')->nullable(); // Configuration settings
            $table->json('metadata')->nullable(); // Additional data

            // Sync settings
            $table->boolean('auto_sync')->default(false);
            $table->timestamp('last_synced_at')->nullable();
            $table->string('sync_frequency')->default('manual'); // manual, hourly, daily

            $table->timestamps();

            $table->unique(['user_id', 'provider']);
            $table->index('user_id');
            $table->index('provider');
            $table->index('active');
        });

        Schema::create('integration_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_id')->constrained()->onDelete('cascade');
            $table->string('action'); // sync, create, update, delete
            $table->string('status'); // success, failed, pending
            $table->text('message')->nullable();
            $table->json('data')->nullable();
            $table->timestamps();

            $table->index('integration_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_logs');
        Schema::dropIfExists('integrations');
    }
};
