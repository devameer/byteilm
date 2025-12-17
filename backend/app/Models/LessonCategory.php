<?php

namespace App\Models;

use App\Models\Concerns\HasUserOwnership;
use Illuminate\Database\Eloquent\Model;

class LessonCategory extends Model
{
    use HasUserOwnership;

    protected $fillable = ['user_id', 'name', 'course_id'];

    /**
     * Get the course that owns the category.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the lessons in this category.
     */
    public function lessons()
    {
        return $this->hasMany(Lesson::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
