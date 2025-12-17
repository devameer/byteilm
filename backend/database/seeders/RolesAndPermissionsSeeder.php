<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Permissions
        $permissions = [
            // Users
            ['name' => 'view_users', 'display_name' => 'View Users', 'description' => 'Can view users list'],
            ['name' => 'create_users', 'display_name' => 'Create Users', 'description' => 'Can create new users'],
            ['name' => 'edit_users', 'display_name' => 'Edit Users', 'description' => 'Can edit users'],
            ['name' => 'delete_users', 'display_name' => 'Delete Users', 'description' => 'Can delete users'],
            ['name' => 'impersonate_users', 'display_name' => 'Impersonate Users', 'description' => 'Can login as other users'],

            // Plans
            ['name' => 'view_plans', 'display_name' => 'View Plans', 'description' => 'Can view plans'],
            ['name' => 'create_plans', 'display_name' => 'Create Plans', 'description' => 'Can create plans'],
            ['name' => 'edit_plans', 'display_name' => 'Edit Plans', 'description' => 'Can edit plans'],
            ['name' => 'delete_plans', 'display_name' => 'Delete Plans', 'description' => 'Can delete plans'],

            // Subscriptions
            ['name' => 'view_subscriptions', 'display_name' => 'View Subscriptions', 'description' => 'Can view subscriptions'],
            ['name' => 'manage_subscriptions', 'display_name' => 'Manage Subscriptions', 'description' => 'Can cancel/resume subscriptions'],

            // Payments
            ['name' => 'view_payments', 'display_name' => 'View Payments', 'description' => 'Can view payments'],
            ['name' => 'refund_payments', 'display_name' => 'Refund Payments', 'description' => 'Can refund payments'],

            // Content
            ['name' => 'view_all_content', 'display_name' => 'View All Content', 'description' => 'Can view all users content'],
            ['name' => 'delete_any_content', 'display_name' => 'Delete Any Content', 'description' => 'Can delete any content'],

            // Settings
            ['name' => 'manage_settings', 'display_name' => 'Manage Settings', 'description' => 'Can manage system settings'],

            // Analytics
            ['name' => 'view_analytics', 'display_name' => 'View Analytics', 'description' => 'Can view analytics'],

            // Support
            ['name' => 'manage_support', 'display_name' => 'Manage Support', 'description' => 'Can manage support tickets'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Create Roles
        $roles = [
            [
                'name' => 'super_admin',
                'display_name' => 'Super Admin',
                'description' => 'Has full access to everything',
                'permissions' => Permission::all()->pluck('id')->toArray()
            ],
            [
                'name' => 'admin',
                'display_name' => 'Admin',
                'description' => 'Has access to most features',
                'permissions' => Permission::whereIn('name', [
                    'view_users', 'edit_users',
                    'view_plans', 'edit_plans',
                    'view_subscriptions', 'manage_subscriptions',
                    'view_payments',
                    'view_all_content',
                    'view_analytics',
                    'manage_support'
                ])->pluck('id')->toArray()
            ],
            [
                'name' => 'premium_user',
                'display_name' => 'Premium User',
                'description' => 'Paid user with full features access',
                'permissions' => []
            ],
            [
                'name' => 'free_user',
                'display_name' => 'Free User',
                'description' => 'Free user with limited features',
                'permissions' => []
            ],
            [
                'name' => 'trial_user',
                'display_name' => 'Trial User',
                'description' => 'User on trial period',
                'permissions' => []
            ],
        ];

        foreach ($roles as $roleData) {
            $permissions = $roleData['permissions'];
            unset($roleData['permissions']);

            $role = Role::firstOrCreate(
                ['name' => $roleData['name']],
                $roleData
            );

            // Attach permissions
            if (!empty($permissions)) {
                $role->permissions()->sync($permissions);
            }
        }

        $this->command->info('Roles and Permissions created successfully!');
    }
}
