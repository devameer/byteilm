import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import teamService from '../../services/teamService';

const TeamAnalytics = ({ teamId, teamName }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState('week');

    const activityChartRef = useRef(null);
    const memberChartRef = useRef(null);
    const activityChartInstance = useRef(null);
    const memberChartInstance = useRef(null);

    useEffect(() => {
        if (teamId) {
            loadAnalytics();
        }
    }, [teamId, period]);

    useEffect(() => {
        if (analytics) {
            renderCharts();
        }
        return () => {
            if (activityChartInstance.current) activityChartInstance.current.destroy();
            if (memberChartInstance.current) memberChartInstance.current.destroy();
        };
    }, [analytics]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const response = await teamService.getAnalytics(teamId, { period });
            if (response.success) {
                setAnalytics(response.data);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderCharts = () => {
        if (!analytics) return;

        // Activity Chart
        if (activityChartRef.current) {
            if (activityChartInstance.current) {
                activityChartInstance.current.destroy();
            }

            activityChartInstance.current = new Chart(activityChartRef.current, {
                type: 'line',
                data: {
                    labels: analytics.activity_timeline?.map(item => item.date) || [],
                    datasets: [
                        {
                            label: 'النشاطات',
                            data: analytics.activity_timeline?.map(item => item.count) || [],
                            borderColor: 'rgb(99, 102, 241)',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            tension: 0.4,
                            fill: true,
                            borderWidth: 3,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                }
            });
        }

        // Member Contribution Chart
        if (memberChartRef.current) {
            if (memberChartInstance.current) {
                memberChartInstance.current.destroy();
            }

            memberChartInstance.current = new Chart(memberChartRef.current, {
                type: 'doughnut',
                data: {
                    labels: analytics.member_activity?.map(item => item.member_name) || [],
                    datasets: [{
                        data: analytics.member_activity?.map(item => item.activity_count) || [],
                        backgroundColor: [
                            'rgba(99, 102, 241, 0.8)',
                            'rgba(168, 85, 247, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(251, 146, 60, 0.8)',
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { padding: 15, font: { size: 12 } }
                        }
                    }
                }
            });
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
                <div className="text-center py-12">
                    <i className="fas fa-spinner fa-spin text-4xl text-indigo-500 mb-4"></i>
                    <p className="text-slate-500">جاري تحميل التحليلات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-slate-800 flex items-center">
                        <i className="fas fa-chart-line ml-2 text-indigo-500"></i>
                        تحليلات الفريق
                    </h3>
                    <div className="flex gap-2">
                        {['week', 'month', 'year'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    period === p
                                        ? 'bg-indigo-500 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {p === 'week' ? 'أسبوع' : p === 'month' ? 'شهر' : 'سنة'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-blue-600 mb-1">إجمالي النشاطات</p>
                                <p className="text-3xl font-black text-blue-900">{analytics?.total_activities || 0}</p>
                            </div>
                            <i className="fas fa-chart-bar text-3xl text-blue-500"></i>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-green-600 mb-1">المهام المكتملة</p>
                                <p className="text-3xl font-black text-green-900">{analytics?.completed_tasks || 0}</p>
                            </div>
                            <i className="fas fa-check-circle text-3xl text-green-500"></i>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-purple-600 mb-1">الأعضاء النشطون</p>
                                <p className="text-3xl font-black text-purple-900">{analytics?.active_members || 0}</p>
                            </div>
                            <i className="fas fa-users text-3xl text-purple-500"></i>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-orange-600 mb-1">معدل الإنجاز</p>
                                <p className="text-3xl font-black text-orange-900">{analytics?.completion_rate || 0}%</p>
                            </div>
                            <i className="fas fa-trophy text-3xl text-orange-500"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Activity Timeline */}
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
                    <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center">
                        <i className="fas fa-chart-area ml-2 text-indigo-500"></i>
                        خط زمني للنشاطات
                    </h4>
                    <div style={{ height: '300px' }}>
                        <canvas ref={activityChartRef}></canvas>
                    </div>
                </div>

                {/* Member Contributions */}
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
                    <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center">
                        <i className="fas fa-user-chart ml-2 text-indigo-500"></i>
                        مساهمات الأعضاء
                    </h4>
                    <div style={{ height: '300px' }}>
                        <canvas ref={memberChartRef}></canvas>
                    </div>
                </div>
            </div>

            {/* Top Members */}
            <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
                <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center">
                    <i className="fas fa-medal ml-2 text-yellow-500"></i>
                    الأعضاء الأكثر نشاطاً
                </h4>
                <div className="grid gap-3 md:grid-cols-3">
                    {analytics?.top_members?.slice(0, 3).map((member, index) => (
                        <div
                            key={member.id}
                            className={`p-4 rounded-xl border-2 ${
                                index === 0
                                    ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300'
                                    : index === 1
                                    ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
                                    : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                                    index === 0 ? 'bg-yellow-500 text-white' :
                                    index === 1 ? 'bg-gray-400 text-white' :
                                    'bg-orange-500 text-white'
                                }`}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800">{member.name}</p>
                                    <p className="text-sm text-slate-600">{member.activity_count} نشاط</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Achievements */}
            {analytics?.achievements && analytics.achievements.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
                    <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center">
                        <i className="fas fa-star ml-2 text-yellow-500"></i>
                        الإنجازات الأخيرة
                    </h4>
                    <div className="space-y-2">
                        {analytics.achievements.map((achievement, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                            >
                                <div className="text-2xl">{achievement.icon || '🏆'}</div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800">{achievement.title}</p>
                                    <p className="text-xs text-slate-600">{achievement.description}</p>
                                </div>
                                <span className="text-xs text-slate-400">{achievement.date}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamAnalytics;
