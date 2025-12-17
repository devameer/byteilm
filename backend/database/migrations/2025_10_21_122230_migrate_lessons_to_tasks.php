<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Migrate existing lessons to tasks table
     */
    public function up(): void
    {
        // Get all lessons
        $lessons = DB::table('lessons')->get();

        foreach ($lessons as $lesson) {
            // Insert as task with is_lesson flag
            DB::table('tasks')->insert([
                'title' => $lesson->name ?? 'درس بدون عنوان',
                'is_lesson' => true,
                'description' => $lesson->description,
                'course_id' => $lesson->course_id,
                'lesson_id' => $lesson->id, // Keep reference to original lesson
                'status' => $lesson->completed ? 'completed' : 'pending',
                'scheduled_date' => $lesson->scheduled_date,
                'type' => $lesson->type,
                'link' => $lesson->link,
                'order' => $lesson->order ?? 0,
                'completed_at' => $lesson->completed_at,
                'created_at' => $lesson->created_at ?? now(),
                'updated_at' => $lesson->updated_at ?? now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove all tasks that were migrated from lessons
        DB::table('tasks')->where('is_lesson', true)->delete();
    }
};
