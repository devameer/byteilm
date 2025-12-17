<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_usage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->integer('projects_count')->default(0);
            $table->integer('courses_count')->default(0);
            $table->bigInteger('storage_used_mb')->default(0);
            $table->integer('ai_requests_this_month')->default(0);
            $table->timestamp('last_reset_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_usage');
    }
};
