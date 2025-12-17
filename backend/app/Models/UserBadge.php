<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserBadge extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'badge_type',
        'badge_name',
        'badge_icon',
        'badge_description',
        'earned_at',
    ];

    protected $casts = [
        'earned_at' => 'datetime',
    ];

    /**
     * Get the user that owns the badge.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Badge types and their configurations.
     */
    public static function getBadgeConfig($type)
    {
        $badges = [
            'first_lesson' => [
                'name' => 'البداية',
                'description' => 'أكملت درسك الأول!',
                'icon' => '🌟',
            ],
            'streak_3' => [
                'name' => 'مثابرة 3 أيام',
                'description' => 'أكملت دروساً لمدة 3 أيام متتالية',
                'icon' => '🔥',
            ],
            'streak_7' => [
                'name' => 'مثابرة أسبوع',
                'description' => 'أكملت دروساً لمدة 7 أيام متتالية',
                'icon' => '⭐',
            ],
            'streak_30' => [
                'name' => 'مثابرة شهر',
                'description' => 'أكملت دروساً لمدة 30 يوماً متتالياً',
                'icon' => '🏆',
            ],
            'streak_100' => [
                'name' => 'مثابرة 100 يوم',
                'description' => 'أكملت دروساً لمدة 100 يوم متتالي',
                'icon' => '👑',
            ],
            'course_complete' => [
                'name' => 'إنهاء دورة',
                'description' => 'أكملت دورتك الأولى بنجاح',
                'icon' => '🎓',
            ],
            'lessons_10' => [
                'name' => '10 دروس',
                'description' => 'أكملت 10 دروس',
                'icon' => '📚',
            ],
            'lessons_50' => [
                'name' => '50 درس',
                'description' => 'أكملت 50 درساً',
                'icon' => '📖',
            ],
            'lessons_100' => [
                'name' => '100 درس',
                'description' => 'أكملت 100 درس',
                'icon' => '🎯',
            ],
        ];

        return $badges[$type] ?? null;
    }

    /**
     * Award a badge to a user if they don't already have it.
     */
    public static function awardBadge($userId, $badgeType)
    {
        // Check if user already has this badge
        $existingBadge = self::where('user_id', $userId)
            ->where('badge_type', $badgeType)
            ->first();

        if ($existingBadge) {
            return null;
        }

        $config = self::getBadgeConfig($badgeType);
        if (!$config) {
            return null;
        }

        return self::create([
            'user_id' => $userId,
            'badge_type' => $badgeType,
            'badge_name' => $config['name'],
            'badge_icon' => $config['icon'],
            'badge_description' => $config['description'],
            'earned_at' => now(),
        ]);
    }
}
