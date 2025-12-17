<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FileAttachment;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileAttachmentController extends Controller
{
    public function index(Request $request, Task $task)
    {
        $attachments = $task->attachments()->get();
        
        return response()->json([
            'success' => true,
            'data' => $attachments,
        ]);
    }

    public function store(Request $request, Task $task)
    {
        $validated = $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
        ]);

        $file = $request->file('file');
        
        // Store file
        $path = $file->store('attachments', 'public');
        
        // Create attachment record
        $attachment = new FileAttachment([
            'user_id' => $request->user()->id,
            'filename' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'path' => $path,
            'disk' => 'public',
        ]);

        $task->attachments()->save($attachment);

        return response()->json([
            'success' => true,
            'message' => 'تم رفع الملف بنجاح',
            'data' => $attachment,
        ], 201);
    }

    public function download(Request $request, Task $task, FileAttachment $attachment)
    {
        // Verify attachment belongs to task
        if ($attachment->attachable_type !== Task::class || $attachment->attachable_id !== $task->id) {
            return response()->json([
                'success' => false,
                'message' => 'الملف غير موجود',
            ], 404);
        }

        // Verify user has access to task
        if ($task->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'لا تملك صلاحية الوصول لهذا الملف',
            ], 403);
        }

        if (!Storage::disk('public')->exists($attachment->path)) {
            return response()->json([
                'success' => false,
                'message' => 'الملف غير موجود',
            ], 404);
        }

        return response()->download(
            Storage::disk('public')->path($attachment->path),
            $attachment->original_name
        );
    }

    public function destroy(Request $request, Task $task, FileAttachment $attachment)
    {
        // Verify attachment belongs to task
        if ($attachment->attachable_type !== Task::class || $attachment->attachable_id !== $task->id) {
            return response()->json([
                'success' => false,
                'message' => 'الملف غير موجود',
            ], 404);
        }

        // Delete file from storage
        if (Storage::disk('public')->exists($attachment->path)) {
            Storage::disk('public')->delete($attachment->path);
        }

        // Delete attachment record
        $attachment->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الملف بنجاح',
        ]);
    }
}
