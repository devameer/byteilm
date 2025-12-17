import React, { useState } from "react";
import { Link } from "react-router-dom";
import PublicNavbar from "../../components/landing/PublicNavbar";
import PublicFooter from "../../components/landing/PublicFooter";
import PublicLayout from "../../components/layout/PublicLayout";

const FeaturesPage = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const features = [
    {
      category: "projects",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      title: "لوحة المشاريع",
      description: "عرض شامل لجميع مشاريعك مع إحصائيات فورية",
      gradient: "from-indigo-500 to-blue-500",
    },
    {
      category: "projects",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
      title: "إدارة المهام",
      description: "نظام متقدم لتتبع المهام مع أولويات ومواعيد نهائية",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      category: "projects",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      title: "إدارة الفرق",
      description: "تعاون سلس مع أعضاء فريقك وتوزيع المهام",
      gradient: "from-cyan-500 to-teal-500",
    },
    {
      category: "projects",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      title: "تقارير المشاريع",
      description: "تقارير تفصيلية عن تقدم المشاريع والأداء",
      gradient: "from-teal-500 to-green-500",
    },
    {
      category: "education",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
      title: "إدارة الدورات",
      description: "إنشاء وإدارة دوراتك التعليمية بسهولة",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      category: "education",
      icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
      title: "دروس الفيديو",
      description: "رفع ومشاركة دروس الفيديو التفاعلية",
      gradient: "from-pink-500 to-red-500",
    },
    {
      category: "education",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      title: "الاختبارات والواجبات",
      description: "إنشاء اختبارات تفاعلية وتقييم تلقائي",
      gradient: "from-red-500 to-orange-500",
    },
    {
      category: "education",
      icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
      title: "الشهادات",
      description: "شهادات إنجاز احترافية قابلة للتخصيص",
      gradient: "from-orange-500 to-yellow-500",
    },
    {
      category: "advanced",
      icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
      title: "مساعد AI",
      description: "مساعد ذكاء اصطناعي لإنشاء المحتوى والمهام",
      gradient: "from-yellow-500 to-green-500",
    },
    {
      category: "advanced",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      title: "التقويم الذكي",
      description: "تنظيم المواعيد والأحداث بذكاء",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      category: "advanced",
      icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
      title: "الدردشة الجماعية",
      description: "تواصل فوري مع فريقك وطلابك",
      gradient: "from-emerald-500 to-cyan-500",
    },
    {
      category: "advanced",
      icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
      title: "مكتبة الوسائط",
      description: "تخزين وإدارة ملفاتك ووسائطك",
      gradient: "from-cyan-500 to-blue-500",
    },
  ];

  const categories = [
    { id: "all", name: "الكل", count: features.length },
    {
      id: "projects",
      name: "إدارة المشاريع",
      count: features.filter((f) => f.category === "projects").length,
    },
    {
      id: "education",
      name: "التعليم",
      count: features.filter((f) => f.category === "education").length,
    },
    {
      id: "advanced",
      name: "مميزات متقدمة",
      count: features.filter((f) => f.category === "advanced").length,
    },
  ];

  const filteredFeatures =
    activeCategory === "all"
      ? features
      : features.filter((f) => f.category === activeCategory);

  return (
    <PublicLayout>
      <div className="rtl min-h-screen bg-white" dir="rtl">
        <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
            <div
              className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center text-white space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 shadow-lg animate-fade-in-down">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-sm font-bold">
                  32+ ميزة قوية متاحة الآن
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight animate-fade-in-up">
                اكتشف قوة <span className="text-yellow-300">منصتك</span>
              </h1>

              <p
                className="text-xl sm:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
                مجموعة شاملة من الأدوات والمزايا المصممة لتعزيز إنتاجيتك وتسهيل
                إدارة مشاريعك ودوراتك
              </p>

              <div
                className="flex flex-wrap gap-4 justify-center animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                {["32 ميزة فعالة", "ذكاء اصطناعي", "آمن ومحمي", "دعم 24/7"].map(
                  (badge, i) => (
                    <div
                      key={i}
                      className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30 font-bold transform hover:scale-105 transition-transform duration-300"
                    >
                      {badge}
                    </div>
                  )
                )}
              </div>

              <div
                className="pt-4 animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
                <Link
                  to="/register"
                  className="inline-flex items-center gap-3 bg-white text-indigo-700 px-10 py-4 rounded-2xl font-black text-lg shadow-2xl hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  ابدأ استخدام المنصة مجاناً
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
            >
              <path
                d="M0 100L60 90C120 80 240 60 360 50C480 40 600 40 720 45C840 50 960 60 1080 65C1200 70 1320 70 1380 70L1440 70V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0Z"
                fill="white"
              />
            </svg>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center gap-4 mb-16 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-8 py-4 rounded-2xl font-bold transition-all duration-300 ${
                    activeCategory === cat.id
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat.name}
                  <span
                    className={`mr-2 px-2 py-1 rounded-full text-xs ${
                      activeCategory === cat.id ? "bg-white/20" : "bg-gray-200"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-white border-2 border-gray-100 hover:border-transparent rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}
                    >
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={feature.icon}
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float"></div>
            <div
              className="absolute bottom-10 right-10 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
              جاهز لتجربة القوة الكاملة؟
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              ابدأ استخدام جميع المميزات مجاناً وشاهد الفرق بنفسك
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-3 bg-white text-indigo-700 px-10 py-4 rounded-2xl font-black text-lg shadow-2xl hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                ابدأ مجاناً الآن
                <svg
                  className="w-6 h-6 group-hover:-translate-x-2 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md text-white px-10 py-4 rounded-2xl font-bold text-lg border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                العودة للرئيسية
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default FeaturesPage;
