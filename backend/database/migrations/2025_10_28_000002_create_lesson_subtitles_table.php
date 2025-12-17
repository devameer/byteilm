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
        Schema::create('lesson_subtitles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_video_id')->constrained()->onDelete('cascade');
            $table->string('language', 10)->default('ar'); // ar, en, etc.
            $table->string('language_name')->default('Arabic'); // Full name
            $table->string('file_name');
            $table->string('file_path');
            $table->unsignedInteger('file_size'); // in bytes
            $table->timestamps();

            // Index for faster queries
            $table->index('lesson_video_id');
            $table->index(['lesson_video_id', 'language']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lesson_subtitles');
    }
};
