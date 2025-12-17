<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Only run for MySQL - SQLite doesn't have storage engines
        if (DB::getDriverName() === 'mysql') {
            // Convert users table from MyISAM to InnoDB to support foreign keys
            DB::statement('ALTER TABLE users ENGINE = InnoDB');

            // Also convert any other tables that might be MyISAM
            DB::statement('ALTER TABLE password_reset_tokens ENGINE = InnoDB');
            DB::statement('ALTER TABLE sessions ENGINE = InnoDB');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionally convert back to MyISAM (not recommended)
        // Only for MySQL
        // if (DB::getDriverName() === 'mysql') {
        //     DB::statement('ALTER TABLE users ENGINE = MyISAM');
        // }
    }
};
