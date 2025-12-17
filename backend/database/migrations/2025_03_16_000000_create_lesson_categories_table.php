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
        Schema::create('lesson_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            // Add unique constraint for category name within a course
            $table->unique(['name', 'course_id']);
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('lesson_category_id')->nullable()->constrained()->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropForeign(['lesson_category_id']);
            $table->dropColumn('lesson_category_id');
        });

        Schema::dropIfExists('lesson_categories');
    }
};
