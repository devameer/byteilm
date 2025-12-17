<?php

namespace App\Http\Controllers;

use App\Models\Prompt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PromptController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $prompts = Prompt::where('user_id', Auth::id())->get();
        return view('prompts.index', compact('prompts'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        if (request()->ajax()) {
            return [
                'form' => view('prompts.partials.form')->render()
            ];
        }

        return view('prompts.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
            ]);

            $prompt = new Prompt();
            $prompt->title = $validated['title'];
            $prompt->content = $validated['content'];
            $prompt->user_id = Auth::id();
            $prompt->save();

            if ($request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم إنشاء القالب بنجاح',
                    'prompt' => $prompt,
                    'redirect' => route('prompts.index')
                ]);
            }

            return redirect()->route('prompts.index')
                ->with('success', 'تم إنشاء القالب بنجاح');
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->ajax()) {
                return response()->json([
                    'success' => false,
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $prompt = Prompt::where('user_id', Auth::id())->findOrFail($id);

        if (request()->ajax()) {
            return [
                'form' => view('prompts.partials.form', compact('prompt'))->render()
            ];
        }

        return view('prompts.edit', compact('prompt'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $prompt = Prompt::where('user_id', Auth::id())->findOrFail($id);

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
            ]);

            $prompt->title = $validated['title'];
            $prompt->content = $validated['content'];
            $prompt->save();

            if ($request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم تحديث القالب بنجاح',
                    'prompt' => $prompt,
                    'redirect' => route('prompts.index')
                ]);
            }

            return redirect()->route('prompts.index')
                ->with('success', 'تم تحديث القالب بنجاح');
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->ajax()) {
                return response()->json([
                    'success' => false,
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $prompt = Prompt::where('user_id', Auth::id())->findOrFail($id);
        $prompt->delete();

        if (request()->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'تم حذف القالب بنجاح'
            ]);
        }

        return redirect()->route('prompts.index')
            ->with('success', 'تم حذف القالب بنجاح');
    }
}
