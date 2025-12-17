<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIRecommendation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'recommendable_type',
        'recommendable_id',
        'reason',
        'confidence_score',
        'metadata',
        'is_accepted',
        'is_dismissed',
        'shown_at',
        'interacted_at'
    ];

    protected $casts = [
        'confidence_score' => 'decimal:2',
        'metadata' => 'array',
        'is_accepted' => 'boolean',
        'is_dismissed' => 'boolean',
        'shown_at' => 'datetime',
        'interacted_at' => 'datetime'
    ];

    /**
     * Get the user
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the recommendable item (Course, Task, User, etc.)
     */
    public function recommendable()
    {
        return $this->morphTo();
    }

    /**
     * Mark as shown to user
     */
    public function markAsShown()
    {
        $this->update(['shown_at' => now()]);
    }

    /**
     * Accept this recommendation
     */
    public function accept()
    {
        $this->update([
            'is_accepted' => true,
            'interacted_at' => now()
        ]);
    }

    /**
     * Dismiss this recommendation
     */
    public function dismiss()
    {
        $this->update([
            'is_dismissed' => true,
            'interacted_at' => now()
        ]);
    }

    /**
     * Scope: Active recommendations
     */
    public function scopeActive($query)
    {
        return $query->where('is_dismissed', false)
            ->whereNull('is_accepted');
    }

    /**
     * Scope: By type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }
}
