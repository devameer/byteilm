<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudyTimeRecommendation extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'study_time_recommendations';

    protected $fillable = [
        'user_id',
        'day_of_week',
        'start_time',
        'end_time',
        'duration_minutes',
        'productivity_score',
        'reason',
        'is_active'
    ];

    protected $casts = [
        'productivity_score' => 'decimal:2',
        'duration_minutes' => 'integer',
        'is_active' => 'boolean'
    ];

    /**
     * Get the user
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: Active recommendations
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: By day
     */
    public function scopeForDay($query, $day)
    {
        return $query->where('day_of_week', $day);
    }
}
