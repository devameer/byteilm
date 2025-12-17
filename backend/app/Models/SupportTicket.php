<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SupportTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'user_id',
        'subject',
        'category',
        'status',
        'priority',
        'closed_at',
        'last_message_at',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
        'closed_at' => 'datetime',
        'last_message_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (SupportTicket $ticket): void {
            if (empty($ticket->reference)) {
                $ticket->reference = static::generateReference();
            }

            if (!isset($ticket->last_message_at)) {
                $ticket->last_message_at = now();
            }
        });
    }

    public static function generateReference(): string
    {
        do {
            $reference = 'TCK-' . Str::upper(Str::random(6));
        } while (static::where('reference', $reference)->exists());

        return $reference;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SupportMessage::class);
    }

    public function latestMessage(): HasMany
    {
        return $this->messages()->latest();
    }

    public function scopeStatus(Builder $query, ?string $status): Builder
    {
        if (empty($status)) {
            return $query;
        }

        return $query->where('status', $status);
    }

    public function scopeCategory(Builder $query, ?string $category): Builder
    {
        if (empty($category)) {
            return $query;
        }

        return $query->where('category', $category);
    }

    public function scopePriority(Builder $query, ?string $priority): Builder
    {
        if (empty($priority)) {
            return $query;
        }

        return $query->where('priority', $priority);
    }

    public function isOpen(): bool
    {
        return in_array($this->status, ['open', 'pending'], true);
    }

    public function reopen(): void
    {
        $this->forceFill([
            'status' => 'open',
            'closed_at' => null,
        ])->save();
    }

    public function markResolved(): void
    {
        $this->forceFill([
            'status' => 'resolved',
            'closed_at' => now(),
        ])->save();
    }

    public function markClosed(): void
    {
        $this->forceFill([
            'status' => 'closed',
            'closed_at' => now(),
        ])->save();
    }
}
