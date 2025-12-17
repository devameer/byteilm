<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Integration extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'provider',
        'provider_user_id',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'settings',
        'auto_sync',
        'last_sync_at',
        'is_active',
        'error_count',
        'last_error'
    ];

    protected $casts = [
        'settings' => 'array',
        'auto_sync' => 'boolean',
        'is_active' => 'boolean',
        'last_sync_at' => 'datetime',
        'token_expires_at' => 'datetime',
        'error_count' => 'integer'
    ];

    protected $hidden = [
        'access_token',
        'refresh_token'
    ];

    /**
     * Get the user that owns the integration
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get integration logs
     */
    public function logs()
    {
        return $this->hasMany(IntegrationLog::class);
    }

    /**
     * Check if token is expired
     */
    public function isTokenExpired()
    {
        if (!$this->token_expires_at) {
            return false;
        }

        return $this->token_expires_at->isPast();
    }

    /**
     * Check if token needs refresh (within 5 minutes of expiry)
     */
    public function needsTokenRefresh()
    {
        if (!$this->token_expires_at) {
            return false;
        }

        return $this->token_expires_at->subMinutes(5)->isPast();
    }

    /**
     * Update last sync time
     */
    public function markSynced()
    {
        $this->update([
            'last_sync_at' => now(),
            'error_count' => 0,
            'last_error' => null
        ]);
    }

    /**
     * Record error
     */
    public function recordError($error)
    {
        $this->increment('error_count');
        $this->update([
            'last_error' => $error,
            'is_active' => $this->error_count < 5 // Deactivate after 5 errors
        ]);
    }

    /**
     * Get provider display name
     */
    public function getProviderNameAttribute()
    {
        $providers = [
            'google_calendar' => 'Google Calendar',
            'slack' => 'Slack',
            'discord' => 'Discord',
            'trello' => 'Trello',
            'notion' => 'Notion',
            'github' => 'GitHub'
        ];

        return $providers[$this->provider] ?? $this->provider;
    }

    /**
     * Get provider icon
     */
    public function getProviderIconAttribute()
    {
        $icons = [
            'google_calendar' => '📅',
            'slack' => '💬',
            'discord' => '🎮',
            'trello' => '📋',
            'notion' => '📝',
            'github' => '🐙'
        ];

        return $icons[$this->provider] ?? '🔗';
    }

    /**
     * Scope: Active integrations
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: By provider
     */
    public function scopeProvider($query, $provider)
    {
        return $query->where('provider', $provider);
    }

    /**
     * Scope: For user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Auto-sync enabled
     */
    public function scopeAutoSync($query)
    {
        return $query->where('auto_sync', true);
    }

    /**
     * Scope: Needs sync (auto-sync enabled and last sync > 1 hour ago)
     */
    public function scopeNeedsSync($query)
    {
        return $query->where('auto_sync', true)
            ->where(function ($q) {
                $q->whereNull('last_sync_at')
                  ->orWhere('last_sync_at', '<', now()->subHour());
            });
    }
}
