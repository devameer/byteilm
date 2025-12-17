<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;
use App\Models\Course;
use App\Models\Lesson;
use Carbon\Carbon;

class HomeController extends BaseController
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        // Auth middleware is applied in routes/web.php
    }

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        // Get all categories
        $categories = Category::with('courses')->get();
        
        // Get active courses with their progress
        $activeCourses = Course::with(['category', 'lessons'])
            ->where('active', true)
            ->orderBy('progress', 'desc')
            ->take(5)
            ->get();
        
        // Get today's lessons (lessons scheduled for today)
        $today = Carbon::today();
        $todayLessons = Lesson::with('course')
            ->where('scheduled_date', $today)
            ->where('completed', false)
            ->orderBy('created_at', 'asc')
            ->get();
        
        return view('home', compact('categories', 'activeCourses', 'todayLessons', 'today'));
    }
}
