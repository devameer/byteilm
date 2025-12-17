<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseReview extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'course_id',
        'user_id',
        'rating',
        'review',
        'is_approved',
        'is_featured',
        'helpful_count',
        'not_helpful_count',
        'approved_at',
        'approved_by'
    ];

    protected $casts = [
        'is_approved' => 'boolean',
        'is_featured' => 'boolean',
        'approved_at' => 'datetime'
    ];

    protected $with = ['user'];

    /**
     * Get the course that was reviewed
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the user who wrote the review
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the moderator who approved the review
     */
    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get votes for this review
     */
    public function votes()
    {
        return $this->hasMany(ReviewVote::class, 'review_id');
    }

    /**
     * Approve the review
     */
    public function approve($moderatorId = null)
    {
        $this->update([
            'is_approved' => true,
            'approved_at' => now(),
            'approved_by' => $moderatorId
        ]);

        // Update course rating summary
        $this->course->updateRatingSummary();
    }

    /**
     * Mark as featured
     */
    public function markAsFeatured()
    {
        $this->update(['is_featured' => true]);
    }

    /**
     * Vote as helpful
     */
    public function voteHelpful($userId)
    {
        $vote = ReviewVote::updateOrCreate(
            ['review_id' => $this->id, 'user_id' => $userId],
            ['vote_type' => 'helpful']
        );

        $this->recalculateVotes();
    }

    /**
     * Vote as not helpful
     */
    public function voteNotHelpful($userId)
    {
        $vote = ReviewVote::updateOrCreate(
            ['review_id' => $this->id, 'user_id' => $userId],
            ['vote_type' => 'not_helpful']
        );

        $this->recalculateVotes();
    }

    /**
     * Recalculate vote counts
     */
    public function recalculateVotes()
    {
        $this->helpful_count = $this->votes()->where('vote_type', 'helpful')->count();
        $this->not_helpful_count = $this->votes()->where('vote_type', 'not_helpful')->count();
        $this->save();
    }

    /**
     * Scope: Approved reviews
     */
    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    /**
     * Scope: Featured reviews
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope: Pending reviews
     */
    public function scopePending($query)
    {
        return $query->where('is_approved', false);
    }
}
