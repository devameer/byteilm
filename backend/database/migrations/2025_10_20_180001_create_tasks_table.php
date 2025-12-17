<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();

            // العلاقات المتعددة (nullable لأن Task يمكن أن تكون مستقلة)
            $table->unsignedBigInteger('project_id')->nullable();
            $table->unsignedBigInteger('lesson_id')->nullable();
            $table->unsignedBigInteger('course_id')->nullable();

            // Foreign keys
            // Only add foreign key for projects (InnoDB)
            // lessons and courses use MyISAM engine which doesn't support foreign keys
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');

            // Indexes for lessons and courses (instead of foreign keys)
            $table->index('lesson_id');
            $table->index('course_id');

            // الحالة والأولوية
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->nullable();

            // التواريخ
            $table->date('scheduled_date')->nullable(); // التاريخ المجدول
            $table->date('due_date')->nullable(); // تاريخ الاستحقاق
            $table->timestamp('completed_at')->nullable();

            // معلومات إضافية
            $table->string('type')->nullable(); // نوع المهمة (video, reading, coding, etc.)
            $table->integer('estimated_duration')->nullable(); // بالدقائق
            $table->integer('actual_duration')->nullable(); // بالدقائق
            $table->string('link')->nullable(); // رابط خارجي
            $table->json('tags')->nullable(); // وسوم

            // ترتيب وتنظيم
            $table->integer('order')->default(0);

            $table->timestamps();

            // Indexes للبحث السريع
            $table->index('scheduled_date');
            $table->index('due_date');
            $table->index('status');
            $table->index('priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
