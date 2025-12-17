<?php

namespace App\Console\Commands;

use App\Models\LessonVideo;
use App\Models\LessonSubtitle;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class MigrateVideosToS3 extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'videos:migrate-to-s3
                            {--dry-run : Perform a dry run without actually migrating files}
                            {--delete-local : Delete local files after successful migration}
                            {--force : Skip confirmation prompts}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate all videos and subtitles from local storage to Amazon S3';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('===========================================');
        $this->info('  Video Migration to S3');
        $this->info('===========================================');
        $this->newLine();

        // Check if S3 is configured
        if (config('filesystems.default') !== 's3') {
            $this->error('⚠️  FILESYSTEM_DISK is not set to "s3" in your .env file');
            $this->warn('Please update your .env file and set FILESYSTEM_DISK=s3');
            return 1;
        }

        // Verify S3 connection
        if (!$this->testS3Connection()) {
            $this->error('❌ Failed to connect to S3. Please check your AWS credentials.');
            return 1;
        }

        $this->info('✅ S3 connection verified');
        $this->newLine();

        $isDryRun = $this->option('dry-run');
        $deleteLocal = $this->option('delete-local');
        $force = $this->option('force');

        if ($isDryRun) {
            $this->warn('🔍 DRY RUN MODE - No files will be migrated');
            $this->newLine();
        }

        // Count files to migrate
        $videos = LessonVideo::all();
        $subtitles = LessonSubtitle::all();

        $this->info("Found {$videos->count()} videos and {$subtitles->count()} subtitles to migrate");
        $this->newLine();

        if (!$force && !$isDryRun) {
            if (!$this->confirm('Do you want to proceed with the migration?')) {
                $this->warn('Migration cancelled.');
                return 0;
            }
        }

        $this->newLine();

        // Migrate videos
        $this->info('📹 Migrating videos...');
        $this->newLine();

        $videoStats = $this->migrateVideos($videos, $isDryRun, $deleteLocal);

        $this->newLine();

        // Migrate subtitles
        $this->info('📝 Migrating subtitles...');
        $this->newLine();

        $subtitleStats = $this->migrateSubtitles($subtitles, $isDryRun, $deleteLocal);

        $this->newLine();
        $this->info('===========================================');
        $this->info('  Migration Summary');
        $this->info('===========================================');
        $this->table(
            ['Type', 'Total', 'Migrated', 'Skipped', 'Failed'],
            [
                ['Videos', $videoStats['total'], $videoStats['migrated'], $videoStats['skipped'], $videoStats['failed']],
                ['Subtitles', $subtitleStats['total'], $subtitleStats['migrated'], $subtitleStats['skipped'], $subtitleStats['failed']],
            ]
        );

        if ($isDryRun) {
            $this->warn('🔍 This was a DRY RUN - no files were actually migrated');
        } else {
            $this->info('✅ Migration completed successfully!');

            if ($deleteLocal) {
                $this->warn('⚠️  Local files have been deleted');
            } else {
                $this->info('💡 Local files are still intact. Use --delete-local to remove them after verification');
            }
        }

        return 0;
    }

    /**
     * Test S3 connection
     */
    protected function testS3Connection(): bool
    {
        try {
            Storage::disk('s3')->files();
            return true;
        } catch (\Exception $e) {
            $this->error('S3 Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Migrate videos to S3
     */
    protected function migrateVideos($videos, bool $isDryRun, bool $deleteLocal): array
    {
        $stats = ['total' => 0, 'migrated' => 0, 'skipped' => 0, 'failed' => 0];

        $progressBar = $this->output->createProgressBar($videos->count());
        $progressBar->start();

        foreach ($videos as $video) {
            $stats['total']++;

            try {
                // Migrate video file
                if ($video->file_path) {
                    $result = $this->migrateFile($video->file_path, $isDryRun, $deleteLocal, 'video');

                    if ($result === 'migrated') {
                        $stats['migrated']++;
                    } elseif ($result === 'skipped') {
                        $stats['skipped']++;
                    } else {
                        $stats['failed']++;
                    }
                }

                // Migrate thumbnail if exists
                if ($video->thumbnail_path) {
                    $this->migrateFile($video->thumbnail_path, $isDryRun, $deleteLocal, 'thumbnail');
                }

            } catch (\Exception $e) {
                $stats['failed']++;
                $this->newLine();
                $this->error("Failed to migrate video {$video->id}: " . $e->getMessage());
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine();

        return $stats;
    }

    /**
     * Migrate subtitles to S3
     */
    protected function migrateSubtitles($subtitles, bool $isDryRun, bool $deleteLocal): array
    {
        $stats = ['total' => 0, 'migrated' => 0, 'skipped' => 0, 'failed' => 0];

        $progressBar = $this->output->createProgressBar($subtitles->count());
        $progressBar->start();

        foreach ($subtitles as $subtitle) {
            $stats['total']++;

            try {
                if ($subtitle->file_path) {
                    $result = $this->migrateFile($subtitle->file_path, $isDryRun, $deleteLocal, 'subtitle');

                    if ($result === 'migrated') {
                        $stats['migrated']++;
                    } elseif ($result === 'skipped') {
                        $stats['skipped']++;
                    } else {
                        $stats['failed']++;
                    }
                }
            } catch (\Exception $e) {
                $stats['failed']++;
                $this->newLine();
                $this->error("Failed to migrate subtitle {$subtitle->id}: " . $e->getMessage());
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine();

        return $stats;
    }

    /**
     * Migrate a single file to S3
     */
    protected function migrateFile(string $filePath, bool $isDryRun, bool $deleteLocal, string $type): string
    {
        // Check if file already exists on S3
        if (Storage::disk('s3')->exists($filePath)) {
            return 'skipped';
        }

        // Get local file path
        $localPath = storage_path('app/public/' . $filePath);

        // Check if local file exists
        if (!File::exists($localPath)) {
            return 'failed';
        }

        if ($isDryRun) {
            return 'migrated'; // Simulate success in dry run
        }

        try {
            // Read local file
            $fileContent = File::get($localPath);

            // Upload to S3
            Storage::disk('s3')->put($filePath, $fileContent);

            // Set visibility to private
            Storage::disk('s3')->setVisibility($filePath, 'private');

            // Delete local file if requested
            if ($deleteLocal) {
                File::delete($localPath);
            }

            return 'migrated';

        } catch (\Exception $e) {
            $this->error("Failed to migrate {$type}: {$filePath} - " . $e->getMessage());
            return 'failed';
        }
    }
}
