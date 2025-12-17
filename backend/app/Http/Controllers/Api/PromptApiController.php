<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PromptResource;
use App\Models\Prompt;
use Illuminate\Http\Request;

class PromptApiController extends Controller
{
    /**
     * Display a listing of the user's prompts.
     */
    public function index(Request $request)
    {
        $prompts = Prompt::where('user_id', $request->user()->id)
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => PromptResource::collection($prompts),
        ]);
    }

    /**
     * Store a newly created prompt.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $prompt = Prompt::create([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء القالب بنجاح',
            'data' => new PromptResource($prompt),
        ], 201);
    }

    /**
     * Display the specified prompt.
     */
    public function show(Request $request, $id)
    {
        $prompt = Prompt::where('user_id', $request->user()->id)->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new PromptResource($prompt),
        ]);
    }

    /**
     * Update the specified prompt.
     */
    public function update(Request $request, $id)
    {
        $prompt = Prompt::where('user_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $prompt->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث القالب بنجاح',
            'data' => new PromptResource($prompt),
        ]);
    }

    /**
     * Remove the specified prompt from storage.
     */
    public function destroy(Request $request, $id)
    {
        $prompt = Prompt::where('user_id', $request->user()->id)->findOrFail($id);
        $prompt->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف القالب بنجاح',
        ]);
    }
}
