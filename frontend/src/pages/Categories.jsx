import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import categoryService from '../services/categoryService';
import Modal from '../components/Modal';
import CategoriesPageSkeleton from '../components/categories/CategoriesPageSkeleton';

function Categories() {
    const { darkMode } = useTheme();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [formState, setFormState] = useState({ name: '', image: null });
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await categoryService.getCategories();
            if (response.success) {
                setCategories(response.data);
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
                console.error("Network error loading categories:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setFormMode('create');
        setFormState({ name: '', image: null });
        setEditingId(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (category) => {
        setFormMode('edit');
        setFormState({ name: category.name, image: null });
        setEditingId(category.id);
        setModalOpen(true);
    };

    const handleFormChange = (event) => {
        const { name, value, files } = event.target;
        if (name === 'image') {
            setFormState((prev) => ({ ...prev, image: files?.[0] ?? null }));
            return;
        }
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('name', formState.name);
            if (formState.image) {
                payload.append('image', formState.image);
            }

            if (formMode === 'create') {
                await categoryService.createCategory(payload);
            } else if (editingId) {
                await categoryService.updateCategory(editingId, payload);
            }

            setModalOpen(false);
            setFormState({ name: '', image: null });
            await loadCategories();
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر حفظ التصنيف');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmation = window.confirm('هل أنت متأكد من حذف هذا التصنيف؟');
        if (!confirmation) {
            return;
        }

        try {
            await categoryService.deleteCategory(id);
            await loadCategories();
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر حذف التصنيف');
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
                : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
        }`}>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>التصنيفات</h1>
                    <p className={`mt-1 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>إدارة التصنيفات ومتابعة التقدم في الدورات المرتبطة بها</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    + تصنيف جديد
                </button>
            </div>

            {error && (
                <div className={`p-4 border rounded-lg ${
                    darkMode
                        ? 'bg-red-900/30 border-red-800 text-red-300'
                        : 'bg-red-100 border-red-200 text-red-700'
                }`}>
                    {error}
                </div>
            )}

            {loading ? (
                <CategoriesPageSkeleton />
            ) : categories.length === 0 ? (
                <div className={`rounded-lg shadow p-12 text-center space-y-3 transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'
                }`}>
                    <p>لا توجد تصنيفات حتى الآن.</p>
                    <button
                        onClick={handleOpenCreate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        إنشاء أول تصنيف
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                        <div key={category.id} className={`rounded-xl shadow-md p-6 flex flex-col space-y-4 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div className="flex items-center justify-between">
                                <h2 className={`text-xl font-semibold ${
                                    darkMode ? 'text-gray-100' : 'text-gray-900'
                                }`}>{category.name}</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenEdit(category)}
                                        className="text-blue-600 hover:text-blue-800 transition text-sm"
                                    >
                                        تعديل
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className="text-red-600 hover:text-red-800 transition text-sm"
                                    >
                                        حذف
                                    </button>
                                </div>
                            </div>

                            {category.image_url && (
                                <img
                                    src={category.image_url}
                                    alt={category.name}
                                    className="w-full h-40 object-cover rounded-lg"
                                />
                            )}

                            <div className={`space-y-2 text-sm ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                <div>الدورات المرتبطة: {category.courses_count ?? 0}</div>
                                <div className="space-y-1">
                                    <div className={`flex justify-between text-xs ${
                                        darkMode ? 'text-gray-500' : 'text-gray-500'
                                    }`}>
                                        <span>نسبة الإنجاز</span>
                                        <span>{category.progress?.toFixed ? category.progress.toFixed(1) : category.progress}%</span>
                                    </div>
                                    <div className={`h-2 rounded-full overflow-hidden ${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}>
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all"
                                            style={{ width: `${category.progress || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1" />

                            <Link
                                to={`/categories/${category.id}`}
                                className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                            >
                                عرض التفاصيل
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                title={formMode === 'create' ? 'إضافة تصنيف جديد' : 'تعديل التصنيف'}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            اسم التصنيف
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formState.name}
                            onChange={handleFormChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="أدخل اسم التصنيف"
                        />
                    </div>

                    <div>
                        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                            صورة التصنيف (اختياري)
                        </label>
                        <input
                            id="image"
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={handleFormChange}
                            className="w-full text-sm text-gray-600"
                        />
                        <p className="text-xs text-gray-500 mt-1">يمكن رفع صورة بصيغة JPG أو PNG بحجم أقصى 2MB</p>
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
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {submitting ? 'جاري الحفظ...' : formMode === 'create' ? 'حفظ التصنيف' : 'تحديث التصنيف'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
        </div>
    );
}

export default Categories;
