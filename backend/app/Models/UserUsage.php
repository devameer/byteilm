<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserUsage extends Model
{
    protected $table = 'user_usage';

    protected $fillable = [
        'user_id',
        'projects_count',
        'courses_count',
        'lessons_count',
        'storage_used_mb',
        'ai_requests_this_month',
        'last_reset_at',
    ];

    protected $casts = [
        'last_reset_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
