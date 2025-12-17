<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LearningInsight extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'insight_date',
        'category',
        'insight_type',
        'title',
        'description',
        'data',
        'priority',
        'is_read'
    ];

    protected $casts = [
        'insight_date' => 'date',
        'data' => 'array',
        'is_read' => 'boolean'
    ];

    /**
     * Get the user
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark as read
     */
    public function markAsRead()
    {
        $this->update(['is_read' => true]);
    }

    /**
     * Scope: Unread insights
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope: By category
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope: High priority
     */
    public function scopeHighPriority($query)
    {
        return $query->where('priority', '>=', 7);
    }
}
