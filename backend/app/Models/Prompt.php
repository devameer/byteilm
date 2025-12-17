<?php

namespace App\Models;

use App\Models\Concerns\HasUserOwnership;
use Illuminate\Database\Eloquent\Model;

class Prompt extends Model
{
    use HasUserOwnership;

    protected $fillable = ['title', 'content', 'user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
