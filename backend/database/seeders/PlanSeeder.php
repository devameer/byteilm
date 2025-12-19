<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Skip deletion if plans already exist (to avoid foreign key constraints)
        if (Plan::count() > 0) {
            $this->command->warn('Plans already exist. Skipping seeding to avoid conflicts.');
            return;
        }

        // Free Plan
        Plan::create([
            'name' => 'free',
            'display_name' => 'الخطة المجانية',
            'description' => 'مثالية للمبتدئين لتجربة المنصة',
            'price' => 0.00,
            'currency' => 'USD',
            'billing_period' => 'lifetime',
            'is_active' => true,
            'sort_order' => 1,
            'features' => [
                'الوصول إلى الدورات الأساسية',
                'إنشاء مشاريع محدودة',
                'التخزين الأساسي',
                'دعم عبر البريد الإلكتروني',
            ],
            'limits' => [
                // Basic Limits
                'max_projects' => 2,
                'max_courses' => 3,
                'max_storage_mb' => 500, // 500 MB
                'max_storage_gb' => 0.5,

                // AI Limits (Very Limited)
                'max_ai_requests_per_month' => 50,
                'max_quiz_generations_per_month' => 5,
                'max_video_transcriptions_per_month' => 2,
                'max_video_analyses_per_month' => 2,
                'max_ai_chat_messages_per_month' => 20,
                'max_text_translations_per_month' => 10,
                'max_text_summarizations_per_month' => 10,
                'max_videos_per_month' => 5,

                // External API Usage
                'can_use_assemblyai' => false, // Only Gemini allowed
                'can_use_google_calendar' => false,
            ],
        ]);

        // Basic Plan
        Plan::create([
            'name' => 'basic',
            'display_name' => 'الخطة الأساسية',
            'description' => 'للطلاب والمتعلمين الجادين',
            'price' => 9.99,
            'currency' => 'USD',
            'billing_period' => 'monthly',
            'is_active' => true,
            'sort_order' => 2,
            'features' => [
                'جميع ميزات الخطة المجانية',
                'إنشاء مشاريع غير محدودة',
                'دورات غير محدودة',
                '10 GB تخزين',
                'إنشاء اختبارات بالذكاء الاصطناعي',
                'تحويل الفيديو لنص (محدود)',
                'الترجمة الآلية',
                'دعم عبر الدردشة',
            ],
            'limits' => [
                // Basic Limits
                'max_projects' => -1, // Unlimited
                'max_courses' => -1, // Unlimited
                'max_storage_mb' => 10240, // 10 GB
                'max_storage_gb' => 10,

                // AI Limits (Moderate)
                'max_ai_requests_per_month' => 300,
                'max_quiz_generations_per_month' => 30,
                'max_video_transcriptions_per_month' => 10,
                'max_video_analyses_per_month' => 10,
                'max_ai_chat_messages_per_month' => 150,
                'max_text_translations_per_month' => 50,
                'max_text_summarizations_per_month' => 50,
                'max_videos_per_month' => 30,

                // External API Usage
                'can_use_assemblyai' => false, // Only Gemini
                'can_use_google_calendar' => true,
            ],
        ]);

        // Pro Plan
        Plan::create([
            'name' => 'pro',
            'display_name' => 'الخطة الاحترافية',
            'description' => 'للمدرسين والمحترفين',
            'price' => 24.99,
            'currency' => 'USD',
            'billing_period' => 'monthly',
            'is_active' => true,
            'sort_order' => 3,
            'features' => [
                'جميع ميزات الخطة الأساسية',
                '50 GB تخزين',
                'تحويل فيديو غير محدود بـ AssemblyAI',
                'تحليل الفيديو بالذكاء الاصطناعي',
                'محادثات الذكاء الاصطناعي غير محدودة',
                'توصيات ذكية متقدمة',
                'تكامل مع Google Calendar',
                'دعم أولوية',
            ],
            'limits' => [
                // Basic Limits
                'max_projects' => -1, // Unlimited
                'max_courses' => -1, // Unlimited
                'max_storage_mb' => 51200, // 50 GB
                'max_storage_gb' => 50,

                // AI Limits (High)
                'max_ai_requests_per_month' => 1500,
                'max_quiz_generations_per_month' => 100,
                'max_video_transcriptions_per_month' => 50,
                'max_video_analyses_per_month' => 50,
                'max_ai_chat_messages_per_month' => 800,
                'max_text_translations_per_month' => 300,
                'max_text_summarizations_per_month' => 300,
                'max_videos_per_month' => 100,

                // External API Usage
                'can_use_assemblyai' => true,
                'can_use_google_calendar' => true,
            ],
        ]);

        // Enterprise Plan
        Plan::create([
            'name' => 'enterprise',
            'display_name' => 'خطة المؤسسات',
            'description' => 'للمؤسسات التعليمية والفرق الكبيرة',
            'price' => 99.99,
            'currency' => 'USD',
            'billing_period' => 'monthly',
            'is_active' => true,
            'sort_order' => 4,
            'features' => [
                'جميع ميزات الخطة الاحترافية',
                'تخزين غير محدود',
                'جميع ميزات الذكاء الاصطناعي غير محدودة',
                'تحويل وتحليل فيديو غير محدود',
                'API وصول كامل',
                'تقارير وإحصائيات متقدمة',
                'مدير حساب مخصص',
                'دعم 24/7',
                'تدريب مخصص',
            ],
            'limits' => [
                // All Unlimited
                'max_projects' => -1,
                'max_courses' => -1,
                'max_storage_mb' => -1,
                'max_storage_gb' => -1,

                // AI Limits (Unlimited)
                'max_ai_requests_per_month' => -1,
                'max_quiz_generations_per_month' => -1,
                'max_video_transcriptions_per_month' => -1,
                'max_video_analyses_per_month' => -1,
                'max_ai_chat_messages_per_month' => -1,
                'max_text_translations_per_month' => -1,
                'max_text_summarizations_per_month' => -1,
                'max_videos_per_month' => -1,

                // External API Usage
                'can_use_assemblyai' => true,
                'can_use_google_calendar' => true,
            ],
        ]);

        $this->command->info('Plans seeded successfully!');
    }
}
