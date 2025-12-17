<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;

class PlansSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'free',
                'display_name' => 'مجاني',
                'description' => 'خطة مجانية للبدء',
                'price' => 0.00,
                'currency' => 'USD',
                'billing_period' => 'lifetime',
                'features' => json_encode([
                    '3 مشاريع كحد أقصى',
                    '5 دورات كحد أقصى',
                    'رفع فيديوهات حتى 100MB',
                    '10 استخدامات AI شهرياً',
                    'تكامل Telegram Bot',
                    'الإحصائيات الأساسية',
                ]),
                'limits' => json_encode([
                    'max_projects' => 3,
                    'max_courses' => 5,
                    'max_video_size_mb' => 100,
                    'max_ai_requests_monthly' => 10,
                    'max_storage_gb' => 1,
                ]),
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'premium_monthly',
                'display_name' => 'Premium شهري',
                'description' => 'الخطة المميزة بفوترة شهرية',
                'price' => 9.99,
                'currency' => 'USD',
                'billing_period' => 'monthly',
                'features' => json_encode([
                    'مشاريع غير محدودة',
                    'دورات غير محدودة',
                    'رفع فيديوهات حتى 2GB',
                    'استخدام AI غير محدود',
                    'ترجمة تلقائية للفيديوهات',
                    'إحصائيات متقدمة',
                    'دعم أولوية',
                    'بدون إعلانات',
                ]),
                'limits' => json_encode([
                    'max_projects' => -1,
                    'max_courses' => -1,
                    'max_video_size_mb' => 2048,
                    'max_ai_requests_monthly' => -1,
                    'max_storage_gb' => 50,
                ]),
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'premium_yearly',
                'display_name' => 'Premium سنوي',
                'description' => 'الخطة المميزة بفوترة سنوية (وفر 17%)',
                'price' => 99.99,
                'currency' => 'USD',
                'billing_period' => 'yearly',
                'features' => json_encode([
                    'جميع ميزات Premium الشهري',
                    'خصم 17% (شهرين مجاناً)',
                    'أولوية في الدعم الفني',
                    'وصول مبكر للميزات الجديدة',
                ]),
                'limits' => json_encode([
                    'max_projects' => -1,
                    'max_courses' => -1,
                    'max_video_size_mb' => 2048,
                    'max_ai_requests_monthly' => -1,
                    'max_storage_gb' => 100,
                ]),
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'business',
                'display_name' => 'للأعمال',
                'description' => 'خطة للفرق والشركات',
                'price' => 29.99,
                'currency' => 'USD',
                'billing_period' => 'monthly',
                'features' => json_encode([
                    'جميع ميزات Premium',
                    'فريق حتى 10 أعضاء',
                    'مساحة تخزين 200GB',
                    'API Access',
                    'تقارير مخصصة',
                    'دعم فني مخصص',
                ]),
                'limits' => json_encode([
                    'max_projects' => -1,
                    'max_courses' => -1,
                    'max_video_size_mb' => 5120,
                    'max_ai_requests_monthly' => -1,
                    'max_storage_gb' => 200,
                    'max_team_members' => 10,
                ]),
                'is_active' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::firstOrCreate(
                ['name' => $plan['name']],
                $plan
            );
        }

        $this->command->info('Plans created successfully!');
    }
}
