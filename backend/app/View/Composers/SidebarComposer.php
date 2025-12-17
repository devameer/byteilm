<?php

namespace App\View\Composers;

use App\Models\Course;
use Illuminate\View\View;

class SidebarComposer
{
    /**
     * Bind data to the view.
     *
     * @param  \Illuminate\View\View  $view
     * @return void
     */
    public function compose(View $view)
    {
        // Get active courses with their progress
        $activeCourses = Course::where('active', true)
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get();

        $view->with('activeCourses', $activeCourses);
    }
}
