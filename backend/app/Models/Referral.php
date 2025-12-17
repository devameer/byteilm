<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Referral extends Model
{
    protected $fillable = [
        'referrer_id',
        'referred_id',
        'code',
        'referral_code',
        'visit_id',
        'status',
        'reward_type',
        'reward_value',
        'completed_at',
        'rewarded_at',
    ];

    protected $casts = [
        'reward_value' => 'decimal:2',
        'completed_at' => 'datetime',
        'rewarded_at' => 'datetime',
    ];

    public function referrer()
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    public function referred()
    {
        return $this->belongsTo(User::class, 'referred_id');
    }

    public function visit()
    {
        return $this->belongsTo(ReferralVisit::class);
    }
}
