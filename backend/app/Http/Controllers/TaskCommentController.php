<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class TaskCommentController extends Controller
{
    /**
     * Get comments for a task
     * GET /api/tasks/{id}/comments
     */
    public function index($taskId)
    {
        $task = Task::findOrFail($taskId);

        // Check if user has access to this task
        if ($task->user_id !== Auth::id() && !$task->isSharedWith(Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بالوصول إلى هذه المهمة'
            ], 403);
        }

        $comments = $task->comments()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $comments
        ]);
    }

    /**
     * Create a comment
     * POST /api/tasks/{id}/comments
     */
    public function store(Request $request, $taskId)
    {
        $task = Task::findOrFail($taskId);

        // Check access
        if ($task->user_id !== Auth::id() && !$task->isSharedWith(Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بالتعليق على هذه المهمة'
            ], 403);
        }

        $request->validate([
            'comment' => 'required|string|max:5000',
            'mentions' => 'nullable|array',
            'mentions.*' => 'exists:users,id',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240' // 10MB
        ]);

        // Handle file uploads
        $attachmentUrls = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('task-comments', 'public');
                $attachmentUrls[] = [
                    'name' => $file->getClientOriginalName(),
                    'url' => Storage::url($path),
                    'size' => $file->getSize(),
                    'type' => $file->getMimeType()
                ];
            }
        }

        $comment = TaskComment::create([
            'task_id' => $taskId,
            'user_id' => Auth::id(),
            'comment' => $request->comment,
            'mentions' => $request->mentions,
            'attachments' => $attachmentUrls
        ]);

        // TODO: Send notifications to mentioned users

        $comment->load('user');

        return response()->json([
            'success' => true,
            'data' => $comment,
            'message' => 'تم إضافة التعليق بنجاح'
        ], 201);
    }

    /**
     * Update a comment
     * PUT /api/task-comments/{id}
     */
    public function update(Request $request, $id)
    {
        $comment = TaskComment::findOrFail($id);

        if ($comment->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بتعديل هذا التعليق'
            ], 403);
        }

        $request->validate([
            'comment' => 'required|string|max:5000'
        ]);

        $comment->update([
            'comment' => $request->comment
        ]);

        $comment->markAsEdited();
        $comment->load('user');

        return response()->json([
            'success' => true,
            'data' => $comment,
            'message' => 'تم تحديث التعليق'
        ]);
    }

    /**
     * Delete a comment
     * DELETE /api/task-comments/{id}
     */
    public function destroy($id)
    {
        $comment = TaskComment::findOrFail($id);

        // User can delete their own comment or task owner can delete any comment
        $task = $comment->task;
        $isTaskOwner = $task->user_id === Auth::id();
        $isCommentOwner = $comment->user_id === Auth::id();

        if (!$isCommentOwner && !$isTaskOwner) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بحذف هذا التعليق'
            ], 403);
        }

        // Delete attachments from storage
        if ($comment->attachments) {
            foreach ($comment->attachments as $attachment) {
                $path = str_replace('/storage/', '', $attachment['url']);
                Storage::disk('public')->delete($path);
            }
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف التعليق'
        ]);
    }
}
