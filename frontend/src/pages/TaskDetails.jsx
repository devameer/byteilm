import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import taskService from '../services/taskService';

const statusOptions = [
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'in_progress', label: 'قيد التنفيذ' },
    { value: 'completed', label: 'مكتملة' },
    { value: 'cancelled', label: 'ملغاة' },
];

const priorityOptions = [
    { value: 'low', label: 'منخفضة' },
    { value: 'medium', label: 'متوسطة' },
    { value: 'high', label: 'مرتفعة' },
    { value: 'urgent', label: 'عاجلة' },
];

function TaskDetails() {
    const { darkMode } = useTheme();
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadTask();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadTask = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await taskService.getTask(id);
            if (response.success) {
                setTask(response.data);
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
                console.error("Network error loading task details:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (event) => {
        if (!task) {
            return;
        }
        setUpdating(true);
        try {
            await taskService.updateTask(task.id, { status: event.target.value });
            await loadTask();
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر تحديث حالة المهمة');
        } finally {
            setUpdating(false);
        }
    };

    const handlePriorityChange = async (event) => {
        if (!task) {
            return;
        }
        setUpdating(true);
        try {
            await taskService.updateTask(task.id, { priority: event.target.value });
            await loadTask();
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر تحديث أولوية المهمة');
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!task) {
            return;
        }
        const confirmation = window.confirm('سيتم حذف المهمة. هل تريد المتابعة؟');
        if (!confirmation) {
            return;
        }
        try {
            await taskService.deleteTask(task.id);
            navigate('/tasks');
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر حذف المهمة');
        }
    };

    const handleComplete = async () => {
        if (!task || task.status === 'completed') {
            return;
        }
        setUpdating(true);
        try {
            await taskService.completeTask(task.id);
            await loadTask();
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر إكمال المهمة');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className={`rounded-lg shadow p-12 text-center transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'
        }`}>جاري تحميل بيانات المهمة...</div>;
    }

    if (!task) {
        return (
            <div className={`rounded-lg shadow p-12 text-center transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'
            }`}>
                {error || 'لم يتم العثور على المهمة المطلوبة'}
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className={`flex items-center gap-3 text-sm ${
                        darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                        <Link to="/tasks" className="hover:underline">
                            المهام
                        </Link>
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>/</span>
                        <span>{task.title}</span>
                    </div>
                    <h1 className={`mt-2 text-3xl font-bold ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>{task.title}</h1>
                </div>
                <div className="flex flex-wrap gap-3">
                    {task.status !== 'completed' && (
                        <button
                            onClick={handleComplete}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            disabled={updating}
                        >
                            إكمال المهمة
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        حذف المهمة
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

            <div className={`rounded-xl shadow-md p-6 space-y-4 transition-colors duration-300 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
                {task.description && <p className={`text-sm ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>{task.description}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                    {task.scheduled_date && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500">تاريخ التنفيذ</p>
                            <p className="text-lg font-semibold text-gray-900">{task.scheduled_date}</p>
                        </div>
                    )}
                    {task.due_date && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500">تاريخ الاستحقاق</p>
                            <p className="text-lg font-semibold text-gray-900">{task.due_date}</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                            حالة المهمة
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={task.status}
                            onChange={handleStatusChange}
                            disabled={updating}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                            أولوية المهمة
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={task.priority ?? 'medium'}
                            onChange={handlePriorityChange}
                            disabled={updating}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {priorityOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                    {task.project && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500">المشروع المرتبط</p>
                            <p className="text-lg font-semibold text-gray-900">
                                <Link to={`/projects/${task.project.id}`} className="text-blue-600 hover:underline">
                                    {task.project.name}
                                </Link>
                            </p>
                        </div>
                    )}
                    {task.course && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500">الدورة المرتبطة</p>
                            <p className="text-lg font-semibold text-gray-900">
                                <Link to={`/courses/${task.course.id}`} className="text-blue-600 hover:underline">
                                    {task.course.name}
                                </Link>
                            </p>
                        </div>
                    )}
                    {task.lesson && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500">الدرس المرتبط</p>
                            <p className="text-lg font-semibold text-gray-900">{task.lesson.name}</p>
                        </div>
                    )}
                    {task.link && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500">رابط خارجي</p>
                            <a
                                href={task.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                فتح الرابط
                            </a>
                        </div>
                    )}
                    {task.estimated_duration && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500">المدة المتوقعة</p>
                            <p className="text-lg font-semibold text-gray-900">{task.estimated_duration} دقيقة</p>
                        </div>
                    )}
                </div>

                {task.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        {task.tags.map((tag) => (
                            <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="text-sm text-gray-500">
                    <p>تم إنشاء المهمة في: {new Date(task.created_at).toLocaleString('ar-EG')}</p>
                    <p>آخر تحديث: {new Date(task.updated_at).toLocaleString('ar-EG')}</p>
                </div>
            </div>
        </div>
        </div>
    );
}

export default TaskDetails;
