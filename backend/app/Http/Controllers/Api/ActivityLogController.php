<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $logs = ActivityLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    public function teamActivity(Request $request, int $teamId): JsonResponse
    {
        // Verify user has access to team
        $user = $request->user();
        $isMember = $user->teams()->where('team_id', $teamId)->exists() || 
                   $user->ownedTeams()->where('id', $teamId)->exists();
        
        if (!$isMember) {
            return response()->json([
                'success' => false,
                'message' => __('لا تملك صلاحية الوصول لسجل نشاط هذا الفريق.'),
            ], 403);
        }

        $logs = ActivityLog::where('metadata->team_id', $teamId)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
}
