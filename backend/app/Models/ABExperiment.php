<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ABExperiment extends Model
{
    use HasFactory;

    protected $table = 'ab_experiments';

    protected $fillable = [
        'name',
        'description',
        'type',
        'variants',
        'traffic_allocation',
        'success_metric',
        'status',
        'started_at',
        'ended_at',
        'metadata'
    ];

    protected $casts = [
        'variants' => 'array',
        'traffic_allocation' => 'integer',
        'metadata' => 'array',
        'started_at' => 'datetime',
        'ended_at' => 'datetime'
    ];

    public function assignments()
    {
        return $this->hasMany(ABAssignment::class, 'experiment_id');
    }

    public function conversions()
    {
        return $this->hasMany(ABConversion::class, 'experiment_id');
    }

    public function scopeRunning($query)
    {
        return $query->where('status', 'running');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function start()
    {
        $this->update([
            'status' => 'running',
            'started_at' => now()
        ]);
    }

    public function pause()
    {
        $this->update(['status' => 'paused']);
    }

    public function complete()
    {
        $this->update([
            'status' => 'completed',
            'ended_at' => now()
        ]);
    }
}
