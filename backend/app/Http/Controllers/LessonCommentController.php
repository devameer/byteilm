<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\LessonComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LessonCommentController extends Controller
{
    /**
     * Get comments for a lesson
     * GET /api/lessons/{id}/comments
     */
    public function index($lessonId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        // Get top-level comments with replies
        $comments = $lesson->comments()
            ->topLevel()
            ->with(['user', 'replies.user', 'replies.likes'])
            ->withCount('likes')
            ->orderBy('is_pinned', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $comments
        ]);
    }

    /**
     * Create a comment
     * POST /api/lessons/{id}/comments
     */
    public function store(Request $request, $lessonId)
    {
        $lesson = Lesson::findOrFail($lessonId);

        // Check if user has access to this lesson
        $enrollment = Auth::user()->enrollments()
            ->where('course_id', $lesson->course_id)
            ->first();

        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'يجب أن تكون مسجلاً في الدورة للتعليق'
            ], 403);
        }

        $request->validate([
            'comment' => 'required|string|max:2000',
            'parent_id' => 'nullable|exists:lesson_comments,id'
        ]);

        // Check if it's an instructor reply
        $isInstructor = $lesson->course->instructor_id === Auth::id();

        $comment = LessonComment::create([
            'lesson_id' => $lessonId,
            'user_id' => Auth::id(),
            'parent_id' => $request->parent_id,
            'comment' => $request->comment,
            'is_instructor_reply' => $isInstructor
        ]);

        // Load relationships
        $comment->load('user', 'replies.user');

        return response()->json([
            'success' => true,
            'data' => $comment,
            'message' => 'تم إضافة التعليق بنجاح'
        ], 201);
    }

    /**
     * Update a comment
     * PUT /api/comments/{id}
     */
    public function update(Request $request, $id)
    {
        $comment = LessonComment::findOrFail($id);

        if ($comment->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بتعديل هذا التعليق'
            ], 403);
        }

        $request->validate([
            'comment' => 'required|string|max:2000'
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
     * DELETE /api/comments/{id}
     */
    public function destroy($id)
    {
        $comment = LessonComment::findOrFail($id);

        // User can delete their own comment or instructor can delete any comment in their course
        $lesson = $comment->lesson;
        $isInstructor = $lesson->course->instructor_id === Auth::id();
        $isOwner = $comment->user_id === Auth::id();

        if (!$isOwner && !$isInstructor) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بحذف هذا التعليق'
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف التعليق'
        ]);
    }

    /**
     * Toggle like on a comment
     * POST /api/comments/{id}/like
     */
    public function toggleLike($id)
    {
        $comment = LessonComment::findOrFail($id);

        $liked = $comment->toggleLike(Auth::id());

        return response()->json([
            'success' => true,
            'data' => [
                'liked' => $liked,
                'likes_count' => $comment->likes_count
            ]
        ]);
    }

    /**
     * Pin a comment (Instructor only)
     * POST /api/comments/{id}/pin
     */
    public function pin($id)
    {
        $comment = LessonComment::findOrFail($id);
        $lesson = $comment->lesson;

        // Check if user is the course instructor
        if ($lesson->course->instructor_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'فقط المدرب يمكنه تثبيت التعليقات'
            ], 403);
        }

        $comment->pin();

        return response()->json([
            'success' => true,
            'message' => 'تم تثبيت التعليق'
        ]);
    }

    /**
     * Unpin a comment (Instructor only)
     * POST /api/comments/{id}/unpin
     */
    public function unpin($id)
    {
        $comment = LessonComment::findOrFail($id);
        $lesson = $comment->lesson;

        if ($lesson->course->instructor_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'فقط المدرب يمكنه إلغاء تثبيت التعليقات'
            ], 403);
        }

        $comment->unpin();

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء تثبيت التعليق'
        ]);
    }
}
