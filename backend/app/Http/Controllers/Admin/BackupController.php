<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\View\View;

class BackupController extends Controller
{
    public function index(): View
    {
        $strategies = [
            ['name' => __('النسخ الاحتياطي التلقائي'), 'description' => __('جدولة النسخ الاحتياطي لقاعدة البيانات والملفات أسبوعياً أو يومياً.')],
            ['name' => __('الاستعادة'), 'description' => __('اختيار نسخة احتياطية لاستعادة البيانات كاملة أو جزئية.')],
            ['name' => __('تصدير البيانات الشخصية (GDPR)'), 'description' => __('تجهيز حزم بيانات قابلة للتنزيل بناءً على طلب المستخدم.')],
        ];

        return view('admin.backups.index', compact('strategies'));
    }
}
