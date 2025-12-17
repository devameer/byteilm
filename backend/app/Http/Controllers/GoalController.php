<?php

namespace App\Http\Controllers;

use App\Services\GoalService;
use App\Models\Goal;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GoalController extends Controller
{
    protected $goalService;

    public function __construct(GoalService $goalService)
    {
        $this->goalService = $goalService;
    }

    /**
     * Get all user goals
     * GET /api/goals?type=personal&status=active&category=tasks
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $filters = $request->only(['type', 'status', 'category']);
        $goals = $this->goalService->getUserGoals($user, $filters);

        return response()->json([
            'success' => true,
            'data' => $goals
        ]);
    }

    /**
     * Get single goal
     * GET /api/goals/{id}
     */
    public function show($id)
    {
        $goal = Goal::with(['user', 'team', 'collaborators.user', 'progress'])
            ->findOrFail($id);

        // Check authorization
        $user = Auth::user();
        if ($goal->user_id !== $user->id && !$goal->collaborators->contains('user_id', $user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بعرض هذا الهدف'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $goal
        ]);
    }

    /**
     * Create new goal
     * POST /api/goals
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:personal,team',
            'category' => 'required|in:tasks,projects,courses,learning,productivity,custom',
            'metric_type' => 'required|string',
            'target_value' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'team_id' => 'nullable|exists:teams,id',
            'reward_points' => 'nullable|integer|min:0',
            'reward_badge' => 'nullable|string',
            'reward_description' => 'nullable|string',
            'reminders_enabled' => 'boolean',
            'reminder_frequency' => 'in:daily,weekly,milestone',
            'milestones' => 'nullable|array',
            'visibility' => 'in:private,team,public',
            'collaborators' => 'nullable|array',
            'collaborators.*' => 'exists:users,id'
        ]);

        $user = Auth::user();
        $goal = $this->goalService->createGoal($user, $request->all());

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الهدف بنجاح',
            'data' => $goal
        ], 201);
    }

    /**
     * Update goal
     * PUT /api/goals/{id}
     */
    public function update(Request $request, $id)
    {
        $goal = Goal::findOrFail($id);

        // Check authorization
        $user = Auth::user();
        if ($goal->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بتعديل هذا الهدف'
            ], 403);
        }

        $request->validate([
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'type' => 'in:personal,team',
            'category' => 'in:tasks,projects,courses,learning,productivity,custom',
            'metric_type' => 'string',
            'target_value' => 'integer|min:1',
            'start_date' => 'date',
            'end_date' => 'date|after:start_date',
            'team_id' => 'nullable|exists:teams,id',
            'reward_points' => 'nullable|integer|min:0',
            'reward_badge' => 'nullable|string',
            'reward_description' => 'nullable|string',
            'reminders_enabled' => 'boolean',
            'reminder_frequency' => 'in:daily,weekly,milestone',
            'milestones' => 'nullable|array',
            'visibility' => 'in:private,team,public',
            'collaborators' => 'nullable|array',
            'collaborators.*' => 'exists:users,id'
        ]);

        $goal = $this->goalService->updateGoal($goal, $request->all());

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الهدف بنجاح',
            'data' => $goal
        ]);
    }

    /**
     * Delete goal
     * DELETE /api/goals/{id}
     */
    public function destroy($id)
    {
        $goal = Goal::findOrFail($id);

        // Check authorization
        $user = Auth::user();
        if ($goal->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بحذف هذا الهدف'
            ], 403);
        }

        $this->goalService->deleteGoal($goal);

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الهدف بنجاح'
        ]);
    }

    /**
     * Update goal progress
     * POST /api/goals/{id}/progress
     */
    public function updateProgress(Request $request, $id)
    {
        $goal = Goal::findOrFail($id);

        // Check authorization
        $user = Auth::user();
        if ($goal->user_id !== $user->id && !$goal->collaborators->contains('user_id', $user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بتحديث هذا الهدف'
            ], 403);
        }

        $request->validate([
            'value' => 'required|integer|min:0',
            'note' => 'nullable|string'
        ]);

        $goal = $this->goalService->updateProgress(
            $goal,
            $request->value,
            $request->note
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث التقدم بنجاح',
            'data' => $goal
        ]);
    }

    /**
     * Increment goal progress
     * POST /api/goals/{id}/increment
     */
    public function incrementProgress(Request $request, $id)
    {
        $goal = Goal::findOrFail($id);

        // Check authorization
        $user = Auth::user();
        if ($goal->user_id !== $user->id && !$goal->collaborators->contains('user_id', $user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بتحديث هذا الهدف'
            ], 403);
        }

        $request->validate([
            'amount' => 'integer|min:1',
            'note' => 'nullable|string'
        ]);

        $amount = $request->input('amount', 1);
        $goal = $this->goalService->incrementProgress(
            $goal,
            $amount,
            $request->note
        );

        return response()->json([
            'success' => true,
            'message' => 'تم زيادة التقدم بنجاح',
            'data' => $goal
        ]);
    }

    /**
     * Get goal statistics
     * GET /api/goals/statistics
     */
    public function statistics()
    {
        $user = Auth::user();
        $stats = $this->goalService->getGoalStatistics($user);

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get team goals
     * GET /api/goals/team/{teamId}
     */
    public function teamGoals($teamId)
    {
        $team = Team::findOrFail($teamId);
        $user = Auth::user();

        // Check if user is team member
        $isMember = $team->members()->where('user_id', $user->id)->exists();
        if (!$isMember && $team->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بعرض أهداف هذا الفريق'
            ], 403);
        }

        $goals = $this->goalService->getTeamGoals($team);

        return response()->json([
            'success' => true,
            'data' => $goals
        ]);
    }

    /**
     * Get suggested goals
     * GET /api/goals/suggestions
     */
    public function suggestions()
    {
        $user = Auth::user();
        $suggestions = $this->goalService->getSuggestedGoals($user);

        return response()->json([
            'success' => true,
            'data' => $suggestions
        ]);
    }

    /**
     * Get leaderboard
     * GET /api/goals/leaderboard?type=all&limit=10
     */
    public function leaderboard(Request $request)
    {
        $type = $request->input('type', 'all');
        $limit = $request->input('limit', 10);

        $leaderboard = $this->goalService->getLeaderboard($type, $limit);

        return response()->json([
            'success' => true,
            'data' => $leaderboard
        ]);
    }

    /**
     * Mark goal as completed manually
     * POST /api/goals/{id}/complete
     */
    public function markCompleted($id)
    {
        $goal = Goal::findOrFail($id);

        // Check authorization
        $user = Auth::user();
        if ($goal->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بتحديث هذا الهدف'
            ], 403);
        }

        $goal->update([
            'status' => 'completed',
            'completed_at' => now(),
            'current_value' => $goal->target_value
        ]);

        // Award rewards
        $goal->awardRewards();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديد الهدف كمكتمل بنجاح',
            'data' => $goal->fresh()
        ]);
    }

    /**
     * Cancel goal
     * POST /api/goals/{id}/cancel
     */
    public function cancel($id)
    {
        $goal = Goal::findOrFail($id);

        // Check authorization
        $user = Auth::user();
        if ($goal->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بتحديث هذا الهدف'
            ], 403);
        }

        $goal->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء الهدف بنجاح',
            'data' => $goal->fresh()
        ]);
    }
}
