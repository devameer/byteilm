<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'image', 'progress'];
    
    protected $casts = [
        'progress' => 'float',
    ];

    public function courses()
    {
        return $this->hasMany(Course::class);
    }
    
    /**
     * Update the progress of the category based on its courses
     */
    public function updateProgress()
    {
        $totalCourses = $this->courses()->count();
        
        if ($totalCourses === 0) {
            $this->progress = 0;
        } else {
            // Calculate the sum of all course progress
            $totalProgress = $this->courses()->sum('progress');
            
            // Calculate the average progress
            $this->progress = $totalProgress / $totalCourses;
        }
        
        $this->save();
        
        return $this;
    }
}
