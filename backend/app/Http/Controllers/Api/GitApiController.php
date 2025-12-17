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
}
