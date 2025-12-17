<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImpersonationController extends Controller
{
    public function start(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('status', __('لا يمكنك انتحال جلسة نفسك.'));
        }

        $request->session()->put('impersonator_id', $request->user()->id);
        Auth::login($user);

        return redirect('/')->with('status', __('تم تسجيل الدخول كمستخدم مؤقتاً.'));
    }

    public function stop(Request $request): RedirectResponse
    {
        $impersonatorId = $request->session()->pull('impersonator_id');

        if ($impersonatorId) {
            $admin = User::find($impersonatorId);

            if ($admin) {
                Auth::login($admin);

                return redirect()->route('admin.users.index')->with('status', __('تم إنهاء جلسة الانتحال.'));
            }
        }

        Auth::logout();

        return redirect()->route('login');
    }
}
