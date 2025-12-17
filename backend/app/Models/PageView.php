<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PageView extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_id',
        'page_url',
        'page_title',
        'referrer',
        'time_on_page',
        'scroll_depth',
        'bounced',
        'exit_page',
        'metadata',
        'viewed_at'
    ];

    protected $casts = [
        'time_on_page' => 'integer',
        'scroll_depth' => 'integer',
        'bounced' => 'boolean',
        'metadata' => 'array',
        'viewed_at' => 'datetime'
    ];

    const UPDATED_AT = null;

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeByPage($query, $pageUrl)
    {
        return $query->where('page_url', $pageUrl);
    }

    public function scopeBounced($query)
    {
        return $query->where('bounced', true);
    }
}
