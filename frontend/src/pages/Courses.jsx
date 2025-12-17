import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse, useToggleCourseActive } from "../hooks/api";
import categoryService from "../services/categoryService";
import Modal from "../components/Modal";
import CoursesPageSkeleton from "../components/skeletons/CoursesPageSkeleton";

const PLACEHOLDER_IMAGE =
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80";

const FILTERS = [
    { value: "all", label: "كل الدورات" },
    { value: "active", label: "الدورات النشطة" },
    { value: "inactive", label: "الدورات غير النشطة" },
];

function Courses() {
    const { darkMode } = useTheme();
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [formMode, setFormMode] = useState("create");
    const [formState, setFormState] = useState({
        name: "",
        category_id: "",
        link: "",
        active: true,
        image: null,
    });
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    const resolveFilter = useCallback((value) => {
        if (!value) {
            return "all";
        }
        return FILTERS.some((item) => item.value === value) ? value : "all";
    }, []);

    const [filter, setFilter] = useState(() =>
        resolveFilter(searchParams.get("filter"))
    );

    // Build query params based on filter
    const queryParams = filter === "active" ? { active: true } : filter === "inactive" ? { active: false } : {};
    
    // React Query hooks
    const { data: coursesResponse, isLoading: loading, refetch: refetchCourses } = useCourses(queryParams);
    const createCourseMutation = useCreateCourse();
    const updateCourseMutation = useUpdateCourse();
    const deleteCourseMutation = useDeleteCourse();
    const toggleActiveMutation = useToggleCourseActive();

    const courses = coursesResponse?.data || [];

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await categoryService.getCategories();
            if (response.success) {
                setCategories(response.data);
            }
        } catch (err) {
            // ignore category errors in the list view
        }
    };

    useEffect(() => {
        const urlFilter = resolveFilter(searchParams.get("filter"));
        setFilter((current) => (current === urlFilter ? current : urlFilter));
    }, [searchParams, resolveFilter]);

    const handleToggleActive = async (id) => {
        try {
            await toggleActiveMutation.mutateAsync(id);
        } catch (err) {
            if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
                return;
            }
            setError(err.response?.data?.message || "تعذر تحديث حالة الدورة");
        }
    };

    const handleDelete = async (id) => {
        const confirmation = window.confirm(
            "سيتم حذف الدورة وجميع بياناتها المرتبطة. هل تريد المتابعة؟"
        );
        if (!confirmation) {
            return;
        }
        try {
            await deleteCourseMutation.mutateAsync(id);
        } catch (err) {
            if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
                return;
            }
            setError(err.response?.data?.message || "تعذر حذف الدورة");
        }
    };

    const handleFilterChange = (value) => {
        const nextFilter = resolveFilter(value);
        setFilter(nextFilter);

        const params = new URLSearchParams(searchParams.toString());
        if (nextFilter === "all") {
            params.delete("filter");
        } else {
            params.set("filter", nextFilter);
        }
        setSearchParams(params);
    };

    const handleOpenCreate = () => {
        setFormMode("create");
        setEditingId(null);
        setFormState({
            name: "",
            category_id: categories[0]?.id ?? "",
            link: "",
            active: true,
            image: null,
        });
        setModalOpen(true);
    };

    const handleOpenEdit = (course) => {
        setFormMode("edit");
        setEditingId(course.id);
        setFormState({
            name: course.name,
            category_id: course.category?.id ?? "",
            link: course.link ?? "",
            active: Boolean(course.active),
            image: null,
        });
        setModalOpen(true);
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

    const handleSubmit = async (event) => {
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

            if (formMode === "create") {
                await createCourseMutation.mutateAsync(payload);
            } else if (editingId) {
                await updateCourseMutation.mutateAsync({ id: editingId, data: payload });
            }

            setModalOpen(false);
        } catch (err) {
            // Ignore canceled errors
            if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
                setSaving(false);
                return;
            }
            setError(err.response?.data?.message || "تعذر حفظ بيانات الدورة");
        } finally {
            setSaving(false);
        }
    };

    const handleImageError = (event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = PLACEHOLDER_IMAGE;
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
                : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
        }`}>
            <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                        الدورات التعليمية
                    </h1>
                    <p className={`mt-1 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        إدارة الدورات ومتابعة تقدم الدروس المرتبطة
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    + دورة جديدة
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {FILTERS.map((item) => (
                    <button
                        key={item.value}
                        onClick={() => handleFilterChange(item.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                            filter === item.value
                                ? "bg-blue-600 text-white shadow-md"
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
                <div className={`p-4 border rounded-xl ${
                    darkMode
                        ? 'bg-red-900/30 border-red-800 text-red-300'
                        : 'bg-red-100 border-red-200 text-red-700'
                }`}>
                    {error}
                </div>
            )}

            {loading ? (
                <CoursesPageSkeleton />
            ) : courses.length === 0 ? (
                <div className={`rounded-xl shadow p-12 text-center transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800 text-gray-500' : 'bg-white text-gray-500'
                }`}>
                    لا توجد دورات في هذا القسم.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => {
                        const progress = Number(course.progress ?? 0);
                        const imageUrl = course.image_url || PLACEHOLDER_IMAGE;
                        const lessonCount = course.lessons_count ?? 0;
                        const completedLessons =
                            course.completed_lessons_count ?? 0;
                        return (
                            <div
                                key={course.id}
                                className={`group relative overflow-hidden rounded-2xl ring-1 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                                    darkMode ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-100'
                                }`}
                            >
                                <div className="relative aspect-[16/9] overflow-hidden">
                                    <img
                                        src={imageUrl}
                                        alt={course.name}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        onError={handleImageError}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                                    <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
                                        <div className="flex items-start justify-between gap-2">
                                            <span
                                                className={`rounded-full px-3 py-1 text-[11px] font-medium tracking-wide ${
                                                    course.active
                                                        ? "bg-emerald-500 text-white shadow-sm"
                                                        : "bg-white/20 text-white backdrop-blur"
                                                }`}
                                            >
                                                {course.active
                                                    ? "نشطة"
                                                    : "غير نشطة"}
                                            </span>
                                            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur">
                                                {lessonCount} درس
                                            </span>
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold leading-tight">
                                                {course.name}
                                            </h2>
                                            {course.category && (
                                                <p className="mt-1 text-sm text-gray-200">
                                                    {course.category.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5 p-6">
                                    <div className={`grid grid-cols-2 gap-3 text-sm ${
                                        darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        <div className={`rounded-xl px-4 py-3 ${
                                            darkMode ? 'bg-gray-900/50' : 'bg-slate-50/80'
                                        }`}>
                                            <div className={`flex items-center gap-2 ${
                                                darkMode ? 'text-gray-500' : 'text-gray-500'
                                            }`}>
                                                <i className="fas fa-check-circle text-emerald-500" />
                                                <span>الدروس المكتملة</span>
                                            </div>
                                            <div className={`mt-1 text-base font-semibold ${
                                                darkMode ? 'text-gray-200' : 'text-gray-900'
                                            }`}>
                                                {completedLessons} /{" "}
                                                {lessonCount}
                                            </div>
                                        </div>
                                        <div className={`rounded-xl px-4 py-3 ${
                                            darkMode ? 'bg-gray-900/50' : 'bg-slate-50/80'
                                        }`}>
                                            <div className={`flex items-center gap-2 ${
                                                darkMode ? 'text-gray-500' : 'text-gray-500'
                                            }`}>
                                                <i className="fas fa-bolt text-amber-500" />
                                                <span>معدل التقدم</span>
                                            </div>
                                            <div className={`mt-1 text-base font-semibold ${
                                                darkMode ? 'text-gray-200' : 'text-gray-900'
                                            }`}>
                                                {progress.toFixed(0)}%
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className={`flex items-center justify-between text-xs ${
                                            darkMode ? 'text-gray-500' : 'text-gray-500'
                                        }`}>
                                            <span>مسار الإنجاز</span>
                                            <span>{progress.toFixed(1)}%</span>
                                        </div>
                                        <div className={`h-2 overflow-hidden rounded-full ${
                                            darkMode ? 'bg-gray-700' : 'bg-slate-200'
                                        }`}>
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(
                                                        progress,
                                                        100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <Link
                                            to={`/courses/${course.id}`}
                                            className={`flex-1 min-w-[120px] rounded-lg border px-4 py-2.5 text-center text-sm font-medium transition ${
                                                darkMode
                                                    ? 'border-indigo-700 bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50'
                                                    : 'border-transparent bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                            }`}
                                        >
                                            استعراض
                                        </Link>
                                        <button
                                            onClick={() =>
                                                handleOpenEdit(course)
                                            }
                                            className={`flex-1 min-w-[110px] rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                                                darkMode
                                                    ? 'border-gray-700 text-gray-300 hover:bg-gray-700'
                                                    : 'border-slate-200 text-gray-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            تعديل
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleToggleActive(course.id)
                                            }
                                            className={`flex-1 min-w-[110px] rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                                                course.active
                                                    ? "bg-slate-900 text-white hover:bg-slate-700"
                                                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                                            }`}
                                        >
                                            {course.active ? "إيقاف" : "تفعيل"}
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(course.id)
                                            }
                                            className={`flex-1 min-w-[110px] rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                                                darkMode
                                                    ? 'border-red-800 text-red-400 hover:bg-red-900/30'
                                                    : 'border-red-200 text-red-600 hover:bg-red-50'
                                            }`}
                                        >
                                            حذف
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal
                title={
                    formMode === "create"
                        ? "إضافة دورة جديدة"
                        : "تعديل بيانات الدورة"
                }
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="name"
                            className={`block text-sm font-bold mb-2 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
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
                            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                    : 'border-gray-300 focus:border-transparent'
                            }`}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="category_id"
                            className={`block text-sm font-bold mb-2 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                        >
                            التصنيف
                        </label>
                        <select
                            id="category_id"
                            name="category_id"
                            value={formState.category_id}
                            onChange={handleFormChange}
                            required
                            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium transition-all ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                    : 'border-gray-300 focus:border-transparent'
                            }`}
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
                            className={`block text-sm font-bold mb-2 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                        >
                            رابط الدورة (اختياري)
                        </label>
                        <input
                            id="link"
                            name="link"
                            type="url"
                            value={formState.link}
                            onChange={handleFormChange}
                            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                    : 'border-gray-300 focus:border-transparent'
                            }`}
                            placeholder="https://"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="image"
                            className={`block text-sm font-bold mb-2 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                        >
                            صورة الدورة (اختياري)
                        </label>
                        <input
                            id="image"
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={handleFormChange}
                            className={`w-full text-sm ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
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
                            className={`text-sm ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                        >
                            تفعيل الدورة فوراً
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            className={`px-5 py-2.5 rounded-lg border-2 font-bold transition-all ${
                                darkMode
                                    ? 'border-gray-700 text-gray-300 hover:bg-gray-700'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving
                                ? "جاري الحفظ..."
                                : formMode === "create"
                                ? "حفظ الدورة"
                                : "تحديث الدورة"}
                        </button>
                    </div>
                </form>
            </Modal>
            </div>
        </div>
    );
}

export default Courses;
