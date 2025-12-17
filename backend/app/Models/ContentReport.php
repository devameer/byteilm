<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContentReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'reported_by',
        'reportable_type',
        'reportable_id',
        'reason',
        'details',
        'status',
        'reviewed_by',
        'resolution_notes',
        'reviewed_at'
    ];

    protected $casts = [
        'reviewed_at' => 'datetime'
    ];

    /**
     * Get the reporter
     */
    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    /**
     * Get the reviewer
     */
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Get the reported content (polymorphic)
     */
    public function reportable()
    {
        return $this->morphTo();
    }

    /**
     * Mark as reviewing
     */
    public function markAsReviewing($reviewerId)
    {
        $this->update([
            'status' => 'reviewing',
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now()
        ]);
    }

    /**
     * Resolve report
     */
    public function resolve($notes = null)
    {
        $this->update([
            'status' => 'resolved',
            'resolution_notes' => $notes
        ]);
    }

    /**
     * Dismiss report
     */
    public function dismiss($notes = null)
    {
        $this->update([
            'status' => 'dismissed',
            'resolution_notes' => $notes
        ]);
    }

    /**
     * Scope: Pending reports
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope: Under review
     */
    public function scopeReviewing($query)
    {
        return $query->where('status', 'reviewing');
    }
}
