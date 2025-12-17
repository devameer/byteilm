<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Only run for MySQL - SQLite doesn't have storage engines
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE courses ENGINE = InnoDB');
            DB::statement('ALTER TABLE projects ENGINE = InnoDB');
        }
    }

    public function down(): void
    {
        // No-op: original engine unknown.
    }
};
