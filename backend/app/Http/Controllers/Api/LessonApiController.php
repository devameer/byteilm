<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LessonResource;
use App\Models\Lesson;
use App\Models\LessonCategory;
use Illuminate\Http\Request;

class LessonApiController extends Controller
{
    /**
     * Get all lessons
     */
    public function index(Request $request)
    {
        $query = Lesson::with(['course', 'category', 'task' => function($taskQuery) {
            $taskQuery->whereIn('status', ['pending', 'in_progress']);
        }]);

        // Filter by course
        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        // Filter by completion
        if ($request->filled('completed')) {
            $completed = filter_var($request->completed, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($completed !== null) {
                $query->where('completed', $completed);
            }
        }

        $perPage = (int) $request->input('per_page', 0);

        if ($perPage > 0) {
            $perPage = min($perPage, 50);
            $lessons = $query->orderBy('order')->orderBy('id')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => LessonResource::collection($lessons->getCollection()),
                'meta' => [
                    'current_page' => $lessons->currentPage(),
                    'per_page' => $lessons->perPage(),
                    'total' => $lessons->total(),
                    'last_page' => $lessons->lastPage(),
                ],
            ]);
        }

        $lessons = $query->orderBy('order')->orderBy('id')->get();

        return response()->json([
            'success' => true,
            'data' => LessonResource::collection($lessons),
        ]);
    }

    /**
     * Get single lesson
     */
    public function show($id)
    {
        $lesson = Lesson::with(['course', 'category', 'task'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new LessonResource($lesson),
        ]);
    }

    /**
     * Create new lesson
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'link' => 'nullable|string|max:500',
            'duration' => 'nullable|string|max:50',
            'type' => 'nullable|string|max:50',
            'order' => 'nullable|integer',
            'lesson_category_id' => 'nullable|exists:lesson_categories,id',
            'new_category_name' => 'nullable|string|max:255',
        ]);

        $lessonCategoryId = $this->resolveLessonCategoryId(
            $validated['course_id'],
            $validated['lesson_category_id'] ?? null,
            $validated['new_category_name'] ?? null
        );

        $lesson = new Lesson();
        $lesson->fill([
            'course_id' => $validated['course_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'link' => $validated['link'] ?? null,
            'duration' => $validated['duration'] ?? null,
            'type' => $validated['type'] ?? null,
            'order' => $validated['order'] ?? 0,
            'lesson_category_id' => $lessonCategoryId,
        ]);

        $lesson->save();

        $lesson->course?->updateCompletionStatus();

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الدرس بنجاح',
            'data' => new LessonResource($lesson->load('course')),
        ], 201);
    }

    /**
     * Update lesson
     */
    public function update(Request $request, $id)
    {
        $lesson = Lesson::findOrFail($id);

        $validated = $request->validate([
            'course_id' => 'sometimes|required|exists:courses,id',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'link' => 'nullable|string|max:500',
            'duration' => 'nullable|string|max:50',
            'type' => 'nullable|string|max:50',
            'order' => 'nullable|integer',
            'lesson_category_id' => 'nullable|exists:lesson_categories,id',
            'new_category_name' => 'nullable|string|max:255',
            'completed' => 'nullable|boolean',
        ]);

        if (array_key_exists('course_id', $validated)) {
            $lesson->course_id = $validated['course_id'];
        }
        if (array_key_exists('name', $validated)) {
            $lesson->name = $validated['name'];
        }
        if (array_key_exists('description', $validated)) {
            $lesson->description = $validated['description'];
        }
        if (array_key_exists('link', $validated)) {
            $lesson->link = $validated['link'];
        }
        if (array_key_exists('duration', $validated)) {
            $lesson->duration = $validated['duration'];
        }
        if (array_key_exists('type', $validated)) {
            $lesson->type = $validated['type'];
        }
        if (array_key_exists('order', $validated)) {
            $lesson->order = $validated['order'];
        }

        if (array_key_exists('completed', $validated)) {
            $lesson->completed = (bool) $validated['completed'];
            $lesson->completed_at = $lesson->completed ? now() : null;
        }

        if (array_key_exists('lesson_category_id', $validated) || array_key_exists('new_category_name', $validated)) {
            $lesson->lesson_category_id = $this->resolveLessonCategoryId(
                $lesson->course_id,
                $validated['lesson_category_id'] ?? null,
                $validated['new_category_name'] ?? null
            );
        }

        $lesson->save();

        $lesson->course?->updateCompletionStatus();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الدرس بنجاح',
            'data' => new LessonResource($lesson->load('course')),
        ]);
    }

    /**
     * Delete lesson
     */
    public function destroy($id)
    {
        $lesson = Lesson::findOrFail($id);
        $course = $lesson->course;

        $lesson->delete();

        $course?->updateCompletionStatus();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الدرس بنجاح',
        ]);
    }

    /**
     * Toggle lesson completion
     */
    public function toggleCompletion($id)
    {
        $lesson = Lesson::findOrFail($id);
        $lesson->completed = !$lesson->completed;
        $lesson->completed_at = $lesson->completed ? now() : null;
        $lesson->save();

        $lesson->course?->updateCompletionStatus();

        return response()->json([
            'success' => true,
            'message' => $lesson->completed ? 'تم وضع مكتمل' : 'تم إلغاء علامة مكتمل',
            'data' => new LessonResource($lesson->load('course')),
        ]);
    }

    /**
     * Resolve lesson category id from existing or new category name.
     */
    protected function resolveLessonCategoryId(int $courseId, ?int $existingCategoryId, ?string $newCategoryName): ?int
    {
        if ($newCategoryName) {
            $category = LessonCategory::firstOrCreate([
                'course_id' => $courseId,
                'name' => $newCategoryName,
            ]);

            return $category->id;
        }

        if ($existingCategoryId) {
            $category = LessonCategory::where('course_id', $courseId)
                ->where('id', $existingCategoryId)
                ->first();

            return $category?->id;
        }

        return null;
    }
}
