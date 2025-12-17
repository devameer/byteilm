import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import TeamsPageSkeleton from '../components/teams/TeamsPageSkeleton.jsx';
import TeamDetailSkeleton from '../components/teams/TeamDetailSkeleton.jsx';
import TeamInvitations from '../components/teams/TeamInvitations.jsx';
import TeamActivityLog from '../components/teams/TeamActivityLog.jsx';
import TeamTasks from '../components/teams/TeamTasks.jsx';
import TeamAnalytics from '../components/teams/TeamAnalytics.jsx';
import teamService from '../services/teamService.js';

function Teams() {
    const { darkMode } = useTheme();
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [resourcesLoading, setResourcesLoading] = useState(false);
    const [resourceOptions, setResourceOptions] = useState({ courses: [], projects: [] });
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [quickViewTeam, setQuickViewTeam] = useState(null);
    const [statistics, setStatistics] = useState({
        total: 0,
        ownedTeams: 0,
        memberTeams: 0,
        totalMembers: 0,
    });

    const [createForm, setCreateForm] = useState({
        name: '',
        description: '',
    });
    const [createLoading, setCreateLoading] = useState(false);

    const [teamForm, setTeamForm] = useState({
        name: '',
        description: '',
    });
    const [teamFormLoading, setTeamFormLoading] = useState(false);

    const [memberForm, setMemberForm] = useState({
        email: '',
        role: 'member',
    });
    const [memberLoading, setMemberLoading] = useState(false);

    const roleLabels = useMemo(() => ({
        owner: 'مالك',
        member: 'عضو',
        viewer: 'مشاهد',
    }), []);

    const showError = useCallback((message) => {
        setError(message);
        setTimeout(() => {
            setError('');
        }, 5000);
    }, []);

    const updateTeamInList = useCallback((teamData) => {
        setTeams((prev) => {
            const exists = prev.some((team) => team.id === teamData.id);
            const updated = exists
                ? prev.map((team) => (team.id === teamData.id ? teamData : team))
                : [...prev, teamData];

            return [...updated].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        });
    }, []);

    const fetchResourceOptions = useCallback(async (teamId) => {
        setResourcesLoading(true);
        try {
            const response = await teamService.getResourceOptions(teamId);
            if (response.success) {
                setResourceOptions({
                    courses: response.data?.courses ?? [],
                    projects: response.data?.projects ?? [],
                });
            } else {
                showError(response.message || 'تعذر تحميل الموارد المتاحة.');
            }
        } catch (err) {
            // Ignore canceled errors (they're not real errors, just duplicate request prevention)
            if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
                setResourcesLoading(false);
                return;
            }
            // Only show error if it's a real error (not network timeout or canceled)
            const errorMessage = err?.response?.data?.message || err?.message;
            if (errorMessage && !errorMessage.includes('timeout') && !errorMessage.includes('canceled')) {
                showError(errorMessage);
            } else if (err?.response?.status >= 500) {
                showError("حدث خطأ في الخادم. يرجى المحاولة لاحقاً");
            } else if (!err?.response) {
                // Network error - don't show error, just log it
                console.error("Network error loading resource options:", err);
            }
        } finally {
            setResourcesLoading(false);
        }
    }, [showError]);

    const loadTeam = useCallback(async (teamId, { silent = false } = {}) => {
        setStatus('');
        setError('');
        if (!silent) {
            setDetailLoading(true);
        }
        try {
            const response = await teamService.getTeam(teamId);
            if (response.success) {
                const teamData = response.data;
                setSelectedTeamId(teamId);
                setSelectedTeam(teamData);
                setTeamForm({
                    name: teamData.name ?? '',
                    description: teamData.description ?? '',
                });
                updateTeamInList(teamData);

                if (teamData.permissions?.manage_resources) {
                    await fetchResourceOptions(teamId);
                } else {
                    setResourceOptions({ courses: [], projects: [] });
                }
            } else {
                showError(response.message || 'تعذر تحميل تفاصيل الفريق.');
            }
        } catch (err) {
            // Ignore canceled errors (they're not real errors, just duplicate request prevention)
            if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
                if (!silent) {
                    setDetailLoading(false);
                }
                return;
            }
            // Only show error if it's a real error (not network timeout or canceled)
            const errorMessage = err?.response?.data?.message || err?.message;
            if (errorMessage && !errorMessage.includes('timeout') && !errorMessage.includes('canceled')) {
                showError(errorMessage);
            } else if (err?.response?.status >= 500) {
                showError("حدث خطأ في الخادم. يرجى المحاولة لاحقاً");
            } else if (!err?.response) {
                // Network error - don't show error, just log it
                console.error("Network error loading team details:", err);
            }
        } finally {
            if (!silent) {
                setDetailLoading(false);
            }
        }
    }, [fetchResourceOptions, showError, updateTeamInList]);

    const fetchTeams = useCallback(async () => {
        setLoading(true);
        try {
            const response = await teamService.getTeams();
            if (response.success) {
                const data = Array.isArray(response.data) ? response.data : [];
                const ordered = data.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
                setTeams(ordered);

                const stats = {
                    total: ordered.length,
                    ownedTeams: ordered.filter(t => t.current_role === 'owner').length,
                    memberTeams: ordered.filter(t => t.current_role !== 'owner').length,
                    totalMembers: ordered.reduce((sum, t) => sum + (t.members?.length || 0), 0),
                };
                setStatistics(stats);

                if (ordered.length > 0) {
                    const defaultTeamId = ordered[0].id;
                    setSelectedTeamId(defaultTeamId);
                    await loadTeam(defaultTeamId, { silent: true });
                } else {
                    setSelectedTeam(null);
                    setSelectedTeamId(null);
                }
            } else {
                showError(response.message || 'تعذر تحميل الفرق.');
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
                showError(errorMessage);
            } else if (err?.response?.status >= 500) {
                showError("حدث خطأ في الخادم. يرجى المحاولة لاحقاً");
            } else if (!err?.response) {
                // Network error - don't show error, just log it
                console.error("Network error loading teams:", err);
            }
        } finally {
            setLoading(false);
        }
    }, [loadTeam, showError]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    const handleCreateTeam = async (event) => {
        event.preventDefault();
        setCreateLoading(true);
        setStatus('');
        try {
            const response = await teamService.createTeam(createForm);
            if (response.success) {
                const newTeam = response.data;
                updateTeamInList(newTeam);
                setCreateForm({ name: '', description: '' });
                setStatus(response.message || 'تم إنشاء الفريق بنجاح.');
                await loadTeam(newTeam.id, { silent: true });
                setSelectedTeamId(newTeam.id);
                await fetchTeams();
            } else {
                showError(response.message || 'تعذر إنشاء الفريق.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'حدث خطأ أثناء إنشاء الفريق.';
            showError(message);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleUpdateTeam = async (event) => {
        event.preventDefault();
        if (!selectedTeam) {
            return;
        }
        setTeamFormLoading(true);
        try {
            const response = await teamService.updateTeam(selectedTeam.id, teamForm);
            if (response.success) {
                const updatedTeam = response.data;
                setSelectedTeam(updatedTeam);
                updateTeamInList(updatedTeam);
                setStatus(response.message || 'تم تحديث بيانات الفريق.');
            } else {
                showError(response.message || 'تعذر تحديث بيانات الفريق.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'حدث خطأ أثناء تحديث بيانات الفريق.';
            showError(message);
        } finally {
            setTeamFormLoading(false);
        }
    };

    const handleDeleteTeam = async () => {
        if (!selectedTeam) {
            return;
        }
        if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الفريق؟')) {
            return;
        }

        try {
            const response = await teamService.deleteTeam(selectedTeam.id);
            if (response.success) {
                setStatus(response.message || 'تم حذف الفريق.');
                const remainingTeams = teams.filter((team) => team.id !== selectedTeam.id);
                setTeams(remainingTeams);

                if (remainingTeams.length > 0) {
                    const nextTeam = remainingTeams[0];
                    setSelectedTeamId(nextTeam.id);
                    await loadTeam(nextTeam.id, { silent: true });
                } else {
                    setSelectedTeam(null);
                    setSelectedTeamId(null);
                }
                await fetchTeams();
            } else {
                showError(response.message || 'تعذر حذف الفريق.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'حدث خطأ أثناء حذف الفريق.';
            showError(message);
        }
    };

    const handleAddMember = async (event) => {
        event.preventDefault();
        if (!selectedTeam) {
            return;
        }
        setMemberLoading(true);
        try {
            const response = await teamService.addMember(selectedTeam.id, memberForm);
            if (response.success) {
                const updatedTeam = response.data;
                setSelectedTeam(updatedTeam);
                updateTeamInList(updatedTeam);
                setMemberForm({ email: '', role: 'member' });
                setStatus(response.message || 'تم إضافة العضو.');
                await fetchTeams();
            } else {
                showError(response.message || 'تعذر إضافة العضو.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'حدث خطأ أثناء إضافة العضو.';
            showError(message);
        } finally {
            setMemberLoading(false);
        }
    };

    const handleUpdateMemberRole = async (memberId, role) => {
        if (!selectedTeam) {
            return;
        }
        try {
            const response = await teamService.updateMember(selectedTeam.id, memberId, { role });
            if (response.success) {
                const updatedTeam = response.data;
                setSelectedTeam(updatedTeam);
                updateTeamInList(updatedTeam);
                setStatus(response.message || 'تم تحديث دور العضو.');
            } else {
                showError(response.message || 'تعذر تحديث دور العضو.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'حدث خطأ أثناء تحديث دور العضو.';
            showError(message);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!selectedTeam) {
            return;
        }
        if (!confirm('هل تريد إزالة هذا العضو من الفريق؟')) {
            return;
        }

        try {
            const response = await teamService.removeMember(selectedTeam.id, memberId);
            if (response.success) {
                const updatedTeam = response.data;
                setSelectedTeam(updatedTeam);
                updateTeamInList(updatedTeam);
                setStatus(response.message || 'تم إزالة العضو من الفريق.');
                await fetchTeams();
            } else {
                showError(response.message || 'تعذر إزالة العضو.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'حدث خطأ أثناء إزالة العضو.';
            showError(message);
        }
    };

    const handleToggleCourse = async (course) => {
        if (!selectedTeam) {
            return;
        }

        try {
            const response = course.shared
                ? await teamService.unshareCourse(selectedTeam.id, course.id)
                : await teamService.shareCourse(selectedTeam.id, course.id);

            if (response.success) {
                const updatedTeam = response.data;
                setSelectedTeam(updatedTeam);
                updateTeamInList(updatedTeam);
                setStatus(response.message || 'تم تحديث مشاركة الدورة.');
                await fetchResourceOptions(selectedTeam.id);
            } else {
                showError(response.message || 'تعذر تحديث مشاركة الدورة.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'حدث خطأ أثناء تحديث مشاركة الدورة.';
            showError(message);
        }
    };

    const handleToggleProject = async (project) => {
        if (!selectedTeam) {
            return;
        }

        try {
            const response = project.shared
                ? await teamService.unshareProject(selectedTeam.id, project.id)
                : await teamService.shareProject(selectedTeam.id, project.id);

            if (response.success) {
                const updatedTeam = response.data;
                setSelectedTeam(updatedTeam);
                updateTeamInList(updatedTeam);
                setStatus(response.message || 'تم تحديث مشاركة المشروع.');
                await fetchResourceOptions(selectedTeam.id);
            } else {
                showError(response.message || 'تعذر تحديث مشاركة المشروع.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'حدث خطأ أثناء تحديث مشاركة المشروع.';
            showError(message);
        }
    };

    const activeTeamMembers = selectedTeam?.members ?? [];
    const sharedCourses = selectedTeam?.courses ?? [];
    const sharedProjects = selectedTeam?.projects ?? [];

    const filteredTeams = useMemo(() => {
        if (!searchTerm) return teams;
        return teams.filter(team =>
            team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [teams, searchTerm]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 p-6" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2">إدارة الفرق</h1>
                        <p className="text-gray-600">تعاون مع فريقك وشارك الموارد</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">إجمالي الفرق</p>
                                <p className="text-3xl font-black text-gray-900">{statistics.total}</p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <i className="fas fa-users text-white text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">الفرق التي أملكها</p>
                                <p className="text-3xl font-black text-gray-900">{statistics.ownedTeams}</p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                <i className="fas fa-crown text-white text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">فرق أنا عضو فيها</p>
                                <p className="text-3xl font-black text-gray-900">{statistics.memberTeams}</p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                <i className="fas fa-user-friends text-white text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">إجمالي الأعضاء</p>
                                <p className="text-3xl font-black text-gray-900">{statistics.totalMembers}</p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                                <i className="fas fa-user-plus text-white text-2xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {status && (
                        <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-semibold">
                            <i className="fas fa-check-circle ml-2"></i>
                            {status}
                        </div>
                    )}
                    {error && (
                        <Alert type="error" message={error} onClose={() => setError('')} />
                    )}
                </div>

                {loading ? (
                    <TeamsPageSkeleton />
                ) : (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-1">
                            <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
                                <div className="flex items-center mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center ml-3">
                                        <i className="fas fa-plus text-white"></i>
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800">إنشاء فريق جديد</h2>
                                </div>
                                <form onSubmit={handleCreateTeam} className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="new-team-name" className="text-sm font-bold text-slate-700 flex items-center">
                                            <i className="fas fa-tag ml-2 text-slate-400"></i>
                                            اسم الفريق
                                        </label>
                                        <input
                                            id="new-team-name"
                                            type="text"
                                            required
                                            className="form-input w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                            value={createForm.name}
                                            onChange={(event) =>
                                                setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="new-team-description" className="text-sm font-bold text-slate-700 flex items-center">
                                            <i className="fas fa-align-right ml-2 text-slate-400"></i>
                                            وصف مختصر (اختياري)
                                        </label>
                                        <textarea
                                            id="new-team-description"
                                            rows={3}
                                            className="form-textarea w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                            value={createForm.description}
                                            onChange={(event) =>
                                                setCreateForm((prev) => ({ ...prev, description: event.target.value }))
                                            }
                                        />
                                    </div>
                                    <Button type="submit" variant="secondary" fullWidth loading={createLoading} icon="fa-plus" size="lg">
                                        إنشاء الفريق
                                    </Button>
                                </form>
                            </div>

                            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4 flex items-center justify-between">
                                    <h2 className="text-lg font-black text-white flex items-center">
                                        <i className="fas fa-list ml-2"></i>
                                        قائمة الفرق
                                    </h2>
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-white font-bold">
                                        {filteredTeams.length}
                                    </span>
                                </div>
                                
                                <div className="p-4 border-b border-slate-200">
                                    <div className="relative">
                                        <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                                        <input
                                            type="text"
                                            placeholder="ابحث عن فريق..."
                                            className="w-full pr-10 pl-4 py-2 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                                    {filteredTeams.length === 0 && (
                                        <p className="p-4 text-sm text-slate-500 text-center">
                                            {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد فرق حتى الآن.'}
                                        </p>
                                    )}
                                    {filteredTeams.map((team) => (
                                        <div
                                            key={team.id}
                                            className={`p-4 transition ${
                                                selectedTeamId === team.id
                                                    ? 'bg-gradient-to-r from-indigo-50 to-blue-50 border-r-4 border-indigo-500'
                                                    : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => loadTeam(team.id)}
                                                    className="flex-1 text-right"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-bold ${
                                                                    selectedTeamId === team.id ? 'text-indigo-700' : 'text-slate-700'
                                                                }`}>
                                                                    {team.name}
                                                                </span>
                                                                {team.current_role === 'owner' && (
                                                                    <i className="fas fa-crown text-yellow-500 text-xs"></i>
                                                                )}
                                                            </div>
                                                            {team.description && (
                                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                                                    {team.description}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <span className="text-xs text-slate-500 flex items-center">
                                                                    <i className="fas fa-users ml-1 text-slate-400"></i>
                                                                    {team.members?.length ?? 0} عضو
                                                                </span>
                                                                {team.current_role && (
                                                                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                                                        {roleLabels[team.current_role] ?? team.current_role}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => setQuickViewTeam(team)}
                                                    className="px-3 py-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all hover:shadow-md border-2 border-transparent hover:border-indigo-200"
                                                    title="عرض سريع"
                                                >
                                                    <i className="fas fa-eye text-lg"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            {detailLoading || !selectedTeam ? (
                                selectedTeamId ? (
                                    <TeamDetailSkeleton />
                                ) : (
                                    <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
                                        <div className="text-center py-12">
                                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                                <i className="fas fa-users text-slate-400 text-3xl"></i>
                                            </div>
                                            <p className="text-slate-500 font-semibold">اختر فريقاً من القائمة أو أنشئ فريقاً جديداً</p>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg space-y-6">
                                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 -m-6 mb-6 p-6 rounded-t-2xl">
                                            <div className="flex items-center justify-between flex-wrap gap-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                                                        <i className="fas fa-users text-white text-2xl"></i>
                                                    </div>
                                                    <div>
                                                        <h2 className="text-2xl font-black text-white">{selectedTeam.name}</h2>
                                                        <p className="text-sm text-white/80 flex items-center gap-2 mt-1">
                                                            <i className="fas fa-crown text-yellow-300"></i>
                                                            {selectedTeam.owner?.name} ({selectedTeam.owner?.email})
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedTeam.permissions?.manage_team && (
                                                    <Button
                                                        type="button"
                                                        variant="danger"
                                                        icon="fa-trash"
                                                        onClick={handleDeleteTeam}
                                                        size="md"
                                                    >
                                                        حذف الفريق
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {selectedTeam.permissions?.manage_team ? (
                                            <form onSubmit={handleUpdateTeam} className="space-y-4">
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-slate-700 flex items-center">
                                                            <i className="fas fa-tag ml-2 text-slate-400"></i>
                                                            اسم الفريق
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            className="form-input w-full border-2 border-slate-200 rounded-lg px-4 py-2"
                                                            value={teamForm.name}
                                                            onChange={(event) =>
                                                                setTeamForm((prev) => ({ ...prev, name: event.target.value }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <label className="text-sm font-bold text-slate-700 flex items-center">
                                                            <i className="fas fa-align-right ml-2 text-slate-400"></i>
                                                            وصف الفريق
                                                        </label>
                                                        <textarea
                                                            rows={3}
                                                            className="form-textarea w-full border-2 border-slate-200 rounded-lg px-4 py-2"
                                                            value={teamForm.description}
                                                            onChange={(event) =>
                                                                setTeamForm((prev) => ({ ...prev, description: event.target.value }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 flex justify-end">
                                                        <Button type="submit" variant="primary" loading={teamFormLoading} icon="fa-save" size="lg">
                                                            حفظ التعديلات
                                                        </Button>
                                                    </div>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                                                <p className="text-slate-700">
                                                    {selectedTeam.description || 'لا يوجد وصف لهذا الفريق.'}
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 hover:shadow-lg transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-bold text-blue-600 mb-1">عدد الأعضاء</p>
                                                        <p className="text-3xl font-black text-blue-900">{activeTeamMembers.length}</p>
                                                    </div>
                                                    <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                                                        <i className="fas fa-users text-white text-xl"></i>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-5 hover:shadow-lg transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-bold text-green-600 mb-1">دورات مشتركة</p>
                                                        <p className="text-3xl font-black text-green-900">{sharedCourses.length}</p>
                                                    </div>
                                                    <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                                                        <i className="fas fa-book text-white text-xl"></i>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 p-5 hover:shadow-lg transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-bold text-purple-600 mb-1">مشاريع مشتركة</p>
                                                        <p className="text-3xl font-black text-purple-900">{sharedProjects.length}</p>
                                                    </div>
                                                    <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                                                        <i className="fas fa-folder text-white text-xl"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-black text-slate-800 flex items-center">
                                                <i className="fas fa-user-friends ml-2 text-indigo-500"></i>
                                                أعضاء الفريق
                                            </h3>
                                            {selectedTeam.permissions?.manage_members && (
                                                <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                                    يمكنك إضافة أعضاء أو تعديل أدوارهم
                                                </span>
                                            )}
                                        </div>

                                        {selectedTeam.permissions?.manage_members && (
                                            <form onSubmit={handleAddMember} className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl p-4 border-2 border-slate-200">
                                                <div className="grid gap-4 md:grid-cols-3">
                                                    <div className="md:col-span-2">
                                                        <input
                                                            type="email"
                                                            required
                                                            className="form-input w-full border-2 border-slate-200 rounded-lg px-4 py-2"
                                                            placeholder="member@example.com"
                                                            value={memberForm.email}
                                                            onChange={(event) =>
                                                                setMemberForm((prev) => ({ ...prev, email: event.target.value }))
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <select
                                                            className="form-select w-full border-2 border-slate-200 rounded-lg px-4 py-2"
                                                            value={memberForm.role}
                                                            onChange={(event) =>
                                                                setMemberForm((prev) => ({ ...prev, role: event.target.value }))
                                                            }
                                                        >
                                                            {Object.keys(roleLabels).map((role) => (
                                                                <option key={role} value={role}>
                                                                    {roleLabels[role]}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-3 flex justify-end">
                                                        <Button type="submit" variant="success" loading={memberLoading} icon="fa-user-plus" size="lg">
                                                            إضافة العضو
                                                        </Button>
                                                    </div>
                                                </div>
                                            </form>
                                        )}

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y-2 divide-slate-200 text-sm">
                                                <thead className="bg-gradient-to-r from-slate-100 to-blue-100/30 text-slate-700">
                                                    <tr>
                                                        <th className="px-4 py-3 text-right font-black">العضو</th>
                                                        <th className="px-4 py-3 text-right font-black">الدور</th>
                                                        <th className="px-4 py-3 text-right font-black">التحكم</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {activeTeamMembers.map((member) => (
                                                        <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                                        {member.user?.name?.charAt(0) || 'U'}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                                                            {member.user?.name}
                                                                            {member.is_owner && (
                                                                                <i className="fas fa-crown text-yellow-500 text-xs"></i>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-xs text-slate-500">{member.user?.email}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                                                                    {roleLabels[member.role] ?? member.role}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {selectedTeam.permissions?.manage_members ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <select
                                                                            className="form-select text-xs border-2 border-slate-200 rounded-lg px-3 py-1"
                                                                            value={member.role}
                                                                            onChange={(event) =>
                                                                                handleUpdateMemberRole(member.id, event.target.value)
                                                                            }
                                                                            disabled={member.is_owner}
                                                                        >
                                                                            {Object.keys(roleLabels).map((role) => (
                                                                                <option key={role} value={role}>
                                                                                    {roleLabels[role]}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        <Button
                                                                            type="button"
                                                                            variant="danger"
                                                                            icon="fa-user-minus"
                                                                            disabled={member.is_owner}
                                                                            onClick={() => handleRemoveMember(member.id)}
                                                                            size="sm"
                                                                        >
                                                                            إزالة
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {selectedTeam.permissions?.manage_resources && (
                                        <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-black text-slate-800 flex items-center">
                                                    <i className="fas fa-share-alt ml-2 text-indigo-500"></i>
                                                    الموارد المشتركة
                                                </h3>
                                                {resourcesLoading && (
                                                    <span className="text-xs text-slate-400 flex items-center gap-2">
                                                        <i className="fas fa-spinner fa-spin"></i>
                                                        جاري تحديث القائمة...
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className="border-2 border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-blue-50/20">
                                                    <h4 className="text-sm font-black text-slate-700 mb-3 flex items-center">
                                                        <i className="fas fa-book ml-2 text-green-500"></i>
                                                        الدورات
                                                    </h4>
                                                    {resourceOptions.courses.length === 0 ? (
                                                        <p className="text-sm text-slate-500">لا تملك أي دورات حالياً.</p>
                                                    ) : (
                                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                                            {resourceOptions.courses.map((course) => (
                                                                <label
                                                                    key={course.id}
                                                                    className="flex items-center justify-between gap-3 border-2 border-slate-200 rounded-lg px-4 py-3 hover:bg-white hover:shadow-md transition-all cursor-pointer"
                                                                >
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-bold text-slate-800">{course.name}</p>
                                                                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                                                            <i className={`fas fa-circle text-xs ${course.active ? 'text-green-500' : 'text-gray-400'}`}></i>
                                                                            {course.active ? 'نشطة' : 'غير نشطة'}
                                                                        </p>
                                                                    </div>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={course.shared}
                                                                        onChange={() => handleToggleCourse(course)}
                                                                        className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                                                    />
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="border-2 border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-purple-50/20">
                                                    <h4 className="text-sm font-black text-slate-700 mb-3 flex items-center">
                                                        <i className="fas fa-folder ml-2 text-purple-500"></i>
                                                        المشاريع
                                                    </h4>
                                                    {resourceOptions.projects.length === 0 ? (
                                                        <p className="text-sm text-slate-500">لا تملك أي مشاريع حالياً.</p>
                                                    ) : (
                                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                                            {resourceOptions.projects.map((project) => (
                                                                <label
                                                                    key={project.id}
                                                                    className="flex items-center justify-between gap-3 border-2 border-slate-200 rounded-lg px-4 py-3 hover:bg-white hover:shadow-md transition-all cursor-pointer"
                                                                >
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-bold text-slate-800">{project.name}</p>
                                                                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                                                            <i className="fas fa-info-circle text-xs"></i>
                                                                            الحالة: {project.status}
                                                                        </p>
                                                                    </div>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={project.shared}
                                                                        onChange={() => handleToggleProject(project)}
                                                                        className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                                                    />
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2 mt-4">
                                                <div className="border-2 border-green-200 rounded-xl p-4 bg-gradient-to-br from-green-50 to-green-100/30">
                                                    <h4 className="text-sm font-black text-green-700 mb-2 flex items-center">
                                                        <i className="fas fa-check-circle ml-2"></i>
                                                        الدورات المشتركة حالياً
                                                    </h4>
                                                    {sharedCourses.length === 0 ? (
                                                        <p className="text-sm text-slate-500">لم تتم مشاركة أي دورات بعد.</p>
                                                    ) : (
                                                        <ul className="space-y-1 text-sm text-slate-700">
                                                            {sharedCourses.map((course) => (
                                                                <li key={course.id} className="flex items-center gap-2">
                                                                    <i className="fas fa-book text-xs text-green-500"></i>
                                                                    {course.name}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                                <div className="border-2 border-purple-200 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-purple-100/30">
                                                    <h4 className="text-sm font-black text-purple-700 mb-2 flex items-center">
                                                        <i className="fas fa-check-circle ml-2"></i>
                                                        المشاريع المشتركة حالياً
                                                    </h4>
                                                    {sharedProjects.length === 0 ? (
                                                        <p className="text-sm text-slate-500">لم تتم مشاركة أي مشاريع بعد.</p>
                                                    ) : (
                                                        <ul className="space-y-1 text-sm text-slate-700">
                                                            {sharedProjects.map((project) => (
                                                                <li key={project.id} className="flex items-center gap-2">
                                                                    <i className="fas fa-folder text-xs text-purple-500"></i>
                                                                    {project.name}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Team Invitations */}
                                    {selectedTeam.permissions?.manage_members && (
                                        <TeamInvitations
                                            teamId={selectedTeam.id}
                                            teamName={selectedTeam.name}
                                        />
                                    )}

                                    {/* Team Tasks */}
                                    <TeamTasks
                                        teamId={selectedTeam.id}
                                        teamName={selectedTeam.name}
                                        members={activeTeamMembers}
                                    />

                                    {/* Team Activity Log */}
                                    <TeamActivityLog
                                        teamId={selectedTeam.id}
                                        teamName={selectedTeam.name}
                                    />

                                    {/* Team Analytics */}
                                    <TeamAnalytics
                                        teamId={selectedTeam.id}
                                        teamName={selectedTeam.name}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {quickViewTeam && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQuickViewTeam(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                                        <i className="fas fa-users text-white text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">{quickViewTeam.name}</h3>
                                        <p className="text-sm text-white/80">عرض سريع</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setQuickViewTeam(null)}
                                    className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all hover:scale-110"
                                >
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="text-sm font-black text-slate-600 mb-2 flex items-center">
                                    <i className="fas fa-align-right ml-2 text-slate-400"></i>
                                    الوصف
                                </h4>
                                <p className="text-slate-700 bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
                                    {quickViewTeam.description || 'لا يوجد وصف لهذا الفريق.'}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-black text-slate-600 mb-2 flex items-center">
                                    <i className="fas fa-crown ml-2 text-yellow-500"></i>
                                    المالك
                                </h4>
                                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                        {quickViewTeam.owner?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{quickViewTeam.owner?.name}</p>
                                        <p className="text-xs text-slate-500">{quickViewTeam.owner?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-black text-slate-600 mb-3 flex items-center">
                                    <i className="fas fa-chart-bar ml-2 text-indigo-500"></i>
                                    الإحصائيات
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border-2 border-blue-200 text-center">
                                        <i className="fas fa-users text-blue-500 text-2xl mb-2"></i>
                                        <p className="text-2xl font-black text-blue-900">{quickViewTeam.members?.length || 0}</p>
                                        <p className="text-xs text-blue-600 font-bold">أعضاء</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 rounded-xl border-2 border-green-200 text-center">
                                        <i className="fas fa-book text-green-500 text-2xl mb-2"></i>
                                        <p className="text-2xl font-black text-green-900">{quickViewTeam.courses?.length || 0}</p>
                                        <p className="text-xs text-green-600 font-bold">دورات</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl border-2 border-purple-200 text-center">
                                        <i className="fas fa-folder text-purple-500 text-2xl mb-2"></i>
                                        <p className="text-2xl font-black text-purple-900">{quickViewTeam.projects?.length || 0}</p>
                                        <p className="text-xs text-purple-600 font-bold">مشاريع</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-black text-slate-600 mb-2 flex items-center">
                                    <i className="fas fa-user-tag ml-2 text-slate-400"></i>
                                    دورك في الفريق
                                </h4>
                                <div className="bg-indigo-50 border-2 border-indigo-200 p-4 rounded-lg">
                                    <span className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold inline-flex items-center gap-2">
                                        {quickViewTeam.current_role === 'owner' && <i className="fas fa-crown"></i>}
                                        {roleLabels[quickViewTeam.current_role] || quickViewTeam.current_role}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setQuickViewTeam(null);
                                        loadTeam(quickViewTeam.id);
                                    }}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-external-link-alt"></i>
                                    <span>عرض التفاصيل الكاملة</span>
                                </button>
                                <button
                                    onClick={() => setQuickViewTeam(null)}
                                    className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-400 transition-all hover:shadow-md"
                                >
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Teams;
