<?php

namespace App\Models;

use App\Models\Concerns\HasUserOwnership;
use Illuminate\Database\Eloquent\Model;

class Subtask extends Model
{
    use HasUserOwnership;

    protected $fillable = [
        'user_id',
        'task_id',
        'title',
        'description',
        'completed',
        'order',
    ];

    protected $casts = [
        'completed' => 'boolean',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function markAsCompleted()
    {
        $this->completed = true;
        $this->save();
        return $this;
    }

    public function markAsNotCompleted()
    {
        $this->completed = false;
        $this->save();
        return $this;
    }
}
