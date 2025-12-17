<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use Illuminate\Http\Request;

class LessonCompletionController extends BaseController
{
    /**
     * Toggle the completion status of a lesson
     */
    public function toggleCompletion(Request $request, string $id)
    {
        $lesson = Lesson::findOrFail($id);
        
        if ($lesson->completed) {
            $lesson->markAsNotCompleted();
            $message = 'تم إلغاء اكتمال الدرس بنجاح';
        } else {
            $lesson->markAsCompleted();
            $message = 'تم تحديد الدرس كمكتمل بنجاح';
        }
        
        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $message,
                'completed' => $lesson->completed,
                'course_progress' => $lesson->course->progress,
                'course_completed' => $lesson->course->completed,
            ]);
        }
        
        return redirect()->back()->with('success', $message);
    }
}
