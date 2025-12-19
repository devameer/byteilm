# دليل البدء السريع - Quick Start Guide

## 🚀 تشغيل النظام المحدّث

### المتطلبات
- ✅ PHP 8.1+
- ✅ Composer
- ✅ Node.js 18+
- ✅ MySQL/MariaDB
- ✅ Laravel 10+

---

## Backend Setup

### 1. تطبيق التحديثات
```bash
cd "d:\devameer\new plan\backend"

# 1. تطبيق Migration الجديدة
php artisan migrate

# سيتم تطبيق:
# ✅ 2025_12_18_131556_add_detailed_ai_usage_tracking_to_user_usage_table

# 2. (اختياري) ملء البيانات - فقط إذا لم تكن الباقات موجودة
php artisan db:seed --class=PlanSeeder

# 3. مسح الكاش
php artisan route:clear
php artisan view:clear
php artisan config:clear

# 4. إعادة بناء الكاش
php artisan route:cache
php artisan view:cache
php artisan config:cache

# 5. التحقق من الـ Routes
php artisan route:list | grep -E "plans|usage"
```

**النتيجة المتوقعة:**
```
✓ 3 routes for /api/plans
✓ 2 routes for /api/usage
✓ 2 routes for /admin/usage
✓ 6 routes for /admin/plans
```

### 2. التحقق من قاعدة البيانات
```bash
# افتح MySQL/MariaDB
mysql -u root -p

# تحقق من الجداول
USE plan;
SHOW TABLES LIKE '%usage%';
SHOW TABLES LIKE '%plans%';

# تحقق من الأعمدة الجديدة
DESCRIBE user_usage;

# تحقق من الباقات
SELECT id, name, display_name, price, is_active FROM plans;
```

**النتيجة المتوقعة:**
```
✓ user_usage table has 15 new columns
✓ plans table has 4 rows (free, basic, pro, enterprise)
```

### 3. اختبار API Endpoints
```bash
# 1. اختبار Plans API (Public)
curl http://localhost:8000/api/plans

# يجب أن يعيد JSON بجميع الباقات النشطة

# 2. اختبار Usage API (يتطلب Token)
# أولاً احصل على token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# ثم استخدم الـ token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/usage/dashboard
```

---

## Frontend Setup

### 1. تحديث Landing Page
```bash
cd "d:\devameer\new plan\frontend"

# 1. Backup القديم
mv src/pages/landing/Landing.jsx src/pages/landing/Landing.old.jsx

# 2. استخدام النسخة المحدّثة
mv src/pages/landing/LandingUpdated.jsx src/pages/landing/Landing.jsx

# 3. التأكد من تعريف VITE_API_URL
cat .env
# يجب أن يحتوي على:
# VITE_API_URL=http://localhost:8000

# 4. تثبيت Dependencies (إذا لزم)
npm install axios

# 5. تشغيل Development Server
npm run dev
```

### 2. التحقق من Frontend
```bash
# افتح المتصفح
# http://localhost:5173

# يجب أن تشاهد:
✓ Landing page مع باقات حقيقية من API
✓ الأسعار والميزات تُجلب من قاعدة البيانات
✓ الحدود الشهرية معروضة بوضوح
✓ الباقة "Pro" مميزة كـ "الأكثر شعبية"
```

---

## Admin Panel Access

### 1. تسجيل الدخول
```
URL: http://localhost:8000/admin/login
Email: admin@example.com (أو أي مستخدم admin)
Password: your_admin_password
```

### 2. الوصول لإحصائيات الاستخدام
```
بعد تسجيل الدخول:
1. انقر على "إحصائيات الاستخدام" في القائمة الجانبية
2. شاهد:
   ✓ إحصائيات شاملة للمنصة
   ✓ أكثر المستخدمين استخداماً
   ✓ الاستخدام حسب الباقة
   ✓ المستخدمون القريبون من الحد الأقصى
3. انقر على أي مستخدم لرؤية تفاصيله الكاملة
```

---

## Testing Workflow

### اختبار نظام الحدود (Limits)

#### 1. إنشاء اختبار جديد
```bash
# تسجيل دخول كمستخدم عادي
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# استخدم الـ Token للمحاولة
curl -X POST http://localhost:8000/api/lessons/1/quizzes/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"num_questions":10,"difficulty":"medium"}'

# ✅ إذا كانت الحدود غير مستنفدة:
# سيتم إنشاء الاختبار + زيادة العداد

# ❌ إذا وصلت للحد الأقصى:
# {
#   "error": "Usage limit reached",
#   "message": "لقد وصلت إلى الحد الأقصى لإنشاء الاختبارات...",
#   "current": 5,
#   "limit": 5,
#   "percentage": 100,
#   "upgrade_url": "..."
# }
```

#### 2. التحقق من العدادات
```sql
-- في MySQL
SELECT
    user_id,
    quiz_generations_this_month,
    ai_requests_this_month,
    total_quiz_generations,
    total_ai_requests
FROM user_usage
WHERE user_id = 1;
```

#### 3. اختبار Reset الشهري
```php
// في tinker
php artisan tinker

$usage = \App\Models\UserUsage::find(1);
$usage->last_reset_at = now()->subMonth(); // محاكاة شهر سابق
$usage->save();

$usage->resetIfNeeded(); // يجب أن يعيد العدادات لـ 0

dd($usage->fresh()); // تحقق من القيم
```

---

## Troubleshooting

