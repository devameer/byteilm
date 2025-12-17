import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import lessonService from "../services/lessonService";
import courseService from "../services/courseService";
import taskService from "../services/taskService";
import Modal from "../components/Modal";
import LessonsPageSkeleton from "../components/skeletons/LessonsPageSkeleton";

const LESSON_PLACEHOLDER_IMAGE =
    "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1000&q=80";
const LESSONS_PER_PAGE = 9;

const FILTERS = [
    { value: "all", label: "كل الدروس" },
    { value: "incomplete", label: "غير مكتملة" },
    { value: "completed", label: "مكتملة" },
];

function Lessons() {
    const { darkMode } = useTheme();
    const [lessons, setLessons] = useState([]);
    const [courses, setCourses] = useState([]);
    const [filter, setFilter] = useState("incomplete");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formState, setFormState] = useState({
        course_id: "",
        name: "",
        description: "",
        link: "",
        duration: "",
        type: "",
    });

    // Add to Tasks Modal State
    const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [taskFormState, setTaskFormState] = useState({
        scheduled_date: "",
        priority: "medium",
    });
    const [addingTask, setAddingTask] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: LESSONS_PER_PAGE,
    });

    useEffect(() => {
        loadCourses();
    }, []);

    useEffect(() => {
        loadLessons();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, page]);

    const loadCourses = async () => {
        try {
            const response = await courseService.getCourses({ active: true });
            if (response.success) {
                setCourses(response.data);
            }
        } catch (err) {
            // ignore course errors, they will be handled in the form when needed
        }
    };

    const loadLessons = async () => {
        setLoading(true);
        setError("");
        try {
            const params = {
                page,
                per_page: LESSONS_PER_PAGE,
            };
            if (filter === "completed") {
                params.completed = true;
            } else if (filter === "incomplete") {
                params.completed = false;
            }

            const response = await lessonService.getLessons(params);
            if (response.success) {
                const lessonData = Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.data?.data)
                    ? response.data.data
                    : [];
                if (response.meta) {
                    const currentPage = response.meta.current_page ?? page;
                    const lastPage = response.meta.last_page ?? 1;
                    if (page > lastPage && lastPage > 0) {
                        setPage(lastPage);
                        return;
                    }
                    setPagination({
                        current_page: currentPage,
                        last_page: lastPage,
                        total: response.meta.total ?? lessonData.length,
                        per_page: response.meta.per_page ?? LESSONS_PER_PAGE,
                    });
                } else {
                    setPagination({
                        current_page: 1,
                        last_page: 1,
                        total: lessonData.length,
                        per_page: LESSONS_PER_PAGE,
                    });
                }
                setLessons(lessonData);
            } else {
                // If API returns failure but no error, set empty array
                setLessons([]);
            }
        } catch (err) {
            // Ignore canceled errors (they're not real errors, just duplicate request prevention)
            if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
                setLoading(false);
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
                console.error("Network error loading lessons:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCompletion = async (lessonId) => {
        try {
            await lessonService.toggleCompletion(lessonId);
            await loadLessons();
        } catch (err) {
            setError(err.response?.data?.message || "تعذر تحديث حالة الدرس");
        }
    };

    const handleOpenModal = () => {
        setFormState({
            course_id: courses[0]?.id ?? "",
            name: "",
            description: "",
            link: "",
            duration: "",
            type: "",
        });
        setModalOpen(true);
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateLesson = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            const payload = {
                ...formState,
                course_id: Number(formState.course_id),
                duration: formState.duration || null,
                link: formState.link || null,
                type: formState.type || null,
                description: formState.description || null,
            };

            await lessonService.createLesson(payload);
            setModalOpen(false);
            await loadLessons();
        } catch (err) {
            setError(err.response?.data?.message || "تعذر إنشاء الدرس");
        } finally {
            setSaving(false);
        }
    };

    const handleOpenAddTask = (lesson) => {
        setSelectedLesson(lesson);
        const today = new Date().toISOString().split("T")[0];
        setTaskFormState({
            scheduled_date: today,
            priority: "medium",
        });
        setAddTaskModalOpen(true);
    };

    const handleTaskFormChange = (event) => {
        const { name, value } = event.target;
        setTaskFormState((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddTask = async (event) => {
        event.preventDefault();
        setAddingTask(true);
        setError("");

        try {
            const payload = {
                title: selectedLesson.name,
                is_lesson: true,
                lesson_id: selectedLesson.id,
                course_id: selectedLesson.course_id,
                source_type: "lesson",
                scheduled_date: taskFormState.scheduled_date,
                priority: taskFormState.priority,
                status: "pending",
            };

            const response = await taskService.createTask(payload);
            if (response.success) {
                setAddTaskModalOpen(false);
                setSelectedLesson(null);
                setSuccessMessage("تمت إضافة الدرس للمهام بنجاح!");
                setTimeout(() => setSuccessMessage(""), 3000);
                // Reload lessons to update has_task status
                await loadLessons();
            } else {
                setError(response.message || "تعذر إضافة الدرس للمهام");
            }
        } catch (err) {
            if (err.response?.status === 422) {
                setError(
                    err.response?.data?.message ||
                        "هذا الدرس مجدول بالفعل في المهام"
                );
                setAddTaskModalOpen(false);
                setSelectedLesson(null);
                // Reload to refresh has_task status
                await loadLessons();
            } else {
                setError(
                    err.response?.data?.message || "تعذر إضافة الدرس للمهام"
                );
            }
        } finally {
            setAddingTask(false);
        }
    };

    const handleFilterChange = (value) => {
        setFilter(value);
        setPage(1);
    };

    const handleImageError = (event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = LESSON_PLACEHOLDER_IMAGE;
    };

    const paginationRange = useMemo(() => {
        const totalPages = pagination.last_page ?? 1;
        const currentPage = Math.min(page, totalPages);

        if (totalPages <= 1) {
            return [1];
        }

        const siblings = 1;
        const startPage = Math.max(1, currentPage - siblings);
        const endPage = Math.min(totalPages, currentPage + siblings);
        const range = [];

        if (startPage > 1) {
            range.push(1);
        }

        if (startPage > 2) {
            range.push("ellipsis-left");
        }

        for (
            let pageNumber = startPage;
            pageNumber <= endPage;
            pageNumber += 1
        ) {
            range.push(pageNumber);
        }

        if (endPage < totalPages - 1) {
            range.push("ellipsis-right");
        }

        if (endPage < totalPages) {
            range.push(totalPages);
        }

        return range;
    }, [page, pagination.last_page]);

    const handlePageChange = (nextPage) => {
        if (
            nextPage >= 1 &&
            nextPage <= pagination.last_page &&
            nextPage !== page
        ) {
            setPage(nextPage);
        }
    };

    const paginationSummary = useMemo(() => {
        if (!pagination.total) {
            return { from: 0, to: 0 };
        }
        const from = (pagination.current_page - 1) * pagination.per_page + 1;
        const to = Math.min(
            pagination.total,
            pagination.current_page * pagination.per_page
        );
        return { from, to };
    }, [pagination.current_page, pagination.per_page, pagination.total]);

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
                : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
        }`}>
        <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-bold ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>الدروس</h1>
                    <p className={`mt-1 text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        إدارة الدروس المرتبطة بالدورات ومتابعة التقدم
                    </p>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                >
                    <i className="fas fa-plus ml-1" />
                    درس جديد
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {FILTERS.map((item) => (
                    <button
                        key={item.value}
                        onClick={() => handleFilterChange(item.value)}
                        className={`px-4 py-2 rounded-lg text-sm transition ${
                            filter === item.value
                                ? "bg-indigo-600 text-white"
                                : darkMode
                                ? "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className={`p-4 border rounded-lg flex items-start gap-3 animate-fade-in ${
                    darkMode
                        ? 'bg-red-900/30 border-red-800 text-red-300'
                        : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                    <i className="fas fa-exclamation-circle text-red-600 mt-0.5" />
                    <div className="flex-1">{error}</div>
                    <button
                        onClick={() => setError("")}
                        className="text-red-600 hover:text-red-800"
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>
            )}

            {successMessage && (
                <div className={`p-4 border rounded-lg flex items-start gap-3 animate-fade-in ${
                    darkMode
                        ? 'bg-green-900/30 border-green-800 text-green-300'
                        : 'bg-green-50 border-green-200 text-green-800'
                }`}>
                    <i className="fas fa-check-circle text-green-600 mt-0.5" />
                    <div className="flex-1">{successMessage}</div>
                    <button
                        onClick={() => setSuccessMessage("")}
                        className="text-green-600 hover:text-green-800"
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>
            )}

            {loading ? (
                <LessonsPageSkeleton />
            ) : lessons.length === 0 ? (
                <div className={`rounded-2xl shadow-lg border-2 p-16 text-center transition-all duration-300 ${
                    darkMode 
                        ? 'bg-gray-800/50 border-gray-700/50 backdrop-blur-sm' 
                        : 'bg-white/80 border-gray-100 backdrop-blur-sm'
                }`}>
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                        <i className={`fas fa-book-open text-3xl ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                    </div>
                    <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        لا توجد دروس ضمن هذا الفلتر
                    </p>
                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        جرب تغيير الفلتر أو إضافة درس جديد
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {lessons.map((lesson) => {
                        const courseName = lesson.course?.name || "دورة غير محددة";
                        const heroImage = lesson.course?.image_url || LESSON_PLACEHOLDER_IMAGE;
                        return (
                            <div
                                key={lesson.id}
                                className={`group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                                    darkMode 
                                        ? 'bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 shadow-xl shadow-gray-900/50 ring-1 ring-gray-700/50' 
                                        : 'bg-white shadow-xl shadow-gray-200/50 ring-1 ring-gray-100'
                                }`}
                            >
                                {/* Hero Image Section */}
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <img
                                        src={heroImage}
                                        alt={courseName}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        onError={handleImageError}
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                    
                                    {/* Play Button Overlay */}
                                    <a
                                        href={`/lessons/${lesson.id}/media`}
                                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/40 transition-transform duration-300 group-hover:scale-110">
                                            <i className="fas fa-play text-white text-xl ml-1"></i>
                                        </div>
                                    </a>
                                    
                                    {/* Top Badges */}
                                    <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2 z-10">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-sm ${
                                                lesson.completed
                                                    ? "bg-emerald-500/90 text-white"
                                                    : "bg-amber-500/90 text-white"
                                            }`}
                                        >
                                            <i className={`fas ${lesson.completed ? 'fa-check-circle' : 'fa-hourglass-half'} text-[10px]`}></i>
                                            {lesson.completed ? "مكتمل" : "قيد الإنجاز"}
                                        </span>
                                        
                                        <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium backdrop-blur-md ${
                                            lesson.has_task 
                                                ? 'bg-blue-500/80 text-white' 
                                                : 'bg-white/20 text-white'
                                        }`}>
                                            <i className={`fas ${lesson.has_task ? 'fa-calendar-check' : 'fa-clock'} text-[10px]`}></i>
                                            {lesson.has_task ? "مجدول" : (lesson.duration || "مدة غير محددة")}
                                        </span>
                                    </div>
                                    
                                    {/* Bottom Title Section */}
                                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                                        <h2 className="text-lg font-bold text-white leading-tight line-clamp-2 mb-1 drop-shadow-lg">
                                            {lesson.name}
                                        </h2>
                                        <p className="text-sm text-gray-300 flex items-center gap-2">
                                            <i className="fas fa-graduation-cap text-indigo-400"></i>
                                            {courseName}
                                        </p>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-5 space-y-4">
                                    {/* Description */}
                                    {lesson.description && (
                                        <p className={`text-sm leading-relaxed line-clamp-2 ${
                                            darkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            {lesson.description}
                                        </p>
                                    )}

                                    {/* Quick Stats */}
                                    <div className={`flex items-center gap-4 py-3 border-y ${
                                        darkMode ? 'border-gray-700/50' : 'border-gray-100'
                                    }`}>
                                        <div className="flex items-center gap-2 flex-1">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                darkMode ? 'bg-indigo-500/20' : 'bg-indigo-50'
                                            }`}>
                                                <i className="fas fa-clock text-indigo-500 text-sm"></i>
                                            </div>
                                            <div>
                                                <p className={`text-[10px] uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>المدة</p>
                                                <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                    {lesson.duration || "غير محددة"}
                                                </p>
                                            </div>
                                        </div>
                                        {lesson.type && (
                                            <div className="flex items-center gap-2 flex-1">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                    darkMode ? 'bg-purple-500/20' : 'bg-purple-50'
                                                }`}>
                                                    <i className="fas fa-layer-group text-purple-500 text-sm"></i>
                                                </div>
                                                <div>
                                                    <p className={`text-[10px] uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>النوع</p>
                                                    <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                        {lesson.type}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Primary Action - Watch Video Button */}
                                    <a
                                        href={`/lessons/${lesson.id}/media`}
                                        className="group/btn flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white font-semibold text-sm transition-all duration-300 hover:from-indigo-700 hover:via-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/30"
                                    >
                                        <i className="fas fa-play-circle transition-transform duration-300 group-hover/btn:scale-110"></i>
                                        <span>مشاهدة الفيديو</span>
                                        <i className="fas fa-arrow-left text-xs opacity-0 -translate-x-2 transition-all duration-300 group-hover/btn:opacity-100 group-hover/btn:translate-x-0"></i>
                                    </a>

                                    {/* Secondary Actions */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {!lesson.completed && !lesson.has_task && (
                                            <button
                                                onClick={() => handleOpenAddTask(lesson)}
                                                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                                    darkMode
                                                        ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600/50'
                                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                }`}
                                                title="إضافة الدرس إلى قائمة المهام"
                                            >
                                                <i className="fas fa-calendar-plus text-indigo-500"></i>
                                                <span>جدولة</span>
                                            </button>
                                        )}
                                        
                                        {lesson.has_task && !lesson.completed && (
                                            <div className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium ${
                                                darkMode
                                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                                            }`}>
                                                <i className="fas fa-calendar-check"></i>
                                                <span>مجدول</span>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleToggleCompletion(lesson.id)}
                                            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                                lesson.completed
                                                    ? darkMode
                                                        ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600/50'
                                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                    : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-500/30'
                                            } ${(!lesson.completed && !lesson.has_task) ? '' : 'col-span-2'}`}
                                            title={lesson.completed ? "إلغاء اكتمال الدرس" : "وضع مكتمل"}
                                        >
                                            <i className={`fas ${lesson.completed ? 'fa-undo' : 'fa-check-circle'}`}></i>
                                            <span>{lesson.completed ? "إرجاع قيد الإنجاز" : "وضع مكتمل"}</span>
                                        </button>
                                    </div>

                                    {/* External Link (if available) */}
                                    {lesson.link && (
                                        <a
                                            href={lesson.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-300 ${
                                                darkMode
                                                    ? 'text-gray-400 hover:text-indigo-400 hover:bg-gray-700/50'
                                                    : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50'
                                            }`}
                                            title="فتح الدرس في تبويب جديد"
                                        >
                                            <i className="fas fa-external-link-alt"></i>
                                            <span>فتح الرابط الخارجي</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {lessons.length > 0 && pagination.last_page > 1 && (
                <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-sm transition-colors duration-300 ${
                    darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                }`}>
                    <div className={`text-sm transition-colors duration-300 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        عرض {paginationSummary.from} - {paginationSummary.to} من{" "}
                        {pagination.total} درس
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page <= 1}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-300 ${
                                darkMode
                                    ? 'text-gray-300 hover:bg-gray-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <i className="fas fa-chevron-right text-xs" />
                            السابق
                        </button>
                        {paginationRange.map((item, index) =>
                            typeof item === "string" ? (
                                <span
                                    key={`${item}-${index}`}
                                    className={`px-2 transition-colors duration-300 ${
                                        darkMode ? 'text-gray-500' : 'text-gray-400'
                                    }`}
                                >
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => handlePageChange(item)}
                                    className={`min-w-[38px] rounded-lg px-3 py-2 text-sm font-medium transition transition-colors duration-300 ${
                                        item === page
                                            ? "bg-indigo-600 text-white shadow"
                                            : darkMode
                                                ? "text-gray-300 hover:bg-gray-700"
                                                : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    {item}
                                </button>
                            )
                        )}
                        <button
                            type="button"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= pagination.last_page}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-300 ${
                                darkMode
                                    ? 'text-gray-300 hover:bg-gray-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            التالي
                            <i className="fas fa-chevron-left text-xs" />
                        </button>
                    </div>
                </div>
            )}

            <Modal
                title="إضافة الدرس للمهام"
                isOpen={addTaskModalOpen}
                onClose={() => setAddTaskModalOpen(false)}
            >
                <form onSubmit={handleAddTask} className="space-y-4">
                    {selectedLesson && (
                        <div className={`border rounded-lg p-4 transition-colors duration-300 ${
                            darkMode
                                ? 'bg-indigo-900/30 border-indigo-700'
                                : 'bg-indigo-50 border-indigo-200'
                        }`}>
                            <p className={`text-sm mb-1 transition-colors duration-300 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                اسم الدرس:
                            </p>
                            <p className={`font-semibold transition-colors duration-300 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                                {selectedLesson.name}
                            </p>
                            {selectedLesson.course?.name && (
                                <p className={`text-xs mt-1 transition-colors duration-300 ${
                                    darkMode ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                    الدورة: {selectedLesson.course.name}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="scheduled_date"
                            className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                        >
                            <i className="fas fa-calendar ml-2 text-indigo-600" />
                            تاريخ التنفيذ المتوقع
                        </label>
                        <input
                            id="scheduled_date"
                            name="scheduled_date"
                            type="date"
                            value={taskFormState.scheduled_date}
                            onChange={handleTaskFormChange}
                            required
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-300 ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-700 text-gray-200'
                                    : 'border-gray-300'
                            }`}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="priority"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            <i className="fas fa-flag ml-2 text-indigo-600" />
                            الأولوية
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={taskFormState.priority}
                            onChange={handleTaskFormChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="low">منخفض</option>
                            <option value="medium">متوسط</option>
                            <option value="high">عالي</option>
                            <option value="urgent">عاجل</option>
                        </select>
                    </div>

                    <div className={`border rounded-lg p-4 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                        <p className={`text-xs transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            <i className="fas fa-info-circle ml-1 text-indigo-600" />
                            سيتم إضافة هذا الدرس كمهمة في قائمة المهام بالتاريخ
                            والأولوية المحددة.
                        </p>
                    </div>

                    <div className={`flex justify-end gap-3 pt-4 border-t transition-colors duration-300 ${
                        darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                        <button
                            type="button"
                            onClick={() => setAddTaskModalOpen(false)}
                            className={`px-4 py-2 rounded-lg border transition-colors duration-300 ${
                                darkMode
                                    ? 'border-gray-700 text-gray-300 hover:bg-gray-700'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={addingTask}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {addingTask ? (
                                <>
                                    <i className="fas fa-spinner fa-spin ml-2" />
                                    جاري الإضافة...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus ml-2" />
                                    إضافة للمهام
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                title="إضافة درس جديد"
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
            >
                <form onSubmit={handleCreateLesson} className="space-y-4">
                    <div>
                        <label
                            htmlFor="course_id"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            اختر الدورة
                        </label>
                        <select
                            id="course_id"
                            name="course_id"
                            value={formState.course_id}
                            onChange={handleFormChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">-- اختر الدورة --</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            عنوان الدرس
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formState.name}
                            onChange={handleFormChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            الوصف (اختياري)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows="3"
                            value={formState.description}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="link"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                رابط الدرس (اختياري)
                            </label>
                            <input
                                id="link"
                                name="link"
                                type="url"
                                value={formState.link}
                                onChange={handleFormChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="duration"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                المدة (اختياري)
                            </label>
                            <input
                                id="duration"
                                name="duration"
                                type="text"
                                value={formState.duration}
                                onChange={handleFormChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="مثال: 45 دقيقة"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="type"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            نوع الدرس (اختياري)
                        </label>
                        <input
                            id="type"
                            name="type"
                            type="text"
                            value={formState.type}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="فيديو، قراءة، تدريب..."
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {saving ? "جاري الحفظ..." : "حفظ الدرس"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
        </div>
    );
}

export default Lessons;
