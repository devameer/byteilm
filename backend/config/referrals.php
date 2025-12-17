<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Referral Program Configuration
    |--------------------------------------------------------------------------
    */

    // Number of characters generated for referral codes
    'code_length' => env('REFERRAL_CODE_LENGTH', 10),

    // Reward configuration (currently points-based)
    'reward_type' => env('REFERRAL_REWARD_TYPE', 'points'),
    'reward_points' => (int) env('REFERRAL_REWARD_POINTS', 100),

    // Lifetime of referral cookies in days
    'cookie_lifetime_days' => (int) env('REFERRAL_COOKIE_DAYS', 30),

    // Base URL used when generating referral share links
    'share_base_url' => env('FRONTEND_URL', env('APP_URL', 'http://localhost')),
    'share_path' => env('REFERRAL_SHARE_PATH', '/register'),
];
