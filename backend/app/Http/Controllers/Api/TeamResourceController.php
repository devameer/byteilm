<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeamResource;
use App\Models\Course;
use App\Models\Project;
use App\Models\Task;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamResourceController extends Controller
{
    public function shareTask(Request $request, Team $team): JsonResponse
    {
        $team = $this->loadTeamForResourceManagement($request, $team);

        $validated = $request->validate([
            'task_id' => ['required', 'integer', 'exists:tasks,id'],
        ]);

        $task = Task::where('id', $validated['task_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $team->tasks()->syncWithoutDetaching([$task->id]);

        $team = $team->fresh()->load(['courses', 'projects', 'tasks', 'members.user', 'owner']);

        return $this->teamResourceResponse($team, __('تمت مشاركة المهمة مع الفريق.'));
    }

    public function unshareTask(Request $request, Team $team, Task $task): JsonResponse
    {
        $team = $this->loadTeamForResourceManagement($request, $team);

        $team->tasks()->detach($task->id);

        $team = $team->fresh()->load(['courses', 'projects', 'tasks', 'members.user', 'owner']);

        return $this->teamResourceResponse($team, __('تم إلغاء مشاركة المهمة.'));
    }
    public function shareCourse(Request $request, Team $team): JsonResponse
    {
        $team = $this->loadTeamForResourceManagement($request, $team);

        $validated = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
        ]);

        $course = Course::where('id', $validated['course_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $team->courses()->syncWithoutDetaching([$course->id]);

        $team = $team->fresh()->load(['courses', 'projects', 'tasks', 'members.user', 'owner']);

        return $this->teamResourceResponse($team, __('تمت مشاركة الدورة مع الفريق.'));
    }

    public function unshareCourse(Request $request, Team $team, Course $course): JsonResponse
    {
        $team = $this->loadTeamForResourceManagement($request, $team);

        $team->courses()->detach($course->id);

        $team = $team->fresh()->load(['courses', 'projects', 'tasks', 'members.user', 'owner']);

        return $this->teamResourceResponse($team, __('تم إلغاء مشاركة الدورة.'));
    }

    public function shareProject(Request $request, Team $team): JsonResponse
    {
        $team = $this->loadTeamForResourceManagement($request, $team);

        $validated = $request->validate([
            'project_id' => ['required', 'integer', 'exists:projects,id'],
        ]);

        $project = Project::where('id', $validated['project_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $team->projects()->syncWithoutDetaching([$project->id]);

        $team = $team->fresh()->load(['courses', 'projects', 'tasks', 'members.user', 'owner']);

        return $this->teamResourceResponse($team, __('تمت مشاركة المشروع مع الفريق.'));
    }

    public function unshareProject(Request $request, Team $team, Project $project): JsonResponse
    {
        $team = $this->loadTeamForResourceManagement($request, $team);

        $team->projects()->detach($project->id);

        $team = $team->fresh()->load(['courses', 'projects', 'tasks', 'members.user', 'owner']);

        return $this->teamResourceResponse($team, __('تم إلغاء مشاركة المشروع.'));
    }

    public function options(Request $request, Team $team): JsonResponse
    {
        $team = $this->loadTeamForResourceManagement($request, $team, false);

        $team->loadMissing(['courses', 'projects', 'tasks']);

        $user = $request->user();

        $courses = Course::query()
            ->where('user_id', $user->id)
            ->select('id', 'name', 'active')
            ->orderBy('name')
            ->get()
            ->map(function ($course) use ($team) {
                return [
                    'id' => $course->id,
                    'name' => $course->name,
                    'active' => (bool) $course->active,
                    'shared' => $team->courses->contains('id', $course->id),
                ];
            });

        $projects = Project::query()
            ->where('user_id', $user->id)
            ->select('id', 'name', 'status')
            ->orderBy('name')
            ->get()
            ->map(function ($project) use ($team) {
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'status' => $project->status,
                    'shared' => $team->projects->contains('id', $project->id),
                ];
            });
            
        $tasks = Task::query()
            ->where('user_id', $user->id)
            ->select('id', 'title', 'status')
            ->orderBy('title')
            ->get()
            ->map(function ($task) use ($team) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'completed' => $task->status === 'completed',
                    'shared' => $team->tasks->contains('id', $task->id),
                ];
            });

    return response()->json([
            'success' => true,
            'data' => [
                'courses' => $courses,
                'projects' => $projects,
                'tasks' => $tasks,
            ],
        ]);
    }

    private function loadTeamForResourceManagement(Request $request, Team $team, bool $loadRelations = true): Team
    {
        $user = $request->user();
        $team->loadMissing(['members.user', 'owner']);

        abort_unless($team->hasMember($user) || $team->owner_id === $user->id, 404);
        abort_unless($team->canManageResources($user), 403, __('لا تملك صلاحية إدارة موارد الفريق.'));

        if ($loadRelations) {
            $team->loadMissing(['courses', 'projects', 'tasks']);
        }

        return $team;
    }

    private function teamResourceResponse(Team $team, string $message): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => new TeamResource($team->loadMissing(['courses', 'projects', 'tasks', 'members.user', 'owner'])),
        ]);
    }
}
