import { useEffect, useMemo, useState, useCallback } from "react";
import { useTheme } from "../contexts/ThemeContext";
import mediaLibraryService from "../services/mediaLibraryService";
import lessonService from "../services/lessonService";
import LessonMediaSkeleton from "../components/skeletons/LessonMediaSkeleton";
import Pagination from "../components/ui/Pagination";
import ChunkedVideoUploader from "../components/lesson/ChunkedVideoUploader";
import Button from "../components/Button";

const PER_PAGE = 12;
const UNCATEGORIZED_CATEGORY_KEY = "__uncategorized__";
const YOUTUBE_THUMBNAIL = (videoId) =>
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

export default function MediaLibrary() {
    const { darkMode } = useTheme();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0,
        hasNext: false,
    });
    const [filters, setFilters] = useState({
        search: "",
        status: "all",
        courseId: "",
        categoryId: "",
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [lessons, setLessons] = useState([]);
    const [lessonsLoading, setLessonsLoading] = useState(false);
    const [assigningVideo, setAssigningVideo] = useState(null);
    const [selectedLessonId, setSelectedLessonId] = useState("");
    const [assignError, setAssignError] = useState(null);
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [previewVideo, setPreviewVideo] = useState(null);
    const [quickViewVideo, setQuickViewVideo] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [statistics, setStatistics] = useState({
        total: 0,
        assigned: 0,
        unassigned: 0,
        totalSize: 0,
    });

    const assignedLessonIds = useMemo(() => {
        const ids = new Set();
        videos.forEach((video) => {
            if (video.lesson?.id) {
                ids.add(String(video.lesson.id));
            }
        });
        return ids;
    }, [videos]);

    const courses = useMemo(() => {
        const map = new Map();
        lessons.forEach((lesson) => {
            const course = lesson.course;
            const rawId = course?.id ?? lesson.course_id;
            if (!rawId) {
                return;
            }
            const id = String(rawId);
            if (!map.has(id)) {
                const name =
                    course?.name ??
                    course?.title ??
                    lesson.course_name ??
                    `دورة رقم ${id}`;
                map.set(id, name);
            }
        });
        return Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) =>
                (a.name || "").localeCompare(b.name || "", "ar", {
                    sensitivity: "base",
                })
            );
    }, [lessons]);

    const getYoutubeVideoId = (url) => {
        if (!url) {
            return null;
        }

        try {
            const normalizedUrl = url.trim();
            const youtubeRegex =
                /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i;
            const match = normalizedUrl.match(youtubeRegex);
            return match ? match[1] : null;
        } catch (error) {
            return null;
        }
    };

    const resolveThumbnailUrl = (video) => {
        if (!video) {
            return null;
        }
        if (video.thumbnail_url) {
            return video.thumbnail_url;
        }
        const youtubeId = getYoutubeVideoId(video.source_url);
        if (youtubeId) {
            return YOUTUBE_THUMBNAIL(youtubeId);
        }
        return null;
    };

    const courseCategories = useMemo(() => {
        const result = {};
        lessons.forEach((lesson) => {
            const courseId = lesson.course_id ? String(lesson.course_id) : null;
            if (!courseId) {
                return;
            }
            const categoryIdRaw =
                lesson.lesson_category_id ??
                (lesson.category?.id ? Number(lesson.category.id) : null);
            const categoryId = categoryIdRaw
                ? String(categoryIdRaw)
                : UNCATEGORIZED_CATEGORY_KEY;
            const categoryName = categoryIdRaw
                ? lesson.category?.name ?? `تصنيف ${categoryId}`
                : "بدون تصنيف";

            if (!result[courseId]) {
                result[courseId] = {};
            }
            if (!result[courseId][categoryId]) {
                result[courseId][categoryId] = categoryName;
            }
        });

        return Object.fromEntries(
            Object.entries(result).map(([courseId, categories]) => [
                courseId,
                Object.entries(categories)
                    .map(([id, name]) => ({ id, name }))
                    .sort((a, b) =>
                        (a.name || "").localeCompare(b.name || "", "ar", {
                            sensitivity: "base",
                        })
                    ),
            ])
        );
    }, [lessons]);

    const filterCategoryOptions = useMemo(() => {
        if (!filters.courseId) {
            return [];
        }

        const categories = courseCategories[filters.courseId] || [];

        return categories.map((category) => ({
            id: category.id,
            name:
                category.id === UNCATEGORIZED_CATEGORY_KEY
                    ? "بدون تصنيف"
                    : category.name,
        }));
    }, [filters.courseId, courseCategories]);

    const rawCategoriesForSelectedCourse = useMemo(() => {
        if (!selectedCourseId) {
            return [];
        }
        return courseCategories[selectedCourseId] || [];
    }, [selectedCourseId, courseCategories]);

    const hasActualCategories = useMemo(() => {
        return rawCategoriesForSelectedCourse.some(
            (category) => category.id !== UNCATEGORIZED_CATEGORY_KEY
        );
    }, [rawCategoriesForSelectedCourse]);

    const categoriesForSelectedCourse = useMemo(() => {
        if (!hasActualCategories) {
            return [];
        }

        const actualCategories = rawCategoriesForSelectedCourse.filter(
            (category) => category.id !== UNCATEGORIZED_CATEGORY_KEY
        );

        if (
            rawCategoriesForSelectedCourse.some(
                (category) => category.id === UNCATEGORIZED_CATEGORY_KEY
            )
        ) {
            actualCategories.push({
                id: UNCATEGORIZED_CATEGORY_KEY,
                name: "بدون تصنيف",
            });
        }

        return actualCategories;
    }, [rawCategoriesForSelectedCourse, hasActualCategories]);

    const availableLessons = useMemo(() => {
        const courseHasCategories = hasActualCategories;

        return lessons
            .filter((lesson) => {
                if (
                    selectedCourseId &&
                    String(lesson.course_id) !== selectedCourseId
                ) {
                    return false;
                }
                const lessonId = String(lesson.id);
                const isCurrentLesson =
                    assigningVideo?.lesson?.id &&
                    String(assigningVideo.lesson.id) === lessonId;

                if (courseHasCategories && !selectedCategoryId && !isCurrentLesson) {
                    return false;
                }

                const lessonCategoryId = lesson.lesson_category_id
                    ? String(lesson.lesson_category_id)
                    : lesson.category?.id
                    ? String(lesson.category.id)
                    : UNCATEGORIZED_CATEGORY_KEY;
                if (
                    selectedCategoryId &&
                    !isCurrentLesson &&
                    lessonCategoryId !== selectedCategoryId
                ) {
                    return false;
                }

                if (isCurrentLesson) {
                    return true;
                }
                return !assignedLessonIds.has(lessonId);
            })
            .slice()
            .sort((a, b) =>
                (a.name || "").localeCompare(b.name || "", "ar", {
                    sensitivity: "base",
                })
            );
    }, [
        lessons,
        selectedCourseId,
        selectedCategoryId,
        assignedLessonIds,
        assigningVideo,
        hasActualCategories,
    ]);

    useEffect(() => {
        if (!feedback) {
            return;
        }
        const timeout = setTimeout(() => setFeedback(null), 4000);
        return () => clearTimeout(timeout);
    }, [feedback]);

    const loadLessons = useCallback(async () => {
        try {
            setLessonsLoading(true);
            const response = await lessonService.getLessons();
            if (response?.success) {
                const data = Array.isArray(response.data) ? response.data : [];
                setLessons(
                    data.slice().sort((a, b) =>
                        (a.name || "").localeCompare(b.name || "", "ar", {
                            sensitivity: "base",
                        })
                    )
                );
            }
        } catch (err) {
            // Ignore canceled errors (they're not real errors, just duplicate request prevention)
            if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || err?.message?.includes('cancelled')) {
                return;
            }
            // Only log real errors
            console.error("Failed to load lessons for media library:", err);
        } finally {
            setLessonsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLessons();
        // Cleanup function to cancel request if component unmounts
        return () => {
            // Request will be automatically cancelled by axios interceptor if component unmounts
        };
    }, [loadLessons]);

    const buildQueryParams = (pageValue, filtersValue) => {
        const params = {
            page: pageValue,
            per_page: PER_PAGE,
        };

        if (filtersValue.search) {
            params.search = filtersValue.search;
        }

        if (filtersValue.courseId) {
            params.course_id = filtersValue.courseId;
        }

        if (filtersValue.categoryId) {
            params.category_id = filtersValue.categoryId;
        }

        if (filtersValue.status === "assigned") {
            params.assigned = 1;
        } else if (filtersValue.status === "unassigned") {
            params.unassigned = 1;
        }

        return params;
    };

    const loadVideos = async (pageValue = page, filtersValue = filters) => {
        setLoading(true);
        setError(null);

        try {
            const response = await mediaLibraryService.getVideos(
                buildQueryParams(pageValue, filtersValue)
            );

            // Check if response indicates failure
            if (response?.success === false) {
                setVideos([]);
                setError(response?.message || "فشل تحميل مكتبة الوسائط");
                setLoading(false);
                return;
            }

            const data = Array.isArray(response?.data) ? response.data : [];
            const meta = response?.meta || {};

            setVideos(data);
            setPagination({
                currentPage: meta.current_page || pageValue,
                totalPages: meta.last_page || 1,
                total: meta.total ?? data.length ?? 0,
                hasNext:
                    (meta.current_page || pageValue) <
                    (meta.last_page || 1),
            });

            const stats = {
                total: meta.total ?? data.length ?? 0,
                assigned: data.filter(v => v.lesson).length,
                unassigned: data.filter(v => !v.lesson).length,
                totalSize: data.reduce((sum, v) => sum + (v.file_size || 0), 0),
            };
            setStatistics(stats);
        } catch (err) {
            console.error("Error loading media library:", err);
            setVideos([]);
            const errorMessage = err?.response?.data?.message || 
                                err?.message || 
                                "فشل تحميل مكتبة الوسائط";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVideos(page, filters);
    }, [
        page,
        filters.search,
        filters.status,
        filters.courseId,
        filters.categoryId,
    ]);

    const handleFilterChange = (field, value) => {
        setFilters((prev) => {
            const next = {
                ...prev,
                [field]: value,
            };
            if (field === "courseId") {
                next.categoryId = "";
            }
            return next;
        });
        setPage(1);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        handleFilterChange("search", searchTerm.trim());
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setFilters({
            search: "",
            status: "all",
            courseId: "",
            categoryId: "",
        });
        setPage(1);
    };

    const handlePageChange = (nextPage) => {
        if (nextPage < 1 || nextPage > pagination.totalPages) {
            return;
        }
        setPage(nextPage);
    };

    const handleChunkUploadSuccess = async () => {
        setFeedback({
            type: "success",
            message: "تم رفع الفيديو إلى مكتبة الوسائط بنجاح",
        });
        setPage(1);
        await loadVideos(1, filters);
    };

    const openAssignModal = (video) => {
        setAssigningVideo(video);
        if (video.lesson) {
            const courseId = String(video.lesson.course_id || "");
            const categoryId = video.lesson.lesson_category_id
                ? String(video.lesson.lesson_category_id)
                : UNCATEGORIZED_CATEGORY_KEY;
            setSelectedCourseId(courseId);
            setSelectedCategoryId(categoryId);
            setSelectedLessonId(String(video.lesson.id));
        } else {
            setSelectedCourseId("");
            setSelectedCategoryId("");
            setSelectedLessonId("");
        }
        setAssignError(null);
    };

    const closeAssignModal = () => {
        setAssigningVideo(null);
        setSelectedCourseId("");
        setSelectedCategoryId("");
        setSelectedLessonId("");
        setAssignError(null);
    };

    const handleAssignSubmit = async (event) => {
        event.preventDefault();
        setAssignError(null);

        if (!selectedLessonId || !assigningVideo) {
            setAssignError("يرجى اختيار درس لربط الفيديو به.");
            return;
        }

        try {
            const response = await mediaLibraryService.assignVideo(
                assigningVideo.id,
                selectedLessonId
            );

            if (response?.success) {
                setFeedback({
                    type: "success",
                    message:
                        response.message || "تم ربط الفيديو بالدرس بنجاح.",
                });
                closeAssignModal();
                await loadVideos(page, filters);
            } else {
                setAssignError(
                    response?.message || "فشل ربط الفيديو بالدرس."
                );
            }
        } catch (err) {
            setAssignError(
                err?.response?.data?.message || "حدث خطأ أثناء ربط الفيديو."
            );
        }
    };

    const handleDetach = async (videoId) => {
        if (!confirm("هل تريد فصل هذا الفيديو عن الدرس المرتبط به؟")) {
            return;
        }

        try {
            const response = await mediaLibraryService.detachVideo(videoId);
            if (response?.success) {
                setFeedback({
                    type: "success",
                    message: response.message || "تم فصل الفيديو عن الدرس.",
                });
                await loadVideos(page, filters);
            } else {
                setFeedback({
                    type: "error",
                    message:
                        response.message || "فشل فصل الفيديو عن الدرس.",
                });
            }
        } catch (err) {
            setFeedback({
                type: "error",
                message:
                    err?.response?.data?.message ||
                    "حدث خطأ أثناء فصل الفيديو.",
            });
        }
    };

    const handleDeleteVideo = async (videoId) => {
        if (
            !confirm(
                "هل أنت متأكد من حذف هذا الفيديو؟ هذا الإجراء لا يمكن التراجع عنه."
            )
        ) {
            return;
        }

        try {
            const response = await mediaLibraryService.deleteVideo(videoId);
            if (response?.success) {
                setFeedback({
                    type: "success",
                    message: response.message || "تم حذف الفيديو بنجاح.",
                });
                await loadVideos(page, filters);
            } else {
                setFeedback({
                    type: "error",
                    message: response.message || "فشل حذف الفيديو.",
                });
            }
        } catch (err) {
            setFeedback({
                type: "error",
                message:
                    err?.response?.data?.message ||
                    "حدث خطأ أثناء حذف الفيديو.",
            });
        }
    };

    const openPreviewModal = (video) => {
        setPreviewVideo(video);
    };

    const closePreviewModal = () => {
        setPreviewVideo(null);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date)) {
            return "تاريخ غير صالح";
        }
        return new Intl.DateTimeFormat("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(date);
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 بايت';
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 p-6 ${
            darkMode 
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
                : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
        }`} dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={`text-4xl font-black mb-2 transition-colors duration-300 ${
                            darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>مكتبة الوسائط</h1>
                        <p className={`transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>إدارة وتنظيم ملفات الفيديو الخاصة بك</p>
                    </div>
                    <button
                        onClick={() => {
                            const uploadSection = document.getElementById('upload-section');
                            uploadSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                    >
                        <i className="fas fa-cloud-upload-alt text-xl"></i>
                        <span>رفع فيديو جديد</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`rounded-xl shadow-sm border-2 p-6 hover:shadow-lg transition-all duration-300 ${
                        darkMode 
                            ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                            : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm mb-1 transition-colors duration-300 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>إجمالي الفيديوهات</p>
                                <p className={`text-3xl font-black transition-colors duration-300 ${
                                    darkMode ? 'text-gray-100' : 'text-gray-900'
                                }`}>{pagination.total}</p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <i className="fas fa-video text-white text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-xl shadow-sm border-2 p-6 hover:shadow-lg transition-all duration-300 ${
                        darkMode 
                            ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                            : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm mb-1 transition-colors duration-300 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>مرتبطة بدروس</p>
                                <p className={`text-3xl font-black transition-colors duration-300 ${
                                    darkMode ? 'text-gray-100' : 'text-gray-900'
                                }`}>{statistics.assigned}</p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                <i className="fas fa-link text-white text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-xl shadow-sm border-2 p-6 hover:shadow-lg transition-all duration-300 ${
                        darkMode 
                            ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                            : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm mb-1 transition-colors duration-300 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>غير مرتبطة</p>
                                <p className={`text-3xl font-black transition-colors duration-300 ${
                                    darkMode ? 'text-gray-100' : 'text-gray-900'
                                }`}>{statistics.unassigned}</p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                                <i className="fas fa-unlink text-white text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-xl shadow-sm border-2 p-6 hover:shadow-lg transition-all duration-300 ${
                        darkMode 
                            ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                            : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm mb-1 transition-colors duration-300 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>المساحة الإجمالية</p>
                                <p className={`text-3xl font-black transition-colors duration-300 ${
                                    darkMode ? 'text-gray-100' : 'text-gray-900'
                                }`}>{formatFileSize(statistics.totalSize)}</p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                <i className="fas fa-database text-white text-2xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {feedback && (
                    <div
                        className={`rounded-xl border-2 px-6 py-4 font-semibold flex items-center gap-3 transition-colors duration-300 ${
                            feedback.type === "success"
                                ? darkMode
                                    ? "bg-emerald-900/30 border-emerald-700 text-emerald-300"
                                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : darkMode
                                    ? "bg-red-900/30 border-red-700 text-red-300"
                                    : "bg-red-50 border-red-200 text-red-700"
                        }`}
                    >
                        <i className={`fas ${feedback.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"} text-xl`}></i>
                        {feedback.message}
                    </div>
                )}

                <div className={`rounded-2xl p-6 border-2 shadow-lg space-y-6 transition-colors duration-300 ${
                    darkMode 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-slate-200'
                }`}>
                    <div className="flex items-center justify-between">
                        <h2 className={`text-xl font-black flex items-center gap-2 transition-colors duration-300 ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>
                            <i className="fas fa-filter text-indigo-500"></i>
                            البحث والتصفية
                        </h2>
                        <div className={`flex items-center gap-2 rounded-lg p-1 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-700' : 'bg-slate-100'
                        }`}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-2 rounded-md transition-all ${
                                    viewMode === 'grid'
                                        ? darkMode
                                            ? 'bg-gray-600 text-indigo-400 shadow-sm font-bold'
                                            : 'bg-white text-indigo-600 shadow-sm font-bold'
                                        : darkMode
                                            ? 'text-gray-400 hover:text-gray-200'
                                            : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <i className="fas fa-th"></i>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded-md transition-all ${
                                    viewMode === 'list'
                                        ? darkMode
                                            ? 'bg-gray-600 text-indigo-400 shadow-sm font-bold'
                                            : 'bg-white text-indigo-600 shadow-sm font-bold'
                                        : darkMode
                                            ? 'text-gray-400 hover:text-gray-200'
                                            : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <i className="fas fa-list"></i>
                            </button>
                        </div>
                    </div>

                    <form
                        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5"
                        onSubmit={handleSearchSubmit}
                        onReset={handleResetFilters}
                    >
                        <div className="md:col-span-2">
                            <label className={`block text-sm font-bold mb-2 flex items-center gap-2 transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                <i className={`fas fa-search transition-colors duration-300 ${
                                    darkMode ? 'text-gray-500' : 'text-gray-400'
                                }`}></i>
                                البحث عن فيديو
                            </label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="اسم الملف أو رابط المصدر..."
                                className={`w-full rounded-lg border-2 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-300 ${
                                    darkMode
                                        ? 'bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-500'
                                        : 'border-slate-200'
                                }`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-bold mb-2 flex items-center gap-2 transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                <i className={`fas fa-check-circle transition-colors duration-300 ${
                                    darkMode ? 'text-gray-500' : 'text-gray-400'
                                }`}></i>
                                حالة الربط
                            </label>
                            <select
                                value={filters.status}
                                onChange={(event) =>
                                    handleFilterChange(
                                        "status",
                                        event.target.value
                                    )
                                }
                                className={`w-full rounded-lg border-2 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-300 ${
                                    darkMode
                                        ? 'bg-gray-900 border-gray-700 text-gray-200'
                                        : 'border-slate-200'
                                }`}
                            >
                                <option value="">جميع الفيديوهات</option>
                                <option value="assigned">مرتبطة بالدروس</option>
                                <option value="unassigned">غير مرتبطة</option>
                            </select>
                        </div>
                        <div>
                            <label className={`block text-sm font-bold mb-2 flex items-center gap-2 transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                <i className={`fas fa-book transition-colors duration-300 ${
                                    darkMode ? 'text-gray-500' : 'text-gray-400'
                                }`}></i>
                                الدورة
                            </label>
                            <select
                                value={filters.courseId}
                                onChange={(event) =>
                                    handleFilterChange(
                                        "courseId",
                                        event.target.value
                                    )
                                }
                                className={`w-full rounded-lg border-2 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-300 ${
                                    darkMode
                                        ? 'bg-gray-900 border-gray-700 text-gray-200'
                                        : 'border-slate-200'
                                }`}
                            >
                                <option value="">كل الدورات</option>
                                {courses.map((courseOption) => (
                                    <option key={courseOption.id} value={courseOption.id}>
                                        {courseOption.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={`block text-sm font-bold mb-2 flex items-center gap-2 transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                <i className={`fas fa-folder transition-colors duration-300 ${
                                    darkMode ? 'text-gray-500' : 'text-gray-400'
                                }`}></i>
                                التصنيف
                            </label>
                            <select
                                value={filters.categoryId}
                                onChange={(event) =>
                                    handleFilterChange(
                                        "categoryId",
                                        event.target.value
                                    )
                                }
                                disabled={!filters.courseId || !filterCategoryOptions.length}
                                className={`w-full rounded-lg border-2 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-300 ${
                                    darkMode
                                        ? 'bg-gray-900 border-gray-700 text-gray-200 disabled:bg-gray-800 disabled:text-gray-500'
                                        : 'border-slate-200 disabled:bg-gray-100 disabled:text-gray-400'
                                }`}
                            >
                                <option value="">كل التصنيفات</option>
                                {filters.courseId &&
                                    filterCategoryOptions.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </form>

                    <div className="flex gap-3">
                        <Button type="submit" variant="primary" icon="fa-search" onClick={handleSearchSubmit} size="lg">
                            بحث
                        </Button>
                        <Button type="reset" variant="outline" icon="fa-redo" onClick={handleResetFilters} size="lg">
                            إعادة تعيين
                        </Button>
                    </div>
                </div>

                <div className={`rounded-2xl border-2 shadow-lg overflow-hidden transition-colors duration-300 ${
                    darkMode 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-slate-200'
                }`}>
                    {loading ? (
                        <LessonMediaSkeleton />
                    ) : error ? (
                        <div className={`p-6 font-semibold flex items-center gap-3 transition-colors duration-300 ${
                            darkMode ? 'text-red-400' : 'text-red-600'
                        }`}>
                            <i className="fas fa-exclamation-triangle text-2xl"></i>
                            {error}
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300 ${
                                darkMode ? 'bg-gray-700' : 'bg-slate-100'
                            }`}>
                                <i className={`fas fa-video text-3xl transition-colors duration-300 ${
                                    darkMode ? 'text-gray-500' : 'text-slate-400'
                                }`}></i>
                            </div>
                            <p className={`font-semibold transition-colors duration-300 ${
                                darkMode ? 'text-gray-400' : 'text-slate-500'
                            }`}>لا توجد فيديوهات في مكتبة الوسائط حالياً.</p>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'grid' ? (
                                <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {videos.map((video) => {
                                        const thumbnailUrl = resolveThumbnailUrl(video);

                                        return (
                                            <div
                                                key={video.id}
                                                className={`border-2 rounded-xl overflow-hidden hover:shadow-xl transition-all hover:scale-105 ${
                                                    darkMode
                                                        ? 'bg-gray-800 border-gray-700'
                                                        : 'bg-white border-slate-200'
                                                }`}
                                            >
                                                <div className={`relative aspect-video transition-colors duration-300 ${
                                                    darkMode
                                                        ? 'bg-gradient-to-br from-gray-700 to-gray-800'
                                                        : 'bg-gradient-to-br from-slate-100 to-slate-200'
                                                }`}>
                                                    {thumbnailUrl ? (
                                                        <img
                                                            src={thumbnailUrl}
                                                            alt={video.file_name || "Video thumbnail"}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = "none";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <i className={`fas fa-video text-5xl transition-colors duration-300 ${
                                                                darkMode ? 'text-gray-500' : 'text-slate-400'
                                                            }`}></i>
                                                        </div>
                                                    )}
                                                    {video.lesson && (
                                                        <div className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold flex items-center gap-1">
                                                            <i className="fas fa-link"></i>
                                                            مرتبط
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-4 space-y-3">
                                                    <h3 className={`font-bold line-clamp-1 transition-colors duration-300 ${
                                                        darkMode ? 'text-gray-100' : 'text-slate-900'
                                                    }`} title={video.file_name}>
                                                        {video.file_name || "فيديو بدون عنوان"}
                                                    </h3>

                                                    <div className={`space-y-2 text-xs transition-colors duration-300 ${
                                                        darkMode ? 'text-gray-400' : 'text-slate-600'
                                                    }`}>
                                                        {video.lesson && (
                                                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-300 ${
                                                                darkMode
                                                                    ? 'bg-green-900/30'
                                                                    : 'bg-green-50'
                                                            }`}>
                                                                <i className="fas fa-graduation-cap text-green-600"></i>
                                                                <span className={`font-semibold transition-colors duration-300 ${
                                                                    darkMode ? 'text-green-300' : 'text-green-700'
                                                                }`}>
                                                                    {video.lesson.name}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <i className={`fas fa-database transition-colors duration-300 ${
                                                                darkMode ? 'text-gray-500' : 'text-slate-400'
                                                            }`}></i>
                                                            {video.formatted_size || "غير متوفر"}
                                                        </div>
                                                        {video.formatted_duration && (
                                                            <div className="flex items-center gap-2">
                                                                <i className={`fas fa-clock transition-colors duration-300 ${
                                                                    darkMode ? 'text-gray-500' : 'text-slate-400'
                                                                }`}></i>
                                                                {video.formatted_duration}
                                                            </div>
                                                        )}
                                                        {video.created_at && (
                                                            <div className="flex items-center gap-2">
                                                                <i className={`fas fa-calendar transition-colors duration-300 ${
                                                                    darkMode ? 'text-gray-500' : 'text-slate-400'
                                                                }`}></i>
                                                                {formatDate(video.created_at)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setQuickViewVideo(video)}
                                                            className={`flex-1 px-3 py-2 text-sm border-2 rounded-lg font-bold transition-all hover:shadow-md ${
                                                                darkMode
                                                                    ? 'border-indigo-600 text-indigo-400 hover:bg-indigo-900/30'
                                                                    : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                                                            }`}
                                                        >
                                                            <i className="fas fa-eye ml-1"></i>
                                                            عرض سريع
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openAssignModal(video)}
                                                            className={`flex-1 px-3 py-2 text-sm border-2 rounded-lg font-bold transition-all hover:shadow-md ${
                                                                darkMode
                                                                    ? 'border-blue-600 text-blue-400 hover:bg-blue-900/30'
                                                                    : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                                                            }`}
                                                        >
                                                            <i className="fas fa-link ml-1"></i>
                                                            {video.lesson ? "تحديث" : "ربط"}
                                                        </button>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {video.lesson && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDetach(video.id)}
                                                                className={`flex-1 px-3 py-2 text-sm border-2 rounded-lg font-bold transition-all ${
                                                                    darkMode
                                                                        ? 'border-yellow-600 text-yellow-400 hover:bg-yellow-900/30'
                                                                        : 'border-yellow-200 text-yellow-600 hover:bg-yellow-50'
                                                                }`}
                                                            >
                                                                <i className="fas fa-unlink ml-1"></i>
                                                                فصل
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteVideo(video.id)}
                                                            className={`flex-1 px-3 py-2 text-sm border-2 rounded-lg font-bold transition-all ${
                                                                darkMode
                                                                    ? 'border-red-600 text-red-400 hover:bg-red-900/30'
                                                                    : 'border-red-200 text-red-600 hover:bg-red-50'
                                                            }`}
                                                        >
                                                            <i className="fas fa-trash-alt ml-1"></i>
                                                            حذف
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={`divide-y-2 transition-colors duration-300 ${
                                    darkMode ? 'divide-gray-700' : 'divide-slate-100'
                                }`}>
                                    {videos.map((video) => (
                                        <div
                                            key={video.id}
                                            className={`p-6 transition-colors duration-300 ${
                                                darkMode
                                                    ? 'hover:bg-gray-700'
                                                    : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={`w-32 h-20 rounded-lg flex-shrink-0 overflow-hidden transition-colors duration-300 ${
                                                    darkMode
                                                        ? 'bg-gradient-to-br from-gray-700 to-gray-800'
                                                        : 'bg-gradient-to-br from-slate-100 to-slate-200'
                                                }`}>
                                                    {resolveThumbnailUrl(video) ? (
                                                        <img
                                                            src={resolveThumbnailUrl(video)}
                                                            alt={video.file_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <i className={`fas fa-video text-2xl transition-colors duration-300 ${
                                                                darkMode ? 'text-gray-500' : 'text-slate-400'
                                                            }`}></i>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-bold mb-2 transition-colors duration-300 ${
                                                        darkMode ? 'text-gray-100' : 'text-slate-900'
                                                    }`}>{video.file_name}</h3>
                                                    <div className={`flex flex-wrap gap-4 text-xs transition-colors duration-300 ${
                                                        darkMode ? 'text-gray-400' : 'text-slate-600'
                                                    }`}>
                                                        <span className="flex items-center gap-1">
                                                            <i className={`fas fa-database transition-colors duration-300 ${
                                                                darkMode ? 'text-gray-500' : 'text-slate-400'
                                                            }`}></i>
                                                            {video.formatted_size || "غير متوفر"}
                                                        </span>
                                                        {video.formatted_duration && (
                                                            <span className="flex items-center gap-1">
                                                                <i className={`fas fa-clock transition-colors duration-300 ${
                                                                    darkMode ? 'text-gray-500' : 'text-slate-400'
                                                                }`}></i>
                                                                {video.formatted_duration}
                                                            </span>
                                                        )}
                                                        {video.lesson && (
                                                            <span className="flex items-center gap-1 text-green-600 font-bold">
                                                                <i className="fas fa-link"></i>
                                                                {video.lesson.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => setQuickViewVideo(video)}
                                                        className={`px-4 py-2 text-sm border-2 rounded-lg font-bold transition-all ${
                                                            darkMode
                                                                ? 'border-indigo-600 text-indigo-400 hover:bg-indigo-900/30'
                                                                : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                                                        }`}
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => openAssignModal(video)}
                                                        className={`px-4 py-2 text-sm border-2 rounded-lg font-bold transition-all ${
                                                            darkMode
                                                                ? 'border-blue-600 text-blue-400 hover:bg-blue-900/30'
                                                                : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                                                        }`}
                                                    >
                                                        <i className="fas fa-link"></i>
                                                    </button>
                                                    {video.lesson && (
                                                        <button
                                                            onClick={() => handleDetach(video.id)}
                                                            className={`px-4 py-2 text-sm border-2 rounded-lg font-bold transition-all ${
                                                                darkMode
                                                                    ? 'border-yellow-600 text-yellow-400 hover:bg-yellow-900/30'
                                                                    : 'border-yellow-200 text-yellow-600 hover:bg-yellow-50'
                                                            }`}
                                                        >
                                                            <i className="fas fa-unlink"></i>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteVideo(video.id)}
                                                        className={`px-4 py-2 text-sm border-2 rounded-lg font-bold transition-all ${
                                                            darkMode
                                                                ? 'border-red-600 text-red-400 hover:bg-red-900/30'
                                                                : 'border-red-200 text-red-600 hover:bg-red-50'
                                                        }`}
                                                    >
                                                        <i className="fas fa-trash-alt"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={`px-6 pb-6 pt-4 border-t-2 transition-colors duration-300 ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-700'
                                    : 'bg-slate-50 border-slate-200'
                            }`}>
                                <Pagination
                                    page={pagination.currentPage}
                                    total={pagination.totalPages}
                                    hasNext={pagination.hasNext}
                                    onPageChange={handlePageChange}
                                />
                                <div className={`mt-3 text-sm font-semibold transition-colors duration-300 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    إجمالي الفيديوهات: {pagination.total}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div id="upload-section" className={`rounded-2xl border-2 shadow-lg overflow-hidden scroll-mt-6 transition-colors duration-300 ${
                    darkMode
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-slate-200'
                }`}>
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                                <i className="fas fa-cloud-upload-alt text-white text-2xl"></i>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white">رفع فيديوهات جديدة</h2>
                                <p className="text-sm text-white/80">أضف فيديوهات إلى مكتبة الوسائط</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <ChunkedVideoUploader
                            mode="library"
                            allowMultiple
                            onUploadSuccess={handleChunkUploadSuccess}
                            title=""
                            description="اختر فيديو واحداً أو أكثر (MP4, AVI, MOV, WMV, WebM) وسيتم رفعها بالتتابع."
                        />
                    </div>
                </div>
            </div>

            {assigningVideo && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
                    <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                                        <i className="fas fa-link"></i>
                                        ربط الفيديو بالدرس
                                    </h3>
                                    <p className="mt-1 text-sm text-white/80">
                                        {assigningVideo.file_name}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeAssignModal}
                                    className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>

                        <form className="p-6 space-y-4" onSubmit={handleAssignSubmit}>
                            <div>
                                <label className={`block text-sm font-bold mb-2 flex items-center gap-2 transition-colors duration-300 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    <i className={`fas fa-book transition-colors duration-300 ${
                                        darkMode ? 'text-gray-500' : 'text-gray-400'
                                    }`}></i>
                                    اختر الدورة
                                </label>
                                <select
                                    value={selectedCourseId}
                                    onChange={(event) => {
                                        setSelectedCourseId(event.target.value);
                                        setSelectedLessonId("");
                                        setSelectedCategoryId("");
                                        setAssignError(null);
                                    }}
                                    className={`w-full rounded-lg border-2 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-300 ${
                                        darkMode
                                            ? 'bg-gray-900 border-gray-700 text-gray-200'
                                            : 'border-slate-200'
                                    }`}
                                >
                                    <option value="">اختر الدورة</option>
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>
                                            {course.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedCourseId && categoriesForSelectedCourse.length > 0 && (
                                <div>
                                    <label className={`block text-sm font-bold mb-2 flex items-center gap-2 transition-colors duration-300 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        <i className={`fas fa-folder transition-colors duration-300 ${
                                            darkMode ? 'text-gray-500' : 'text-gray-400'
                                        }`}></i>
                                        اختر التصنيف
                                    </label>
                                    <select
                                        value={selectedCategoryId}
                                        onChange={(event) => {
                                            setSelectedCategoryId(event.target.value);
                                            setSelectedLessonId("");
                                            setAssignError(null);
                                        }}
                                        className={`w-full rounded-lg border-2 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-300 ${
                                            darkMode
                                                ? 'bg-gray-900 border-gray-700 text-gray-200'
                                                : 'border-slate-200'
                                        }`}
                                    >
                                        <option value="">اختر التصنيف</option>
                                        {categoriesForSelectedCourse.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className={`block text-sm font-bold mb-2 flex items-center gap-2 transition-colors duration-300 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    <i className={`fas fa-graduation-cap transition-colors duration-300 ${
                                        darkMode ? 'text-gray-500' : 'text-gray-400'
                                    }`}></i>
                                    اختر الدرس
                                </label>
                                <select
                                    value={selectedLessonId}
                                    onChange={(event) => {
                                        setSelectedLessonId(event.target.value);
                                        setAssignError(null);
                                    }}
                                    disabled={!selectedCourseId || lessonsLoading}
                                    className={`w-full rounded-lg border-2 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-300 ${
                                        darkMode
                                            ? 'bg-gray-900 border-gray-700 text-gray-200 disabled:bg-gray-800 disabled:text-gray-500'
                                            : 'border-slate-200 disabled:bg-gray-100 disabled:text-gray-400'
                                    }`}
                                >
                                    <option value="">اختر الدرس</option>
                                    {availableLessons.map((lesson) => (
                                        <option key={lesson.id} value={lesson.id}>
                                            {lesson.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {assignError && (
                                <div className={`text-sm rounded-lg px-4 py-3 flex items-center gap-2 border-2 transition-colors duration-300 ${
                                    darkMode
                                        ? 'text-red-400 bg-red-900/30 border-red-700'
                                        : 'text-red-600 bg-red-50 border-red-200'
                                }`}>
                                    <i className="fas fa-exclamation-circle"></i>
                                    {assignError}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeAssignModal}
                                    className={`px-6 py-3 rounded-lg border-2 font-bold transition-all ${
                                        darkMode
                                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    إلغاء
                                </button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    icon="fa-link"
                                    disabled={
                                        !selectedCourseId ||
                                        (categoriesForSelectedCourse.length > 0 && !selectedCategoryId) ||
                                        !selectedLessonId
                                    }
                                    size="lg"
                                >
                                    ربط الفيديو
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {previewVideo && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                    onClick={closePreviewModal}
                >
                    <div
                        className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                                        <i className="fas fa-play-circle"></i>
                                        معاينة الفيديو
                                    </h3>
                                    <p className="text-sm text-white/80 mt-1">
                                        {previewVideo.file_name}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closePreviewModal}
                                    className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>

                        <div className="bg-black">
                            {previewVideo.video_url ? (
                                <video
                                    key={previewVideo.id}
                                    src={previewVideo.video_url}
                                    controls
                                    autoPlay
                                    className="w-full h-[480px] bg-black"
                                >
                                    المستعرض لديك لا يدعم تشغيل الفيديو.
                                </video>
                            ) : (
                                <div className="p-8 text-center text-white">
                                    لا يتوفر رابط تشغيل لهذا الفيديو.
                                </div>
                            )}
                        </div>

                        <div className={`p-6 border-t-2 transition-colors duration-300 ${
                            darkMode
                                ? 'bg-gray-900 border-gray-700'
                                : 'bg-slate-50 border-slate-200'
                        }`}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className={`rounded-lg p-4 border-2 transition-colors duration-300 ${
                                    darkMode
                                        ? 'bg-gray-800 border-gray-700'
                                        : 'bg-white border-slate-200'
                                }`}>
                                    <p className={`text-xs mb-1 transition-colors duration-300 ${
                                        darkMode ? 'text-gray-400' : 'text-slate-500'
                                    }`}>الحجم</p>
                                    <p className={`font-bold transition-colors duration-300 ${
                                        darkMode ? 'text-gray-100' : 'text-slate-900'
                                    }`}>{previewVideo.formatted_size || "غير متوفر"}</p>
                                </div>
                                {previewVideo.formatted_duration && (
                                    <div className={`rounded-lg p-4 border-2 transition-colors duration-300 ${
                                        darkMode
                                            ? 'bg-gray-800 border-gray-700'
                                            : 'bg-white border-slate-200'
                                    }`}>
                                        <p className={`text-xs mb-1 transition-colors duration-300 ${
                                            darkMode ? 'text-gray-400' : 'text-slate-500'
                                        }`}>المدة</p>
                                        <p className={`font-bold transition-colors duration-300 ${
                                            darkMode ? 'text-gray-100' : 'text-slate-900'
                                        }`}>{previewVideo.formatted_duration}</p>
                                    </div>
                                )}
                                <div className={`rounded-lg p-4 border-2 transition-colors duration-300 ${
                                    darkMode
                                        ? 'bg-gray-800 border-gray-700'
                                        : 'bg-white border-slate-200'
                                }`}>
                                    <p className={`text-xs mb-1 transition-colors duration-300 ${
                                        darkMode ? 'text-gray-400' : 'text-slate-500'
                                    }`}>الحالة</p>
                                    <p className={`font-bold ${previewVideo.lesson ? 'text-green-600' : 'text-orange-600'}`}>
                                        {previewVideo.lesson ? 'مرتبط' : 'غير مرتبط'}
                                    </p>
                                </div>
                                {previewVideo.lesson && (
                                    <div className={`rounded-lg p-4 border-2 transition-colors duration-300 ${
                                        darkMode
                                            ? 'bg-gray-800 border-green-700'
                                            : 'bg-white border-green-200'
                                    }`}>
                                        <p className={`text-xs mb-1 transition-colors duration-300 ${
                                            darkMode ? 'text-gray-400' : 'text-slate-500'
                                        }`}>الدرس</p>
                                        <p className="text-green-600 font-bold line-clamp-1">{previewVideo.lesson.name}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {quickViewVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setQuickViewVideo(null)}>
                    <div className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                    }`} onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                                        <i className="fas fa-video text-white text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">عرض سريع</h3>
                                        <p className="text-sm text-white/80">{quickViewVideo.file_name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setQuickViewVideo(null)}
                                    className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all hover:scale-110"
                                >
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {resolveThumbnailUrl(quickViewVideo) && (
                                <div className={`aspect-video rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                                    darkMode ? 'border-gray-700' : 'border-slate-200'
                                }`}>
                                    <img
                                        src={resolveThumbnailUrl(quickViewVideo)}
                                        alt={quickViewVideo.file_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div>
                                <h4 className={`text-sm font-black mb-3 flex items-center gap-2 transition-colors duration-300 ${
                                    darkMode ? 'text-gray-300' : 'text-slate-600'
                                }`}>
                                    <i className="fas fa-info-circle text-indigo-500"></i>
                                    معلومات الملف
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`rounded-lg p-4 border-2 transition-colors duration-300 ${
                                        darkMode
                                            ? 'bg-gray-900 border-gray-700'
                                            : 'bg-slate-50 border-slate-200'
                                    }`}>
                                        <p className={`text-xs mb-1 transition-colors duration-300 ${
                                            darkMode ? 'text-gray-400' : 'text-slate-500'
                                        }`}>الحجم</p>
                                        <p className={`font-bold transition-colors duration-300 ${
                                            darkMode ? 'text-gray-100' : 'text-slate-900'
                                        }`}>{quickViewVideo.formatted_size || "غير متوفر"}</p>
                                    </div>
                                    {quickViewVideo.formatted_duration && (
                                        <div className={`rounded-lg p-4 border-2 transition-colors duration-300 ${
                                            darkMode
                                                ? 'bg-gray-900 border-gray-700'
                                                : 'bg-slate-50 border-slate-200'
                                        }`}>
                                            <p className={`text-xs mb-1 transition-colors duration-300 ${
                                                darkMode ? 'text-gray-400' : 'text-slate-500'
                                            }`}>المدة</p>
                                            <p className={`font-bold transition-colors duration-300 ${
                                                darkMode ? 'text-gray-100' : 'text-slate-900'
                                            }`}>{quickViewVideo.formatted_duration}</p>
                                        </div>
                                    )}
                                    <div className={`rounded-lg p-4 border-2 transition-colors duration-300 ${
                                        darkMode
                                            ? 'bg-gray-900 border-gray-700'
                                            : 'bg-slate-50 border-slate-200'
                                    }`}>
                                        <p className={`text-xs mb-1 transition-colors duration-300 ${
                                            darkMode ? 'text-gray-400' : 'text-slate-500'
                                        }`}>تاريخ الرفع</p>
                                        <p className={`font-bold text-sm transition-colors duration-300 ${
                                            darkMode ? 'text-gray-100' : 'text-slate-900'
                                        }`}>{formatDate(quickViewVideo.created_at)}</p>
                                    </div>
                                    <div className={`rounded-lg p-4 border-2 transition-colors duration-300 ${
                                        quickViewVideo.lesson
                                            ? darkMode
                                                ? 'bg-green-900/30 border-green-700'
                                                : 'bg-green-50 border-green-200'
                                            : darkMode
                                                ? 'bg-orange-900/30 border-orange-700'
                                                : 'bg-orange-50 border-orange-200'
                                    }`}>
                                        <p className={`text-xs mb-1 transition-colors duration-300 ${
                                            darkMode ? 'text-gray-400' : 'text-slate-500'
                                        }`}>الحالة</p>
                                        <p className={`font-bold ${quickViewVideo.lesson ? 'text-green-600' : 'text-orange-600'}`}>
                                            {quickViewVideo.lesson ? 'مرتبط بدرس' : 'غير مرتبط'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {quickViewVideo.lesson && (
                                <div>
                                    <h4 className={`text-sm font-black mb-3 flex items-center gap-2 transition-colors duration-300 ${
                                        darkMode ? 'text-gray-300' : 'text-slate-600'
                                    }`}>
                                        <i className="fas fa-link text-green-500"></i>
                                        معلومات الربط
                                    </h4>
                                    <div className={`border-2 rounded-lg p-4 transition-colors duration-300 ${
                                        darkMode
                                            ? 'bg-green-900/30 border-green-700'
                                            : 'bg-green-50 border-green-200'
                                    }`}>
                                        <p className={`font-bold transition-colors duration-300 ${
                                            darkMode ? 'text-green-300' : 'text-green-700'
                                        }`}>{quickViewVideo.lesson.name}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setQuickViewVideo(null);
                                        openPreviewModal(quickViewVideo);
                                    }}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-play-circle"></i>
                                    <span>تشغيل الفيديو</span>
                                </button>
                                <button
                                    onClick={() => setQuickViewVideo(null)}
                                    className={`px-6 py-3 border-2 rounded-xl font-bold transition-all hover:shadow-md ${
                                        darkMode
                                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                                            : 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                                    }`}
                                >
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
