<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AITaskPriority extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'ai_task_priorities';

    protected $fillable = [
        'user_id',
        'task_id',
        'ai_priority_score',
        'priority_factors',
        'recommendation',
        'calculated_at'
    ];

    protected $casts = [
        'ai_priority_score' => 'integer',
        'priority_factors' => 'array',
        'calculated_at' => 'date'
    ];

    /**
     * Get the user
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the task
     */
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Scope: For user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Latest calculations
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('calculated_at', 'desc');
    }
}
