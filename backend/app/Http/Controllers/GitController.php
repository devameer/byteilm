<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;

class GitController extends Controller
{
    public function index()
    {
        return view('git.index');
    }

    public function pull(Request $request)
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
}
