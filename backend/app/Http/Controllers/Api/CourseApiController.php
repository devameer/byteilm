<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Http\Resources\LessonResource;
use App\Models\Course;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CourseApiController extends Controller
{
    protected $cacheService;

    public function __construct(CacheService $cacheService)
    {
        $this->middleware('usage.limit:courses')->only(['store']);
        $this->cacheService = $cacheService;
    }

    /**
     * Get all courses
     */
    public function index(Request $request)
    {
        $cacheKey = 'courses:' . md5(json_encode($request->all()));
        
        $courses = $this->cacheService->remember($cacheKey, 300, function () use ($request) {
            $query = Course::with('category')
                ->withCount('lessons')
                ->withCount(['lessons as completed_lessons_count' => function ($lessonQuery) {
                    $lessonQuery->where('completed', true);
                }]);

            // Filter by active status
            if ($request->has('active')) {
                $active = filter_var($request->active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if (!is_null($active)) {
                    $query->where('active', $active);
                }
            }

            // Filter by category
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            // Filter by completion status
            if ($request->has('completed')) {
                $completed = filter_var($request->completed, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if (!is_null($completed)) {
                    $query->where('completed', $completed);
                }
            }

            // Search
            if ($request->has('search')) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }

            return $query->orderBy('name')->get();
        });

        return $this->successResponse(
            CourseResource::collection($courses),
            'تم جلب الدورات بنجاح'
        );
    }

    /**
     * Get single course
     */
    public function show($id)
    {
        $course = Course::with([
            'category',
            'lessons' => function ($query) {
                $query->with(['category', 'task' => function($taskQuery) {
                    $taskQuery->whereIn('status', ['pending', 'in_progress']);
                }])
                      ->orderBy('order')
                      ->orderBy('id');
            },
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new CourseResource($course),
        ]);
    }

    /**
     * Create new course
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'link' => 'nullable|string|max:500',
            'category_id' => 'required|exists:categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'active' => 'nullable|boolean',
        ]);

        $course = new Course();
        $course->name = $validated['name'];
        $course->link = $validated['link'] ?? null;
        $course->category_id = $validated['category_id'];
        $course->active = (bool) ($validated['active'] ?? false);

        if ($request->hasFile('image')) {
            $course->image = $request->file('image')->store('courses', 'public');
        }

        $course->save();

        // Clear cache
        $this->cacheService->clearPattern('courses:*');

        if ($course->category) {
            $course->category->updateProgress();
        }

        return $this->successResponse(
            new CourseResource($course->load('category')),
            'تم إنشاء الدورة بنجاح',
            201
        );
    }

    /**
     * Update course
     */
    public function update(Request $request, $id)
    {
        $course = Course::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'link' => 'nullable|string|max:500',
            'category_id' => 'nullable|exists:categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'active' => 'nullable|boolean',
            'completed' => 'nullable|boolean',
        ]);

        if (array_key_exists('name', $validated)) {
            $course->name = $validated['name'];
        }

        if (array_key_exists('link', $validated)) {
            $course->link = $validated['link'];
        }

        if (array_key_exists('category_id', $validated)) {
            $course->category_id = $validated['category_id'];
        }

        if (array_key_exists('active', $validated)) {
            $course->active = (bool) $validated['active'];
        }

        if ($request->hasFile('image')) {
            if ($course->image) {
                Storage::disk('public')->delete($course->image);
            }
            $course->image = $request->file('image')->store('courses', 'public');
        }

        if (array_key_exists('completed', $validated)) {
            $course->completed = (bool) $validated['completed'];
            if ($course->completed) {
                $course->completed_at = now();
                $course->progress = 100;
            }
        }

        $course->save();

        // Clear cache
        $this->cacheService->clearPattern('courses:*');

        $course->refresh()->load('category');

        if ($course->category) {
            $course->category->updateProgress();
        }

        return $this->successResponse(
            new CourseResource($course),
            'تم تحديث الدورة بنجاح'
        );
    }

    /**
     * Delete course
     */
    public function destroy($id)
    {
        $course = Course::findOrFail($id);
        $category = $course->category;

        if ($course->image) {
            Storage::disk('public')->delete($course->image);
        }

        $course->delete();

        // Clear cache
        $this->cacheService->clearPattern('courses:*');

        if ($category) {
            $category->updateProgress();
        }

        return $this->successResponse(null, 'تم حذف الدورة بنجاح');
    }

    /**
     * Toggle course active status
     */
    public function toggleActive($id)
    {
        $course = Course::findOrFail($id);
        $course->active = !$course->active;
        $course->save();

        // Clear cache
        $this->cacheService->clearPattern('courses:*');

        if ($course->category) {
            $course->category->updateProgress();
        }

        return $this->successResponse(
            new CourseResource($course),
            $course->active ? 'تم تفعيل الدورة' : 'تم إيقاف الدورة'
        );
    }

    /**
     * Get course lessons
     */
    public function lessons($id)
    {
        $course = Course::with(['lessons' => function($query) {
            $query->with('category')
                  ->orderBy('order')
                  ->orderBy('id');
        }])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => LessonResource::collection($course->lessons),
        ]);
    }

    /**
     * Get course statistics
     */
    public function statistics($id)
    {
        $course = Course::with('lessons')->findOrFail($id);

        $totalLessons = $course->lessons->count();
        $completedLessons = $course->lessons->where('completed', true)->count();
        $progress = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 2) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'total_lessons' => $totalLessons,
                'completed_lessons' => $completedLessons,
                'remaining_lessons' => $totalLessons - $completedLessons,
                'progress' => $progress,
                'active' => (bool) $course->active,
                'completed' => (bool) $course->completed,
            ],
        ]);
    }

    /**
     * Apply numbering to course lessons.
     */
    public function numberLessons(Request $request, $id)
    {
        $validated = $request->validate([
            'type' => 'required|in:sequential,category',
        ]);

        $course = Course::with([
            'lessons' => function ($query) {
                $query->with('category')
                      ->orderBy('order')
                      ->orderBy('id');
            },
            'category',
        ])->findOrFail($id);

        $updatedCount = 0;

        DB::transaction(function () use ($course, $validated, &$updatedCount) {
            if ($validated['type'] === 'sequential') {
                $number = 1;
                foreach ($course->lessons as $lesson) {
                    $cleanName = preg_replace('/^\s*[\pN]+[.\-\s]+/u', '', $lesson->name) ?? $lesson->name;
                    $cleanName = ltrim($cleanName);
                    $lesson->name = trim($number . '. ' . $cleanName);
                    $lesson->save();
                    $number++;
                    $updatedCount++;
                }
            } else {
                $lessonsByCategory = $course->lessons->groupBy(function ($lesson) {
                    return $lesson->lesson_category_id ?: 'uncategorized';
                });

                foreach ($lessonsByCategory as $lessons) {
                    $number = 1;
                    foreach ($lessons as $lesson) {
                        $cleanName = preg_replace('/^\s*[\pN]+[.\-\s]+/u', '', $lesson->name) ?? $lesson->name;
                        $cleanName = ltrim($cleanName);
                        $lesson->name = trim($number . '. ' . $cleanName);
                        $lesson->save();
                        $number++;
                        $updatedCount++;
                    }
                }
            }
        });

        // Reload course with updated lessons
        $course->refresh()->load([
            'category',
            'lessons' => function ($query) {
                $query->with('category')
                      ->orderBy('order')
                      ->orderBy('id');
            },
        ]);

        return response()->json([
            'success' => true,
            'message' => "تم ترقيم $updatedCount درس بنجاح",
            'updated_count' => $updatedCount,
            'data' => new CourseResource($course),
        ]);
    }
}
