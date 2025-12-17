<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('course_team')) {
            Schema::create('course_team', function (Blueprint $table) {
                // Only set engine for MySQL
                if (DB::getDriverName() === 'mysql') {
                    $table->engine = 'InnoDB';
                }
                $table->id();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['course_id', 'team_id'], 'course_team_unique');
            });
        } else {
            // Only run for MySQL
            if (DB::getDriverName() === 'mysql') {
                DB::statement('ALTER TABLE course_team ENGINE = InnoDB');
            }
        }

        if (!Schema::hasTable('project_team')) {
            Schema::create('project_team', function (Blueprint $table) {
                // Only set engine for MySQL
                if (DB::getDriverName() === 'mysql') {
                    $table->engine = 'InnoDB';
                }
                $table->id();
                $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
                $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['project_id', 'team_id'], 'project_team_unique');
            });
        } else {
            // Only run for MySQL
            if (DB::getDriverName() === 'mysql') {
                DB::statement('ALTER TABLE project_team ENGINE = InnoDB');
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('course_team');
        Schema::dropIfExists('project_team');
    }
};
