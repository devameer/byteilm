<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LessonComment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'lesson_id',
        'user_id',
        'parent_id',
        'comment',
        'likes_count',
        'is_pinned',
        'is_instructor_reply',
        'edited_at'
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'is_instructor_reply' => 'boolean',
        'edited_at' => 'datetime'
    ];

    protected $with = ['user'];

    /**
     * Get the lesson
     */
    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Get the user who commented
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get parent comment (for replies)
     */
    public function parent()
    {
        return $this->belongsTo(LessonComment::class, 'parent_id');
    }

    /**
     * Get replies to this comment
     */
    public function replies()
    {
        return $this->hasMany(LessonComment::class, 'parent_id')->orderBy('created_at', 'asc');
    }

    /**
     * Get likes for this comment
     */
    public function likes()
    {
        return $this->hasMany(CommentLike::class, 'comment_id');
    }

    /**
     * Check if user liked this comment
     */
    public function isLikedBy($userId)
    {
        return $this->likes()->where('user_id', $userId)->exists();
    }

    /**
     * Toggle like
     */
    public function toggleLike($userId)
    {
        $like = $this->likes()->where('user_id', $userId)->first();

        if ($like) {
            $like->delete();
            $this->decrement('likes_count');
            return false; // Unliked
        } else {
            $this->likes()->create(['user_id' => $userId]);
            $this->increment('likes_count');
            return true; // Liked
        }
    }

    /**
     * Pin comment
     */
    public function pin()
    {
        $this->update(['is_pinned' => true]);
    }

    /**
     * Unpin comment
     */
    public function unpin()
    {
        $this->update(['is_pinned' => false]);
    }

    /**
     * Mark as edited
     */
    public function markAsEdited()
    {
        $this->update(['edited_at' => now()]);
    }

    /**
     * Scope: Top-level comments only
     */
    public function scopeTopLevel($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope: Pinned comments
     */
    public function scopePinned($query)
    {
        return $query->where('is_pinned', true);
    }

    /**
     * Scope: Instructor replies
     */
    public function scopeInstructorReplies($query)
    {
        return $query->where('is_instructor_reply', true);
    }
}
