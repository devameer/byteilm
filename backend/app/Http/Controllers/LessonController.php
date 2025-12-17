<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\Course;
use App\Models\LessonCategory;
use Illuminate\Http\Request;

class LessonController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Lesson::with('course');

        // Default filter state (incomplete lessons)
        $filterState = $request->filter ?? 'incomplete';

        // Apply filter based on state
        if ($filterState === 'completed') {
            $query->where('completed', true);
        } elseif ($filterState === 'incomplete') {
            $query->where('completed', false);
        }
        // 'all' filter doesn't need any where clause

        $lessons = $query->get();

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'html' => view('lessons.partials.lessons_table', compact('lessons'))->render()
            ]);
        }

        return view('lessons.index', compact('lessons', 'filterState'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        try {
            if (!$request->has('course_id')) {
                throw new \Exception('Course ID is required');
            }

            $course = Course::with('lessonCategories')->findOrFail($request->course_id);

            if (request()->ajax()) {
                return [
                    'form' => view('lessons.partials.form', compact('course'))->render()
                ];
            }

            return view('lessons.create', compact('course'));
        } catch (\Exception $e) {
            if (request()->ajax()) {
                return response()->json([
                    'error' => $e->getMessage()
                ], 422);
            }

            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Get categories for a specific course
     */
    public function getCourseCategories($courseId)
    {
        $categories = Course::findOrFail($courseId)->lessonCategories;
        return response()->json($categories);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $course = Course::findOrFail($request->course_id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'link' => 'nullable|string|max:255',
            'duration' => 'nullable|string|max:50',
            'type' => 'nullable|string|max:50',
            'category_action' => 'required|in:select,create',
            'lesson_category_id' => 'nullable|exists:lesson_categories,id',
            'new_category_name' => 'required_if:category_action,create|string|max:255',
        ]);

        // Handle category
        $categoryId = null;
        if ($validated['category_action'] === 'create' && !empty($validated['new_category_name'])) {
            // Try to find existing category with same name or create new one
            $category = LessonCategory::firstOrCreate([
                'name' => $validated['new_category_name'],
                'course_id' => $course->id
            ]);
            $categoryId = $category->id;
        } elseif ($validated['category_action'] === 'select' && !empty($validated['lesson_category_id'])) {
            // Verify the category belongs to the selected course
            $category = LessonCategory::where('course_id', $course->id)
                ->where('id', $validated['lesson_category_id'])
                ->first();
            if ($category) {
                $categoryId = $category->id;
            }
        }

        $lesson = new Lesson();
        $lesson->name = $validated['name'];
        $lesson->description = $request->description;
        $lesson->link = $validated['link'];
        $lesson->duration = $validated['duration'];
        $lesson->type = $validated['type'] ?? null;
        $lesson->course_id = $course->id;
        $lesson->lesson_category_id = $categoryId;

        $lesson->save();

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء الدرس بنجاح',
                'lesson' => $lesson->load('course'),
                'redirect' => route('lessons.index')
            ]);
        }

        return redirect()->route('lessons.index')
            ->with('success', 'تم إنشاء الدرس بنجاح');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $lesson = Lesson::with('course')->findOrFail($id);
        $lessons = $lesson->course->lessons->where('id', '!=', $lesson->id)->where('completed', false)->take(5);
        return view('lessons.show', compact('lesson', 'lessons'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        try {
            $lesson = Lesson::with('course.lessonCategories')->findOrFail($id);
            $course = $lesson->course;

            if (request()->ajax()) {
                return [
                    'form' => view('lessons.partials.form', compact('lesson', 'course'))->render()
                ];
            }

            return view('lessons.edit', compact('lesson', 'course'));
        } catch (\Exception $e) {
            if (request()->ajax()) {
                return response()->json([
                    'error' => $e->getMessage()
                ], 422);
            }

            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $lesson = Lesson::findOrFail($id);
        $course = Course::findOrFail($request->course_id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'link' => 'nullable|string|max:255',
            'duration' => 'nullable|string|max:50',
            'type' => 'nullable|string|max:50',
            'category_action' => 'required|in:select,create',
            'lesson_category_id' => 'nullable|exists:lesson_categories,id',
            'new_category_name' => 'required_if:category_action,create|string|max:255',
        ]);

        // Handle category
        $categoryId = null;
        if ($validated['category_action'] === 'create' && !empty($validated['new_category_name'])) {
            // Try to find existing category with same name or create new one
            $category = LessonCategory::firstOrCreate([
                'name' => $validated['new_category_name'],
                'course_id' => $course->id
            ]);
            $categoryId = $category->id;
        } elseif ($validated['category_action'] === 'select' && !empty($validated['lesson_category_id'])) {
            // Verify the category belongs to the selected course
            $category = LessonCategory::where('course_id', $course->id)
                ->where('id', $validated['lesson_category_id'])
                ->first();
            if ($category) {
                $categoryId = $category->id;
            }
        }

        $lesson->name = $validated['name'];
        $lesson->description = $request->description;
        $lesson->link = $validated['link'];
        $lesson->duration = $validated['duration'];
        $lesson->type = $validated['type'] ?? null;
        $lesson->course_id = $course->id;
        $lesson->lesson_category_id = $categoryId;

        $lesson->save();

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'تم تحديث الدرس بنجاح',
                'lesson' => $lesson->load('course'),
                'redirect' => route('lessons.index')
            ]);
        }

        return redirect()->route('lessons.index')
            ->with('success', 'تم تحديث الدرس بنجاح');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $lesson = Lesson::findOrFail($id);
        $lesson->delete();

        if (request()->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'تم حذف الدرس بنجاح'
            ]);
        }

        return redirect()->route('lessons.index')
            ->with('success', 'تم حذف الدرس بنجاح');
    }
}
