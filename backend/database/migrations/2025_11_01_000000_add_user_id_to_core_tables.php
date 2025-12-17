<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'courses',
            'lessons',
            'tasks',
            'projects',
            'lesson_videos',
            'lesson_categories',
        ];

        // Step 1: Add user_id column without foreign key constraint
        foreach ($tables as $tableName) {
            if (!Schema::hasColumn($tableName, 'user_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->unsignedBigInteger('user_id')->nullable()->after('id');
                });
            }
        }

        // Step 2: Backfill existing records with the first available user (if any)
        $defaultUserId = DB::table('users')->orderBy('id')->value('id');

        if ($defaultUserId) {
            DB::table('courses')->whereNull('user_id')->update(['user_id' => $defaultUserId]);
            DB::table('lessons')->whereNull('user_id')->update(['user_id' => $defaultUserId]);
            DB::table('tasks')->whereNull('user_id')->update(['user_id' => $defaultUserId]);
            DB::table('projects')->whereNull('user_id')->update(['user_id' => $defaultUserId]);
            DB::table('lesson_videos')->whereNull('user_id')->update(['user_id' => $defaultUserId]);
            DB::table('lesson_categories')->whereNull('user_id')->update(['user_id' => $defaultUserId]);
        }

        // Step 3: Add foreign key constraints
        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $table->foreign('user_id')
                    ->references('id')
                    ->on('users')
                    ->onDelete('cascade');
            });
        }

        // Step 4: Make user_id NOT NULL if we have data
        if ($defaultUserId) {
            $this->enforceNotNull($tables);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ([
            'lesson_categories',
            'lesson_videos',
            'projects',
            'tasks',
            'lessons',
            'courses',
        ] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            });
        }
    }

    /**
     * Ensure the user_id column is not nullable when data exists.
     */
    protected function enforceNotNull(array $tables): void
    {
        $driver = DB::getDriverName();

        foreach ($tables as $tableName) {
            match ($driver) {
                'mysql', 'mariadb' => DB::statement("ALTER TABLE `{$tableName}` MODIFY `user_id` BIGINT UNSIGNED NOT NULL"),
                'pgsql' => DB::statement("ALTER TABLE \"{$tableName}\" ALTER COLUMN \"user_id\" SET NOT NULL"),
                default => null,
            };
        }
    }
};
