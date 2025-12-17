<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('referrals', function (Blueprint $table) {
            if (!Schema::hasColumn('referrals', 'referral_code')) {
                $table->string('referral_code', 16)
                    ->nullable()
                    ->after('code')
                    ->index();
            }

            if (!Schema::hasColumn('referrals', 'visit_id')) {
                $table->foreignId('visit_id')
                    ->nullable()
                    ->after('referral_code')
                    ->constrained('referral_visits')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('referrals', function (Blueprint $table) {
            if (Schema::hasColumn('referrals', 'visit_id')) {
                $table->dropForeign(['visit_id']);
                $table->dropColumn('visit_id');
            }

            if (Schema::hasColumn('referrals', 'referral_code')) {
                $table->dropIndex(['referral_code']);
                $table->dropColumn('referral_code');
            }
        });
    }
};
