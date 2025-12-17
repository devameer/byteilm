<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CourseController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filter = $request->get('filter', 'all'); // Default to all

        $query = Course::with('category');

        if ($filter === 'active') {
            $query->where('active', true);
        } elseif ($filter === 'inactive') {
            $query->where('active', false);
        }
        // If 'all', no filter is applied

        $courses = $query->get();

        return view('courses.index', compact('courses', 'filter'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $categories = Category::all();
        $selectedCategoryId = $request->query('category_id');

        if (request()->ajax()) {
            return response()->json([
                'form' => view('courses.partials.form', compact('categories', 'selectedCategoryId'))->render(),
                'title' => 'إضافة دورة جديدة'
            ]);
        }

        return view('courses.create', compact('categories', 'selectedCategoryId'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'link' => 'nullable|string|max:255',
            'category_id' => 'required|exists:categories,id',
        ]);

        $course = new Course();
        $course->name = $validated['name'];
        $course->link = $validated['link'];
        $course->category_id = $validated['category_id'];

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('courses', 'public');
            $course->image = $path;
        }

        $course->save();

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء الدورة بنجاح',
                'course' => $course->load('category'),
                'redirect' => route('courses.index')
            ]);
        }

        return redirect()->route('courses.index')
            ->with('success', 'تم إنشاء الدورة بنجاح');
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        $filter = $request->get('filter', 'uncomplete'); // Default to uncomplete

        $course = Course::with(['category', 'lessons' => function($query) use ($filter) {
            if ($filter === 'complete') {
                $query->where('completed', true);
            } elseif ($filter === 'uncomplete') {
                $query->where('completed', false);
            }
            // If 'all', no filter is applied

            // Order lessons by order column, then by ID
            $query->orderBy('order', 'asc')->orderBy('id', 'asc');
        }, 'lessons.category'])->findOrFail($id);

        // Group lessons by category
        $lessonsByCategory = $course->lessons->groupBy(function($lesson) {
            return $lesson->category ? $lesson->category->name : 'غير مصنف';
        });

        return view('courses.show', compact('course', 'filter', 'lessonsByCategory'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $course = Course::findOrFail($id);
        $categories = Category::all();

        if (request()->ajax()) {
            return response()->json([
                'form' => view('courses.partials.form', compact('course', 'categories'))->render(),
                'title' => 'تعديل الدورة: ' . $course->name
            ]);
        }

        return view('courses.edit', compact('course', 'categories'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'link' => 'nullable|string|max:255',
            'category_id' => 'required|exists:categories,id',
        ]);

        $course = Course::findOrFail($id);
        $course->name = $validated['name'];
        $course->link = $validated['link'];
        $course->category_id = $validated['category_id'];

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($course->image) {
                Storage::disk('public')->delete($course->image);
            }

            $path = $request->file('image')->store('courses', 'public');
            $course->image = $path;
        }

        $course->save();

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'تم تحديث الدورة بنجاح',
                'course' => $course->load('category'),
                'redirect' => route('courses.index')
            ]);
        }

        return redirect()->route('courses.index')
            ->with('success', 'تم تحديث الدورة بنجاح');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $course = Course::findOrFail($id);

        // Delete image if exists
        if ($course->image) {
            Storage::disk('public')->delete($course->image);
        }

        $course->delete();

        if (request()->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'تم حذف الدورة بنجاح'
            ]);
        }

        return redirect()->route('courses.index')
            ->with('success', 'تم حذف الدورة بنجاح');
    }

    /**
     * Show the form for importing lessons from JSON.
     */
    public function showImportLessons(string $id)
    {
        $course = Course::findOrFail($id);

        if (request()->ajax()) {
            return response()->json([
                'form' => view('courses.partials.import-lessons-form', compact('course'))->render(),
                'title' => 'إضافة دروس للدورة: ' . $course->name
            ]);
        }

        return view('courses.import-lessons', compact('course'));
    }

    /**
     * Import lessons from JSON data.
     */
    public function importLessons(Request $request, string $id)
    {
        $course = Course::findOrFail($id);

        $validated = $request->validate([
            'lessons_json' => 'required|json',
            'add_numbering' => 'nullable|boolean',
        ]);

        $lessonsData = json_decode($validated['lessons_json'], true);
        $importedCount = 0;
        $errors = [];
        $addNumbering = $request->has('add_numbering') && $request->add_numbering;

        // Get the current highest lesson number and order for this course
        $currentMaxNumber = 0;
        $currentMaxOrder = 0;

        $lastLesson = $course->lessons()
            ->orderBy('order', 'desc')
            ->first();

        if ($lastLesson) {
            $currentMaxOrder = $lastLesson->order;

            // Try to extract number from the lesson name (e.g., "1. Lesson" -> 1)
            if ($addNumbering && preg_match('/^(\d+)[\.\-\s]/', $lastLesson->name, $matches)) {
                $currentMaxNumber = (int)$matches[1];
            }
        }

        foreach ($lessonsData as $index => $lessonData) {
            try {
                // Validate each lesson
                $validator = Validator::make($lessonData, [
                    'name' => 'required|string|max:255',
                    'duration' => 'nullable|string|max:255',
                    'link' => 'nullable|string|max:255',
                    'type' => 'nullable|string|max:255',
                    'category' => 'nullable|string|max:255',
                ]);

                if ($validator->fails()) {
                    $errors[] = "خطأ في الدرس رقم " . ($index + 1) . ": " . implode(', ', $validator->errors()->all());
                    continue;
                }

                // Handle category if provided
                $categoryId = null;
                if (!empty($lessonData['category'])) {
                    // Try to find existing category or create new one
                    $category = $course->lessonCategories()
                        ->firstOrCreate(['name' => $lessonData['category']]);
                    $categoryId = $category->id;
                }

                // Add numbering to lesson name if requested
                $lessonName = $lessonData['name'];
                if ($addNumbering) {
                    $lessonNumber = $currentMaxNumber + $index + 1;
                    $lessonName = $lessonNumber . '. ' . $lessonName;
                }

                // Create the lesson with order
                $lesson = new \App\Models\Lesson();
                $lesson->name = $lessonName;
                $lesson->course_id = $course->id;
                $lesson->duration = $lessonData['duration'] ?? null;
                $lesson->link = $lessonData['link'] ?? null;
                $lesson->type = $lessonData['type'] ?? null;
                $lesson->lesson_category_id = $categoryId;
                $lesson->order = $currentMaxOrder + $index + 1;
                $lesson->save();

                $importedCount++;
            } catch (\Exception $e) {
                $errors[] = "خطأ في الدرس رقم " . ($index + 1) . ": " . $e->getMessage();
            }
        }

        $message = "تم استيراد $importedCount درس بنجاح";
        if (!empty($errors)) {
            $message .= ". مع وجود الأخطاء التالية: " . implode(', ', $errors);
        }

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $message,
                'imported_count' => $importedCount,
                'errors' => $errors,
                'redirect' => route('courses.show', $course->id)
            ]);
        }

        return redirect()->route('courses.show', $course->id)
            ->with('success', $message);
    }

    /**
     * Toggle the active status of a course
     */
    public function toggleActive(string $id)
    {
        $course = Course::findOrFail($id);
        $course->active = !$course->active;
        $course->save();

        $status = $course->active ? 'نشطة' : 'غير نشطة';

        if (request()->ajax()) {
            return response()->json([
                'success' => true,
                'message' => "تم تغيير حالة الدورة إلى $status",
                'course' => $course
            ]);
        }

        return redirect()->back()
            ->with('success', "تم تغيير حالة الدورة إلى $status");
    }

    /**
     * Auto-number lessons in a course
     */
    public function autoNumberLessons(Request $request, string $id)
    {
        $request->validate([
            'numbering_type' => 'required|in:sequential,by_category',
        ]);

        $course = Course::with(['lessons' => function($query) {
            $query->with('category')->orderBy('order', 'asc')->orderBy('id', 'asc');
        }])->findOrFail($id);

        $numberingType = $request->numbering_type;
        $updatedCount = 0;

        try {
            if ($numberingType === 'sequential') {
                // Numbering sequential for all lessons
                $number = 1;
                foreach ($course->lessons as $lesson) {
                    // Remove existing numbering first
                    $cleanName = preg_replace('/^\d+[\.\-\s]+/', '', $lesson->name);

                    // Add new numbering
                    $lesson->name = $number . '. ' . $cleanName;
                    $lesson->save();

                    $number++;
                    $updatedCount++;
                }
            } else {
                // Numbering by category (restart numbering for each category)
                $lessonsByCategory = $course->lessons->groupBy(function($lesson) {
                    return $lesson->category ? $lesson->category->name : 'غير مصنف';
                });

                foreach ($lessonsByCategory as $categoryName => $lessons) {
                    $number = 1;
                    foreach ($lessons as $lesson) {
                        // Remove existing numbering first
                        $cleanName = preg_replace('/^\d+[\.\-\s]+/', '', $lesson->name);

                        // Add new numbering
                        $lesson->name = $number . '. ' . $cleanName;
                        $lesson->save();

                        $number++;
                        $updatedCount++;
                    }
                }
            }

            if (request()->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => "تم ترقيم $updatedCount درس بنجاح",
                    'updated_count' => $updatedCount
                ]);
            }

            return redirect()->back()
                ->with('success', "تم ترقيم $updatedCount درس بنجاح");

        } catch (\Exception $e) {
            if (request()->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'حدث خطأ أثناء الترقيم: ' . $e->getMessage()
                ], 500);
            }

            return redirect()->back()
                ->with('error', 'حدث خطأ أثناء الترقيم');
        }
    }
}
