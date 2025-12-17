<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class IntegrationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'integration_id',
        'action',
        'status',
        'message',
        'request_data',
        'response_data',
        'error_details',
        'duration_ms'
    ];

    protected $casts = [
        'request_data' => 'array',
        'response_data' => 'array',
        'error_details' => 'array',
        'duration_ms' => 'integer'
    ];

    /**
     * Get the integration this log belongs to
     */
    public function integration()
    {
        return $this->belongsTo(Integration::class);
    }

    /**
     * Scope: Successful logs
     */
    public function scopeSuccess($query)
    {
        return $query->where('status', 'success');
    }

    /**
     * Scope: Failed logs
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope: Recent logs (last 24 hours)
     */
    public function scopeRecent($query)
    {
        return $query->where('created_at', '>=', now()->subDay());
    }

    /**
     * Scope: For integration
     */
    public function scopeForIntegration($query, $integrationId)
    {
        return $query->where('integration_id', $integrationId);
    }

    /**
     * Scope: By action
     */
    public function scopeAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Get formatted duration
     */
    public function getFormattedDurationAttribute()
    {
        if ($this->duration_ms < 1000) {
            return $this->duration_ms . 'ms';
        }

        return round($this->duration_ms / 1000, 2) . 's';
    }

    /**
     * Check if log is successful
     */
    public function isSuccessful()
    {
        return $this->status === 'success';
    }

    /**
     * Check if log is failed
     */
    public function isFailed()
    {
        return $this->status === 'failed';
    }
}
