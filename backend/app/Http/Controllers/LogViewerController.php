<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class LogViewerController extends Controller
{
    /**
     * Get Laravel logs with filtering
     * GET /api/logs
     */
    public function index(Request $request)
    {
        $request->validate([
            'level' => 'nullable|in:emergency,alert,critical,error,warning,notice,info,debug',
            'search' => 'nullable|string',
            'limit' => 'nullable|integer|min:10|max:1000',
            'date' => 'nullable|string'
        ]);

        $level = $request->input('level');
        $search = $request->input('search');
        $limit = $request->input('limit', 100);
        $date = $request->input('date', now()->format('Y-m-d'));

        // Determine log file path
        if ($date && $date !== 'current' && $date !== now()->format('Y-m-d')) {
            // Historical log file
            $logFile = storage_path("logs/laravel-{$date}.log");
        } else {
            // Current log file
            $logFile = storage_path('logs/laravel.log');
        }

        if (!File::exists($logFile)) {
            return response()->json([
                'success' => true,
                'message' => 'لا توجد سجلات متاحة لهذا التاريخ',
                'data' => [
                    'logs' => [],
                    'total' => 0,
                    'file' => basename($logFile),
                    'size' => '0 B',
                    'filters' => [
                        'level' => $level,
                        'search' => $search,
                        'date' => $date
                    ]
                ]
            ]);
        }

        // Read log file
        $logs = $this->parseLogFile($logFile, $level, $search, $limit);

        return response()->json([
            'success' => true,
            'data' => [
                'logs' => $logs,
                'total' => count($logs),
                'file' => basename($logFile),
                'size' => $this->formatBytes(File::size($logFile)),
                'filters' => [
                    'level' => $level,
                    'search' => $search,
                    'date' => $date
                ]
            ]
        ]);
    }

    /**
     * Get available log dates
     * GET /api/logs/dates
     */
    public function getDates()
    {
        $logPath = storage_path('logs');
        $files = File::files($logPath);

        $dates = [];
        foreach ($files as $file) {
            if (preg_match('/laravel-(\d{4}-\d{2}-\d{2})\.log/', $file->getFilename(), $matches)) {
                $dates[] = [
                    'date' => $matches[1],
                    'size' => $this->formatBytes($file->getSize()),
                    'modified' => date('Y-m-d H:i:s', $file->getMTime())
                ];
            }
        }

        // Add current log file
        if (File::exists($logPath . '/laravel.log')) {
            $currentLog = new \SplFileInfo($logPath . '/laravel.log');
            $dates[] = [
                'date' => 'current',
                'size' => $this->formatBytes($currentLog->getSize()),
                'modified' => date('Y-m-d H:i:s', $currentLog->getMTime())
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $dates
        ]);
    }

    /**
     * Download log file
     * GET /api/logs/download
     */
    public function download(Request $request)
    {
        $date = $request->input('date', now()->format('Y-m-d'));

        // Determine log file path
        if ($date && $date !== 'current' && $date !== now()->format('Y-m-d')) {
            // Historical log file
            $logFile = storage_path("logs/laravel-{$date}.log");
        } else {
            // Current log file
            $logFile = storage_path('logs/laravel.log');
        }

        if (!File::exists($logFile)) {
            return response()->json([
                'success' => false,
                'message' => 'ملف السجل غير موجود'
            ], 404);
        }

        return response()->download($logFile);
    }

    /**
     * Clear logs
     * DELETE /api/logs/clear
     */
    public function clear(Request $request)
    {
        $date = $request->input('date');

        // Determine log file path
        if ($date && $date !== 'current' && $date !== now()->format('Y-m-d')) {
            // Historical log file
            $logFile = storage_path("logs/laravel-{$date}.log");
        } else {
            // Current log file
            $logFile = storage_path('logs/laravel.log');
        }

        if (File::exists($logFile)) {
            // Clear file content instead of deleting (better for production)
            File::put($logFile, '');

            return response()->json([
                'success' => true,
                'message' => 'تم تنظيف السجل بنجاح'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'ملف السجل غير موجود'
        ], 404);
    }

    /**
     * Parse log file and return structured data
     */
    private function parseLogFile($logFile, $level = null, $search = null, $limit = 100)
    {
        $content = File::get($logFile);
        $lines = explode("\n", $content);

        $logs = [];
        $currentLog = null;

        foreach ($lines as $line) {
            // Match log pattern: [2025-12-18 04:48:16] local.ERROR: ...
            if (preg_match('/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+): (.+)$/', $line, $matches)) {
                // Save previous log if exists
                if ($currentLog) {
                    if ($this->matchesFilters($currentLog, $level, $search)) {
                        $logs[] = $currentLog;
                    }
                }

                // Start new log entry
                $currentLog = [
                    'timestamp' => $matches[1],
                    'env' => $matches[2],
                    'level' => strtolower($matches[3]),
                    'message' => $matches[4],
                    'stacktrace' => ''
                ];
            } elseif ($currentLog && trim($line)) {
                // Append to stacktrace
                $currentLog['stacktrace'] .= $line . "\n";
            }

            // Stop if we've reached the limit
            if (count($logs) >= $limit) {
                break;
            }
        }

        // Add last log
        if ($currentLog && $this->matchesFilters($currentLog, $level, $search)) {
            $logs[] = $currentLog;
        }

        // Reverse to show newest first
        return array_reverse(array_slice($logs, -$limit));
    }

    /**
     * Check if log matches filters
     */
    private function matchesFilters($log, $level, $search)
    {
        // Filter by level
        if ($level && $log['level'] !== strtolower($level)) {
            return false;
        }

        // Filter by search term
        if ($search) {
            $searchLower = strtolower($search);
            $logText = strtolower($log['message'] . ' ' . $log['stacktrace']);

            if (strpos($logText, $searchLower) === false) {
                return false;
            }
        }

        return true;
    }

    /**
     * Format bytes to human readable
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
