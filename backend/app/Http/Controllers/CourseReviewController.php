<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseReviewController extends Controller
{
    /**
     * Get reviews for a course
     * GET /api/courses/{id}/reviews
     */
    public function index(Request $request, $courseId)
    {
        $course = Course::findOrFail($courseId);

        $query = $course->reviews()->approved()->with(['user', 'votes']);

        // Sorting
        $sort = $request->input('sort', 'recent');
        switch ($sort) {
            case 'helpful':
                $query->orderBy('helpful_count', 'desc');
                break;
            case 'rating_high':
                $query->orderBy('rating', 'desc');
                break;
            case 'rating_low':
                $query->orderBy('rating', 'asc');
                break;
            default: // recent
                $query->latest();
        }

        // Filter by rating
        if ($request->has('rating')) {
            $query->where('rating', $request->rating);
        }

        $reviews = $query->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $reviews,
            'summary' => $course->ratingSummary
        ]);
    }

    /**
     * Create a review
     * POST /api/courses/{id}/reviews
     */
    public function store(Request $request, $courseId)
    {
        $course = Course::findOrFail($courseId);

        // Check if user is enrolled
        $enrollment = Auth::user()->enrollments()->where('course_id', $courseId)->first();
        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'يجب أن تكون مسجلاً في الدورة لكتابة مراجعة'
            ], 403);
        }

        // Check if already reviewed
        $existingReview = CourseReview::where('course_id', $courseId)
            ->where('user_id', Auth::id())
            ->first();

        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => 'لقد قمت بمراجعة هذه الدورة مسبقاً'
            ], 422);
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:2000'
        ]);

        $review = CourseReview::create([
            'course_id' => $courseId,
            'user_id' => Auth::id(),
            'rating' => $request->rating,
            'review' => $request->review,
            'is_approved' => false // Requires moderation
        ]);

        return response()->json([
            'success' => true,
            'data' => $review->load('user'),
            'message' => 'تم إرسال مراجعتك وستتم مراجعتها قريباً'
        ], 201);
    }

    /**
     * Update a review
     * PUT /api/reviews/{id}
     */
    public function update(Request $request, $id)
    {
        $review = CourseReview::findOrFail($id);

        if ($review->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بتعديل هذه المراجعة'
            ], 403);
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:2000'
        ]);

        $review->update([
            'rating' => $request->rating,
            'review' => $request->review,
            'is_approved' => false // Requires re-moderation
        ]);

        // Update course rating summary
        $review->course->updateRatingSummary();

        return response()->json([
            'success' => true,
            'data' => $review->load('user'),
            'message' => 'تم تحديث مراجعتك'
        ]);
    }

    /**
     * Delete a review
     * DELETE /api/reviews/{id}
     */
    public function destroy($id)
    {
        $review = CourseReview::findOrFail($id);

        if ($review->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بحذف هذه المراجعة'
            ], 403);
        }

        $course = $review->course;
        $review->delete();

        // Update course rating summary
        $course->updateRatingSummary();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المراجعة'
        ]);
    }

    /**
     * Vote on a review
     * POST /api/reviews/{id}/vote
     */
    public function vote(Request $request, $id)
    {
        $review = CourseReview::findOrFail($id);

        $request->validate([
            'vote' => 'required|in:helpful,not_helpful'
        ]);

        if ($request->vote === 'helpful') {
            $review->voteHelpful(Auth::id());
        } else {
            $review->voteNotHelpful(Auth::id());
        }

        return response()->json([
            'success' => true,
            'data' => [
                'helpful_count' => $review->helpful_count,
                'not_helpful_count' => $review->not_helpful_count
            ]
        ]);
    }

    /**
     * Get user's review for a course
     * GET /api/courses/{id}/my-review
     */
    public function getMyReview($courseId)
    {
        $review = CourseReview::where('course_id', $courseId)
            ->where('user_id', Auth::id())
            ->with('user')
            ->first();

        if (!$review) {
            return response()->json([
                'success' => false,
                'message' => 'لم تقم بمراجعة هذه الدورة بعد'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $review
        ]);
    }

    /**
     * ========================================
     * MODERATION ENDPOINTS (Admin/Instructor only)
     * ========================================
     */

    /**
     * Get pending reviews
     * GET /api/admin/reviews/pending
     */
    public function getPendingReviews()
    {
        // TODO: Add admin/instructor middleware

        $reviews = CourseReview::pending()
            ->with(['course', 'user'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $reviews
        ]);
    }

    /**
     * Approve a review
     * POST /api/admin/reviews/{id}/approve
     */
    public function approve($id)
    {
        // TODO: Add admin/instructor middleware

        $review = CourseReview::findOrFail($id);
        $review->approve(Auth::id());

        return response()->json([
            'success' => true,
            'message' => 'تمت الموافقة على المراجعة'
        ]);
    }

    /**
     * Reject a review
     * POST /api/admin/reviews/{id}/reject
     */
    public function reject($id)
    {
        // TODO: Add admin/instructor middleware

        $review = CourseReview::findOrFail($id);
        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم رفض المراجعة'
        ]);
    }

    /**
     * Feature a review
     * POST /api/admin/reviews/{id}/feature
     */
    public function feature($id)
    {
        // TODO: Add admin/instructor middleware

        $review = CourseReview::findOrFail($id);
        $review->markAsFeatured();

        return response()->json([
            'success' => true,
            'message' => 'تم تمييز المراجعة'
        ]);
    }
}
