<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\UserUsage;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get roles
        $superAdminRole = Role::where('name', 'super_admin')->first();
        $freeUserRole = Role::where('name', 'free_user')->first();

        // Get free plan
        $freePlan = Plan::where('name', 'free')->first();

        // Create Super Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@plan.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        // Assign super admin role
        if ($superAdminRole && !$admin->roles()->where('role_id', $superAdminRole->id)->exists()) {
            $admin->roles()->attach($superAdminRole->id);
        }

        // Create demo user
        $user = User::firstOrCreate(
            ['email' => 'user@plan.com'],
            [
                'name' => 'Demo User',
                'password' => Hash::make('user123'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        // Assign free user role
        if ($freeUserRole && !$user->roles()->where('role_id', $freeUserRole->id)->exists()) {
            $user->roles()->attach($freeUserRole->id);
        }

        // Create subscription for demo user
        if ($freePlan && !$user->subscriptions()->exists()) {
            Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $freePlan->id,
                'status' => 'active',
                'starts_at' => now(),
            ]);
        }

        // Create user usage tracking
        if (!UserUsage::where('user_id', $user->id)->exists()) {
            UserUsage::create([
                'user_id' => $user->id,
                'projects_count' => 0,
                'courses_count' => 0,
                'storage_used_mb' => 0,
                'ai_requests_this_month' => 0,
            ]);
        }

        $this->command->info('Admin users created successfully!');
        $this->command->info('Super Admin: admin@plan.com / admin123');
        $this->command->info('Demo User: user@plan.com / user123');
    }
}
