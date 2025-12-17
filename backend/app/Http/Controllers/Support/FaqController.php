<?php

namespace App\Http\Controllers\Support;

use App\Http\Controllers\Controller;
use App\Models\FaqArticle;
use Illuminate\Http\Request;
use Illuminate\View\View;

class FaqController extends Controller
{
    public function index(Request $request): View
    {
        $category = $request->string('category')->toString();
        $search = $request->string('q')->toString();

        $articles = FaqArticle::query()
            ->published()
            ->category($category)
            ->when($search, function ($query) use ($search) {
                $term = "%{$search}%";
                $query->where(function ($subQuery) use ($term) {
                    $subQuery->where('question', 'like', $term)
                        ->orWhere('answer', 'like', $term);
                });
            })
            ->orderBy('sort_order')
            ->orderBy('question')
            ->get()
            ->groupBy(fn (FaqArticle $faq) => $faq->category ?? __('بدون تصنيف'));

        $categories = FaqArticle::query()
            ->published()
            ->select('category')
            ->distinct()
            ->pluck('category')
            ->filter()
            ->values();

        return view('support.faq.index', [
            'articles' => $articles,
            'categories' => $categories,
            'selectedCategory' => $category,
            'search' => $search,
        ]);
    }
}
