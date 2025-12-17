<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProjectCommentController extends Controller
{
    /**
     * Get comments for a project
     * GET /api/projects/{id}/comments
     */
    public function index($projectId)
    {
        $project = Project::findOrFail($projectId);

        // Check if user is a member of the project
        if (!$project->hasMember(Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بالوصول إلى هذا المشروع'
            ], 403);
        }

        $comments = $project->comments()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $comments
        ]);
    }

    /**
     * Create a comment
     * POST /api/projects/{id}/comments
     */
    public function store(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        // Check if user is a member
        if (!$project->hasMember(Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بالتعليق على هذا المشروع'
            ], 403);
        }

        $request->validate([
            'comment' => 'required|string|max:5000',
            'mentions' => 'nullable|array',
            'mentions.*' => 'exists:users,id',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240' // 10MB
        ]);

        // Handle file uploads
        $attachmentUrls = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('project-comments', 'public');
                $attachmentUrls[] = [
                    'name' => $file->getClientOriginalName(),
                    'url' => Storage::url($path),
                    'size' => $file->getSize(),
                    'type' => $file->getMimeType()
                ];
            }
        }

        $comment = ProjectComment::create([
            'project_id' => $projectId,
            'user_id' => Auth::id(),
            'comment' => $request->comment,
            'mentions' => $request->mentions,
            'attachments' => $attachmentUrls
        ]);

        // TODO: Send notifications to mentioned users and project members

        $comment->load('user');

        return response()->json([
            'success' => true,
            'data' => $comment,
            'message' => 'تم إضافة التعليق بنجاح'
        ], 201);
    }

    /**
     * Update a comment
     * PUT /api/project-comments/{id}
     */
    public function update(Request $request, $id)
    {
        $comment = ProjectComment::findOrFail($id);

        if ($comment->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بتعديل هذا التعليق'
            ], 403);
        }

        $request->validate([
            'comment' => 'required|string|max:5000'
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
     * DELETE /api/project-comments/{id}
     */
    public function destroy($id)
    {
        $comment = ProjectComment::findOrFail($id);

        // User can delete their own comment or project owner can delete any comment
        $project = $comment->project;
        $isProjectOwner = $project->user_id === Auth::id();
        $isCommentOwner = $comment->user_id === Auth::id();

        if (!$isCommentOwner && !$isProjectOwner) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بحذف هذا التعليق'
            ], 403);
        }

        // Delete attachments from storage
        if ($comment->attachments) {
            foreach ($comment->attachments as $attachment) {
                $path = str_replace('/storage/', '', $attachment['url']);
                Storage::disk('public')->delete($path);
            }
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف التعليق'
        ]);
    }
}
