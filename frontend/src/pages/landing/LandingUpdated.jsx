import { Link } from "react-router-dom";
import PublicLayout from "../../components/layout/PublicLayout";
import React, { useEffect, useState } from "react";
import axios from "axios";

const LandingUpdated = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counters, setCounters] = useState({
    users: 0,
    projects: 0,
    courses: 0,
  });

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/plans`);
        if (response.data.success) {
          setPlans(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

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

  // Helper function to format billing period
  const formatBillingPeriod = (period) => {
    const periods = {
      monthly: "شهرياً",
      yearly: "سنوياً",
      lifetime: "مدى الحياة",
    };
    return periods[period] || period;
  };

  // Helper function to format limits
  const formatLimit = (value) => {
    if (value === -1) return "غير محدود";
    return value.toLocaleString();
  };

  return (
    <PublicLayout>
      <div className="rtl min-h-screen" dir="rtl">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
            <div
              className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float"
              style={{ animationDelay: "1s" }}
            ></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
              {[0, 0.5, 1, 1.5].map((delay, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 bg-white/40 rounded-full animate-ping ${
                    i === 0 ? "top-0 left-0" :
                    i === 1 ? "top-1/4 right-1/4" :
                    i === 2 ? "bottom-1/4 left-1/3" :
                    "bottom-1/3 right-1/3"
                  }`}
                  style={{ animationDelay: `${delay}s` }}
                ></div>
              ))}
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
                    متاح الآن - نسخة محدثة 2025 مع AI
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
                  نظام متكامل مدعوم بالذكاء الاصطناعي يجمع بين إدارة المشاريع، التعلم الإلكتروني،
                  وأدوات الإنتاجية - كل ما تحتاجه في مكان واحد
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
                    <div className="text-3xl sm:text-4xl font-black">AI</div>
                    <div className="text-xs sm:text-sm text-white/80 font-semibold mt-1">
                      ذكاء اصطناعي
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
                      {["red", "yellow", "green"].map((color, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full bg-${color}-500 animate-pulse`}
                          style={{ animationDelay: `${i * 0.2}s` }}
                        ></div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded w-3/4 animate-pulse"></div>
                      {[0.1, 0.2].map((delay, i) => (
                        <div
                          key={i}
                          className={`h-4 bg-gray-700 rounded ${i === 0 ? "w-1/2" : "w-2/3"} animate-pulse`}
                          style={{ animationDelay: `${delay}s` }}
                        ></div>
                      ))}
                      <div className="grid grid-cols-3 gap-3 mt-6">
                        {[0, 0.1, 0.2].map((delay, i) => (
                          <div
                            key={i}
                            className={`h-20 ${i === 0 ? "bg-gradient-to-br from-indigo-500 to-purple-500" : "bg-gray-700"} rounded-xl animate-pulse`}
                            style={{ animationDelay: `${delay}s` }}
                          ></div>
                        ))}
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

        {/* Stats Section */}
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

        {/* Pricing Section with Real Data */}
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
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                باقات مرنة تناسب جميع الاحتياجات - من الأفراد إلى المؤسسات الكبيرة
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">جاري تحميل الباقات...</p>
              </div>
            ) : (
              <div className={`grid gap-8 ${plans.length === 3 ? "md:grid-cols-3" : plans.length === 4 ? "md:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                {plans.map((plan, i) => {
                  const gradient =
                    plan.name === "free" ? "from-gray-500 to-gray-600" :
                    plan.name === "basic" ? "from-blue-500 to-cyan-500" :
                    plan.name === "pro" ? "from-indigo-600 to-purple-600" :
                    "from-purple-600 to-pink-600";

                  return (
                    <div
                      key={plan.id}
                      className={`relative group animate-fade-in-up ${
                        plan.is_popular ? "md:-translate-y-4 scale-105" : ""
                      }`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {plan.is_popular && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-1 rounded-full text-sm font-black shadow-lg animate-bounce">
                          الأكثر شعبية
                        </div>
                      )}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
                      ></div>
                      <div className="relative bg-white border-2 border-gray-100 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500">
                        <div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
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
                          {plan.display_name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
                        <div className="mb-6">
                          <span
                            className={`text-5xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
                          >
                            ${plan.price}
                          </span>
                          <span className="text-gray-600 text-lg mr-2">
                            {formatBillingPeriod(plan.billing_period)}
                          </span>
                        </div>

                        {/* Key Limits Display */}
                        <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase">الحدود الشهرية</h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="text-center">
                              <div className="font-bold text-indigo-600">{formatLimit(plan.limits.max_ai_requests_per_month)}</div>
                              <div className="text-gray-500">طلبات AI</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-purple-600">{formatLimit(plan.limits.max_quiz_generations_per_month)}</div>
                              <div className="text-gray-500">اختبارات</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-blue-600">{formatLimit(plan.limits.max_storage_gb)} GB</div>
                              <div className="text-gray-500">تخزين</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-emerald-600">{formatLimit(plan.limits.max_projects)}</div>
                              <div className="text-gray-500">مشاريع</div>
                            </div>
                          </div>
                        </div>

                        <ul className="space-y-3 mb-8">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div
                                className={`w-5 h-5 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}
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
                              <span className="text-gray-700 text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Link
                          to="/register"
                          className={`block text-center py-3 rounded-xl font-bold transition-all duration-300 ${
                            plan.is_popular
                              ? `bg-gradient-to-r ${gradient} text-white shadow-lg hover:shadow-xl hover:scale-105`
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          ابدأ الآن
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Comparison Link */}
            <div className="text-center mt-12">
              <Link
                to="/plans/compare"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                مقارنة تفصيلية بين الباقات
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
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
              استثنائية مدعومة بالذكاء الاصطناعي
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

export default LandingUpdated;
