<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonVideo;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ContentController extends Controller
{
    public function index()
    {
        $totals = [
            'courses' => Course::withoutGlobalScope('user')->count(),
            'lessons' => Lesson::withoutGlobalScope('user')->count(),
            'projects' => Project::withoutGlobalScope('user')->count(),
            'tasks' => Task::withoutGlobalScope('user')->count(),
        ];

        $storageBytes = LessonVideo::withoutGlobalScope('user')->sum('file_size');

        $topUsersRaw = Lesson::withoutGlobalScope('user')
            ->select('user_id', DB::raw('count(*) as lessons_count'))
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->orderByDesc('lessons_count')
            ->limit(5)
            ->get();

        $users = User::whereIn('id', $topUsersRaw->pluck('user_id'))
            ->get()
            ->keyBy('id');

        $topUsers = $topUsersRaw->map(function ($row) use ($users) {
            return [
                'user' => $users->get($row->user_id),
                'lessons_count' => $row->lessons_count,
            ];
        });

        return view('admin.content.index', [
            'totals' => $totals,
            'storageBytes' => $storageBytes,
            'topUsers' => $topUsers,
        ]);
    }
}
