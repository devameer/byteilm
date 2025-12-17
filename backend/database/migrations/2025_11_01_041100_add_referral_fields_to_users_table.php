<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'referral_code')) {
                $table->string('referral_code', 16)->nullable()->unique()->after('last_login_at');
            }

            if (!Schema::hasColumn('users', 'referred_by')) {
                $table->foreignId('referred_by')
                    ->nullable()
                    ->after('referral_code')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('users', 'referral_points')) {
                $table->unsignedInteger('referral_points')->default(0)->after('referred_by');
            }
        });

        // Generate referral codes for existing users
        $codeLength = (int) config('referrals.code_length', 10);

        DB::table('users')
            ->select('id')
            ->orderBy('id')
            ->chunkById(100, function ($users) use ($codeLength) {
                foreach ($users as $user) {
                    $code = null;

                    do {
                        $candidate = Str::upper(Str::random($codeLength));
                        $exists = DB::table('users')
                            ->where('referral_code', $candidate)
                            ->exists();
                    } while ($exists);

                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['referral_code' => $candidate]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'referral_points')) {
                $table->dropColumn('referral_points');
            }

            if (Schema::hasColumn('users', 'referred_by')) {
                $table->dropForeign(['referred_by']);
                $table->dropColumn('referred_by');
            }

            if (Schema::hasColumn('users', 'referral_code')) {
                $table->dropUnique(['referral_code']);
                $table->dropColumn('referral_code');
            }
        });
    }
};
