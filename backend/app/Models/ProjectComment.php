<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProjectComment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'user_id',
        'comment',
        'attachments',
        'mentions',
        'edited_at'
    ];

    protected $casts = [
        'attachments' => 'array',
        'mentions' => 'array',
        'edited_at' => 'datetime'
    ];

    protected $with = ['user'];

    /**
     * Get the project
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user who commented
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get mentioned users
     */
    public function mentionedUsers()
    {
        if (!$this->mentions) {
            return collect();
        }

        return User::whereIn('id', $this->mentions)->get();
    }

    /**
     * Mark as edited
     */
    public function markAsEdited()
    {
        $this->update(['edited_at' => now()]);
    }
}
