import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Chart from "chart.js/auto";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import dashboardService from "../services/dashboardService";
import StatsCard from "../components/dashboard/StatsCard";
import QuickAction from "../components/dashboard/QuickAction";
import UsageItem from "../components/dashboard/UsageItem";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";

function Dashboard() {
    const { user } = useAuth();
    const { darkMode } = useTheme();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-US");

    const formatStorage = (valueMb) => {
        if (!Number.isFinite(valueMb) || valueMb <= 0) {
            return "0 MB";
        }

        if (valueMb >= 1024) {
            return `${(valueMb / 1024).toFixed(2)} GB`;
        }

        return `${Number(valueMb).toFixed(1)} MB`;
    };

    const dailyChartRef = useRef(null);
    const weeklyChartRef = useRef(null);
    const streakChartRef = useRef(null);
    
    const dailyChartInstance = useRef(null);
    const weeklyChartInstance = useRef(null);
    const streakChartInstance = useRef(null);

    useEffect(() => {
        let ignore = false;
        const loadDashboard = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await dashboardService.getDashboard();
                if (!ignore) {
                    if (response.success) {
                        setData(response.data);
                    } else {
                        setError("تعذر تحميل بيانات لوحة التحكم");
                    }
                }
            } catch (err) {
                if (!ignore) {
                    // Ignore canceled errors (they're not real errors, just duplicate request prevention)
                    if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
                        return;
                    }
                    // Only show error if it's a real error (not network timeout or canceled)
                    const errorMessage = err?.response?.data?.message || err?.message;
                    if (errorMessage && !errorMessage.includes('timeout') && !errorMessage.includes('canceled')) {
                        setError(errorMessage);
                    } else if (err?.response?.status >= 500) {
                        setError("حدث خطأ في الخادم. يرجى المحاولة لاحقاً");
                    } else if (!err?.response) {
                        // Network error - don't show error, just log it
                        console.error("Network error loading dashboard:", err);
                    }
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        loadDashboard();

        return () => {
            ignore = true;
        };
    }, []);

    const summary = data?.summary;
    const charts = data?.charts;
    const streak = data?.streak;
    const topCourses = data?.top_courses ?? [];
    const upcomingLessons = data?.upcoming_lessons ?? [];
    const badges = data?.badges ?? [];
    const usage = data?.usage;

    useEffect(() => {
        if (!charts) {
            return undefined;
        }

        if (dailyChartInstance.current) {
            dailyChartInstance.current.destroy();
        }
        if (weeklyChartInstance.current) {
            weeklyChartInstance.current.destroy();
        }
        if (streakChartInstance.current) {
            streakChartInstance.current.destroy();
        }

        if (dailyChartRef.current) {
            dailyChartInstance.current = new Chart(dailyChartRef.current, {
                type: "line",
                data: {
                    labels: charts.daily?.map((item) => item.label) ?? [],
                    datasets: [
                        {
                            label: "دروس مكتملة",
                            data: charts.daily?.map((item) => item.count) ?? [],
                            borderColor: "rgb(99, 102, 241)",
                            backgroundColor: "rgba(99, 102, 241, 0.1)",
                            tension: 0.4,
                            fill: true,
                            borderWidth: 3,
                            pointBackgroundColor: "rgb(99, 102, 241)",
                            pointBorderColor: "#fff",
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            padding: 12,
                            borderRadius: 8,
                            titleColor: "#fff",
                            bodyColor: "#fff",
                            displayColors: false,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, precision: 0 },
                            grid: {
                                color: "rgba(0, 0, 0, 0.05)",
                            }
                        },
                        x: {
                            grid: {
                                display: false,
                            }
                        }
                    },
                },
            });
        }

        if (weeklyChartRef.current) {
            weeklyChartInstance.current = new Chart(weeklyChartRef.current, {
                type: "bar",
                data: {
                    labels: charts.weekly?.map((item) => item.label) ?? [],
                    datasets: [
                        {
                            label: "دروس أسبوعية",
                            data: charts.weekly?.map((item) => item.count) ?? [],
                            backgroundColor: "rgba(168, 85, 247, 0.8)",
                            borderRadius: 8,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } },
                    },
                },
            });
        }

        if (streakChartRef.current) {
            streakChartInstance.current = new Chart(streakChartRef.current, {
                type: "bar",
                data: {
                    labels: charts.streak?.map((item) => item.label) ?? [],
                    datasets: [
                        {
                            data: charts.streak?.map((item) => item.active) ?? [],
                            backgroundColor: charts.streak?.map((item) =>
                                item.active === 1 ? "rgba(34, 197, 94, 0.8)" : "rgba(229, 231, 235, 0.8)"
                            ) ?? [],
                            borderRadius: 4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label(context) {
                                    return context.parsed.y === 1
                                        ? "نشط"
                                        : "غير نشط";
                                },
                            },
                        },
                    },
                    scales: {
                        y: { display: false, beginAtZero: true, max: 1 },
                        x: {
                            ticks: {
                                maxRotation: 90,
                                minRotation: 45,
                                font: { size: 9 },
                            },
                        },
                    },
                },
            });
        }

        return () => {
            if (dailyChartInstance.current) {
                dailyChartInstance.current.destroy();
            }
            if (weeklyChartInstance.current) {
                weeklyChartInstance.current.destroy();
            }
            if (streakChartInstance.current) {
                streakChartInstance.current.destroy();
            }
        };
    }, [charts]);

    const usageItems = useMemo(() => {
        if (!usage) {
            return [];
        }

        return [
            {
                key: "projects",
                title: "المشاريع",
                used: usage.projects?.used ?? 0,
                limit: usage.projects?.limit ?? -1,
                icon: "fa-diagram-project",
                formatter: formatNumber,
                unit: "",
            },
            {
                key: "courses",
                title: "الدورات",
                used: usage.courses?.used ?? 0,
                limit: usage.courses?.limit ?? -1,
                icon: "fa-graduation-cap",
                formatter: formatNumber,
                unit: "",
            },
            {
                key: "lessons",
                title: "الدروس",
                used: usage.lessons?.used ?? 0,
                limit: usage.lessons?.limit ?? -1,
                icon: "fa-book-open",
                formatter: formatNumber,
                unit: "",
            },
            {
                key: "storage",
                title: "التخزين",
                used: usage.storage?.used_mb ?? 0,
                limit: usage.storage?.limit_mb ?? -1,
                icon: "fa-cloud",
                formatter: formatStorage,
                unit: "",
            },
            {
                key: "ai_requests",
                title: "طلبات AI",
                used: usage.ai_requests?.used ?? 0,
                limit: usage.ai_requests?.limit ?? -1,
                icon: "fa-robot",
                formatter: formatNumber,
                unit: "",
            },
        ];
    }, [usage]);

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <div className={`border-2 p-6 rounded-2xl transition-colors duration-300 ${
                darkMode
                    ? 'bg-red-900/30 border-red-800 text-red-300'
                    : 'bg-red-50 border-red-200 text-red-700'
            }`}>
                <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-bold">{error}</span>
                </div>
            </div>
        );
    }

    if (!summary) {
        return null;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-6 lg:p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-10 w-60 h-60 bg-white rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-black mb-2">مرحباً بعودتك، {user?.name}! 👋</h2>
                            <p className="text-white/90">إليك ملخص نشاطك اليوم</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30">
                            <p className="text-sm font-bold">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                            <p className="text-white/80 text-xs lg:text-sm mb-1">إجمالي الدورات</p>
                            <p className="text-2xl lg:text-3xl font-black">{summary.courses?.total ?? 0}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                            <p className="text-white/80 text-xs lg:text-sm mb-1">دورات مكتملة</p>
                            <p className="text-2xl lg:text-3xl font-black">{summary.courses?.completed ?? 0}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                            <p className="text-white/80 text-xs lg:text-sm mb-1">إجمالي الدروس</p>
                            <p className="text-2xl lg:text-3xl font-black">{summary.lessons?.total ?? 0}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                            <p className="text-white/80 text-xs lg:text-sm mb-1">الوقت المستغرق</p>
                            <p className="text-2xl lg:text-3xl font-black">{summary.time_spent_hours ?? 0}<span className="text-base lg:text-lg mr-1">ساعة</span></p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatsCard
                    title="المشاريع"
                    value={summary.projects?.total ?? 0}
                    icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    color="indigo"
                    link="/projects"
                />
                <StatsCard
                    title="المهام"
                    value={summary.tasks?.total ?? 0}
                    icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    color="blue"
                    link="/tasks"
                />
                <StatsCard
                    title="مهام اليوم"
                    value={summary.tasks?.today ?? 0}
                    icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    color="green"
                    link="/tasks"
                />
                <StatsCard
                    title="مهام متأخرة"
                    value={summary.tasks?.overdue ?? 0}
                    icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    color="orange"
                    link="/tasks"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-xl font-black ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>نشاطك اليومي</h3>
                            <span className={`text-sm ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>آخر 7 أيام</span>
                        </div>
                        <div style={{ height: "280px" }}>
                            <canvas ref={dailyChartRef}></canvas>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                            <h3 className={`text-xl font-black mb-6 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>النشاط الأسبوعي</h3>
                            <div style={{ height: "200px" }}>
                                <canvas ref={weeklyChartRef}></canvas>
                            </div>
                        </div>

                        <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                            <h3 className={`text-xl font-black mb-4 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>سلسلة النشاط</h3>
                            {streak?.user && (
                                <div className={`mb-4 p-4 rounded-xl border ${
                                    darkMode
                                        ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-800'
                                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text-sm ${
                                                darkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>السلسلة الحالية</p>
                                            <p className="text-3xl font-black text-green-600">{streak.user.current_streak} يوم</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm ${
                                                darkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>أطول سلسلة</p>
                                            <p className={`text-2xl font-black ${
                                                darkMode ? 'text-gray-100' : 'text-gray-900'
                                            }`}>{streak.user.longest_streak}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div style={{ height: "120px" }}>
                                <canvas ref={streakChartRef}></canvas>
                            </div>
                        </div>
                    </div>

                    {topCourses.length > 0 && (
                        <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                            <h3 className={`text-xl font-black mb-6 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>الدورات النشطة</h3>
                            <div className="space-y-4">
                                {topCourses.slice(0, 5).map((course) => (
                                    <Link
                                        key={course.id}
                                        to={`/courses/${course.id}`}
                                        className={`group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 border ${
                                            darkMode
                                                ? 'border-transparent hover:bg-gradient-to-r hover:from-indigo-900/30 hover:to-purple-900/30 hover:border-indigo-800'
                                                : 'border-transparent hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-200'
                                        }`}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-bold group-hover:text-indigo-600 transition-colors truncate ${
                                                darkMode ? 'text-gray-100' : 'text-gray-900'
                                            }`}>
                                                {course.name}
                                            </h4>
                                            <div className={`mt-2 w-full rounded-full h-2 ${
                                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                            }`}>
                                                <div
                                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.round(course.progress ?? 0)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-2xl font-black text-indigo-600">
                                                {Math.round(course.progress ?? 0)}%
                                            </p>
                                            <p className={`text-xs ${
                                                darkMode ? 'text-gray-500' : 'text-gray-500'
                                            }`}>مكتمل</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}>
                        <h3 className={`text-xl font-black mb-6 ${
                            darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>إجراءات سريعة</h3>
                        <div className="space-y-3">
                            <QuickAction
                                title="مشروع جديد"
                                description="ابدأ مشروع جديد الآن"
                                icon="M12 4v16m8-8H4"
                                color="indigo"
                                link="/projects"
                            />
                            <QuickAction
                                title="دورة جديدة"
                                description="أنشئ دورة تعليمية"
                                icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                color="green"
                                link="/courses"
                            />
                            <QuickAction
                                title="مهمة جديدة"
                                description="أضف مهمة إلى قائمتك"
                                icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                color="blue"
                                link="/tasks"
                            />
                        </div>
                    </div>

                    {upcomingLessons.length > 0 && (
                        <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                            <h3 className={`text-xl font-black mb-6 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>الدروس القادمة</h3>
                            <div className="space-y-3">
                                {upcomingLessons.slice(0, 5).map((lesson) => (
                                    <Link
                                        key={lesson.id}
                                        to={`/lessons/${lesson.id}`}
                                        className={`group flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${
                                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-bold text-sm group-hover:text-indigo-600 transition-colors truncate ${
                                                darkMode ? 'text-gray-100' : 'text-gray-900'
                                            }`}>
                                                {lesson.name}
                                            </h4>
                                            {lesson.course && (
                                                <p className={`text-xs truncate ${
                                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`}>{lesson.course.name}</p>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {badges.length > 0 && (
                        <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                            <h3 className={`text-xl font-black mb-6 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>الإنجازات</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {badges.slice(0, 4).map((badge) => (
                                    <div
                                        key={badge.id}
                                        className={`group p-4 rounded-xl border hover:scale-105 transition-transform duration-300 ${
                                            darkMode
                                                ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-800'
                                                : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                                        }`}
                                    >
                                        <div className="text-center">
                                            <div className="text-3xl mb-2">{badge.icon}</div>
                                            <h4 className={`font-bold text-sm mb-1 ${
                                                darkMode ? 'text-gray-100' : 'text-gray-900'
                                            }`}>{badge.name}</h4>
                                            <p className={`text-xs ${
                                                darkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>{badge.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {usageItems.length > 0 && (
                        <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                            <h3 className={`text-xl font-black mb-6 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>الاستخدام</h3>
                            <div className="space-y-4">
                                {usageItems.map((item) => {
                                    const { key, ...props } = item;
                                    return <UsageItem key={key} {...props} />;
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
