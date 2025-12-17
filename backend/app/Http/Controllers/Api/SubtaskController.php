<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subtask;
use App\Models\Task;
use Illuminate\Http\Request;

class SubtaskController extends Controller
{
    public function index(Request $request, Task $task)
    {
        $subtasks = $task->subtasks()->get();
        
        return response()->json([
            'success' => true,
            'data' => $subtasks,
        ]);
    }

    public function store(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'order' => 'nullable|integer',
        ]);

        $subtask = new Subtask([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'order' => $validated['order'] ?? 0,
        ]);

        $task->subtasks()->save($subtask);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء المهمة الفرعية بنجاح',
            'data' => $subtask,
        ], 201);
    }

    public function update(Request $request, Task $task, Subtask $subtask)
    {
        // Verify subtask belongs to task
        if ($subtask->task_id !== $task->id) {
            return response()->json([
                'success' => false,
                'message' => 'المهمة الفرعية غير موجودة',
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'nullable|boolean',
            'order' => 'nullable|integer',
        ]);

        $subtask->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث المهمة الفرعية بنجاح',
            'data' => $subtask,
        ]);
    }

    public function destroy(Request $request, Task $task, Subtask $subtask)
    {
        // Verify subtask belongs to task
        if ($subtask->task_id !== $task->id) {
            return response()->json([
                'success' => false,
                'message' => 'المهمة الفرعية غير موجودة',
            ], 404);
        }

        $subtask->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المهمة الفرعية بنجاح',
        ]);
    }

    public function reorder(Request $request, Task $task)
    {
        $validated = $request->validate([
            'subtasks' => 'required|array',
            'subtasks.*.id' => 'required|exists:subtasks,id',
            'subtasks.*.order' => 'required|integer',
        ]);

        foreach ($validated['subtasks'] as $subtaskData) {
            Subtask::where('id', $subtaskData['id'])
                ->where('task_id', $task->id)
                ->update(['order' => $subtaskData['order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إعادة ترتيب المهام الفرعية بنجاح',
        ]);
    }
}
