<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

class SettingController extends Controller
{
    public function index()
    {
        $settings = [
            'general' => [
                'app_name' => config('app.name'),
                'timezone' => config('app.timezone'),
            ],
            'payment' => [
                'provider' => config('services.stripe.key') ? 'Stripe' : __('Not configured'),
            ],
            'mail' => [
                'driver' => config('mail.default'),
                'from_address' => config('mail.from.address'),
            ],
            'storage' => [
                'default' => config('filesystems.default'),
            ],
            'ai' => [
                'gemini' => config('services.google_gemini.key') ? __('Enabled') : __('Disabled'),
            ],
            'integrations' => [
                'telegram_bot' => config('services.telegram-bot-api.token') ? __('Enabled') : __('Disabled'),
            ],
        ];

        return view('admin.settings.index', compact('settings'));
    }
}
