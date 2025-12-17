<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            if (Schema::hasColumn('team_members', 'role')) {
                $table->dropColumn('role');
            }
        });

        Schema::table('team_members', function (Blueprint $table) {
            $table->string('role', 20)
                ->default('member')
                ->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            $table->dropColumn('role');
        });

        Schema::table('team_members', function (Blueprint $table) {
            $table->enum('role', ['owner', 'admin', 'member'])
                ->default('member')
                ->after('user_id');
        });
    }
};
