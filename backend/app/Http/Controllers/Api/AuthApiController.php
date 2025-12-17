<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\UserUsageShouldUpdate;
use App\Http\Resources\UserResource;
use App\Models\Referral;
use App\Models\ReferralVisit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthApiController extends Controller
{
    /**
     * Login user and create token
     */
    public function login(\App\Http\Requests\Api\LoginRequest $request)
    {

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة'],
            ]);
        }

        // Create token for the user
        $token = $user->createToken('spa-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الدخول بنجاح',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ]);
    }

    /**
     * Get authenticated user
     */
    public function user(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource($request->user()),
        ]);
    }

    /**
     * Logout user (revoke token)
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        $token = $user?->currentAccessToken();

        if ($token instanceof \Laravel\Sanctum\PersonalAccessToken) {
            $token->delete();
        } else {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الخروج بنجاح',
        ]);
    }

    /**
     * Logout from all devices (revoke all tokens)
     */
    public function logoutAll(Request $request)
    {
        $user = $request->user();

        if ($user) {
            $user->tokens()->delete();
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الخروج من جميع الأجهزة بنجاح',
        ]);
    }

    /**
     * Register new user (optional - if registration is enabled)
     */
    public function register(\App\Http\Requests\Api\RegisterRequest $request)
    {
        $validated = $request->validated();

        $referralCode = $request->filled('referral_code')
            ? trim((string) $request->input('referral_code'))
            : null;

        if ($referralCode === '') {
            $referralCode = null;
        }

        $referralCode ??= $request->cookie('referral_code');
        $referralCode = $referralCode ? trim((string) $referralCode) : null;

        $visitToken = $request->cookie('referral_visit');

        $user = DB::transaction(function () use ($validated, $referralCode, $visitToken) {
            $referrer = null;
            if ($referralCode) {
                $referrer = User::where('referral_code', $referralCode)->first();

                // Prevent self-referrals by email
                if ($referrer && strcasecmp($referrer->email, $validated['email']) === 0) {
                    $referrer = null;
                }
            }

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'referred_by' => $referrer?->id,
            ]);

            if ($referrer && $referrer->id !== $user->id) {
                $rewardType = config('referrals.reward_type', 'points');
                $rewardPoints = (int) config('referrals.reward_points', 0);

                $visit = null;
                if ($visitToken) {
                    $visit = ReferralVisit::where('visit_token', $visitToken)->first();
                }

                Referral::create([
                    'referrer_id' => $referrer->id,
                    'referred_id' => $user->id,
                    'code' => (string) Str::uuid(),
                    'referral_code' => $referrer->referral_code,
                    'visit_id' => $visit?->id,
                    'status' => $rewardPoints > 0 ? 'rewarded' : 'completed',
                    'reward_type' => $rewardType,
                    'reward_value' => $rewardType === 'points' ? $rewardPoints : null,
                    'completed_at' => now(),
                    'rewarded_at' => $rewardPoints > 0 ? now() : null,
                ]);

                if ($rewardType === 'points' && $rewardPoints > 0) {
                    $referrer->increment('referral_points', $rewardPoints);
                }

                if ($visit) {
                    $visit->update([
                        'registered_user_id' => $user->id,
                        'converted_at' => now(),
                    ]);
                }
            }

            return $user;
        });

        $user->getOrCreateUsage();
        event(new UserUsageShouldUpdate($user->id));

        Cookie::queue(Cookie::forget('referral_code'));
        Cookie::queue(Cookie::forget('referral_visit'));

        $token = $user->createToken('spa-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الحساب بنجاح',
            'data' => [
                'user' => new UserResource($user->fresh()),
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Get CSRF cookie for SPA authentication
     */
    public function csrf()
    {
        return response()->json([
            'success' => true,
            'message' => 'CSRF cookie set',
        ]);
    }

    /**
     * Send password reset link
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'success' => true,
                'message' => 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
            ]);
        }

        throw ValidationException::withMessages([
            'email' => ['لم نتمكن من العثور على مستخدم بهذا البريد الإلكتروني'],
        ]);
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ])->setRememberToken(Str::random(60));

                $user->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' => 'تم إعادة تعيين كلمة المرور بنجاح',
            ]);
        }

        throw ValidationException::withMessages([
            'email' => ['الرابط غير صالح أو منتهي الصلاحية'],
        ]);
    }
}
