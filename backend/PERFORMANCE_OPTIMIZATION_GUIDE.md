# دليل تحسين الأداء الشامل
# Performance Optimization Guide

هذا الدليل يوضح جميع تحسينات الأداء المطبقة والمخطط لها في المشروع.

---

## 📊 الحالة الحالية

### ✅ المنجز
- [x] CacheService محسّن
- [x] Request Deduplication في Frontend
- [x] Loading Skeletons
- [x] Toast Notifications
- [x] Error Boundaries
- [x] Code Splitting & Lazy Loading

### 🔄 قيد التنفيذ
- [ ] تثبيت وتفعيل Redis
- [ ] إنشاء Indexes Migration
- [ ] تطبيق Query Optimization
- [ ] Image Optimization
- [ ] Gzip Compression
- [ ] CDN Setup

---

## 1️⃣ Redis للكاش

### التثبيت والإعداد

#### على Windows:
\`\`\`bash
# تحميل Redis for Windows
# من: https://github.com/microsoftarchive/redis/releases

# أو استخدام WSL2
wsl --install
wsl
sudo apt-get update
sudo apt-get install redis-server
redis-server

# أو Chocolatey
choco install redis-64
redis-server
\`\`\`

#### على Linux/Mac:
\`\`\`bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# macOS
brew install redis
brew services start redis
\`\`\`

#### Docker (موصى به):
\`\`\`bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine redis-server --appendonly yes
\`\`\`

### تفعيل Redis في Laravel

#### 1. تثبيت PHP Redis Extension:
\`\`\`bash
# للتحقق من التثبيت
php -m | grep redis

# إذا لم يكن مثبتاً:
# Windows: قم بتحميل php_redis.dll وأضفه إلى php.ini
# Linux: sudo apt-get install php-redis
# Mac: pecl install redis
\`\`\`

#### 2. تحديث ملف \`.env\`:
\`\`\`env
# تغيير من database إلى redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# إعدادات Redis
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# قواعد بيانات Redis منفصلة
REDIS_DB=0
REDIS_CACHE_DB=1
REDIS_QUEUE_DB=2
REDIS_SESSION_DB=3
\`\`\`

#### 3. تنظيف الكاش:
\`\`\`bash
php artisan cache:clear
php artisan config:clear
php artisan config:cache
\`\`\`

### استخدام CacheService المحسّن

\`\`\`php
use App\Services\CacheService;

\$cache = app(CacheService::class);

// كاش بسيط
\$data = \$cache->remember('my-key', CacheService::CACHE_MEDIUM, function() {
    return MyModel::all();
});

// كاش خاص بالمستخدم
\$userStats = \$cache->rememberUser('stats', \$userId, CacheService::CACHE_SHORT, function() use (\$userId) {
    return User::find(\$userId)->getStatistics();
});

// كاش الداشبورد
\$dashboard = \$cache->rememberDashboard(\$userId, CacheService::CACHE_MEDIUM, function() use (\$userId) {
    return DashboardService::getData(\$userId);
});

// إلغاء الكاش
\$cache->clearUserCache(\$userId);
\$cache->clearDashboardCache(\$userId);
\$cache->clearCourseCache(\$courseId);
\`\`\`

---

## 2️⃣ تحسين استعلامات قاعدة البيانات

### N+1 Query Problem

#### ❌ قبل التحسين:
\`\`\`php
\$courses = Course::all(); // 1 query
foreach (\$courses as \$course) {
    \$lessons = \$course->lessons; // N queries
}
// إجمالي: 1 + N queries
\`\`\`

#### ✅ بعد التحسين:
\`\`\`php
\$courses = Course::with('lessons')->get(); // 2 queries فقط
\`\`\`

### Eager Loading Strategy

\`\`\`php
// في Controllers
\$courses = Course::query()
    ->with(['lessons', 'category', 'user'])
    ->where('active', true)
    ->get();

// في Models - تحميل افتراضي
protected \$with = ['category'];

// تحميل شرطي
public function scopeWithDetails(\$query)
{
    return \$query->with([
        'lessons' => function (\$q) {
            \$q->where('completed', false)
              ->orderBy('order');
        },
        'category',
        'user:id,name,email'
    ]);
}
\`\`\`

---

## 3️⃣ إضافة Indexes

\`\`\`bash
php artisan make:migration add_performance_indexes_to_all_tables
\`\`\`

انظر إلى الملف التالي للكود الكامل:
\`plan-backend/database/migrations/2025_01_20_000001_add_performance_indexes.php\`

---

## 4️⃣ Lazy Loading للصور

### إنشاء LazyImage Component:

\`\`\`jsx
// plan-frontend/src/components/LazyImage.jsx
import React, { useState, useEffect, useRef } from 'react';

const LazyImage = ({ src, alt, placeholder = '/placeholder.png', className = '', ...props }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    let observer;
    if (imgRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imgRef.current);
            }
          });
        },
        { rootMargin: '50px' }
      );
      observer.observe(imgRef.current);
    }
    return () => {
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={\`\${className} \${imageLoaded ? 'loaded' : 'loading'}\`}
      onLoad={() => setImageLoaded(true)}
      {...props}
    />
  );
};

export default LazyImage;
\`\`\`

---

## 5️⃣ Gzip Compression

### Vite Configuration:

\`\`\`bash
cd plan-frontend
npm install -D vite-plugin-compression
\`\`\`

\`\`\`javascript
// vite.config.js
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],
});
\`\`\`

---

## 📈 مؤشرات الأداء المتوقعة

| المؤشر | قبل | بعد | التحسين |
|--------|-----|-----|---------|
| وقت التحميل | ~4s | ~1.5s | 62% |
| حجم الصفحة | ~2.5MB | ~800KB | 68% |
| عدد الطلبات | ~80 | ~40 | 50% |
| DB Queries | ~150 | ~20 | 87% |

---

## ✅ Checklist التنفيذ

### المرحلة الأولى (أسبوع 1):
- [x] تحسين CacheService
- [ ] تثبيت وتفعيل Redis
- [ ] إنشاء Indexes Migration
- [ ] تطبيق Query Optimization

### المرحلة الثانية (أسبوع 2):
- [ ] LazyImage Component
- [ ] Image Optimization Service
- [ ] Gzip Compression
- [ ] Testing & Benchmarking

---

**آخر تحديث**: 2025-12-14
