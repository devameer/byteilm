<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use App\Models\ReferralVisit;
use Illuminate\Http\Request;

class ReferralApiController extends Controller
{
    public function summary(Request $request)
    {
        $user = $request->user()->fresh();

        $shareBase = (string) config('referrals.share_base_url', config('app.url'));
        $sharePath = (string) config('referrals.share_path', '/register');

        $shareUrlBase = rtrim($shareBase, '/');
        if ($sharePath !== '') {
            $shareUrlBase .= '/' . ltrim($sharePath, '/');
        }

        $separator = str_contains($shareUrlBase, '?') ? '&' : '?';
        $shareUrl = $shareUrlBase . $separator . 'ref=' . $user->referral_code;

        $referrals = Referral::with('referred')
            ->where('referrer_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        $totalReferrals = $referrals->count();
        $pendingReferrals = $referrals->where('status', 'pending')->count();
        $completedReferrals = $referrals->where('status', 'completed')->count();
        $rewardedReferrals = $referrals->where('status', 'rewarded')->count();

        $visitsQuery = ReferralVisit::where('referrer_id', $user->id);
        $clicksTotal = (clone $visitsQuery)->count();
        $clicksUnique = (clone $visitsQuery)->whereNotNull('visitor_identifier')->distinct('visitor_identifier')->count('visitor_identifier');
        $clicksConverted = (clone $visitsQuery)->whereNotNull('registered_user_id')->count();

        $recentReferrals = $referrals->take(10)->map(function (Referral $referral) {
            return [
                'id' => $referral->id,
                'referred_name' => $referral->referred?->name,
                'referred_email' => $referral->referred?->email,
                'status' => $referral->status,
                'reward_type' => $referral->reward_type,
                'reward_value' => $referral->reward_value,
                'completed_at' => optional($referral->completed_at)->toDateTimeString(),
                'rewarded_at' => optional($referral->rewarded_at)->toDateTimeString(),
                'created_at' => optional($referral->created_at)->toDateTimeString(),
            ];
        });

        $recentVisits = ReferralVisit::where('referrer_id', $user->id)
            ->orderByDesc('created_at')
            ->take(10)
            ->get()
            ->map(function (ReferralVisit $visit) {
                return [
                    'id' => $visit->id,
                    'landing_page' => $visit->landing_page,
                    'ip_address' => $visit->ip_address,
                    'converted' => (bool) $visit->registered_user_id,
                    'converted_at' => optional($visit->converted_at)->toDateTimeString(),
                    'created_at' => optional($visit->created_at)->toDateTimeString(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'code' => $user->referral_code,
                'share_url' => $shareUrl,
                'reward_points_per_referral' => (int) config('referrals.reward_points', 0),
                'reward_type' => config('referrals.reward_type', 'points'),
                'points_balance' => $user->referral_points ?? 0,
                'stats' => [
                    'total_referrals' => $totalReferrals,
                    'pending_referrals' => $pendingReferrals,
                    'completed_referrals' => $completedReferrals,
                    'rewarded_referrals' => $rewardedReferrals,
                    'clicks_total' => $clicksTotal,
                    'clicks_unique' => $clicksUnique,
                    'clicks_converted' => $clicksConverted,
                ],
                'recent_referrals' => $recentReferrals,
                'recent_visits' => $recentVisits,
            ],
        ]);
    }
}