### مشكلة: API لا يعيد بيانات
```bash
# 1. تحقق من الـ routes
php artisan route:list | grep plans

# 2. تحقق من الـ logs
tail -f storage/logs/laravel.log

# 3. امسح الكاش
php artisan route:clear
php artisan config:clear

# 4. تحقق من قاعدة البيانات
php artisan tinker
>>> \App\Models\Plan::count()
>>> \App\Models\Plan::all()
```

### مشكلة: Frontend لا يجلب البيانات
```bash
# 1. تحقق من .env
cat frontend/.env
# VITE_API_URL يجب أن يكون صحيح

# 2. تحقق من Console في المتصفح
# F12 → Console → ابحث عن أخطاء

# 3. تحقق من Network Tab
# F12 → Network → راقب طلبات /api/plans

# 4. اختبار مباشر
curl http://localhost:8000/api/plans
```

### مشكلة: Middleware يحجب الطلبات
```php
// في tinker
$user = \App\Models\User::find(1);
$subscription = $user->subscriptions()->where('status', 'active')->first();

// تحقق من:
dd([
    'has_subscription' => $subscription !== null,
    'plan' => $subscription?->plan,
    'limits' => $subscription?->plan?->limits,
    'usage' => $user->usage,
]);
```

### مشكلة: Admin Panel لا يعرض البيانات
```bash
# 1. تحقق من الـ views
ls -la resources/views/admin/usage/

# 2. امسح view cache
php artisan view:clear

# 3. تحقق من الـ controller
php artisan route:list --name=admin.usage

# 4. تحقق من البيانات
php artisan tinker
>>> \App\Models\UserUsage::count()
```

---

## Performance Optimization

### 1. Database Indexes
```sql
-- إضافة Indexes للأعمدة الأكثر استخداماً
ALTER TABLE user_usage ADD INDEX idx_user_id (user_id);
ALTER TABLE user_usage ADD INDEX idx_ai_requests (ai_requests_this_month);
ALTER TABLE user_usage ADD INDEX idx_last_reset (last_reset_at);
```

### 2. Query Optimization
```php
// استخدام eager loading
$topUsers = UserUsage::with('user')
    ->orderByDesc('ai_requests_this_month')
    ->limit(10)
    ->get();

// Caching للباقات (نادراً ما تتغير)
$plans = Cache::remember('active_plans', 3600, function () {
    return Plan::where('is_active', true)->get();
});
```

### 3. Frontend Optimization
```javascript
// Cache plans in localStorage (optional)
const fetchPlans = async () => {
  const cached = localStorage.getItem('plans');
  const cacheTime = localStorage.getItem('plans_cache_time');

  // Use cache if less than 1 hour old
  if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
    return JSON.parse(cached);
  }

  const response = await axios.get(`${API_URL}/api/plans`);
  localStorage.setItem('plans', JSON.stringify(response.data.data));
  localStorage.setItem('plans_cache_time', Date.now().toString());

  return response.data.data;
};
```

---

## Monitoring & Alerts

### 1. Setup Log Monitoring
```bash
# في production
tail -f storage/logs/laravel.log | grep -E "limit|usage|quota"
```

### 2. Database Monitoring
```sql
-- مراقبة المستخدمين القريبون من الحد
SELECT
    u.name,
    u.email,
    uu.ai_requests_this_month,
    p.limits->>'$.max_ai_requests_per_month' as limit,
    ROUND((uu.ai_requests_this_month * 100.0 / (p.limits->>'$.max_ai_requests_per_month')), 2) as percentage
FROM users u
JOIN user_usage uu ON u.id = uu.user_id
JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
JOIN plans p ON s.plan_id = p.id
WHERE (uu.ai_requests_this_month * 100.0 / (p.limits->>'$.max_ai_requests_per_month')) >= 80
ORDER BY percentage DESC;
```

### 3. Automated Alerts (Recommendation)
```php
// في Scheduler (app/Console/Kernel.php)
$schedule->call(function () {
    $usersNearLimit = User::whereHas('usage', function ($q) {
        // Logic to find users at 90%+ of their limits
    })->get();

    foreach ($usersNearLimit as $user) {
        // Send email notification
        Mail::to($user)->send(new UsageLimitWarning($user));
    }
})->daily();
```

---

## Next Steps

### Immediate:
1. ✅ Deploy updated Landing page
2. ✅ Monitor usage in admin panel
3. ✅ Test all API endpoints
4. ✅ Gather user feedback

### Short-term:
1. Add usage charts
2. Implement email alerts
3. Create plan comparison page
4. Add usage export (PDF/Excel)

### Long-term:
1. Usage analytics dashboard
2. Custom plan builder
3. Automated usage reports
4. ML-based usage predictions

---

## Documentation Links

- 📖 [Full Usage System Docs](USAGE_SYSTEM_DOCUMENTATION.md)
- 📖 [Admin Panel Guide](ADMIN_USAGE_PANEL_DOCUMENTATION.md)
- 📖 [Comprehensive Audit](COMPREHENSIVE_SYSTEM_AUDIT.md)
- 📖 [Integration Summary](INTEGRATION_SUMMARY.md)

---

## Support

### Getting Help:
1. Check documentation files above
2. Review Laravel logs: `storage/logs/laravel.log`
3. Check browser console (F12) for frontend issues
4. Verify database state using `php artisan tinker`

### Common Commands:
```bash
# Clear all caches
php artisan optimize:clear

# Run migrations
php artisan migrate

# Check routes
php artisan route:list

# Interactive PHP console
php artisan tinker

# View logs in realtime
tail -f storage/logs/laravel.log
```

---

**Created:** 2025-12-18
**Version:** 1.0.0
**Status:** ✅ READY TO USE
