import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import courseService from "../services/courseService";
import lessonService from "../services/lessonService";
import categoryService from "../services/categoryService";
import taskService from "../services/taskService";
import Modal from "../components/Modal";
import CourseDetailsSkeleton from "../components/courses/CourseDetailsSkeleton";

function CourseDetails() {
    const { darkMode } = useTheme();
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [formState, setFormState] = useState({
        name: "",
        category_id: "",
        link: "",
        active: true,
        image: null,
    });
    const [saving, setSaving] = useState(false);

    // Add to Tasks Modal State
    const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [taskFormState, setTaskFormState] = useState({
        scheduled_date: "",
        priority: "medium",
    });
    const [addingTask, setAddingTask] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [numberingType, setNumberingType] = useState("sequential");
    const [numberingLoading, setNumberingLoading] = useState(false);

    // JSON Import Modal State
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [jsonContent, setJsonContent] = useState("");
    const [importing, setImporting] = useState(false);

    // Add Lesson Modal State
    const [addLessonModalOpen, setAddLessonModalOpen] = useState(false);
    const [newLessonForm, setNewLessonForm] = useState({
        name: "",
        lesson_category_id: "",
        link: "",
        duration: "",
        description: "",
    });
    const [addingLesson, setAddingLesson] = useState(false);

    // Filter State
    const [showCompleted, setShowCompleted] = useState(true);

    // Collapse State for Categories
    const [collapsedCategories, setCollapsedCategories] = useState({});

    useEffect(() => {
        loadCourse();
        loadCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadCourse = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await courseService.getCourse(id);
            if (response.success) {
                setCourse(response.data);
                setFormState({
                    name: response.data.name,
                    category_id: response.data.category?.id ?? "",
                    link: response.data.link ?? "",
                    active: Boolean(response.data.active),
                    image: null,
                });
            }

            const statsResponse = await courseService.getStatistics(id);
            if (statsResponse.success) {
                setStatistics(statsResponse.data);
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
                console.error("Network error loading course details:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await categoryService.getCategories();
            if (response.success) {
                setCategories(response.data);
            }
        } catch (err) {
            // ignore
        }
    };

    const handleToggleActive = async () => {
        try {
            await courseService.toggleActive(id);
            await loadCourse();
        } catch (err) {
            setError(err.response?.data?.message || "تعذر تحديث حالة الدورة");
        }
    };

    const handleDelete = async () => {
        const confirmation = window.confirm(
            "سيتم حذف الدورة وجميع دروسها. هل تريد المتابعة؟"
        );
        if (!confirmation) {
            return;
        }
        try {
            await courseService.deleteCourse(id);
            navigate("/courses");
        } catch (err) {
            setError(err.response?.data?.message || "تعذر حذف الدورة");
        }
    };

    const handleNumberLessons = async () => {
        if (!course?.lessons?.length) {
            setError("لا توجد دروس لترقيمها");
            return;
        }

        setNumberingLoading(true);
        setError("");

        try {
            const response = await courseService.numberLessons(
                id,
                numberingType
            );
            setSuccessMessage(
                response.message || "تم تحديث ترقيم الدروس بنجاح"
            );
            setTimeout(() => setSuccessMessage(""), 5000);
            await loadCourse();
        } catch (err) {
            setError(err.response?.data?.message || "تعذر ترقيم الدروس");
        } finally {
            setNumberingLoading(false);
        }
    };

    const handleToggleLesson = async (lessonId) => {
        try {
            await lessonService.toggleCompletion(lessonId);
            await loadCourse();
        } catch (err) {
            setError(err.response?.data?.message || "تعذر تحديث حالة الدرس");
        }
    };

    const handleFormChange = (event) => {
        const { name, value, type, checked, files } = event.target;
        if (name === "image") {
            setFormState((prev) => ({ ...prev, image: files?.[0] ?? null }));
        } else if (type === "checkbox") {
            setFormState((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormState((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleUpdateCourse = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            const payload = new FormData();
            payload.append("name", formState.name);
            payload.append("category_id", formState.category_id);
            if (formState.link) {
                payload.append("link", formState.link);
            }
            payload.append("active", formState.active ? "1" : "0");
            if (formState.image) {
                payload.append("image", formState.image);
            }

            await courseService.updateCourse(id, payload);
            setModalOpen(false);
            await loadCourse();
        } catch (err) {
            setError(err.response?.data?.message || "تعذر تحديث الدورة");
        } finally {
            setSaving(false);
        }
    };

    const handleOpenAddTask = (lesson) => {
        setSelectedLesson(lesson);
        // Set default date to today
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
                course_id: course.id,
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
                // Reload course to update has_task status
                await loadCourse();
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
                await loadCourse();
            } else {
                setError(
                    err.response?.data?.message || "تعذر إضافة الدرس للمهام"
                );
            }
        } finally {
            setAddingTask(false);
        }
    };

    const handleImportFromJson = async (event) => {
        event.preventDefault();
        setImporting(true);
        setError("");

        try {
            const lessons = JSON.parse(jsonContent);

            if (!Array.isArray(lessons)) {
                setError("يجب أن يكون ملف JSON عبارة عن مصفوفة من الدروس");
                setImporting(false);
                return;
            }

            let successCount = 0;
            let errorCount = 0;

            for (const lesson of lessons) {
                try {
                    const payload = {
                        name: lesson.name,
                        course_id: id,
                        lesson_category_id:
                            lesson.lesson_category_id ||
                            lesson.category_id ||
                            null,
                        link: lesson.link || "",
                        completed: lesson.completed || false,
                        duration: lesson.duration || null,
                        description: lesson.description || null,
                    };

                    await lessonService.createLesson(payload);
                    successCount++;
                } catch (err) {
                    errorCount++;
                    console.error("خطأ في استيراد الدرس:", lesson.name, err);
                }
            }

            setImportModalOpen(false);
            setJsonContent("");

            if (errorCount > 0) {
                setSuccessMessage(
                    `تم استيراد ${successCount} درس بنجاح. فشل استيراد ${errorCount} درس.`
                );
            } else {
                setSuccessMessage(`تم استيراد ${successCount} درس بنجاح!`);
            }

            setTimeout(() => setSuccessMessage(""), 5000);
            await loadCourse();
        } catch (err) {
            setError(
                err.message === "Unexpected token" ||
                    err.message.includes("JSON")
                    ? "تنسيق JSON غير صحيح. يرجى التحقق من الملف."
                    : err.response?.data?.message ||
                          "تعذر استيراد الدروس من JSON"
            );
        } finally {
            setImporting(false);
        }
    };

    // Handle Add Lesson
    const handleNewLessonChange = (event) => {
        const { name, value } = event.target;
        setNewLessonForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddLesson = async (event) => {
        event.preventDefault();
        setAddingLesson(true);
        setError("");

        try {
            const payload = {
                name: newLessonForm.name,
                course_id: id,
                lesson_category_id: newLessonForm.lesson_category_id || null,
                link: newLessonForm.link || "",
                duration: newLessonForm.duration || null,
                description: newLessonForm.description || null,
                completed: false,
            };

            const response = await lessonService.createLesson(payload);
            if (response.success) {
                setAddLessonModalOpen(false);
                setNewLessonForm({
                    name: "",
                    lesson_category_id: "",
                    link: "",
                    duration: "",
                    description: "",
                });
                setSuccessMessage("تمت إضافة الدرس بنجاح!");
                setTimeout(() => setSuccessMessage(""), 3000);
                await loadCourse();
            } else {
                setError(response.message || "تعذر إضافة الدرس");
            }
        } catch (err) {
            setError(err.response?.data?.message || "تعذر إضافة الدرس");
        } finally {
            setAddingLesson(false);
        }
    };

    // Toggle category collapse
    const toggleCategory = (categoryName) => {
        setCollapsedCategories((prev) => ({
            ...prev,
            [categoryName]: !prev[categoryName],
        }));
    };

    const hasLessonCategories = React.useMemo(() => {
        if (!course?.lessons?.length) return false;
        return course.lessons.some((lesson) => Boolean(lesson.category));
    }, [course?.lessons]);

    // Group lessons by category with filtering
    const groupedLessons = React.useMemo(() => {
        if (!course?.lessons?.length) return {};

        const groups = {};
        course.lessons.forEach((lesson) => {
            // Filter by completion status
            if (!showCompleted && lesson.completed) {
                return;
            }

            const categoryName = lesson.category?.name || "بدون تصنيف";
            if (!groups[categoryName]) {
                groups[categoryName] = [];
            }
            groups[categoryName].push(lesson);
        });

        // Remove empty categories
        const filteredGroups = {};
        Object.entries(groups).forEach(([categoryName, lessons]) => {
            if (lessons.length > 0) {
                filteredGroups[categoryName] = lessons;
            }
        });

        return filteredGroups;
    }, [course?.lessons, showCompleted]);

    useEffect(() => {
        if (!hasLessonCategories && numberingType === "category") {
            setNumberingType("sequential");
        }
    }, [hasLessonCategories, numberingType]);

    // Initialize collapsed state - keep first category open
    React.useEffect(() => {
        if (Object.keys(groupedLessons).length > 0) {
            const initialCollapsed = {};
            Object.keys(groupedLessons).forEach((categoryName, index) => {
                // First category is open, others are collapsed
                initialCollapsed[categoryName] = index !== 0;
            });
            setCollapsedCategories(initialCollapsed);
        }
    }, [course?.lessons]); // Only run when lessons change

    if (loading) {
        return <CourseDetailsSkeleton />;
    }

    if (!course) {
        return (
            <div className={`rounded-xl shadow p-12 text-center transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'
            }`}>
                {error || "لم يتم العثور على الدورة المطلوبة"}
            </div>
        );
    }

    const progress = Number(course.progress ?? statistics?.progress ?? 0);

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
                : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
        }`}>
        <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-2 text-sm mb-2 ${
                        darkMode ? 'text-indigo-400' : 'text-indigo-600'
                    }`}>
                        <Link
                            to="/courses"
                            className="hover:underline flex items-center gap-1 transition-colors"
                        >
                            <i className="fas fa-arrow-right text-xs" />
                            الدورات
                        </Link>
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>/</span>
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{course.name}</span>
                    </div>
                    <h1 className={`text-3xl font-bold flex items-center gap-3 ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                        <i className="fas fa-graduation-cap text-indigo-600" />
                        {course.name}
                    </h1>
                    {course.category && (
                        <p className={`mt-2 text-sm flex items-center gap-2 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            <i className="fas fa-folder text-indigo-500" />
                            {course.category.name}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setAddLessonModalOpen(true)}
                        className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md text-sm font-medium flex items-center gap-2"
                    >
                        <i className="fas fa-plus-circle" />
                        إضافة درس جديد
                    </button>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md text-sm font-medium flex items-center gap-2"
                    >
                        <i className="fas fa-edit" />
                        تعديل
                    </button>
                    <button
                        onClick={handleToggleActive}
                        className={`px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md text-sm font-medium flex items-center gap-2 ${
                            course.active
                                ? darkMode
                                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                : "bg-amber-600 text-white hover:bg-amber-700"
                        }`}
                    >
                        <i className={`fas ${ course.active ? "fa-pause" : "fa-play" }`} />
                        {course.active ? "إيقاف" : "تفعيل"}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm hover:shadow-md text-sm font-medium flex items-center gap-2"
                    >
                        <i className="fas fa-trash" />
                        حذف
                    </button>
                </div>
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
                        className={darkMode ? 'text-red-400 hover:text-red-200' : 'text-red-600 hover:text-red-800'}
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
                        className={darkMode ? 'text-green-400 hover:text-green-200' : 'text-green-600 hover:text-green-800'}
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* بطاقة المعلومات الرئيسية */}
                <div className={`lg:col-span-3 rounded-xl shadow-md border p-6 space-y-6 transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                    {course.image_url && (
                        <div className="relative overflow-hidden rounded-xl group">
                            <img
                                src={course.image_url}
                                alt={course.name}
                                className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                    )}

                    {/* إحصائيات سريعة */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className={`rounded-xl p-5 text-center transition-all duration-300 hover:scale-105 ${
                            darkMode
                                ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700'
                                : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'
                        }`}>
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-blue-600 shadow-lg">
                                <i className="fas fa-book text-white text-lg" />
                            </div>
                            <p className={`text-3xl font-black mb-1 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                                {course.lessons?.length ?? course.lessons_count ?? 0}
                            </p>
                            <p className={`text-xs font-medium ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                إجمالي الدروس
                            </p>
                        </div>

                        <div className={`rounded-xl p-5 text-center transition-all duration-300 hover:scale-105 ${
                            darkMode
                                ? 'bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700'
                                : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'
                        }`}>
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-green-600 shadow-lg">
                                <i className="fas fa-check-circle text-white text-lg" />
                            </div>
                            <p className={`text-3xl font-black mb-1 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                                {statistics?.completed_lessons ?? course.completed_lessons_count ?? 0}
                            </p>
                            <p className={`text-xs font-medium ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                دروس مكتملة
                            </p>
                        </div>

                        <div className={`rounded-xl p-5 text-center transition-all duration-300 hover:scale-105 ${
                            darkMode
                                ? 'bg-gradient-to-br from-amber-900/40 to-amber-800/40 border border-amber-700'
                                : 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200'
                        }`}>
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-amber-600 shadow-lg">
                                <i className="fas fa-clock text-white text-lg" />
                            </div>
                            <p className={`text-3xl font-black mb-1 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                                {(course.lessons?.length ?? 0) - (statistics?.completed_lessons ?? 0)}
                            </p>
                            <p className={`text-xs font-medium ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                دروس متبقية
                            </p>
                        </div>

                        <div className={`rounded-xl p-5 text-center transition-all duration-300 hover:scale-105 ${
                            darkMode
                                ? 'bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700'
                                : 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'
                        }`}>
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-purple-600 shadow-lg">
                                <i className="fas fa-percent text-white text-lg" />
                            </div>
                            <p className={`text-3xl font-black mb-1 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                                {progress.toFixed(0)}%
                            </p>
                            <p className={`text-xs font-medium ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                نسبة الإنجاز
                            </p>
                        </div>
                    </div>

                    {/* شريط التقدم */}
                    <div className={`rounded-xl p-6 space-y-4 ${
                        darkMode
                            ? 'bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-800'
                            : 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg">
                                    <i className="fas fa-chart-line text-white" />
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${
                                        darkMode ? 'text-gray-100' : 'text-gray-900'
                                    }`}>
                                        تقدم الدورة
                                    </h3>
                                    <p className={`text-sm ${
                                        darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        {statistics?.completed_lessons ?? 0} من {course.lessons?.length ?? 0} درس
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {progress.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div className={`h-4 rounded-full overflow-hidden shadow-inner ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                            <div
                                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* الشريط الجانبي */}
                <div className="space-y-5">
                    {/* إجراءات سريعة */}
                    <div className={`rounded-xl shadow-md border p-6 space-y-4 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                                <i className="fas fa-bolt text-white" />
                            </div>
                            <h2 className={`text-lg font-bold ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                                إجراءات سريعة
                            </h2>
                        </div>

                        <button
                            onClick={() => setAddLessonModalOpen(true)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg text-sm font-bold flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-plus-circle" />
                            إضافة درس جديد
                        </button>

                        <Link
                            to={`/lessons?course_id=${course.id}`}
                            className="block w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg text-sm font-bold text-center"
                        >
                            <i className="fas fa-list ml-2" />
                            إدارة جميع الدروس
                        </Link>

                        <button
                            onClick={() => setImportModalOpen(true)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm font-bold flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-file-import" />
                            استيراد JSON
                        </button>
                    </div>

                    <div className={`rounded-lg shadow-sm border p-5 space-y-4 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                        <h2 className={`text-base font-bold flex items-center ${
                            darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                            <i className="fas fa-sort-numeric-down text-indigo-600 ml-2 text-sm" />
                            ترقيم الدروس
                        </h2>
                        <p className={`text-sm leading-relaxed ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            أضف أرقاماً تلقائية لعناوين الدروس لسهولة المتابعة.
                            يمكنك اختيار الترقيم المتتالي لكل الدروس أو إعادة
                            الترقيم داخل كل فئة على حدة.
                        </p>

                        <div className="space-y-3">
                            <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                                darkMode ? 'border-gray-700 hover:border-indigo-500' : 'border-gray-200 hover:border-indigo-400'
                            }`}>
                                <input
                                    type="radio"
                                    className="mt-1 form-radio text-indigo-600"
                                    name="numbering-type"
                                    value="sequential"
                                    checked={numberingType === "sequential"}
                                    onChange={(event) =>
                                        setNumberingType(event.target.value)
                                    }
                                />
                                <div>
                                    <div className={`font-semibold text-sm ${
                                        darkMode ? 'text-gray-200' : 'text-gray-900'
                                    }`}>
                                        ترقيم متتالي
                                    </div>
                                    <p className={`text-xs leading-relaxed ${
                                        darkMode ? 'text-gray-500' : 'text-gray-500'
                                    }`}>
                                        يبدأ الترقيم من 1 ويستمر حتى آخر درس في
                                        الدورة بغض النظر عن التصنيف.
                                    </p>
                                </div>
                            </label>

                            <label
                                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                                    numberingType === "category" &&
                                    hasLessonCategories
                                        ? darkMode ? "border-indigo-500" : "border-indigo-400"
                                        : darkMode ? "border-gray-700 hover:border-indigo-500" : "hover:border-indigo-400"
                                } ${
                                    !hasLessonCategories
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }`}
                            >
                                <input
                                    type="radio"
                                    className="mt-1 form-radio text-indigo-600"
                                    name="numbering-type"
                                    value="category"
                                    checked={numberingType === "category"}
                                    onChange={(event) =>
                                        setNumberingType(event.target.value)
                                    }
                                    disabled={!hasLessonCategories}
                                />
                                <div>
                                    <div className={`font-semibold text-sm ${
                                        darkMode ? 'text-gray-200' : 'text-gray-900'
                                    }`}>
                                        ترقيم حسب الفئة
                                    </div>
                                    <p className={`text-xs leading-relaxed ${
                                        darkMode ? 'text-gray-500' : 'text-gray-500'
                                    }`}>
                                        يعيد الترقيم إلى 1 داخل كل فئة دروس.
                                        مفيد عند تقسيم الدورة إلى أجزاء متعددة.
                                    </p>
                                    {!hasLessonCategories && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            جميع الدروس بدون فئات محددة، استخدم
                                            الترقيم المتتالي بدلاً من ذلك.
                                        </p>
                                    )}
                                </div>
                            </label>
                        </div>

                        <button
                            onClick={handleNumberLessons}
                            disabled={
                                numberingLoading || !course?.lessons?.length
                            }
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {numberingLoading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin" />
                                    جاري الترقيم...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check-double" />
                                    تطبيق الترقيم
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className={`rounded-lg shadow-sm border p-5 space-y-4 transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className={`text-lg font-bold flex items-center ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                        <i className="fas fa-list text-indigo-600 ml-2 text-sm" />
                        قائمة الدروس
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowCompleted(!showCompleted)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition font-medium flex items-center gap-2 ${
                                showCompleted
                                    ? darkMode
                                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                            title={
                                showCompleted
                                    ? "إخفاء الدروس المكتملة"
                                    : "إظهار الدروس المكتملة"
                            }
                        >
                            <i
                                className={`fas ${
                                    showCompleted ? "fa-eye-slash" : "fa-eye"
                                } text-xs`}
                            />
                            <span>
                                {showCompleted
                                    ? "إخفاء المكتملة"
                                    : "إظهار المكتملة"}
                            </span>
                        </button>
                        <span className={`text-sm px-3 py-1 rounded-lg font-medium ${
                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                            {Object.values(groupedLessons).reduce(
                                (total, lessons) => total + lessons.length,
                                0
                            )}{" "}
                            درس
                        </span>
                    </div>
                </div>

                {course.lessons?.length ? (
                    <div className="space-y-4">
                        {Object.keys(groupedLessons).length === 0 ? (
                            <div className={`text-center py-12 rounded-lg border ${
                                darkMode
                                    ? 'bg-gray-900/30 border-gray-700 text-gray-500'
                                    : 'bg-gray-50 border-gray-200 text-gray-500'
                            }`}>
                                <i className={`fas fa-filter text-4xl mb-3 ${
                                    darkMode ? 'text-gray-700' : 'text-gray-300'
                                }`} />
                                <p>لا توجد دروس تطابق الفلتر المحدد</p>
                            </div>
                        ) : (
                            Object.entries(groupedLessons).map(
                                ([categoryName, lessons]) => {
                                    const isCollapsed =
                                        collapsedCategories[categoryName] ??
                                        false;

                                    return (
                                        <div
                                            key={categoryName}
                                            className={`border rounded-lg overflow-hidden ${
                                                darkMode ? 'border-gray-700' : 'border-gray-200'
                                            }`}
                                        >
                                            {/* Category Header */}
                                            <button
                                                onClick={() =>
                                                    toggleCategory(categoryName)
                                                }
                                                className={`w-full flex items-center justify-between gap-2 p-4 transition-colors ${
                                                    darkMode
                                                        ? 'bg-gray-900/50 hover:bg-gray-900'
                                                        : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <i
                                                        className={`fas ${
                                                            isCollapsed
                                                                ? "fa-chevron-left"
                                                                : "fa-chevron-down"
                                                        } text-indigo-600 text-xs transition-transform`}
                                                    />
                                                    <i className="fas fa-folder text-indigo-600 text-sm" />
                                                    <h3 className={`text-base font-bold ${
                                                        darkMode ? 'text-gray-100' : 'text-gray-900'
                                                    }`}>
                                                        {categoryName}
                                                    </h3>
                                                    <span className={`text-xs px-2 py-1 rounded-full border ${
                                                        darkMode
                                                            ? 'bg-gray-800 text-gray-400 border-gray-700'
                                                            : 'bg-white text-gray-600 border-gray-200'
                                                    }`}>
                                                        {lessons.length} درس
                                                    </span>
                                                </div>
                                            </button>

                                            {/* Category Content */}
                                            {!isCollapsed && (
                                                <div className={`p-4 space-y-3 ${
                                                    darkMode ? 'bg-gray-800' : 'bg-white'
                                                }`}>
                                                    {lessons.map((lesson) => (
                                                        <div
                                                            key={lesson.id}
                                                            className={`border rounded-lg p-4 hover:shadow-md transition-shadow duration-200 ${
                                                                darkMode
                                                                    ? 'bg-gray-900/50 border-gray-700'
                                                                    : 'bg-white border-gray-200'
                                                            }`}
                                                        >
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start gap-3">
                                                                        <div
                                                                            className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                                                                                lesson.completed
                                                                                    ? "bg-green-100"
                                                                                    : "bg-amber-100"
                                                                            }`}
                                                                        >
                                                                            <i
                                                                                className={`fas ${
                                                                                    lesson.completed
                                                                                        ? "fa-check-circle text-green-600"
                                                                                        : "fa-book-open text-amber-600"
                                                                                } text-lg`}
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h3 className={`text-base font-semibold mb-1 ${
                                                                                darkMode ? 'text-gray-200' : 'text-gray-900'
                                                                            }`}>
                                                                                {
                                                                                    lesson.name
                                                                                }
                                                                            </h3>
                                                                            <div className="flex items-center gap-2">
                                                                                <span
                                                                                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                                                                                        lesson.completed
                                                                                            ? "bg-green-100 text-green-700 border border-green-200"
                                                                                            : "bg-amber-100 text-amber-700 border border-amber-200"
                                                                                    }`}
                                                                                >
                                                                                    <i
                                                                                        className={`fas ${
                                                                                            lesson.completed
                                                                                                ? "fa-check"
                                                                                                : "fa-clock"
                                                                                        } ml-1 text-xs`}
                                                                                    />
                                                                                    {lesson.completed
                                                                                        ? "مكتمل"
                                                                                        : "قيد الإنجاز"}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {/* زر مشاهدة الدرس */}
                                                                    <Link
                                                                        to={`/lessons/${lesson.id}/media`}
                                                                        className="px-4 py-2 text-sm text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors font-medium flex items-center gap-2"
                                                                        title="مشاهدة الدرس مع الفيديو والترجمات"
                                                                    >
                                                                        <i className="fas fa-play-circle text-xs" />
                                                                        <span>
                                                                            مشاهدة
                                                                            الدرس
                                                                        </span>
                                                                    </Link>

                                                                    {lesson.link && (
                                                                        <a
                                                                            href={
                                                                                lesson.link
                                                                            }
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="px-4 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium flex items-center gap-2"
                                                                            title="فتح الدرس في نافذة جديدة"
                                                                        >
                                                                            <i className="fas fa-external-link-alt text-xs" />
                                                                            <span>
                                                                                رابط
                                                                                خارجي
                                                                            </span>
                                                                        </a>
                                                                    )}
                                                                    {/* زر إضافة للمهام أو مجدول */}
                                                                    {!lesson.completed &&
                                                                        (lesson.has_task ? (
                                                                            <div className={`px-4 py-2 text-sm border rounded-lg font-medium flex items-center gap-2 ${
                                                                                darkMode
                                                                                    ? 'bg-gray-700 text-gray-400 border-gray-600'
                                                                                    : 'bg-gray-50 text-gray-500 border-gray-200'
                                                                            }`}>
                                                                                <i className="fas fa-calendar-check text-xs" />
                                                                                <span>
                                                                                    مجدول
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() =>
                                                                                    handleOpenAddTask(
                                                                                        lesson
                                                                                    )
                                                                                }
                                                                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors font-medium flex items-center gap-2 shadow-sm"
                                                                                title="إضافة الدرس إلى قائمة المهام"
                                                                            >
                                                                                <i className="fas fa-calendar-plus text-xs" />
                                                                                <span>
                                                                                    إضافة
                                                                                    للمهام
                                                                                </span>
                                                                            </button>
                                                                        ))}
                                                                    {/* زر وضع مكتمل */}
                                                                    <button
                                                                        onClick={() =>
                                                                            handleToggleLesson(
                                                                                lesson.id
                                                                            )
                                                                        }
                                                                        className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium flex items-center gap-2 shadow-sm ${
                                                                            lesson.completed
                                                                                ? "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                                                                                : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
                                                                        }`}
                                                                        title={
                                                                            lesson.completed
                                                                                ? "إلغاء اكتمال الدرس"
                                                                                : "وضع مكتمل"
                                                                        }
                                                                    >
                                                                        <i
                                                                            className={`fas ${
                                                                                lesson.completed
                                                                                    ? "fa-undo"
                                                                                    : "fa-check-circle"
                                                                            } text-xs`}
                                                                        />
                                                                        <span>
                                                                            {lesson.completed
                                                                                ? "إلغاء الإكمال"
                                                                                : "إكمال الدرس"}
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            )
                        )}
                    </div>
                ) : (
                    <div className={`text-center py-12 rounded-lg border ${
                        darkMode
                            ? 'bg-gray-900/30 border-gray-700 text-gray-500'
                            : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                        <i className={`fas fa-book-open text-4xl mb-3 ${
                            darkMode ? 'text-gray-700' : 'text-gray-300'
                        }`} />
                        <p>لا توجد دروس مرتبطة بهذه الدورة حالياً.</p>
                    </div>
                )}
            </div>

            <Modal
                title="إضافة الدرس للمهام"
                isOpen={addTaskModalOpen}
                onClose={() => setAddTaskModalOpen(false)}
            >
                <form onSubmit={handleAddTask} className="space-y-4">
                    {selectedLesson && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-1">
                                اسم الدرس:
                            </p>
                            <p className="font-semibold text-gray-900">
                                {selectedLesson.name}
                            </p>
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="scheduled_date"
                            className="block text-sm font-medium text-gray-700 mb-2"
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
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-600">
                            <i className="fas fa-info-circle ml-1 text-indigo-600" />
                            سيتم إضافة هذا الدرس كمهمة في قائمة المهام بالتاريخ
                            والأولوية المحددة.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => setAddTaskModalOpen(false)}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
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
                title="استيراد دروس من JSON"
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
            >
                <form onSubmit={handleImportFromJson} className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700 mb-2">
                            <i className="fas fa-info-circle ml-1 text-blue-600" />
                            قم بلصق محتوى JSON هنا. يجب أن يكون بتنسيق مصفوفة من
                            الدروس:
                        </p>
                        <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                            {`[
  {
    "name": "اسم الدرس",
    "lesson_category_id": 1,
    "link": "https://example.com",
    "duration": "30 دقيقة",
    "description": "وصف الدرس",
    "completed": false
  }
]`}
                        </pre>
                    </div>

                    <div>
                        <label
                            htmlFor="jsonContent"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            <i className="fas fa-code ml-2 text-indigo-600" />
                            محتوى JSON
                        </label>
                        <textarea
                            id="jsonContent"
                            name="jsonContent"
                            value={jsonContent}
                            onChange={(e) => setJsonContent(e.target.value)}
                            required
                            rows={10}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                            placeholder='[{"name": "الدرس الأول", "category_id": 1, "link": "https://..."}]'
                        />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-xs text-gray-700">
                            <i className="fas fa-exclamation-triangle ml-1 text-amber-600" />
                            ملاحظة: سيتم إضافة جميع الدروس إلى هذه الدورة. تأكد
                            من صحة البيانات قبل الاستيراد.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => {
                                setImportModalOpen(false);
                                setJsonContent("");
                            }}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={importing}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {importing ? (
                                <>
                                    <i className="fas fa-spinner fa-spin ml-2" />
                                    جاري الاستيراد...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-file-import ml-2" />
                                    استيراد الدروس
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Add Lesson Modal */}
            <Modal
                title="إضافة درس جديد"
                isOpen={addLessonModalOpen}
                onClose={() => setAddLessonModalOpen(false)}
            >
                <form onSubmit={handleAddLesson} className="space-y-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                                <i className="fas fa-book text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">
                                    دورة: {course.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                    سيتم إضافة الدرس إلى هذه الدورة
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="lesson_name" className="block text-sm font-medium text-gray-700 mb-2">
                            <i className="fas fa-pen ml-2 text-indigo-600" />
                            اسم الدرس *
                        </label>
                        <input
                            id="lesson_name"
                            name="name"
                            type="text"
                            value={newLessonForm.name}
                            onChange={handleNewLessonChange}
                            required
                            placeholder="مثال: مقدمة إلى React"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        />
                    </div>

                    <div>
                        <label htmlFor="lesson_category_id" className="block text-sm font-medium text-gray-700 mb-2">
                            <i className="fas fa-folder ml-2 text-indigo-600" />
                            فئة الدرس (اختياري)
                        </label>
                        <select
                            id="lesson_category_id"
                            name="lesson_category_id"
                            value={newLessonForm.lesson_category_id}
                            onChange={handleNewLessonChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        >
                            <option value="">بدون فئة</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="lesson_link" className="block text-sm font-medium text-gray-700 mb-2">
                            <i className="fas fa-link ml-2 text-indigo-600" />
                            رابط الدرس (اختياري)
                        </label>
                        <input
                            id="lesson_link"
                            name="link"
                            type="url"
                            value={newLessonForm.link}
                            onChange={handleNewLessonChange}
                            placeholder="https://example.com/lesson"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="lesson_duration" className="block text-sm font-medium text-gray-700 mb-2">
                                <i className="fas fa-clock ml-2 text-indigo-600" />
                                المدة (اختياري)
                            </label>
                            <input
                                id="lesson_duration"
                                name="duration"
                                type="text"
                                value={newLessonForm.duration}
                                onChange={handleNewLessonChange}
                                placeholder="30 دقيقة"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="lesson_description" className="block text-sm font-medium text-gray-700 mb-2">
                            <i className="fas fa-align-right ml-2 text-indigo-600" />
                            وصف الدرس (اختياري)
                        </label>
                        <textarea
                            id="lesson_description"
                            name="description"
                            value={newLessonForm.description}
                            onChange={handleNewLessonChange}
                            rows={3}
                            placeholder="وصف مختصر لمحتوى الدرس"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => {
                                setAddLessonModalOpen(false);
                                setNewLessonForm({
                                    name: "",
                                    lesson_category_id: "",
                                    link: "",
                                    duration: "",
                                    description: "",
                                });
                            }}
                            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
                        >
                            <i className="fas fa-times ml-2" />
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={addingLesson}
                            className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {addingLesson ? (
                                <>
                                    <i className="fas fa-spinner fa-spin ml-2" />
                                    جاري الإضافة...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check ml-2" />
                                    إضافة الدرس
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                title="تحديث بيانات الدورة"
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
            >
                <form onSubmit={handleUpdateCourse} className="space-y-4">
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            اسم الدورة
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
                            htmlFor="category_id"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            التصنيف
                        </label>
                        <select
                            id="category_id"
                            name="category_id"
                            value={formState.category_id}
                            onChange={handleFormChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">-- اختر التصنيف --</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="link"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            رابط الدورة (اختياري)
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
                            htmlFor="image"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            صورة جديدة (اختياري)
                        </label>
                        <input
                            id="image"
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={handleFormChange}
                            className="w-full text-sm text-gray-600"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="active"
                            name="active"
                            type="checkbox"
                            checked={formState.active}
                            onChange={handleFormChange}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                            htmlFor="active"
                            className="text-sm text-gray-700"
                        >
                            إبقاء الدورة نشطة
                        </label>
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
                            {saving ? "جاري التحديث..." : "حفظ التغييرات"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
        </div>
    );
}

export default CourseDetails;
