import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import projectService from '../services/projectService';
import taskService from '../services/taskService';

const statusLabels = {
    active: 'نشط',
    completed: 'مكتمل',
    on_hold: 'معلق',
    cancelled: 'ملغى',
};

const getStatusColors = (darkMode) => ({
    active: darkMode 
        ? 'bg-blue-900/30 text-blue-300 border-blue-700' 
        : 'bg-blue-100 text-blue-700 border-blue-200',
    completed: darkMode 
        ? 'bg-green-900/30 text-green-300 border-green-700' 
        : 'bg-green-100 text-green-700 border-green-200',
    on_hold: darkMode 
        ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700' 
        : 'bg-yellow-100 text-yellow-700 border-yellow-200',
    cancelled: darkMode 
        ? 'bg-red-900/30 text-red-300 border-red-700' 
        : 'bg-red-100 text-red-700 border-red-200',
});

const priorityLabels = {
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    urgent: 'عاجلة',
};

const taskStatusLabels = {
    pending: 'قيد الانتظار',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتملة',
};

function ProjectDetails() {
    const { darkMode } = useTheme();
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingProgress, setUpdatingProgress] = useState(false);
    const [taskFilter, setTaskFilter] = useState('all');
    const [taskSearch, setTaskSearch] = useState('');
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddForm, setQuickAddForm] = useState({
        title: '',
        priority: 'medium',
        scheduled_date: '',
    });
    const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
    const [showTimeline, setShowTimeline] = useState(false);

    useEffect(() => {
        loadProject();
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
                console.error("Network error loading project details:", err);
            }
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

    const handleQuickAddSubmit = async (e) => {
        e.preventDefault();
        setQuickAddSubmitting(true);
        try {
            const payload = {
                ...quickAddForm,
                project_id: id,
                is_lesson: 0,
            };
            await taskService.createTask(payload);
            setIsQuickAddOpen(false);
            setQuickAddForm({ title: '', priority: 'medium', scheduled_date: '' });
            await loadProject();
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر إضافة المهمة');
        } finally {
            setQuickAddSubmitting(false);
        }
    };

    const filteredTasks = useMemo(() => {
        if (!project?.tasks) return [];
        
        return project.tasks.filter((task) => {
            const matchesFilter = taskFilter === 'all' || task.status === taskFilter;
            const matchesSearch = task.title.toLowerCase().includes(taskSearch.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [project?.tasks, taskFilter, taskSearch]);

    const timelineEvents = useMemo(() => {
        if (!project) return [];
        
        const events = [];
        
        if (project.created_at) {
            events.push({
                date: project.created_at,
                title: 'تم إنشاء المشروع',
                type: 'created',
                icon: 'fa-plus-circle',
            });
        }
        
        if (project.start_date) {
            events.push({
                date: project.start_date,
                title: 'بداية المشروع',
                type: 'start',
                icon: 'fa-play-circle',
            });
        }
        
        if (project.tasks) {
            project.tasks.forEach((task) => {
                if (task.completed_at) {
                    events.push({
                        date: task.completed_at,
                        title: `تم إكمال: ${task.title}`,
                        type: 'task_completed',
                        icon: 'fa-check-circle',
                    });
                }
            });
        }
        
        if (project.completed_at) {
            events.push({
                date: project.completed_at,
                title: 'تم إكمال المشروع',
                type: 'completed',
                icon: 'fa-flag-checkered',
            });
        }
        
        if (project.due_date) {
            events.push({
                date: project.due_date,
                title: 'الموعد النهائي',
                type: 'deadline',
                icon: 'fa-calendar-check',
            });
        }
        
        return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [project]);

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
                darkMode
                    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
                    : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
            }`}>
                <div className={`rounded-2xl shadow-xl p-12 text-center transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
                    <p className={`font-medium text-lg ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>جاري تحميل بيانات المشروع...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
                darkMode
                    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
                    : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
            }`}>
                <div className={`rounded-2xl shadow-xl p-12 text-center transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        darkMode ? 'bg-red-900/30' : 'bg-red-100'
                    }`}>
                        <i className="fas fa-exclamation-triangle text-red-600 text-3xl"></i>
                    </div>
                    <p className={`text-lg ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>{error || 'لم يتم العثور على المشروع المطلوب'}</p>
                </div>
            </div>
        );
    }

    const statusLabel = statusLabels[project.status] ?? project.status;
    const statusColorsMap = getStatusColors(darkMode);
    const statusClass = statusColorsMap[project.status] ?? (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700');

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
                : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
        }`}>
            <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
                <div className={`rounded-2xl shadow-lg border-2 p-8 transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div className="flex-1">
                            <nav className={`flex items-center gap-2 text-sm mb-3 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                <Link to="/projects" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                                    <i className="fas fa-project-diagram"></i>
                                    <span>المشاريع</span>
                                </Link>
                                <i className="fas fa-chevron-left text-xs"></i>
                                <span className={`font-medium ${
                                    darkMode ? 'text-gray-200' : 'text-gray-900'
                                }`}>{project.name}</span>
                            </nav>
                            
                            <h1 className={`text-4xl font-black mb-3 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>{project.name}</h1>
                            
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${statusClass}`}>
                                    <i className="fas fa-circle text-xs mr-1"></i>
                                    {statusLabel}
                                </span>
                                <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors duration-300 ${
                                    darkMode
                                        ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/30 text-purple-300 border-purple-700'
                                        : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200'
                                }`}>
                                    <i className="fas fa-flag mr-1"></i>
                                    {priorityLabels[project.priority] ?? 'غير محدد'}
                                </span>
                                {project.color && (
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${
                                        darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'
                                    }`}>
                                        <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: project.color }}></div>
                                        <span className={`text-sm font-bold ${
                                            darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>لون المشروع</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setShowTimeline(!showTimeline)}
                                className={`px-4 py-2.5 border-2 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 text-sm font-medium ${
                                    darkMode
                                        ? 'bg-gray-900 border-gray-700 hover:border-indigo-500 hover:bg-gray-700 text-gray-300'
                                        : 'bg-white border-gray-300 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700'
                                }`}
                            >
                                <i className="fas fa-clock"></i>
                                <span>Timeline</span>
                            </button>
                            <button
                                onClick={() => setIsQuickAddOpen(true)}
                                className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm font-bold"
                            >
                                <i className="fas fa-plus"></i>
                                <span>مهمة جديدة</span>
                            </button>
                            <button
                                onClick={handleToggleStatus}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm font-bold"
                            >
                                <i className="fas fa-sync"></i>
                                <span>تبديل الحالة</span>
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm font-bold"
                            >
                                <i className="fas fa-trash"></i>
                                <span>حذف</span>
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className={`p-4 border-2 rounded-xl flex items-center gap-3 transition-colors duration-300 ${
                        darkMode
                            ? 'bg-red-900/30 border-red-800 text-red-300'
                            : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        <i className="fas fa-exclamation-circle text-xl"></i>
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm mb-1 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>إجمالي المهام</p>
                                <p className={`text-3xl font-black ${
                                    darkMode ? 'text-gray-100' : 'text-gray-900'
                                }`}>{statistics?.total_tasks ?? 0}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                                darkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                            }`}>
                                <i className="fas fa-tasks text-blue-600 text-2xl"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm mb-1 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>المهام المكتملة</p>
                                <p className="text-3xl font-black text-green-600">{statistics?.completed_tasks ?? 0}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                                darkMode ? 'bg-green-900/30' : 'bg-green-100'
                            }`}>
                                <i className="fas fa-check-circle text-green-600 text-2xl"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm mb-1 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>قيد التنفيذ</p>
                                <p className="text-3xl font-black text-blue-600">{statistics?.in_progress_tasks ?? 0}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                                darkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                            }`}>
                                <i className="fas fa-spinner text-blue-600 text-2xl"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm mb-1 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>قيد الانتظار</p>
                                <p className="text-3xl font-black text-yellow-600">{statistics?.pending_tasks ?? 0}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                                darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'
                            }`}>
                                <i className="fas fa-clock text-yellow-600 text-2xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                            <h2 className={`text-xl font-black mb-4 flex items-center gap-2 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                                <i className="fas fa-info-circle text-blue-600"></i>
                                <span>معلومات المشروع</span>
                            </h2>
                            
                            {project.description && (
                                <div className="mb-6">
                                    <h3 className={`text-sm font-bold mb-2 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>الوصف</h3>
                                    <p className={`p-4 rounded-lg leading-relaxed ${
                                        darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-600'
                                    }`}>{project.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {project.start_date && (
                                    <div className={`rounded-xl p-4 border-2 transition-colors duration-300 ${
                                        darkMode
                                            ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-800'
                                            : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
                                    }`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                                                <i className="fas fa-calendar-alt text-white"></i>
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold ${
                                                    darkMode ? 'text-blue-400' : 'text-blue-700'
                                                }`}>بداية المشروع</p>
                                                <p className={`text-lg font-black ${
                                                    darkMode ? 'text-blue-200' : 'text-blue-900'
                                                }`}>{project.start_date}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {project.due_date && (
                                    <div className={`rounded-xl p-4 border-2 transition-colors duration-300 ${
                                        darkMode
                                            ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-800'
                                            : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100'
                                    }`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                                                <i className="fas fa-calendar-check text-white"></i>
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold ${
                                                    darkMode ? 'text-purple-400' : 'text-purple-700'
                                                }`}>الموعد النهائي</p>
                                                <p className={`text-lg font-black ${
                                                    darkMode ? 'text-purple-200' : 'text-purple-900'
                                                }`}>{project.due_date}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                            <h2 className={`text-xl font-black mb-4 flex items-center gap-2 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                                <i className="fas fa-chart-line text-blue-600"></i>
                                <span>تقدم المشروع</span>
                            </h2>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${
                                        darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>نسبة الإنجاز</span>
                                    <span className="text-3xl font-black text-blue-600">{project.progress}%</span>
                                </div>
                                
                                <div className={`h-6 rounded-full overflow-hidden shadow-inner ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}>
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                        style={{ width: `${Math.min(project.progress ?? 0, 100)}%` }}
                                    >
                                        {project.progress > 10 && (
                                            <span className="text-xs font-bold text-white drop-shadow">{project.progress}%</span>
                                        )}
                                    </div>
                                </div>

                                <form onSubmit={handleUpdateProgress} className="flex items-center gap-3 pt-2">
                                    <input
                                        type="number"
                                        name="progress"
                                        min={0}
                                        max={100}
                                        defaultValue={project.progress ?? 0}
                                        className={`w-32 px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-bold ${
                                            darkMode
                                                ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        placeholder="0-100"
                                    />
                                    <button
                                        type="submit"
                                        disabled={updatingProgress}
                                        className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {updatingProgress ? 'جاري التحديث...' : 'تحديث النسبة'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {showTimeline && timelineEvents.length > 0 && (
                            <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-300 ${
                                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                            }`}>
                                <h2 className={`text-xl font-black mb-6 flex items-center gap-2 ${
                                    darkMode ? 'text-gray-100' : 'text-gray-900'
                                }`}>
                                    <i className="fas fa-history text-blue-600"></i>
                                    <span>Timeline</span>
                                </h2>
                                
                                <div className="space-y-4">
                                    {timelineEvents.map((event, index) => (
                                        <div key={index} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                                    darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-100 border-blue-200'
                                                }`}>
                                                    <i className={`fas ${event.icon} text-blue-600`}></i>
                                                </div>
                                                {index < timelineEvents.length - 1 && (
                                                    <div className={`w-0.5 h-full mt-2 ${
                                                        darkMode ? 'bg-gray-700' : 'bg-blue-200'
                                                    }`}></div>
                                                )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <p className={`font-bold ${
                                                    darkMode ? 'text-gray-200' : 'text-gray-900'
                                                }`}>{event.title}</p>
                                                <p className={`text-sm ${
                                                    darkMode ? 'text-gray-500' : 'text-gray-500'
                                                }`}>{event.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                                <i className="fas fa-chart-pie"></i>
                                <span>نظرة سريعة</span>
                            </h2>
                            
                            <div className="space-y-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                    <p className="text-sm font-medium text-blue-100 mb-1">معدل الإنجاز</p>
                                    <p className="text-2xl font-black">
                                        {statistics?.total_tasks > 0
                                            ? Math.round((statistics.completed_tasks / statistics.total_tasks) * 100)
                                            : 0}%
                                    </p>
                                </div>
                                
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                    <p className="text-sm font-medium text-blue-100 mb-1">المهام المتبقية</p>
                                    <p className="text-2xl font-black">
                                        {(statistics?.total_tasks ?? 0) - (statistics?.completed_tasks ?? 0)}
                                    </p>
                                </div>
                            </div>

                            <Link
                                to="/tasks"
                                className="block mt-4 text-center px-4 py-3 bg-white hover:bg-blue-50 text-blue-600 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                            >
                                <i className="fas fa-external-link-alt ml-2"></i>
                                إدارة كل المهام
                            </Link>
                        </div>
                    </div>
                </div>

                <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <h2 className={`text-2xl font-black flex items-center gap-2 ${
                            darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                            <i className="fas fa-list-check text-blue-600"></i>
                            <span>المهام المرتبطة ({filteredTasks.length})</span>
                        </h2>
                        
                        <div className="flex flex-wrap gap-2">
                            <input
                                type="text"
                                placeholder="ابحث عن مهمة..."
                                value={taskSearch}
                                onChange={(e) => setTaskSearch(e.target.value)}
                                className={`px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                                    darkMode
                                        ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                        : 'border-gray-300 focus:border-blue-500'
                                }`}
                            />
                            <select
                                value={taskFilter}
                                onChange={(e) => setTaskFilter(e.target.value)}
                                className={`px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium ${
                                    darkMode
                                        ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                        : 'border-gray-300 focus:border-blue-500'
                                }`}
                            >
                                <option value="all">جميع المهام</option>
                                <option value="pending">قيد الانتظار</option>
                                <option value="in_progress">قيد التنفيذ</option>
                                <option value="completed">مكتملة</option>
                            </select>
                        </div>
                    </div>

                    {filteredTasks.length > 0 ? (
                        <div className="space-y-3">
                            {filteredTasks.map((task) => (
                                <div key={task.id} className={`border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                                    darkMode
                                        ? 'border-gray-700 hover:border-blue-500'
                                        : 'border-gray-100 hover:border-blue-200'
                                }`}>
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className={`text-lg font-bold mb-2 ${
                                                darkMode ? 'text-gray-200' : 'text-gray-900'
                                            }`}>{task.title}</h3>
                                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                                <span className={`px-3 py-1 rounded-lg font-bold ${
                                                    task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {taskStatusLabels[task.status] ?? task.status}
                                                </span>
                                                <span className={`flex items-center gap-1 ${
                                                    darkMode ? 'text-gray-400' : 'text-gray-600'
                                                }`}>
                                                    <i className="fas fa-flag"></i>
                                                    {priorityLabels[task.priority] ?? task.priority}
                                                </span>
                                                {task.scheduled_date && (
                                                    <span className={`flex items-center gap-1 ${
                                                        darkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                        <i className="fas fa-calendar"></i>
                                                        {task.scheduled_date}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/tasks/${task.id}`}
                                                className="px-4 py-2 text-sm font-bold text-blue-600 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-all"
                                            >
                                                <i className="fas fa-eye ml-1"></i>
                                                عرض
                                            </Link>
                                            {task.status !== 'completed' && (
                                                <button
                                                    onClick={() => handleCompleteTask(task.id)}
                                                    className="px-4 py-2 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                                                >
                                                    <i className="fas fa-check ml-1"></i>
                                                    إنهاء
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-100'
                            }`}>
                                <i className={`fas fa-tasks text-3xl ${
                                    darkMode ? 'text-gray-500' : 'text-gray-400'
                                }`}></i>
                            </div>
                            <p className={`text-lg font-medium ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>لا توجد مهام مرتبطة بهذا المشروع</p>
                        </div>
                    )}

                </div>

                {isQuickAddOpen && (
                    <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50 ${
                        darkMode ? 'bg-black/70' : 'bg-black/50'
                    }`} onClick={() => setIsQuickAddOpen(false)}>
                        <div className={`rounded-2xl shadow-2xl max-w-md w-full p-6 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                        }`} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className={`text-2xl font-black ${
                                    darkMode ? 'text-gray-100' : 'text-gray-900'
                                }`}>إضافة مهمة جديدة</h3>
                                <button
                                    onClick={() => setIsQuickAddOpen(false)}
                                    className={`transition-colors ${
                                        darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>

                            <form onSubmit={handleQuickAddSubmit} className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-bold mb-2 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>عنوان المهمة</label>
                                    <input
                                        type="text"
                                        value={quickAddForm.title}
                                        onChange={(e) => setQuickAddForm({ ...quickAddForm, title: e.target.value })}
                                        required
                                        className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                            darkMode
                                                ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                        placeholder="أدخل عنوان المهمة"
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-bold mb-2 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>الأولوية</label>
                                    <select
                                        value={quickAddForm.priority}
                                        onChange={(e) => setQuickAddForm({ ...quickAddForm, priority: e.target.value })}
                                        className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                            darkMode
                                                ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                    >
                                        <option value="low">منخفضة</option>
                                        <option value="medium">متوسطة</option>
                                        <option value="high">عالية</option>
                                        <option value="urgent">عاجلة</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-sm font-bold mb-2 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>التاريخ المحدد</label>
                                    <input
                                        type="date"
                                        value={quickAddForm.scheduled_date}
                                        onChange={(e) => setQuickAddForm({ ...quickAddForm, scheduled_date: e.target.value })}
                                        className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                            darkMode
                                                ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                                : 'border-gray-300 focus:border-blue-500'
                                        }`}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={quickAddSubmitting}
                                        className={`flex-1 px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 text-white ${
                                            quickAddSubmitting ? 'bg-gray-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                        }`}
                                    >
                                        {quickAddSubmitting ? 'جاري الإضافة...' : 'إضافة المهمة'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsQuickAddOpen(false)}
                                        className={`px-6 py-3 rounded-lg font-bold transition-all ${
                                            darkMode
                                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProjectDetails;
