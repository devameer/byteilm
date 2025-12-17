import React, { useEffect } from "react";
import PublicLayout from "../../components/layout/PublicLayout";

const FeaturesPage = () => {
  useEffect(() => {
    // إضافة سكريبت التمرير السلس
    const handleSmoothScroll = () => {
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute("href"));
          if (target) {
            target.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        });
      });
    };

    handleSmoothScroll();
  }, []);

  return (
    <PublicLayout>
      <div className="rtl" dir="rtl">
        {/* Navigation */}
        <nav className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <i className="fas fa-rocket text-white text-lg"></i>
                </div>
                <span className="text-2xl font-bold gradient-text">منصتك</span>
              </div>

              <div className="hidden md:flex items-center gap-8">
                <a
                  href="/"
                  className="text-slate-600 hover:text-indigo-600 transition"
                >
                  الرئيسية
                </a>
                <a href="/features" className="text-indigo-600 font-semibold">
                  المميزات
                </a>
                <a
                  href="/#pricing"
                  className="text-slate-600 hover:text-indigo-600 transition"
                >
                  الأسعار
                </a>
                <a
                  href="/support/faq"
                  className="text-slate-600 hover:text-indigo-600 transition"
                >
                  الدعم
                </a>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="/admin/login"
                  className="px-4 py-2 text-slate-600 hover:text-indigo-600 transition"
                >
                  تسجيل الدخول
                </a>
                <a
                  href="/register"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                >
                  ابدأ مجاناً
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 gradient-bg">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-5xl lg:text-6xl font-black text-white mb-6">
              32+ ميزة قوية في منصة واحدة
            </h1>
            <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
              اكتشف مجموعة شاملة من الأدوات والمزايا المصممة لتعزيز إنتاجيتك
              وتسهيل إدارة مشاريعك ودوراتك التعليمية
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-white font-semibold">
                <i className="fas fa-check-circle text-green-300 ml-2"></i>
                32 ميزة عاملة
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-white font-semibold">
                <i className="fas fa-robot text-yellow-300 ml-2"></i>
                ذكاء اصطناعي
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-white font-semibold">
                <i className="fas fa-shield-alt text-blue-300 ml-2"></i>
                آمن ومحمي
              </div>
            </div>
            <a
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:shadow-2xl transition"
            >
              <i className="fas fa-rocket ml-2"></i>
              ابدأ استخدام المنصة مجاناً
            </a>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="py-8 bg-white border-b border-slate-200">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-black gradient-text mb-2">9</div>
                <div className="text-sm text-slate-600">مميزات التعلم</div>
              </div>
              <div>
                <div className="text-4xl font-black gradient-text mb-2">4</div>
                <div className="text-sm text-slate-600">إدارة المشاريع</div>
              </div>
              <div>
                <div className="text-4xl font-black gradient-text mb-2">7</div>
                <div className="text-sm text-slate-600">لوحة الإدارة</div>
              </div>
              <div>
                <div className="text-4xl font-black gradient-text mb-2">12</div>
                <div className="text-sm text-slate-600">مميزات متقدمة</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Categories */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            {/* Learning Management Features */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-2 rounded-full mb-4">
                  <i className="fas fa-graduation-cap ml-2"></i>
                  إدارة التعلم والدورات
                </div>
                <h2 className="text-4xl font-black text-slate-800 mb-4">
                  منصة تعليمية متكاملة مع الذكاء الاصطناعي
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  9 مميزات قوية لإنشاء وإدارة دوراتك التعليمية بسهولة واحترافية
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="feature-box bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fas fa-book text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    إدارة الدورات
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    CRUD كامل للدورات مع إحصائيات تفصيلية، تفعيل/تعطيل، ترقيم
                    تلقائي للدروس، وتتبع شامل للتقدم
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-indigo-500"></i>
                      <span>إنشاء دورات غير محدودة</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-indigo-500"></i>
                      <span>إحصائيات مفصلة لكل دورة</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-indigo-500"></i>
                      <span>ربط الدروس والمهام</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 2 */}
                <div className="feature-box bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fas fa-chalkboard-teacher text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    إدارة الدروس
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    نظام متكامل لإدارة الدروس مع إمكانية ربطها بالدورات والمهام
                    وتتبع حالة الإكمال
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-purple-500"></i>
                      <span>ربط بالدورات والفئات</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-purple-500"></i>
                      <span>تتبع حالة الإكمال</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-purple-500"></i>
                      <span>ملخصات وملاحظات</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 3 */}
                <div className="feature-box bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fas fa-video text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    رفع فيديوهات متقدم
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    رفع عادي أو مجزأ (Chunked Upload) للملفات الكبيرة مع تتبع
                    حالة الرفع وإمكانية الإلغاء
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-blue-500"></i>
                      <span>رفع ملفات ضخمة (Chunked)</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-blue-500"></i>
                      <span>تتبع التقدم والإلغاء</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-blue-500"></i>
                      <span>معلومات تفصيلية للفيديو</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 4 */}
                <div className="feature-box bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-8 border border-red-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fab fa-youtube text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    استيراد من YouTube
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    استورد فيديوهاتك من YouTube مباشرة باستخدام الرابط فقط، مع
                    دعم كامل للتشغيل
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-red-500"></i>
                      <span>استيراد سريع بالرابط</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-red-500"></i>
                      <span>بيانات الفيديو تلقائياً</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-red-500"></i>
                      <span>مشغل YouTube مدمج</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 5 */}
                <div className="feature-box bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 border border-teal-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fas fa-play-circle text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    بث فيديو متقدم
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    نظام Streaming احترافي للفيديوهات مع تحكم كامل في السرعة
                    والجودة
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-teal-500"></i>
                      <span>بث سلس بدون تقطيع</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-teal-500"></i>
                      <span>تحكم في السرعة</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-teal-500"></i>
                      <span>دعم جميع الصيغ</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 6 */}
                <div className="feature-box bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fas fa-closed-captioning text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    ترجمات ذكية
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    رفع ترجمات (VTT/SRT) أو توليدها تلقائياً بالذكاء الاصطناعي
                    بأي لغة
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-amber-500"></i>
                      <span>رفع ملفات ترجمة</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-amber-500"></i>
                      <span>دعم VTT و SRT</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-amber-500"></i>
                      <span>تحديث اللغة</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 7 */}
                <div className="feature-box bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fas fa-robot text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    تحويل صوت لنص (AI)
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    استخدم الذكاء الاصطناعي (Gemini AI) لتحويل الصوت إلى نص بدقة
                    عالية
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <span>تحويل تلقائي بـ AI</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <span>دقة عالية جداً</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <span>حفظ كملف ترجمة</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 8 */}
                <div className="feature-box bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-8 border border-violet-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fas fa-language text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    ترجمة تلقائية (AI)
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    ترجم الترجمات لأي لغة بالذكاء الاصطناعي مع كشف تلقائي للغة
                    المصدر
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-violet-500"></i>
                      <span>ترجمة لأي لغة</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-violet-500"></i>
                      <span>كشف اللغة تلقائياً</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-violet-500"></i>
                      <span>Gemini AI</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 9 */}
                <div className="feature-box bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-8 border border-pink-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fas fa-photo-video text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    مكتبة الوسائط
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    إدارة مركزية لجميع الفيديوهات مع إمكانية ربط فيديو واحد بعدة
                    دروس
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-pink-500"></i>
                      <span>إدارة مركزية</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-pink-500"></i>
                      <span>ربط بعدة دروس</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-pink-500"></i>
                      <span>رفع مجزأ</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Project Management Features */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <div className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full mb-4">
                  <i className="fas fa-tasks ml-2"></i>
                  إدارة المشاريع والمهام
                </div>
                <h2 className="text-4xl font-black text-slate-800 mb-4">
                  نظّم عملك واحصل على إنتاجية أعلى
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  4 أدوات قوية لإدارة مشاريعك ومهامك وتقويمك بكفاءة عالية
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="feature-box bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fas fa-project-diagram text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    إدارة المشاريع
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    CRUD كامل مع تتبع التقدم، إحصائيات، وربط بالمهام
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-blue-500"></i>
                      <span>تتبع التقدم</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-blue-500"></i>
                      <span>إحصائيات شاملة</span>
                    </li>
                  </ul>
                </div>

                <div className="feature-box bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fas fa-check-square text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    إدارة المهام
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    مهام متقدمة مع أنواع، أولويات، حالات، tags، وتصفية
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-indigo-500"></i>
                      <span>4 أولويات</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-indigo-500"></i>
                      <span>Tags + تصفية</span>
                    </li>
                  </ul>
                </div>

                <div className="feature-box bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fas fa-calendar-alt text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    تقويم تفاعلي
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    عرض شهري مع Drag & Drop، إحصائيات، وبحث متقدم
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-purple-500"></i>
                      <span>سحب وإفلات</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-purple-500"></i>
                      <span>إحصائيات مفصلة</span>
                    </li>
                  </ul>
                </div>

                <div className="feature-box bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-8 border border-pink-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fas fa-folder text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    الفئات والمحفزات
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    نظّم محتواك بالفئات واستخدم المحفزات (Prompts)
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-pink-500"></i>
                      <span>CRUD كامل</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-pink-500"></i>
                      <span>تنظيم ذكي</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Dashboards */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full mb-4">
                  <i className="fas fa-chart-line ml-2"></i>
                  لوحات التحكم
                </div>
                <h2 className="text-4xl font-black text-slate-800 mb-4">
                  تحكم كامل بكل التفاصيل
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  لوحات تحكم شاملة للمستخدمين والإدارة مع رسوم بيانية وإحصائيات
                  متقدمة
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="feature-box bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fas fa-tachometer-alt text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    Dashboard المستخدم
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    إحصائيات شاملة، رسوم بيانية تفاعلية، سلاسل الإنجاز
                    (Streaks)، والشارات المكتسبة
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <span>رسوم بيانية (Chart.js)</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <span>Streaks & Badges</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <span>أفضل 5 دورات</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <span>الدروس القادمة</span>
                    </li>
                  </ul>
                </div>

                <div className="feature-box bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fas fa-crown text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    Dashboard الإدارة
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    لوحة تحكم احترافية مع MRR، Churn Rate، نمو المستخدمين،
                    وتحليلات الإيرادات
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-emerald-500"></i>
                      <span>MRR & Churn Rate</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-emerald-500"></i>
                      <span>معدل التحويل</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-emerald-500"></i>
                      <span>أكثر المستخدمين نشاطاً</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check-circle text-emerald-500"></i>
                      <span>رسوم النمو والإيرادات</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Admin Panel Features */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <div className="inline-block bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded-full mb-4">
                  <i className="fas fa-user-shield ml-2"></i>
                  نظام الإدارة الكامل
                </div>
                <h2 className="text-4xl font-black text-slate-800 mb-4">
                  تحكم كامل في منصتك
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  7 أدوات إدارية قوية لإدارة المستخدمين، الباقات، المدفوعات،
                  والدعم
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-orange-300">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-users text-orange-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    إدارة المستخدمين
                  </h3>
                  <p className="text-sm text-slate-600">
                    CRUD + تصفية متقدمة + إحصائيات + انتحال الشخصية
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-red-300">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-user-lock text-red-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    الأدوار والصلاحيات
                  </h3>
                  <p className="text-sm text-slate-600">
                    Super Admin, Admin, User مع صلاحيات متعددة
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-purple-300">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-box text-purple-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    إدارة الباقات
                  </h3>
                  <p className="text-sm text-slate-600">
                    Free, Pro, Enterprise مع تفعيل/تعطيل
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-blue-300">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-credit-card text-blue-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    إدارة الاشتراكات
                  </h3>
                  <p className="text-sm text-slate-600">
                    تقارير + MRR + إلغاء/استئناف
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-green-300">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-money-bill-wave text-green-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    إدارة المدفوعات
                  </h3>
                  <p className="text-sm text-slate-600">
                    تقارير + تصفية + تصدير CSV + أفضل 10 عملاء
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-teal-300">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-headset text-teal-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    نظام الدعم
                  </h3>
                  <p className="text-sm text-slate-600">
                    تذاكر + FAQ + رسائل + تتبع كامل
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-300">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-chart-bar text-indigo-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    التحليلات
                  </h3>
                  <p className="text-sm text-slate-600">
                    نمو المستخدمين + تحليل الإيرادات + Cohort Analysis
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Features */}
            <div>
              <div className="text-center mb-12">
                <div className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-full mb-4">
                  <i className="fas fa-star ml-2"></i>
                  مميزات متقدمة
                </div>
                <h2 className="text-4xl font-black text-slate-800 mb-4">
                  تقنيات حديثة وأمان عالي
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  12 ميزة متقدمة للأمان، التتبع، والتكامل مع أدوات خارجية
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-cyan-300">
                  <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-share-alt text-cyan-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    نظام الإحالات
                  </h3>
                  <p className="text-sm text-slate-600">
                    أكواد + تتبع زيارات + عمولات
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-blue-300">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-users-cog text-blue-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    إدارة الفرق
                  </h3>
                  <p className="text-sm text-slate-600">
                    Teams + أعضاء + صلاحيات + موارد مشتركة
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-300">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fab fa-telegram text-indigo-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    Telegram Bot
                  </h3>
                  <p className="text-sm text-slate-600">
                    Webhook + إشعارات + أوامر + سجلات
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-purple-300">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-shield-alt text-purple-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    مصادقة قوية
                  </h3>
                  <p className="text-sm text-slate-600">
                    Sanctum + Rate Limiting + CSRF
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-red-300">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-lock text-red-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    حماية متقدمة
                  </h3>
                  <p className="text-sm text-slate-600">
                    Security Headers + XSS + CSP
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-green-300">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-history text-green-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    تتبع النشاط
                  </h3>
                  <p className="text-sm text-slate-600">
                    Activity Logs + Login Logs + API Logs
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-yellow-300">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-bell text-yellow-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    نظام الإشعارات
                  </h3>
                  <p className="text-sm text-slate-600">
                    إشعارات الموقع + البريد + Pusher
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-orange-300">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fab fa-git-alt text-orange-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    أدوات Git
                  </h3>
                  <p className="text-sm text-slate-600">
                    سحب التحديثات من المستودع
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-pink-300">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-trophy text-pink-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    Gamification
                  </h3>
                  <p className="text-sm text-slate-600">
                    Streaks + Badges + تتبع الإنجازات
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-teal-300">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-file-export text-teal-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    تقارير متقدمة
                  </h3>
                  <p className="text-sm text-slate-600">
                    تصدير CSV + PDF + إحصائيات شاملة
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-violet-300">
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-filter text-violet-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    بحث وتصفية
                  </h3>
                  <p className="text-sm text-slate-600">
                    تصفية متقدمة في كل الصفحات
                  </p>
                </div>

                <div className="feature-box bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-slate-300">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-user-secret text-slate-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    Global Scopes
                  </h3>
                  <p className="text-sm text-slate-600">
                    عزل بيانات المستخدمين تلقائياً
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 gradient-bg">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
              جاهز لتجربة كل هذه المميزات؟
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              ابدأ اليوم مجاناً واحصل على وصول فوري لـ 32+ ميزة قوية
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="/register"
                className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:shadow-2xl transition transform hover:scale-105"
              >
                <i className="fas fa-rocket ml-2"></i>
                ابدأ الآن مجاناً - لا حاجة لبطاقة ائتمان
              </a>
              <a
                href="/#pricing"
                className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition"
              >
                <i className="fas fa-tag ml-2"></i>
                عرض الباقات والأسعار
              </a>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="text-4xl font-black text-white mb-2">32+</div>
                <div className="text-purple-100">ميزة عاملة</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="text-4xl font-black text-white mb-2">100%</div>
                <div className="text-purple-100">آمن ومحمي</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="text-4xl font-black text-white mb-2">24/7</div>
                <div className="text-purple-100">دعم فني</div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-white py-12">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                    <i className="fas fa-rocket text-white"></i>
                  </div>
                  <span className="text-xl font-bold">منصتك</span>
                </div>
                <p className="text-slate-400 mb-4">
                  منصة شاملة لإدارة المشاريع والدورات التعليمية
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">روابط سريعة</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/"
                      className="text-slate-400 hover:text-white transition"
                    >
                      الرئيسية
                    </a>
                  </li>
                  <li>
                    <a
                      href="/features"
                      className="text-slate-400 hover:text-white transition"
                    >
                      المميزات
                    </a>
                  </li>
                  <li>
                    <a
                      href="/#pricing"
                      className="text-slate-400 hover:text-white transition"
                    >
                      الأسعار
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">الدعم</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/support/faq"
                      className="text-slate-400 hover:text-white transition"
                    >
                      مركز المساعدة
                    </a>
                  </li>
                  <li>
                    <a
                      href="/support/tickets"
                      className="text-slate-400 hover:text-white transition"
                    >
                      تذاكر الدعم
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">تواصل معنا</h3>
                <ul className="space-y-2 text-slate-400">
                  <li className="flex items-center gap-2">
                    <i className="fas fa-envelope"></i>
                    <span>info@plan.com</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-phone"></i>
                    <span>+966 50 123 4567</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
              <p>
                &copy; {new Date().getFullYear()} منصتك. جميع الحقوق محفوظة.
              </p>
            </div>
          </div>
        </footer>

        {/* CSS Styles */}
        <style jsx>{`
          .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .gradient-text {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .feature-box {
            transition: all 0.3s ease;
          }

          .feature-box:hover {
            transform: translateY(-5px);
          }
        `}</style>
      </div>
    </PublicLayout>
  );
};

export default FeaturesPage;
