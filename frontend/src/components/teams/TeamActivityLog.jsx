import React, { useState, useEffect } from 'react';
import teamService from '../../services/teamService';

const TeamActivityLog = ({ teamId }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (teamId) {
            loadActivities();
        }
    }, [teamId, filter]);

    const loadActivities = async (loadMore = false) => {
        setLoading(true);
        try {
            const currentPage = loadMore ? page + 1 : 1;
            const response = await teamService.getActivityLog(teamId, {
                type: filter !== 'all' ? filter : undefined,
                page: currentPage,
                per_page: 10
            });

            if (response.success) {
                const newActivities = response.data || [];
                setActivities(loadMore ? [...activities, ...newActivities] : newActivities);
                setHasMore(newActivities.length === 10);
                setPage(currentPage);
            }
        } catch (error) {
            console.error('Error loading activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type) => {
        const icons = {
            member_added: { icon: 'fa-user-plus', color: 'text-green-500', bg: 'bg-green-50' },
            member_removed: { icon: 'fa-user-minus', color: 'text-red-500', bg: 'bg-red-50' },
            member_role_changed: { icon: 'fa-user-tag', color: 'text-blue-500', bg: 'bg-blue-50' },
            resource_shared: { icon: 'fa-share-alt', color: 'text-purple-500', bg: 'bg-purple-50' },
            resource_unshared: { icon: 'fa-unlink', color: 'text-orange-500', bg: 'bg-orange-50' },
            team_created: { icon: 'fa-plus-circle', color: 'text-indigo-500', bg: 'bg-indigo-50' },
            team_updated: { icon: 'fa-edit', color: 'text-yellow-500', bg: 'bg-yellow-50' },
            team_deleted: { icon: 'fa-trash', color: 'text-red-500', bg: 'bg-red-50' },
            task_shared: { icon: 'fa-tasks', color: 'text-cyan-500', bg: 'bg-cyan-50' },
            task_assigned: { icon: 'fa-user-check', color: 'text-teal-500', bg: 'bg-teal-50' },
        };
        return icons[type] || { icon: 'fa-circle', color: 'text-gray-500', bg: 'bg-gray-50' };
    };

    const getActivityDescription = (activity) => {
        const descriptions = {
            member_added: `أضاف ${activity.actor?.name} العضو ${activity.target?.name}`,
            member_removed: `أزال ${activity.actor?.name} العضو ${activity.target?.name}`,
            member_role_changed: `غيّر ${activity.actor?.name} دور ${activity.target?.name} إلى ${activity.new_value}`,
            resource_shared: `شارك ${activity.actor?.name} ${activity.resource_type === 'course' ? 'الدورة' : 'المشروع'} "${activity.resource_name}"`,
            resource_unshared: `ألغى ${activity.actor?.name} مشاركة ${activity.resource_type === 'course' ? 'الدورة' : 'المشروع'} "${activity.resource_name}"`,
            team_created: `أنشأ ${activity.actor?.name} الفريق`,
            team_updated: `حدّث ${activity.actor?.name} معلومات الفريق`,
            team_deleted: `حذف ${activity.actor?.name} الفريق`,
            task_shared: `شارك ${activity.actor?.name} المهمة "${activity.task_title}"`,
            task_assigned: `عيّن ${activity.actor?.name} المهمة "${activity.task_title}" لـ ${activity.target?.name}`,
        };
        return descriptions[activity.type] || activity.description || 'نشاط غير معروف';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        return date.toLocaleDateString('ar-SA');
    };

    const filterOptions = [
        { value: 'all', label: 'جميع النشاطات', icon: 'fa-list' },
        { value: 'member_added', label: 'إضافة أعضاء', icon: 'fa-user-plus' },
        { value: 'member_removed', label: 'إزالة أعضاء', icon: 'fa-user-minus' },
        { value: 'member_role_changed', label: 'تغيير الأدوار', icon: 'fa-user-tag' },
        { value: 'resource_shared', label: 'مشاركة موارد', icon: 'fa-share-alt' },
        { value: 'task_shared', label: 'مشاركة مهام', icon: 'fa-tasks' },
    ];

    return (
        <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center">
                    <i className="fas fa-history ml-2 text-indigo-500"></i>
                    سجل النشاطات
                </h3>
            </div>

            {/* Filters */}
            <div className="mb-6 overflow-x-auto">
                <div className="flex gap-2 pb-2">
                    {filterOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setFilter(option.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                                filter === option.value
                                    ? 'bg-indigo-500 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            <i className={`fas ${option.icon} ml-1`}></i>
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading && activities.length === 0 ? (
                <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i>
                    <p className="mt-2 text-slate-500">جاري التحميل...</p>
                </div>
            ) : activities.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <i className="fas fa-history text-4xl text-slate-300 mb-3"></i>
                    <p className="text-slate-500">لا توجد نشاطات لعرضها</p>
                    <p className="text-xs text-slate-400 mt-1">ستظهر هنا جميع نشاطات الفريق</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activities.map((activity, index) => {
                        const { icon, color, bg } = getActivityIcon(activity.type);
                        return (
                            <div
                                key={`${activity.id}-${index}`}
                                className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all"
                            >
                                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                                    <i className={`fas ${icon} ${color} text-xl`}></i>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-slate-800 font-medium mb-1">
                                        {getActivityDescription(activity)}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <i className="fas fa-clock"></i>
                                            {formatDate(activity.created_at)}
                                        </span>
                                        {activity.ip_address && (
                                            <span className="flex items-center gap-1">
                                                <i className="fas fa-globe"></i>
                                                {activity.ip_address}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {activity.actor?.avatar && (
                                    <img
                                        src={activity.actor.avatar}
                                        alt={activity.actor.name}
                                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                    />
                                )}
                            </div>
                        );
                    })}

                    {hasMore && (
                        <button
                            onClick={() => loadActivities(true)}
                            disabled={loading}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <><i className="fas fa-spinner fa-spin ml-2"></i>جاري التحميل...</>
                            ) : (
                                <><i className="fas fa-chevron-down ml-2"></i>عرض المزيد</>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeamActivityLog;
