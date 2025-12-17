<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FaqArticle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateData($request);
        FaqArticle::create($data);

        return back()->with('status', __('تم إنشاء مقال الأسئلة الشائعة بنجاح.'));
    }

    public function update(Request $request, FaqArticle $faq): RedirectResponse
    {
        $data = $this->validateData($request);
        $faq->update($data);

        return back()->with('status', __('تم تحديث مقال الأسئلة الشائعة.'));
    }

    public function destroy(FaqArticle $faq): RedirectResponse
    {
        $faq->delete();

        return back()->with('status', __('تم حذف المقال.'));
    }

    protected function validateData(Request $request): array
    {
        $validated = $request->validate([
            'category' => ['nullable', 'string', 'max:100'],
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string'],
            'is_published' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'between:0,9999'],
        ]);

        $validated['is_published'] = (bool) ($validated['is_published'] ?? false);

        return $validated;
    }
}
