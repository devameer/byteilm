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
        Schema::table('tasks', function (Blueprint $table) {
            // Add flag to distinguish lessons from regular tasks
            $table->boolean('is_lesson')->default(false)->after('title');

            // Add index for quick filtering
            $table->index('is_lesson');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['is_lesson']);
            $table->dropColumn('is_lesson');
        });
    }
};
