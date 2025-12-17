<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Process;

class GitApiController extends Controller
{
    /**
     * Execute git pull on the server.
     */
    public function pull()
    {
        $username = 'devameer';
        $token = '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';
        $branch = 'master';

        // Build the remote URL with authentication
        $remoteUrl = "https://{$username}:{$token}@github.com/devameer/plan.git";

        try {
            // Change to project directory
            $projectPath = base_path();

            // Execute git pull
            // $result = Process::path($projectPath)
            //     ->run("git reset --har && git pull {$remoteUrl} {$branch}");
            $result = Process::path($projectPath)
                ->run('git fetch ' . $remoteUrl . ' ' . $branch . ' && git reset --hard FETCH_HEAD && git clean -fd');

            $output = $result->output();
            $errorOutput = $result->errorOutput();

            if ($result->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Git pull completed successfully',
                    'output' => $output,
                    'error' => $errorOutput
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Git pull failed',
                    'output' => $output,
                    'error' => $errorOutput
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error executing git pull',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function pullold()
    {
        try {
            $result = Process::path(base_path())->run('git pull');

            return response()->json([
                'success' => $result->successful(),
                'message' => $result->successful() ? 'تم تنفيذ git pull بنجاح' : 'فشل تنفيذ git pull',
                'output' => $result->output(),
                'error' => $result->errorOutput(),
            ], $result->successful() ? 200 : 500);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تنفيذ الأمر: ' . $exception->getMessage(),
            ], 500);
        }
    }

    /**
     * Execute composer install on the server.
     */
    public function composerInstall()
    {
        try {
            $result = Process::path(base_path())
                ->timeout(300) // 5 minutes timeout for composer
                ->run('composer install --no-interaction --prefer-dist --optimize-autoloader');

            return response()->json([
                'success' => $result->successful(),
                'message' => $result->successful() ? 'تم تنفيذ composer install بنجاح' : 'فشل تنفيذ composer install',
                'output' => $result->output(),
                'error' => $result->errorOutput(),
            ], $result->successful() ? 200 : 500);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تنفيذ الأمر: ' . $exception->getMessage(),
            ], 500);
        }
    }

    /**
     * Execute php artisan migrate on the server.
     */
    public function migrate()
    {
        try {
            $result = Process::path(base_path())
                ->timeout(120)
                ->run('php artisan migrate --force');

            return response()->json([
                'success' => $result->successful(),
                'message' => $result->successful() ? 'تم تنفيذ الترحيل بنجاح' : 'فشل تنفيذ الترحيل',
                'output' => $result->output(),
                'error' => $result->errorOutput(),
            ], $result->successful() ? 200 : 500);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تنفيذ الأمر: ' . $exception->getMessage(),
            ], 500);
        }
    }

    /**
     * Execute php artisan migrate:fresh --seed on the server.
     * WARNING: This will delete all data!
     */
    public function migrateFresh()
    {
        try {
            $result = Process::path(base_path())
                ->timeout(300)
                ->run('php artisan migrate:fresh --seed --force');

            return response()->json([
                'success' => $result->successful(),
                'message' => $result->successful() ? 'تم إعادة إنشاء قاعدة البيانات بنجاح' : 'فشل إعادة إنشاء قاعدة البيانات',
                'output' => $result->output(),
                'error' => $result->errorOutput(),
            ], $result->successful() ? 200 : 500);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تنفيذ الأمر: ' . $exception->getMessage(),
            ], 500);
        }
    }

    /**
     * Check server status for FFmpeg and other tools.
     */
    public function checkStatus()
    {
        $configuredPath = env('FFMPEG_PATH');
        $homePath = getenv('HOME');
        $currentUser = get_current_user();

        $status = [
            'php_version' => PHP_VERSION,
            'os' => PHP_OS,
            'exec_enabled' => function_exists('exec') && !in_array('exec', array_map('trim', explode(',', ini_get('disable_functions')))),
            'home_path' => $homePath,
            'current_user' => $currentUser,
            'configured_ffmpeg_path' => $configuredPath,
            'ffmpeg' => [
                'available' => false,
                'version' => null,
                'path' => null,
                'error' => null,
                'tried_paths' => [],
                'ffmpeg_path' => $configuredPath,
            ],
        ];

        // Check FFmpeg
        if ($status['exec_enabled']) {
            try {
                // Try paths in order
                $ffmpegPaths = [
                    $configuredPath, // From .env
                    'ffmpeg',
                    '/usr/bin/ffmpeg',
                    '/usr/local/bin/ffmpeg',
                    '/opt/cpanel/composer/bin/ffmpeg',
                    $homePath . '/bin/ffmpeg', // ~/bin/ffmpeg
                    '/home/' . $currentUser . '/bin/ffmpeg',
                ];

                foreach ($ffmpegPaths as $path) {
                    if (empty($path))
                        continue;

                    $result = ['path' => $path, 'exists' => file_exists($path), 'executable' => is_executable($path)];

                    exec("{$path} -version 2>&1", $output, $returnCode);
                    $result['return_code'] = $returnCode;
                    $result['output'] = $output[0] ?? null;

                    $status['ffmpeg']['tried_paths'][] = $result;

                    if ($returnCode === 0) {
                        $status['ffmpeg']['available'] = true;
                        $status['ffmpeg']['path'] = $path;
                        $status['ffmpeg']['version'] = $output[0] ?? 'unknown';
                        break;
                    }
                    $output = []; // Reset for next iteration
                }

                if (!$status['ffmpeg']['available']) {
                    $status['ffmpeg']['error'] = 'FFmpeg not found or not executable';
                }
            } catch (\Exception $e) {
                $status['ffmpeg']['error'] = $e->getMessage();
            }
        } else {
            $status['ffmpeg']['error'] = 'exec() function is disabled';
        }

        return response()->json([
            'success' => true,
            'data' => $status,
        ]);
    }
}
