<?php

namespace App\Http\Middleware;

use App\Models\ReferralVisit;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;

class TrackReferral
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Skip tracking for admin routes to improve performance
        if ($request->is('admin/*') || $request->is('admin')) {
            return $response;
        }

        if (!$request->isMethod('GET')) {
            return $response;
        }

        $code = $request->query('ref');

        if (!$code) {
            return $response;
        }

        $code = trim($code);

        if ($code === '') {
            return $response;
        }

        $referrer = User::where('referral_code', $code)->first();

        if (!$referrer) {
            return $response;
        }

        // Skip tracking if the referrer is the currently authenticated user
        if ($request->user() && $request->user()->id === $referrer->id) {
            return $response;
        }

        $minutes = config('referrals.cookie_lifetime_days', 30) * 24 * 60;
        $visitToken = (string) Str::uuid();
        $visitorIdentifier = hash('sha256', ($request->ip() ?? '0.0.0.0') . '|' . ($request->userAgent() ?? ''));

        ReferralVisit::create([
            'referrer_id' => $referrer->id,
            'referral_code' => $referrer->referral_code,
            'visit_token' => $visitToken,
            'visitor_identifier' => $visitorIdentifier,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'landing_page' => $request->fullUrl(),
        ]);

        Cookie::queue(cookie('referral_code', $referrer->referral_code, $minutes));
        Cookie::queue(cookie('referral_visit', $visitToken, $minutes));

        return $response;
    }
}
