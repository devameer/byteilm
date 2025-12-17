<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TelegramUser extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'chat_id',
        'username',
        'first_name',
        'last_name',
        'last_authenticated_at',
    ];

    protected $casts = [
        'last_authenticated_at' => 'datetime',
    ];

    /**
     * Linked application user.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
