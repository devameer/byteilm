import React, { useState, useEffect } from 'react';
import Button from '../Button';
import teamService from '../../services/teamService';
import taskService from '../../services/taskService';
import { useTheme } from '../../contexts/ThemeContext';

const TeamTasks = ({ teamId, teamName, members }) => {
    const { darkMode } = useTheme();
    const [tasks, setTasks] = useState([]);
    const [availableTasks, setAvailableTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddTask, setShowAddTask] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [assignedMember, setAssignedMember] = useState('');

    // Theme-aware classes
    const cardClass = darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-slate-200';
    const textPrimary = darkMode ? 'text-gray-100' : 'text-slate-800';
    const textSecondary = darkMode ? 'text-gray-400' : 'text-slate-500';
    const inputClass = darkMode 
        ? 'bg-gray-700 border-gray-600 text-gray-100' 
        : 'border-slate-200';
    const emptyBg = darkMode ? 'bg-gray-700' : 'bg-slate-50';
    const taskCardClass = darkMode 
        ? 'border-gray-700 hover:border-indigo-500' 
        : 'border-slate-200 hover:border-indigo-300';

    useEffect(() => {
        if (teamId) {
            loadTeamTasks();
            loadAvailableTasks();
        }
    }, [teamId]);

    const loadTeamTasks = async () => {
        setLoading(true);
        try {
            const response = await teamService.getTeamTasks(teamId);
            if (response.success) {
                setTasks(response.data || []);
            }
        } catch (error) {
            console.error('Error loading team tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableTasks = async () => {
        try {
            const response = await taskService.list({ status: 'pending,in_progress' });
            if (response.success) {
                setAvailableTasks(response.data || []);
            }
        } catch (error) {
            console.error('Error loading available tasks:', error);
        }
    };

    const shareTask = async () => {
        if (!selectedTaskId) return;

        try {
            const response = await teamService.shareTask(teamId, {
                task_id: selectedTaskId,
                assigned_to: assignedMember || null
            });

            if (response.success) {
                await loadTeamTasks();
                setShowAddTask(false);
                setSelectedTaskId('');
                setAssignedMember('');
            }
        } catch (error) {
            console.error('Error sharing task:', error);
        }
    };

    const unshareTask = async (taskId) => {
        if (!confirm('هل تريد إلغاء مشاركة هذه المهمة؟')) return;

        try {
            const response = await teamService.unshareTask(teamId, taskId);
            if (response.success) {
                setTasks(tasks.filter(t => t.id !== taskId));
            }
        } catch (error) {
            console.error('Error unsharing task:', error);
        }
    };

    const assignTaskToMember = async (taskId, memberId) => {
        try {
            const response = await teamService.assignTask(teamId, taskId, { member_id: memberId });
            if (response.success) {
                await loadTeamTasks();
            }
        } catch (error) {
            console.error('Error assigning task:', error);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { label: 'قيد الانتظار', class: darkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700' },
            in_progress: { label: 'قيد التنفيذ', class: darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700' },
            completed: { label: 'مكتملة', class: darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700' },
            cancelled: { label: 'ملغاة', class: darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700' },
        };
        const badge = badges[status] || { label: status, class: darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700' };
        return <span className={`px-2 py-1 rounded-full text-xs font-bold ${badge.class}`}>{badge.label}</span>;
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            urgent: { label: 'عاجلة', class: darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700', icon: 'fa-fire' },
            high: { label: 'مرتفعة', class: darkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700', icon: 'fa-arrow-up' },
            medium: { label: 'متوسطة', class: darkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700', icon: 'fa-minus' },
            low: { label: 'منخفضة', class: darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700', icon: 'fa-arrow-down' },
        };
        const badge = badges[priority] || { label: priority, class: darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700', icon: 'fa-circle' };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${badge.class} flex items-center gap-1`}>
                <i className={`fas ${badge.icon}`}></i>
                {badge.label}
            </span>
        );
    };

    return (
        <div className={`${cardClass} rounded-2xl p-6 border-2 shadow-lg`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-black ${textPrimary} flex items-center`}>
                    <i className="fas fa-tasks ml-2 text-indigo-500"></i>
                    مهام الفريق المشتركة
                </h3>
                <Button
                    type="button"
                    variant="primary"
                    icon="fa-plus"
                    onClick={() => setShowAddTask(!showAddTask)}
                    size="sm"
                >
                    {showAddTask ? 'إلغاء' : 'مشاركة مهمة'}
                </Button>
            </div>

            {showAddTask && (
                <div className={`mb-6 rounded-xl p-4 border-2 ${darkMode ? 'bg-indigo-900/30 border-indigo-700' : 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200'}`}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-slate-700'} mb-2`}>
                                <i className={`fas fa-tasks ml-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}></i>
                                اختر المهمة
                            </label>
                            <select
                                className={`form-select w-full border-2 rounded-lg px-3 py-2 ${inputClass}`}
                                value={selectedTaskId}
                                onChange={(e) => setSelectedTaskId(e.target.value)}
                            >
                                <option value="">-- اختر مهمة --</option>
                                {availableTasks.map((task) => (
                                    <option key={task.id} value={task.id}>
                                        {task.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-slate-700'} mb-2`}>
                                <i className={`fas fa-user ml-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}></i>
                                تعيين لعضو (اختياري)
                            </label>
                            <select
                                className={`form-select w-full border-2 rounded-lg px-3 py-2 ${inputClass}`}
                                value={assignedMember}
                                onChange={(e) => setAssignedMember(e.target.value)}
                            >
                                <option value="">-- بدون تعيين --</option>
                                {members.map((member) => (
                                    <option key={member.id} value={member.user_id}>
                                        {member.user?.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button
                            type="button"
                            variant="success"
                            icon="fa-share-alt"
                            onClick={shareTask}
                            disabled={!selectedTaskId}
                        >
                            مشاركة المهمة
                        </Button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i>
                    <p className={`mt-2 ${textSecondary}`}>جاري التحميل...</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className={`text-center py-12 ${emptyBg} rounded-xl`}>
                    <i className={`fas fa-tasks text-4xl ${darkMode ? 'text-gray-600' : 'text-slate-300'} mb-3`}></i>
                    <p className={textSecondary}>لا توجد مهام مشتركة بعد</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'} mt-1`}>شارك مهامك مع أعضاء الفريق للتعاون عليها</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className={`border-2 ${taskCardClass} rounded-xl p-4 hover:shadow-lg transition-all`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h4 className={`font-bold ${textPrimary} text-lg flex-1`}>{task.title}</h4>
                                <button
                                    onClick={() => unshareTask(task.id)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    title="إلغاء المشاركة"
                                >
                                    <i className="fas fa-times-circle text-xl"></i>
                                </button>
                            </div>

                            {task.description && (
                                <p className={`text-sm ${textSecondary} mb-3 line-clamp-2`}>{task.description}</p>
                            )}

                            <div className="flex flex-wrap gap-2 mb-3">
                                {getStatusBadge(task.status)}
                                {getPriorityBadge(task.priority)}
                            </div>

                            {task.scheduled_date && (
                                <div className={`flex items-center gap-2 text-xs ${textSecondary} mb-3`}>
                                    <i className="fas fa-calendar"></i>
                                    <span>موعد التسليم: {new Date(task.scheduled_date).toLocaleDateString('ar-SA')}</span>
                                </div>
                            )}

                            <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-slate-200'} pt-3 mt-3`}>
                                <label className={`block text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-slate-600'} mb-2`}>
                                    <i className="fas fa-user-check ml-1"></i>
                                    معيّن لـ:
                                </label>
                                <div className="flex items-center gap-2">
                                    <select
                                        className={`form-select flex-1 text-sm border-2 rounded-lg px-2 py-1 ${inputClass}`}
                                        value={task.assigned_to || ''}
                                        onChange={(e) => assignTaskToMember(task.id, e.target.value)}
                                    >
                                        <option value="">-- غير معيّن --</option>
                                        {members.map((member) => (
                                            <option key={member.id} value={member.user_id}>
                                                {member.user?.name}
                                            </option>
                                        ))}
                                    </select>
                                    {task.assigned_user && (
                                        <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${darkMode ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}>
                                            <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                                                {task.assigned_user.name?.charAt(0)}
                                            </div>
                                            <span className={`text-xs font-bold ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>{task.assigned_user.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`flex items-center justify-between mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                                    <i className="fas fa-user ml-1"></i>
                                    شاركها: {task.shared_by?.name}
                                </span>
                                <a
                                    href={`/tasks?task_id=${task.id}`}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                                >
                                    عرض التفاصيل
                                    <i className="fas fa-external-link-alt"></i>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeamTasks;
