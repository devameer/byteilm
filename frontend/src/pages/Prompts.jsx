import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import promptService from '../services/promptService';
import Modal from '../components/Modal';
import PromptsPageSkeleton from '../components/skeletons/PromptsPageSkeleton';

function Prompts() {
    const { darkMode } = useTheme();
    const [prompts, setPrompts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [formState, setFormState] = useState({ title: '', content: '' });
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await promptService.getPrompts();
            if (response.success) {
                setPrompts(response.data);
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
                console.error("Network error loading prompts:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setFormMode('create');
        setEditingId(null);
        setFormState({ title: '', content: '' });
        setModalOpen(true);
    };

    const handleOpenEdit = (prompt) => {
        setFormMode('edit');
        setEditingId(prompt.id);
        setFormState({ title: prompt.title, content: prompt.content });
        setModalOpen(true);
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (formMode === 'create') {
                await promptService.createPrompt(formState);
            } else if (editingId) {
                await promptService.updatePrompt(editingId, formState);
            }

            setModalOpen(false);
            await loadPrompts();
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر حفظ القالب');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmation = window.confirm('سيتم حذف القالب. هل تريد المتابعة؟');
        if (!confirmation) {
            return;
        }
        try {
            await promptService.deletePrompt(id);
            await loadPrompts();
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر حذف القالب');
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>قوالب الذكاء الاصطناعي</h1>
                    <p className={`mt-1 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>احفظ القوالب الجاهزة لاستخدامها مع أدوات الذكاء الاصطناعي</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    + قالب جديد
                </button>
            </div>

            {error && (
                <div className={`p-4 border rounded-lg ${
                    darkMode
                        ? 'bg-red-900/30 border-red-800 text-red-300'
                        : 'bg-red-100 border-red-200 text-red-700'
                }`}>{error}</div>
            )}

            {loading ? (
                <PromptsPageSkeleton />
            ) : prompts.length === 0 ? (
                <div className={`rounded-lg shadow p-12 text-center transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800 text-gray-500' : 'bg-white text-gray-500'
                }`}>
                    لا توجد قوالب حتى الآن.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prompts.map((prompt) => (
                        <div key={prompt.id} className={`rounded-xl shadow-md p-6 space-y-4 border transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                            <div className="flex items-start justify-between gap-3">
                                <h2 className={`text-xl font-semibold transition-colors duration-300 ${
                                    darkMode ? 'text-gray-100' : 'text-gray-900'
                                }`}>{prompt.title}</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenEdit(prompt)}
                                        className={`text-sm hover:underline transition-colors duration-300 ${
                                            darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                        }`}
                                    >
                                        تعديل
                                    </button>
                                    <button
                                        onClick={() => handleDelete(prompt.id)}
                                        className={`text-sm hover:underline transition-colors duration-300 ${
                                            darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'
                                        }`}
                                    >
                                        حذف
                                    </button>
                                </div>
                            </div>
                            <pre className={`text-sm whitespace-pre-wrap leading-relaxed transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{prompt.content}</pre>
                            <div className={`text-xs transition-colors duration-300 ${
                                darkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                                آخر تحديث: {new Date(prompt.updated_at).toLocaleString('ar-EG')}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                title={formMode === 'create' ? 'إضافة قالب جديد' : 'تعديل القالب'}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            عنوان القالب
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={formState.title}
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
                        <label htmlFor="content" className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            نص القالب
                        </label>
                        <textarea
                            id="content"
                            name="content"
                            rows="8"
                            value={formState.content}
                            onChange={handleFormChange}
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-700 text-gray-200'
                                    : 'border-gray-300'
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
                            {saving ? 'جاري الحفظ...' : formMode === 'create' ? 'حفظ القالب' : 'تحديث القالب'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
        </div>
    );
}

export default Prompts;
