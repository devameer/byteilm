<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GoalCollaborator extends Model
{
    use HasFactory;

    protected $fillable = [
        'goal_id',
        'user_id',
        'contribution'
    ];

    protected $casts = [
        'contribution' => 'integer'
    ];

    public function goal()
    {
        return $this->belongsTo(Goal::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
