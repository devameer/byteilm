<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_usage', function (Blueprint $table) {
            if (!Schema::hasColumn('user_usage', 'lessons_count')) {
                $table->integer('lessons_count')->default(0)->after('courses_count');
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_usage', function (Blueprint $table) {
            if (Schema::hasColumn('user_usage', 'lessons_count')) {
                $table->dropColumn('lessons_count');
            }
        });
    }
};
