import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import projectService from '../services/projectService';
import taskService from '../services/taskService';

const statusLabels = {
    active: 'نشط',
    completed: 'مكتمل',
    on_hold: 'معلق',
    cancelled: 'ملغى',
};

const statusColors = {
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
};

function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingProgress, setUpdatingProgress] = useState(false);

    useEffect(() => {
        loadProject();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadProject = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await projectService.getProject(id);
            if (response.success) {
                setProject(response.data);
            }

            const statsResponse = await projectService.getStatistics(id);
            if (statsResponse.success) {
                setStatistics(statsResponse.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر تحميل بيانات المشروع');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        try {
            await projectService.toggleStatus(id);
            await loadProject();
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر تغيير حالة المشروع');
        }
    };

    const handleDelete = async () => {
        const confirmation = window.confirm('سيتم حذف المشروع وجميع المهام المرتبطة به. هل تريد المتابعة؟');
        if (!confirmation) {
            return;
        }
        try {
            await projectService.deleteProject(id);
            navigate('/projects');
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر حذف المشروع');
        }
    };

    const handleCompleteTask = async (taskId) => {
        try {
            await taskService.completeTask(taskId);
            await loadProject();
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر تحديث حالة المهمة');
        }
    };

    const handleUpdateProgress = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const progress = Number(formData.get('progress'));
        if (Number.isNaN(progress)) {
            return;
        }

        setUpdatingProgress(true);
        try {
            await projectService.updateProgress(id, progress);
            await loadProject();
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر تحديث تقدم المشروع');
        } finally {
            setUpdatingProgress(false);
        }
    };

    if (loading) {
        return <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">جاري تحميل بيانات المشروع...</div>;
    }

    if (!project) {
        return (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
                {error || 'لم يتم العثور على المشروع المطلوب'}
            </div>
        );
    }

    const statusLabel = statusLabels[project.status] ?? project.status;
    const statusClass = statusColors[project.status] ?? 'bg-gray-100 text-gray-700';

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 text-blue-600 text-sm">
                        <Link to="/projects" className="hover:underline">
                            المشاريع
                        </Link>
                        <span className="text-gray-400">/</span>
                        <span>{project.name}</span>
                    </div>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">{project.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-3 py-1 rounded-full text-xs ${statusClass}`}>{statusLabel}</span>
                        <span className="text-sm text-gray-500">الأولوية: {project.priority ?? 'غير محدد'}</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleToggleStatus}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        تبديل الحالة
                    </button>
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        حذف المشروع
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">{error}</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 space-y-4">
                    {project.description && <p className="text-gray-700 text-sm">{project.description}</p>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                        {project.start_date && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500">بداية المشروع</p>
                                <p className="text-lg font-semibold text-gray-900">{project.start_date}</p>
                            </div>
                        )}
                        {project.due_date && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500">الموعد النهائي</p>
                                <p className="text-lg font-semibold text-gray-900">{project.due_date}</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>نسبة الإنجاز</span>
                            <span className="font-semibold text-blue-600">{project.progress}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${Math.min(project.progress ?? 0, 100)}%` }}
                            />
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProgress} className="flex items-center gap-3 pt-3">
                        <input
                            type="number"
                            name="progress"
                            min={0}
                            max={100}
                            defaultValue={project.progress ?? 0}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <button
                            type="submit"
                            disabled={updatingProgress}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {updatingProgress ? 'جاري التحديث...' : 'تحديث النسبة'}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">إحصائيات سريعة</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-gray-500">عدد المهام</p>
                            <p className="text-xl font-semibold text-gray-900">{statistics?.total_tasks ?? 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-gray-500">مكتمل</p>
                            <p className="text-xl font-semibold text-green-600">{statistics?.completed_tasks ?? 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-gray-500">قيد التنفيذ</p>
                            <p className="text-xl font-semibold text-blue-600">{statistics?.in_progress_tasks ?? 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-gray-500">قيد الانتظار</p>
                            <p className="text-xl font-semibold text-yellow-600">{statistics?.pending_tasks ?? 0}</p>
                        </div>
                    </div>
                    <Link
                        to="/tasks"
                        className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        إدارة كل المهام
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">المهام المرتبطة</h2>
                    <Link
                        to={`/tasks?project_id=${project.id}`}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        تصفية المهام لهذا المشروع
                    </Link>
                </div>

                {project.tasks?.length ? (
                    <div className="space-y-3">
                        {project.tasks.map((task) => (
                            <div key={task.id} className="border border-gray-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                        <span>الحالة: {task.status_text ?? task.status}</span>
                                        <span>الأولوية: {task.priority_text ?? task.priority}</span>
                                        {task.scheduled_date && <span>تاريخ: {task.scheduled_date}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        to={`/tasks/${task.id}`}
                                        className="px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                                    >
                                        التفاصيل
                                    </Link>
                                    {task.status !== 'completed' && (
                                        <button
                                            onClick={() => handleCompleteTask(task.id)}
                                            className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                        >
                                            إنهاء المهمة
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-12">لا توجد مهام مرتبطة بهذا المشروع.</div>
                )}
            </div>
        </div>
    );
}

export default ProjectDetails;
