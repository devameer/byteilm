<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\ActivityLog;
use App\Models\Concerns\HasRoles;
use App\Models\Notification;
use App\Models\Referral;
use App\Models\ReferralVisit;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\UserUsage;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_active',
        'referral_code',
        'referred_by',
        'referral_points',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
            'referral_points' => 'integer',
        ];
    }

    /**
     * Model boot method to ensure referral code generation.
     */
    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            if (empty($user->referral_code)) {
                $user->referral_code = static::generateReferralCode();
            }
        });

        static::created(function (User $user): void {
            $user->getOrCreateUsage();
            event(new \App\Events\UserUsageShouldUpdate($user->id));
        });

        ResetPassword::createUrlUsing(function ($user, string $token) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return $frontendUrl . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);
        });
    }

    /**
     * Generate a unique referral code for the user.
     */
    public static function generateReferralCode(int $length = null): string
    {
        $length ??= (int) config('referrals.code_length', 10);

        do {
            $code = Str::upper(Str::random($length));
        } while (static::where('referral_code', $code)->exists());

        return $code;
    }

    /**
     * Get the user's streak record.
     */
    public function streak()
    {
        return $this->hasOne(UserStreak::class);
    }

    /**
     * Get all badges earned by the user.
     */
    public function badges()
    {
        return $this->hasMany(UserBadge::class);
    }

    /**
     * Courses owned by the user.
     */
    public function courses()
    {
        return $this->hasMany(Course::class);
    }

    /**
     * Lessons owned by the user.
     */
    public function lessons()
    {
        return $this->hasMany(Lesson::class);
    }

    /**
     * Projects owned by the user.
     */
    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    /**
     * Tasks owned by the user.
     */
    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Prompts created by the user.
     */
    public function prompts()
    {
        return $this->hasMany(Prompt::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function referralsMade()
    {
        return $this->hasMany(Referral::class, 'referrer_id');
    }

    public function referralsReceived()
    {
        return $this->hasMany(Referral::class, 'referred_id');
    }

    public function referrer()
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    public function referralVisits()
    {
        return $this->hasMany(ReferralVisit::class, 'referrer_id');
    }

    public function teams()
    {
        return $this->hasMany(Team::class, 'owner_id');
    }

    public function teamMemberships()
    {
        return $this->hasMany(TeamMember::class);
    }

    public function teamsAsMember()
    {
        return $this->belongsToMany(Team::class, 'team_members')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    public function usage()
    {
        return $this->hasOne(UserUsage::class);
    }

    /**
     * Get or create the usage record for this user.
     */
    public function getOrCreateUsage(): UserUsage
    {
        return $this->usage()->firstOrCreate([
            'user_id' => $this->id,
        ]);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function supportTickets()
    {
        return $this->hasMany(SupportTicket::class);
    }

    public function supportMessages()
    {
        return $this->morphMany(SupportMessage::class, 'sender');
    }

    /**
     * Get or create the user's streak record.
     */
    public function getOrCreateStreak()
    {
        if (!$this->streak) {
            return UserStreak::create([
                'user_id' => $this->id,
                'current_streak' => 0,
                'longest_streak' => 0,
                'last_activity_date' => null,
                'total_days_active' => 0,
            ]);
        }

        return $this->streak;
    }

    /**
     * Determine if the user has administrator privileges.
     */
    public function isAdmin(): bool
    {
        if ($this->hasRole(['super_admin', 'admin'])) {
            return true;
        }

        $value = $this->getAttribute('is_admin');

        return (bool) ($value ?? false);
    }

    /**
     * Active subscription for the user.
     */
    public function subscription()
    {
        return $this->hasOne(Subscription::class)
            ->whereIn('status', ['active', 'trialing'])
            ->latest('starts_at');
    }

    /**
     * All subscriptions for the user.
     */
    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
