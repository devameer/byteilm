import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import NotificationBell from "./ui/NotificationBell";
import courseService from "../services/courseService";

function Layout() {
    const { user, logout } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeCourses, setActiveCourses] = useState([]);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth >= 1024 : true
    );
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(() => {
        if (typeof window === "undefined") {
            return true;
        }
        return localStorage.getItem("sidebarClosed") === "true" ? false : true;
    });

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        let isMounted = true;
        async function loadActiveCourses() {
            try {
                const response = await courseService.getCourses({
                    active: true,
                });
                if (response.success && isMounted) {
                    setActiveCourses(
                        Array.isArray(response.data) ? response.data : []
                    );
                }
            } catch (error) {
                // Ignore canceled errors (they're not real errors, just duplicate request prevention)
                if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                    // Request was cancelled due to duplicate - this is expected behavior
                    return;
                }
                console.error("Failed to load active courses:", error);
            }
        }

        loadActiveCourses();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (isDesktop) {
            if (typeof window !== "undefined") {
                const stored = localStorage.getItem("sidebarClosed");
                setIsDesktopSidebarOpen(stored === "true" ? false : true);
            }
            setIsMobileSidebarOpen(false);
        }
    }, [isDesktop]);

    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [location.pathname]);

    const navItems = useMemo(() => [
        {
            section: "رئيسية",
            items: [
                {
                    to: "/dashboard",
                    label: "لوحة التحكم",
                    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
                    matches: ["/dashboard"],
                },
                {
                    to: "/calendar",
                    label: "التقويم",
                    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                    matches: ["/calendar"],
                },
            ]
        },
        {
            section: "العمل",
            items: [
                {
                    to: "/projects",
                    label: "المشاريع",
                    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                    matches: ["/projects"],
                },
                {
                    to: "/tasks",
                    label: "المهام",
                    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
                    matches: ["/tasks"],
                },
                {
                    to: "/teams",
                    label: "الفرق",
                    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                    matches: ["/teams"],
                },
            ]
        },
        {
            section: "التعليم",
            items: [
                {
                    to: { pathname: "/courses", search: "?filter=active" },
                    label: "الدورات",
                    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
                    matches: ["/courses"],
                },
                {
                    to: "/lessons",
                    label: "الدروس",
                    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                    matches: ["/lessons"],
                },
                {
                    to: "/categories",
                    label: "التصنيفات",
                    icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
                    matches: ["/categories"],
                },
            ]
        },
        {
            section: "المحتوى",
            items: [
                {
                    to: "/media-library",
                    label: "مكتبة الوسائط",
                    icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
                    matches: ["/media-library"],
                },
                {
                    to: "/prompts",
                    label: "قوالب AI",
                    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
                    matches: ["/prompts"],
                },
            ]
        },
        {
            section: "أدوات",
            items: [
                {
                    to: "/referrals",
                    label: "برنامج الإحالة",
                    icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
                    matches: ["/referrals"],
                },
                {
                    to: "/git-tools",
                    label: "أدوات Git",
                    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
                    matches: ["/git-tools"],
                },
            ]
        },
    ], []);

    const handleLogout = useCallback(async () => {
        await logout();
        navigate("/login");
    }, [logout, navigate]);

    const handleDesktopSidebarToggle = useCallback(() => {
        setIsDesktopSidebarOpen((prev) => {
            const next = !prev;
            if (typeof window !== "undefined") {
                localStorage.setItem("sidebarClosed", (!next).toString());
            }
            return next;
        });
    }, []);

    const handleMobileSidebarToggle = useCallback(() => {
        setIsMobileSidebarOpen((prev) => !prev);
    }, []);

    const isActive = useCallback((matches = []) => {
        if (!matches.length) {
            return false;
        }

        return matches.some((match) => {
            if (match === "/") {
                return location.pathname === "/";
            }
            return (
                location.pathname === match ||
                location.pathname.startsWith(`${match}/`)
            );
        });
    }, [location.pathname]);

    const renderNavLink = useCallback(({ to, label, icon, matches }) => {
        const active = isActive(matches);
        const linkTarget = to;

        return (
            <Link
                key={label}
                to={linkTarget}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                        : darkMode 
                          ? "text-gray-300 hover:bg-gray-700 hover:scale-105" 
                          : "text-gray-700 hover:bg-gray-100 hover:scale-105"
                }`}
            >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                <span className="text-sm font-medium">{label}</span>
            </Link>
        );
    }, [isActive, darkMode]);

    const pageTitle = useMemo(() => {
        const path = location.pathname;

        if (path === "/" || path === "/dashboard") {
            return "لوحة التحكم";
        }
        if (path.startsWith("/calendar")) {
            return "التقويم الموحد";
        }
        if (path.startsWith("/tasks/")) {
            return "تفاصيل المهمة";
        }
        if (path.startsWith("/tasks")) {
            return "المهام";
        }
        if (path.startsWith("/projects/")) {
            return "تفاصيل المشروع";
        }
        if (path.startsWith("/projects")) {
            return "المشاريع";
        }
        if (path.startsWith("/teams")) {
            return "الفرق";
        }
        if (path.startsWith("/courses/")) {
            return "تفاصيل الدورة";
        }
        if (path.startsWith("/courses")) {
            return "الدورات";
        }
        if (path.startsWith("/media-library")) {
            return "مكتبة الوسائط";
        }
        if (path.startsWith("/categories/")) {
            return "تفاصيل التصنيف";
        }
        if (path.startsWith("/categories")) {
            return "التصنيفات";
        }
        if (path.startsWith("/lessons")) {
            return "الدروس";
        }
        if (path.startsWith("/prompts")) {
            return "قوالب AI";
        }
        if (path.startsWith("/referrals")) {
            return "برنامج الإحالة";
        }
        if (path.startsWith("/git-tools")) {
            return "أدوات Git";
        }
        return "لوحة التحكم";
    }, [location.pathname]);

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode 
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
                : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
        }`} dir="rtl">
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
                    isMobileSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setIsMobileSidebarOpen(false)}
            />

            <div
                className={`fixed right-0 top-0 h-full w-72 shadow-2xl transform transition-all duration-300 ease-in-out z-50 ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                } ${
                    (isDesktop ? isDesktopSidebarOpen : isMobileSidebarOpen)
                        ? "translate-x-0"
                        : "translate-x-full"
                }`}
            >
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-3 group"
                        >
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-xl font-black text-white drop-shadow-lg">
                                    منصتك
                                </span>
                                <p className="text-xs text-white/80 font-medium">
                                    لوحة التحكم
                                </p>
                            </div>
                        </Link>
                    </div>

                    <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        <div className="space-y-6">
                            {navItems.map((section, sectionIndex) => (
                                <div key={sectionIndex}>
                                    <div className="px-4 mb-3">
                                        <p className={`text-xs font-bold uppercase tracking-wider ${
                                            darkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>
                                            {section.section}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        {section.items.map(renderNavLink)}
                                    </div>
                                </div>
                            ))}

                            {activeCourses.length > 0 && (
                                <div>
                                    <div className="px-4 mb-3">
                                        <p className={`text-xs font-bold uppercase tracking-wider ${
                                            darkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>
                                            الدورات النشطة
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        {activeCourses.map((course) => {
                                            const progress = Number(
                                                course.progress ?? 0
                                            );
                                            const roundedProgress = Number.isNaN(
                                                progress
                                            )
                                                ? 0
                                                : Math.round(progress);
                                            return (
                                                <Link
                                                    key={course.id}
                                                    to={`/courses/${course.id}`}
                                                    className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                                                        location.pathname ===
                                                        `/courses/${course.id}`
                                                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                                                            : darkMode 
                                                              ? "text-gray-300 hover:bg-gray-700" 
                                                              : "text-gray-700 hover:bg-gray-100"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                        <span className="text-sm font-medium truncate">
                                                            {course.name}
                                                        </span>
                                                    </div>
                                                    {roundedProgress > 0 && (
                                                        <span className={`text-xs px-2 py-1 rounded-full font-bold transition-colors duration-300 ${
                                                            location.pathname === `/courses/${course.id}`
                                                                ? "bg-white/20 text-white"
                                                                : darkMode
                                                                    ? "bg-indigo-900/30 text-indigo-300"
                                                                    : "bg-indigo-100 text-indigo-700"
                                                        }`}>
                                                            {roundedProgress}%
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </nav>

                    <div className={`p-4 border-t ${
                        darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'
                    }`}>
                        <div className={`mb-3 p-3 rounded-xl border ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${
                                        darkMode ? 'text-gray-200' : 'text-gray-900'
                                    }`}>
                                        {user?.name || "المستخدم"}
                                    </p>
                                    <p className={`text-xs truncate ${
                                        darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                        {user?.email || ""}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Dark Mode Toggle Button */}
                        <button
                            type="button"
                            onClick={toggleDarkMode}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-medium hover:scale-105 mb-2 ${
                                darkMode 
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                                    darkMode 
                                        ? "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
                                        : "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                } />
                            </svg>
                            <span className="text-sm">
                                {darkMode ? 'وضع فاتح ☀️' : 'وضع داكن 🌙'}
                            </span>
                        </button>
                        
                        <button
                            type="button"
                            onClick={handleLogout}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-medium hover:scale-105 ${
                                darkMode
                                    ? 'text-red-400 bg-red-900/30 hover:bg-red-900/50'
                                    : 'text-red-600 bg-red-50 hover:bg-red-100'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-sm">تسجيل الخروج</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleDesktopSidebarToggle}
                        className={`hidden lg:block absolute -left-4 top-8 border-2 rounded-full w-8 h-8 shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center ${
                            darkMode 
                                ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-indigo-500 hover:text-white hover:border-indigo-500' 
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-indigo-500 hover:text-white hover:border-indigo-500'
                        }`}
                    >
                        <svg
                            className={`w-4 h-4 transition-transform duration-300 ${
                                isDesktopSidebarOpen ? "" : "rotate-180"
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            <div
                id="main-content"
                className={`transition-all duration-300 ${
                    isDesktop && isDesktopSidebarOpen ? "lg:mr-72" : "lg:mr-0"
                }`}
            >
                <header className={`backdrop-blur-xl border-b sticky top-0 z-30 shadow-sm transition-colors duration-300 ${
                    darkMode 
                        ? 'bg-gray-800/80 border-gray-700' 
                        : 'bg-white/80 border-gray-200'
                }`}>
                    <div className="px-4 lg:px-8 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={handleMobileSidebarToggle}
                                className={`lg:hidden p-2 rounded-xl transition-all duration-200 ${
                                    darkMode 
                                        ? 'text-gray-300 hover:text-indigo-400 hover:bg-gray-700' 
                                        : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                                }`}
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>

                            <div>
                                <h1 className={`text-xl lg:text-2xl font-black ${
                                    darkMode 
                                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400' 
                                        : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600'
                                }`}>
                                    {pageTitle}
                                </h1>
                                <p className={`text-xs mt-0.5 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                    مرحباً بك، {user?.name || "المستخدم"}
                                </p>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-3">
                            <NotificationBell />
                        </div>
                    </div>
                </header>

                <main className="p-4 lg:p-8 min-h-[calc(100vh-140px)]">
                    <Outlet />
                </main>

                <footer className={`border-t py-6 transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className={`text-sm ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                &copy; {new Date().getFullYear()} منصتك. جميع الحقوق محفوظة.
                            </p>
                            <div className={`flex items-center gap-6 text-sm ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                                <a href="#" className={`transition-colors ${
                                    darkMode ? 'hover:text-indigo-400' : 'hover:text-indigo-600'
                                }`}>الشروط والأحكام</a>
                                <a href="#" className={`transition-colors ${
                                    darkMode ? 'hover:text-indigo-400' : 'hover:text-indigo-600'
                                }`}>سياسة الخصوصية</a>
                                <a href="#" className={`transition-colors ${
                                    darkMode ? 'hover:text-indigo-400' : 'hover:text-indigo-600'
                                }`}>المساعدة</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default Layout;
