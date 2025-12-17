<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GoalProgress extends Model
{
    use HasFactory;

    protected $table = 'goal_progress';

    protected $fillable = [
        'goal_id',
        'value',
        'note',
        'recorded_at'
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'value' => 'integer'
    ];

    public function goal()
    {
        return $this->belongsTo(Goal::class);
    }
}
