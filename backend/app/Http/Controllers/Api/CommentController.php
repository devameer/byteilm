<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Task;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Request $request, Task $task)
    {
        $comments = $task->comments()->with(['user', 'replies.user'])->get();
        
        return response()->json([
            'success' => true,
            'data' => $comments,
        ]);
    }

    public function store(Request $request, Task $task)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:1000',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        // Verify parent comment belongs to the same task
        if (!empty($validated['parent_id'])) {
            $parentComment = Comment::find($validated['parent_id']);
            if (!$parentComment || 
                $parentComment->commentable_type !== Task::class || 
                $parentComment->commentable_id !== $task->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'التعليق الرئيسي غير موجود',
                ], 404);
            }
        }

        $comment = new Comment([
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        $task->comments()->save($comment);

        // Load relationships for response
        $comment->load(['user', 'parent.user']);

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة التعليق بنجاح',
            'data' => $comment,
        ], 201);
    }

    public function update(Request $request, Task $task, Comment $comment)
    {
        // Verify comment belongs to task
        if ($comment->commentable_type !== Task::class || $comment->commentable_id !== $task->id) {
            return response()->json([
                'success' => false,
                'message' => 'التعليق غير موجود',
            ], 404);
        }

        // Verify user owns the comment
        if ($comment->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'لا تملك صلاحية تعديل هذا التعليق',
            ], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $comment->update($validated);

        // Load relationships for response
        $comment->load(['user', 'parent.user']);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث التعليق بنجاح',
            'data' => $comment,
        ]);
    }

    public function destroy(Request $request, Task $task, Comment $comment)
    {
        // Verify comment belongs to task
        if ($comment->commentable_type !== Task::class || $comment->commentable_id !== $task->id) {
            return response()->json([
                'success' => false,
                'message' => 'التعليق غير موجود',
            ], 404);
        }

        // Verify user owns the comment or is admin
        if ($comment->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'لا تملك صلاحية حذف هذا التعليق',
            ], 403);
        }

        // Delete comment and all its replies
        $comment->replies()->delete();
        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف التعليق بنجاح',
        ]);
    }
}
