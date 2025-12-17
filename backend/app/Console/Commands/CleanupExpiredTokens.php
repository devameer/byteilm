<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Laravel\Sanctum\PersonalAccessToken;

class CleanupExpiredTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tokens:cleanup
                            {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired Sanctum tokens';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $expirationMinutes = config('sanctum.expiration');

        if (!$expirationMinutes) {
            $this->info('Token expiration is not configured. Tokens never expire.');
            return 0;
        }

        $expirationDate = now()->subMinutes($expirationMinutes);

        $this->info("Looking for tokens created before: {$expirationDate->format('Y-m-d H:i:s')}");

        // Count expired tokens
        $expiredCount = PersonalAccessToken::where('created_at', '<', $expirationDate)->count();

        if ($expiredCount === 0) {
            $this->info('No expired tokens found. System is clean!');
            return 0;
        }

        $this->warn("Found {$expiredCount} expired tokens.");

        if ($this->option('dry-run')) {
            $this->line("\nDry run mode - showing what would be deleted:");

            $sampleTokens = PersonalAccessToken::with('tokenable')
                ->where('created_at', '<', $expirationDate)
                ->take(10)
                ->get();

            $this->table(
                ['User Email', 'Token Name', 'Created At', 'Age'],
                $sampleTokens->map(function ($token) {
                    return [
                        $token->tokenable->email ?? 'N/A',
                        $token->name,
                        $token->created_at->format('Y-m-d H:i:s'),
                        $token->created_at->diffForHumans(),
                    ];
                })
            );

            $this->info("\nTotal tokens that would be deleted: {$expiredCount}");
            return 0;
        }

        // Confirm deletion
        if (!$this->confirm("Delete {$expiredCount} expired tokens?", true)) {
            $this->info('Cleanup cancelled.');
            return 0;
        }

        // Delete expired tokens
        $deleted = PersonalAccessToken::where('created_at', '<', $expirationDate)->delete();

        $this->info("✓ Successfully deleted {$deleted} expired tokens.");

        return 0;
    }
}
