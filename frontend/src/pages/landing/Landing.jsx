import { Link } from "react-router-dom";
import PublicLayout from "../../components/layout/PublicLayout";
import React, { useEffect, useState } from "react";

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [counters, setCounters] = useState({
    users: 0,
    projects: 0,
    courses: 0,
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const animateCounters = () => {
      const duration = 2000;
      const steps = 60;
      const interval = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;

        setCounters({
          users: Math.floor(10000 * progress),
          projects: Math.floor(5000 * progress),
          courses: Math.floor(1200 * progress),
        });

        if (currentStep >= steps) clearInterval(timer);
      }, interval);
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animateCounters();
        observer.disconnect();
      }
    });

    const statsElement = document.getElementById("stats-section");
    if (statsElement) observer.observe(statsElement);

    return () => observer.disconnect();
  }, []);

  return (
    <PublicLayout>
      <div className="rtl min-h-screen" dir="rtl">
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
            <div
              className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float"
              style={{ animationDelay: "1s" }}
            ></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
              <div
                className="absolute top-0 left-0 w-2 h-2 bg-white/40 rounded-full animate-ping"
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className="absolute top-1/4 right-1/4 w-3 h-3 bg-white/30 rounded-full animate-ping"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <div
                className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-white/40 rounded-full animate-ping"
                style={{ animationDelay: "1s" }}
              ></div>
              <div
                className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-white/30 rounded-full animate-ping"
                style={{ animationDelay: "1.5s" }}
              ></div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="text-white space-y-8">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 shadow-lg animate-fade-in-down">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-sm font-bold">
                    متاح الآن - نسخة محدثة 2025
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight animate-fade-in-up">
                  منصتك الشاملة
                  <span className="block mt-2 text-yellow-300 animate-shimmer">
                    لإدارة المشاريع
                  </span>
                  والتعلم الذكي
                </h1>

                <p
                  className="text-lg sm:text-xl lg:text-2xl text-white/90 leading-relaxed max-w-2xl animate-fade-in-up"
                  style={{ animationDelay: "0.1s" }}
                >
                  نظام متكامل يجمع بين إدارة المشاريع، التعلم الإلكتروني،
                  والأدوات الذكية - كل ما تحتاجه في مكان واحد
                </p>

                <div
                  className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-in-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  <Link
                    to="/register"
                    className="group inline-flex items-center justify-center gap-3 bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black text-lg shadow-2xl hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    ابدأ الآن مجاناً
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
                    to="/features"
                    className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-bold text-lg border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
                  >
                    استكشف المميزات
                  </Link>
                </div>

                <div
                  className="flex items-center gap-6 sm:gap-8 pt-8 animate-fade-in-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  <div className="text-center transform hover:scale-110 transition-transform duration-300">
                    <div className="text-3xl sm:text-4xl font-black">32+</div>
                    <div className="text-xs sm:text-sm text-white/80 font-semibold mt-1">
                      ميزة قوية
                    </div>
                  </div>
                  <div className="h-12 w-px bg-white/30"></div>
                  <div className="text-center transform hover:scale-110 transition-transform duration-300">
                    <div className="text-3xl sm:text-4xl font-black">10K+</div>
                    <div className="text-xs sm:text-sm text-white/80 font-semibold mt-1">
                      مستخدم نشط
                    </div>
                  </div>
                  <div className="h-12 w-px bg-white/30"></div>
                  <div className="text-center transform hover:scale-110 transition-transform duration-300">
                    <div className="text-3xl sm:text-4xl font-black">98%</div>
                    <div className="text-xs sm:text-sm text-white/80 font-semibold mt-1">
                      رضا العملاء
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="relative hidden lg:block animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                <div className="absolute -top-10 -right-10 w-72 h-72 bg-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
                <div
                  className="absolute -bottom-10 -left-10 w-72 h-72 bg-pink-400/30 rounded-full blur-3xl animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
                <div className="relative bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                      <div
                        className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-3 h-3 rounded-full bg-green-500 animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded w-3/4 animate-pulse"></div>
                      <div
                        className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="h-4 bg-gray-700 rounded w-2/3 animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div className="grid grid-cols-3 gap-3 mt-6">
                        <div className="h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl animate-pulse"></div>
                        <div
                          className="h-20 bg-gray-700 rounded-xl animate-pulse"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="h-20 bg-gray-700 rounded-xl animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
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

        <section id="stats-section" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  count: counters.users,
                  label: "مستخدم نشط",
                  icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
                  color: "from-blue-500 to-cyan-500",
                },
                {
                  count: counters.projects,
                  label: "مشروع منجز",
                  icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
                  color: "from-purple-500 to-pink-500",
                },
                {
                  count: counters.courses,
                  label: "دورة تعليمية",
                  icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
                  color: "from-green-500 to-emerald-500",
                },
              ].map((stat, i) => (
                <div key={i} className="relative group">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.color} rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
                  ></div>
                  <div className="relative bg-white border-2 border-gray-100 rounded-3xl p-8 text-center transform hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                    >
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={stat.icon}
                        />
                      </svg>
                    </div>
                    <div
                      className={`text-5xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}
                    >
                      {stat.count.toLocaleString()}+
                    </div>
                    <div className="text-gray-600 font-bold">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="solutions"
          className="py-20 sm:py-32 bg-gradient-to-br from-gray-50 to-gray-100"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-black animate-bounce">
                حلول متكاملة
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">
                اختر{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  الحل المناسب
                </span>{" "}
                لك
              </h2>
            </div>

            <div className="flex justify-center gap-4 mb-12">
              {["projects", "education", "teams"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                      : "bg-white text-gray-600 hover:shadow-md"
                  }`}
                >
                  {tab === "projects"
                    ? "إدارة المشاريع"
                    : tab === "education"
                    ? "التعليم"
                    : "الفرق"}
                </button>
              ))}
            </div>

            <div className="relative min-h-96">
              {activeTab === "projects" && (
                <div className="grid md:grid-cols-2 gap-8 items-center animate-fade-in">
                  <div className="space-y-6">
                    <h3 className="text-3xl font-black text-gray-900">
                      إدارة مشاريعك باحترافية
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      أدِر مشاريعك بكفاءة عالية مع أدوات متقدمة لتتبع المهام،
                      الجداول الزمنية، والميزانيات
                    </p>
                    <ul className="space-y-4">
                      {[
                        "تتبع المهام بالوقت الفعلي",
                        "تقارير تفصيلية عن الأداء",
                        "إدارة الموارد والميزانيات",
                        "تنبيهات ذكية للمواعيد",
                      ].map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 transform hover:translate-x-2 transition-transform duration-300"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700 font-semibold">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl blur-2xl opacity-20"></div>
                    <div className="relative bg-white rounded-3xl p-8 shadow-2xl border-2 border-gray-100">
                      <div className="space-y-4">
                        {[60, 80, 45].map((width, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-4 animate-fade-in"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-shimmer"
                                  style={{ width: `${width}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-gray-600">
                              {width}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "education" && (
                <div className="grid md:grid-cols-2 gap-8 items-center animate-fade-in">
                  <div className="order-2 md:order-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-20"></div>
                    <div className="relative bg-white rounded-3xl p-8 shadow-2xl border-2 border-gray-100">
                      <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 transform hover:scale-105 transition-all duration-300 animate-fade-in"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          >
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mb-3 flex items-center justify-center">
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                />
                              </svg>
                            </div>
                            <div className="h-2 bg-purple-300 rounded-full mb-2"></div>
                            <div className="h-2 bg-purple-200 rounded-full w-2/3"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="order-1 md:order-2 space-y-6">
                    <h3 className="text-3xl font-black text-gray-900">
                      منصة تعليمية متكاملة
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      قدم دوراتك التعليمية باحترافية مع أدوات إنشاء المحتوى،
                      الاختبارات، وتتبع تقدم الطلاب
                    </p>
                    <ul className="space-y-4">
                      {[
                        "دروس فيديو تفاعلية",
                        "اختبارات ومهام ذكية",
                        "شهادات إنجاز معتمدة",
                        "تتبع تقدم الطلاب",
                      ].map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 transform hover:translate-x-2 transition-transform duration-300"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700 font-semibold">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "teams" && (
                <div className="grid md:grid-cols-2 gap-8 items-center animate-fade-in">
                  <div className="space-y-6">
                    <h3 className="text-3xl font-black text-gray-900">
                      تعاون فريقك بفعالية
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      عزز التعاون بين أعضاء فريقك مع أدوات اتصال متقدمة ومشاركة
                      فورية للملفات والمعلومات
                    </p>
                    <ul className="space-y-4">
                      {[
                        "دردشة جماعية فورية",
                        "مشاركة الملفات والوثائق",
                        "لوحات عمل مشتركة",
                        "إدارة الصلاحيات",
                      ].map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 transform hover:translate-x-2 transition-transform duration-300"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700 font-semibold">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl blur-2xl opacity-20"></div>
                    <div className="relative bg-white rounded-3xl p-8 shadow-2xl border-2 border-gray-100">
                      <div className="flex items-center gap-2 mb-6">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold border-4 border-white shadow-lg transform hover:scale-110 transition-all duration-300 animate-fade-in`}
                            style={{
                              animationDelay: `${i * 0.1}s`,
                              marginLeft: i > 1 ? "-12px" : "0",
                            }}
                          >
                            {i}
                          </div>
                        ))}
                        <div
                          className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold border-4 border-white shadow-lg"
                          style={{ marginLeft: "-12px" }}
                        >
                          +5
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[70, 45, 90].map((width, i) => (
                          <div
                            key={i}
                            className="bg-gray-50 rounded-xl p-3 animate-fade-in"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500"></div>
                              <div className="flex-1">
                                <div className="h-2 bg-gray-200 rounded-full mb-1"></div>
                                <div className="h-2 bg-gray-200 rounded-full w-2/3"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="features" className="py-20 sm:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-black">
                المميزات
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">
                كل ما تحتاجه في{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  مكان واحد
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                منصة متكاملة تجمع أدوات إدارة المشاريع والتعلم الذكي بتصميم عصري
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                  title: "إدارة المشاريع",
                  description:
                    "نظام شامل لإدارة المشاريع مع تتبع المهام والجداول الزمنية",
                  gradient: "from-indigo-500 to-blue-500",
                },
                {
                  icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
                  title: "دورات تعليمية",
                  description:
                    "منصة تعلم إلكترونية متكاملة مع دروس تفاعلية وشهادات",
                  gradient: "from-purple-500 to-pink-500",
                },
                {
                  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                  title: "العمل الجماعي",
                  description:
                    "أدوات تعاون فعالة مع دردشة مباشرة ومشاركة الملفات",
                  gradient: "from-green-500 to-teal-500",
                },
                {
                  icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                  title: "تقارير ذكية",
                  description:
                    "لوحة تحكم تحليلية مع رسوم بيانية ومقاييس أداء دقيقة",
                  gradient: "from-yellow-500 to-orange-500",
                },
                {
                  icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                  title: "تقويم متكامل",
                  description: "نظام تقويم متطور لتنظيم المواعيد والاجتماعات",
                  gradient: "from-red-500 to-pink-500",
                },
                {
                  icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
                  title: "ذكاء اصطناعي",
                  description: "مساعدات ذكية لتحسين الإنتاجية والكفاءة",
                  gradient: "from-cyan-500 to-blue-500",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-white border-2 border-gray-100 hover:border-transparent rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}
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
                    <h3 className="text-xl font-black text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="py-20 sm:py-32 bg-gradient-to-br from-indigo-50 to-purple-50"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-black">
                الأسعار
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">
                اختر{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  الباقة المناسبة
                </span>{" "}
                لك
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "المجانية",
                  price: "0",
                  period: "مجاناً للأبد",
                  features: [
                    "5 مشاريع",
                    "10 مستخدمين",
                    "دعم عبر البريد",
                    "1 جيجا تخزين",
                  ],
                  popular: false,
                  gradient: "from-gray-500 to-gray-600",
                },
                {
                  name: "الاحترافية",
                  price: "49",
                  period: "شهرياً",
                  features: [
                    "مشاريع غير محدودة",
                    "100 مستخدم",
                    "دعم أولوية",
                    "100 جيجا تخزين",
                    "تقارير متقدمة",
                    "API متقدم",
                  ],
                  popular: true,
                  gradient: "from-indigo-600 to-purple-600",
                },
                {
                  name: "المؤسسات",
                  price: "199",
                  period: "شهرياً",
                  features: [
                    "كل شيء غير محدود",
                    "دعم مخصص 24/7",
                    "تخزين غير محدود",
                    "تدريب مخصص",
                    "SLA مضمون",
                  ],
                  popular: false,
                  gradient: "from-purple-600 to-pink-600",
                },
              ].map((plan, i) => (
                <div
                  key={i}
                  className={`relative group animate-fade-in-up ${
                    plan.popular ? "md:-translate-y-4 scale-105" : ""
                  }`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-1 rounded-full text-sm font-black shadow-lg animate-bounce">
                      الأكثر شعبية
                    </div>
                  )}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
                  ></div>
                  <div className="relative bg-white border-2 border-gray-100 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                    >
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-6">
                      <span
                        className={`text-5xl font-black bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}
                      >
                        ${plan.price}
                      </span>
                      <span className="text-gray-600 text-lg mr-2">
                        {plan.period}
                      </span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center flex-shrink-0`}
                          >
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/register"
                      className={`block text-center py-3 rounded-xl font-bold transition-all duration-300 ${
                        plan.popular
                          ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg hover:shadow-xl hover:scale-105`
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ابدأ الآن
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 sm:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-black">
                آراء العملاء
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">
                ماذا يقول{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  عملاؤنا
                </span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "أحمد محمد",
                  role: "مدير مشاريع",
                  image: "👨‍💼",
                  comment:
                    "منصة رائعة ساعدتني على تنظيم مشاريعي بشكل احترافي. التصميم سهل والأدوات قوية جداً!",
                },
                {
                  name: "فاطمة علي",
                  role: "مدربة محتوى",
                  image: "👩‍🏫",
                  comment:
                    "أفضل منصة تعليمية استخدمتها! الطلاب يحبون الواجهة السهلة والدروس التفاعلية.",
                },
                {
                  name: "خالد سالم",
                  role: "رائد أعمال",
                  image: "👨‍💻",
                  comment:
                    "كل ما احتاجه في مكان واحد. وفرت علي الكثير من الوقت والمال. أنصح بها بشدة!",
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-5xl transform hover:scale-125 transition-transform duration-300">
                      {testimonial.image}
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-400 animate-pulse"
                        style={{ animationDelay: `${i * 0.1}s` }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {testimonial.comment}
                  </p>
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
              هل أنت مستعد للبدء؟
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              انضم إلى آلاف المستخدمين واستمتع بتجربة إدارة مشاريع وتعلم
              استثنائية
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
                to="/features"
                className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md text-white px-10 py-4 rounded-2xl font-bold text-lg border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                تعرف على المزيد
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default Landing;
