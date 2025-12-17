<?php

use App\Http\Controllers\CourseReviewController;
use App\Http\Controllers\LessonCommentController;
use App\Http\Controllers\TaskCommentController;
use App\Http\Controllers\ProjectCommentController;
use App\Http\Controllers\ContentReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Comments & Reviews Routes
|--------------------------------------------------------------------------
|
| Routes for course reviews, comments system, and content moderation
|
*/

// ========================================
// COURSE REVIEWS
// ========================================

Route::middleware('auth:sanctum')->group(function () {

    // Get reviews for a course (public)
    Route::get('/courses/{id}/reviews', [CourseReviewController::class, 'index']);

    // User's review operations
    Route::get('/courses/{id}/my-review', [CourseReviewController::class, 'getMyReview']);
    Route::post('/courses/{id}/reviews', [CourseReviewController::class, 'store']);
    Route::put('/reviews/{id}', [CourseReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [CourseReviewController::class, 'destroy']);
    Route::post('/reviews/{id}/vote', [CourseReviewController::class, 'vote']);

    // Admin/Moderator endpoints
    Route::prefix('admin/reviews')->group(function () {
        Route::get('/pending', [CourseReviewController::class, 'getPendingReviews']);
        Route::post('/{id}/approve', [CourseReviewController::class, 'approve']);
        Route::post('/{id}/reject', [CourseReviewController::class, 'reject']);
        Route::post('/{id}/feature', [CourseReviewController::class, 'feature']);
    });
});

// ========================================
// LESSON COMMENTS
// ========================================

Route::middleware('auth:sanctum')->group(function () {

    // Comments CRUD
    Route::get('/lessons/{id}/comments', [LessonCommentController::class, 'index']);
    Route::post('/lessons/{id}/comments', [LessonCommentController::class, 'store']);
    Route::put('/comments/{id}', [LessonCommentController::class, 'update']);
    Route::delete('/comments/{id}', [LessonCommentController::class, 'destroy']);

    // Comment interactions
    Route::post('/comments/{id}/like', [LessonCommentController::class, 'toggleLike']);
    Route::post('/comments/{id}/pin', [LessonCommentController::class, 'pin']);
    Route::post('/comments/{id}/unpin', [LessonCommentController::class, 'unpin']);
});

// ========================================
// TASK COMMENTS
// ========================================

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/tasks/{id}/comments', [TaskCommentController::class, 'index']);
    Route::post('/tasks/{id}/comments', [TaskCommentController::class, 'store']);
    Route::put('/task-comments/{id}', [TaskCommentController::class, 'update']);
    Route::delete('/task-comments/{id}', [TaskCommentController::class, 'destroy']);
});

// ========================================
// PROJECT COMMENTS
// ========================================

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/projects/{id}/comments', [ProjectCommentController::class, 'index']);
    Route::post('/projects/{id}/comments', [ProjectCommentController::class, 'store']);
    Route::put('/project-comments/{id}', [ProjectCommentController::class, 'update']);
    Route::delete('/project-comments/{id}', [ProjectCommentController::class, 'destroy']);
});

// ========================================
// CONTENT REPORTING & MODERATION
// ========================================

Route::middleware('auth:sanctum')->group(function () {

    // User reporting
    Route::post('/content/report', [ContentReportController::class, 'report']);
    Route::get('/my-reports', [ContentReportController::class, 'myReports']);

    // Admin moderation
    Route::prefix('admin/reports')->group(function () {
        Route::get('/', [ContentReportController::class, 'index']);
        Route::get('/pending-count', [ContentReportController::class, 'pendingCount']);
        Route::get('/stats', [ContentReportController::class, 'statistics']);
        Route::get('/{id}', [ContentReportController::class, 'show']);
        Route::post('/{id}/review', [ContentReportController::class, 'startReview']);
        Route::post('/{id}/resolve', [ContentReportController::class, 'resolve']);
        Route::post('/{id}/dismiss', [ContentReportController::class, 'dismiss']);
    });
});

/*
|--------------------------------------------------------------------------
| Usage Examples
|--------------------------------------------------------------------------
|
| === COURSE REVIEWS ===
|
| 1. Get all reviews for a course:
|    GET /api/courses/1/reviews?sort=recent
|    Query params: sort (recent, helpful, rating_high, rating_low), rating (1-5)
|
| 2. Write a review:
|    POST /api/courses/1/reviews
|    Body: { "rating": 5, "review": "دورة ممتازة!" }
|
| 3. Get my review:
|    GET /api/courses/1/my-review
|
| 4. Update my review:
|    PUT /api/reviews/123
|    Body: { "rating": 4, "review": "Updated review" }
|
| 5. Vote on review:
|    POST /api/reviews/123/vote
|    Body: { "vote": "helpful" } // or "not_helpful"
|
| === LESSON COMMENTS ===
|
| 6. Get lesson comments:
|    GET /api/lessons/1/comments
|
| 7. Add a comment:
|    POST /api/lessons/1/comments
|    Body: { "comment": "Great lesson!", "parent_id": null }
|
| 8. Reply to a comment:
|    POST /api/lessons/1/comments
|    Body: { "comment": "Thanks!", "parent_id": 5 }
|
| 9. Like a comment:
|    POST /api/comments/123/like
|
| 10. Pin a comment (Instructor):
|     POST /api/comments/123/pin
|
| === TASK COMMENTS ===
|
| 11. Add task comment with file:
|     POST /api/tasks/1/comments
|     Body (multipart): {
|       "comment": "See attached",
|       "mentions": [2, 3],
|       "attachments": [file1, file2]
|     }
|
| === PROJECT COMMENTS ===
|
| 12. Add project comment:
|     POST /api/projects/1/comments
|     Body: { "comment": "Project update", "mentions": [5] }
|
| === CONTENT REPORTING ===
|
| 13. Report content:
|     POST /api/content/report
|     Body: {
|       "reportable_type": "review",
|       "reportable_id": 123,
|       "reason": "spam",
|       "details": "This is spam content"
|     }
|     Reasons: spam, inappropriate, offensive, harassment, misinformation, other
|
| 14. Get my reports:
|     GET /api/my-reports
|
| === MODERATION (Admin) ===
|
| 15. Get all reports:
|     GET /api/admin/reports?status=pending&reason=spam
|
| 16. Get pending count:
|     GET /api/admin/reports/pending-count
|
| 17. Start reviewing:
|     POST /api/admin/reports/123/review
|
| 18. Resolve report:
|     POST /api/admin/reports/123/resolve
|     Body: {
|       "action": "delete_content",
|       "notes": "Content removed for violating guidelines"
|     }
|     Actions: delete_content, warn_user, no_action
|
| 19. Dismiss report:
|     POST /api/admin/reports/123/dismiss
|     Body: { "notes": "No violation found" }
|
| 20. Get moderation stats:
|     GET /api/admin/reports/stats
|
*/
