import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import categoryService from '../services/categoryService';
import Modal from '../components/Modal';

function CategoryDetails() {
    const { darkMode } = useTheme();
    const { id } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [formState, setFormState] = useState({ name: '', image: null });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCategory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadCategory = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await categoryService.getCategory(id);
            if (response.success) {
                setCategory(response.data);
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
                console.error("Network error loading category details:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = () => {
        if (!category) {
            return;
        }
        setFormState({ name: category.name, image: null });
        setModalOpen(true);
    };

    const handleFormChange = (event) => {
        const { name, value, files } = event.target;
        if (name === 'image') {
            setFormState((prev) => ({ ...prev, image: files?.[0] ?? null }));
        } else {
            setFormState((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleUpdate = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            const payload = new FormData();
            payload.append('name', formState.name);
            if (formState.image) {
                payload.append('image', formState.image);
            }

            await categoryService.updateCategory(category.id, payload);
            setModalOpen(false);
            await loadCategory();
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر تحديث التصنيف');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!category) {
            return;
        }

        const confirmDelete = window.confirm('سيتم حذف التصنيف. هل تريد المتابعة؟');
        if (!confirmDelete) {
            return;
        }

        try {
            await categoryService.deleteCategory(category.id);
            navigate('/categories');
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر حذف التصنيف');
        }
    };

    if (loading) {
        return <div className={`rounded-lg shadow p-12 text-center transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'
        }`}>جاري تحميل البيانات...</div>;
    }

    if (!category) {
        return (
            <div className={`rounded-lg shadow p-12 text-center transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'
            }`}>
                {error || 'لم يتم العثور على التصنيف المطلوب'}
            </div>
        );
    }

    const progressValue = Number(category.progress ?? 0);

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
                : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
        }`}>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className={`flex items-center gap-3 text-sm ${
                        darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                        <Link to="/categories" className="hover:underline">
                            التصنيفات
                        </Link>
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>/</span>
                        <span>{category.name}</span>
                    </div>
                    <h1 className={`mt-2 text-3xl font-bold ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>{category.name}</h1>
                    <p className={`mt-1 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>نظرة تفصيلية على الدورات المرتبطة والتقدم المحقق</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenEdit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        تعديل التصنيف
                    </button>
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        حذف التصنيف
                    </button>
                </div>
            </div>

            {error && (
                <div className={`p-4 border rounded-lg ${
                    darkMode
                        ? 'bg-red-900/30 border-red-800 text-red-300'
                        : 'bg-red-100 border-red-200 text-red-700'
                }`}>{error}</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 rounded-xl shadow-md p-6 space-y-6 transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                    {category.image_url && (
                        <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-full h-52 object-cover rounded-lg"
                        />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className={`rounded-lg p-4 ${
                            darkMode ? 'bg-gray-900/50' : 'bg-gray-50'
                        }`}>
                            <p className={`text-xs ${
                                darkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>عدد الدورات</p>
                            <p className={`text-xl font-semibold ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>{category.courses_count ?? 0}</p>
                        </div>
                        <div className={`rounded-lg p-4 ${
                            darkMode ? 'bg-gray-900/50' : 'bg-gray-50'
                        }`}>
                            <p className={`text-xs ${
                                darkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>تاريخ الإنشاء</p>
                            <p className={`text-xl font-semibold ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                                {new Date(category.created_at).toLocaleDateString('ar-EG')}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className={`flex items-center justify-between text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            <span>نسبة الإنجاز الإجمالية</span>
                            <span className={`font-semibold ${
                                darkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>{progressValue.toFixed(1)}%</span>
                        </div>
                        <div className={`h-3 rounded-full overflow-hidden ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                            <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${Math.min(progressValue, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className={`rounded-xl shadow-md p-6 space-y-4 transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                    <h2 className={`text-lg font-semibold ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>إدارة التصنيف</h2>
                    <p className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        يمكنك إضافة دورة جديدة وربطها بهذا التصنيف أو تحديث معلومات التصنيف الحالية.
                    </p>
                    <Link
                        to={`/courses?category_id=${category.id}`}
                        className="block text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                        دورة جديدة لهذا التصنيف
                    </Link>
                </div>
            </div>

            <div className={`rounded-xl shadow-md p-6 space-y-4 transition-colors duration-300 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
                <div className="flex items-center justify-between">
                    <h2 className={`text-xl font-semibold ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>الدورات المرتبطة</h2>
                    <span className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>{category.courses?.length ?? 0} دورة</span>
                </div>

                {category.courses?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {category.courses.map((course) => {
                            const courseProgress = Number(course.progress ?? 0);
                            return (
                                <div key={course.id} className={`border rounded-lg p-5 space-y-4 transition-colors duration-300 ${
                                    darkMode ? 'border-gray-700' : 'border-gray-200'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                                            darkMode ? 'text-gray-100' : 'text-gray-900'
                                        }`}>{course.name}</h3>
                                        <span
                                            className={`px-3 py-1 text-xs rounded-full transition-colors duration-300 ${
                                                course.active 
                                                    ? darkMode 
                                                        ? 'bg-green-900/30 text-green-300' 
                                                        : 'bg-green-100 text-green-700' 
                                                    : darkMode 
                                                        ? 'bg-gray-700 text-gray-400' 
                                                        : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {course.active ? 'نشطة' : 'غير نشطة'}
                                        </span>
                                    </div>

                                    <div className={`text-sm space-y-1 transition-colors duration-300 ${
                                        darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        <div>عدد الدروس: {course.lessons_count ?? 0}</div>
                                        <div>
                                            مكتملة: {course.completed_lessons_count ?? 0} / {course.lessons_count ?? 0}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className={`flex justify-between text-xs transition-colors duration-300 ${
                                            darkMode ? 'text-gray-500' : 'text-gray-500'
                                        }`}>
                                            <span>التقدم</span>
                                            <span>{courseProgress.toFixed(1)}%</span>
                                        </div>
                                        <div className={`h-2 rounded-full overflow-hidden transition-colors duration-300 ${
                                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                        }`}>
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${Math.min(courseProgress, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <Link
                                        to={`/courses/${course.id}`}
                                        className={`inline-flex justify-center items-center px-3 py-2 text-sm font-medium border rounded-lg transition-colors duration-300 ${
                                            darkMode
                                                ? 'text-blue-400 border-blue-700 hover:bg-blue-900/30'
                                                : 'text-blue-600 border-blue-200 hover:bg-blue-50'
                                        }`}
                                    >
                                        عرض الدورة
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={`text-center py-12 transition-colors duration-300 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>لا توجد دورات مرتبطة بهذا التصنيف حالياً.</div>
                )}
            </div>

            <Modal title="تعديل التصنيف" isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label htmlFor="name" className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            اسم التصنيف
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formState.name}
                            onChange={handleFormChange}
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-700 text-gray-200'
                                    : 'border-gray-300'
                            }`}
                        />
                    </div>

                    <div>
                        <label htmlFor="image" className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            صورة جديدة (اختياري)
                        </label>
                        <input
                            id="image"
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={handleFormChange}
                            className={`w-full text-sm transition-colors duration-300 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
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
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {saving ? 'جاري التحديث...' : 'حفظ التغييرات'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
        </div>
    );
}

export default CategoryDetails;
