import React, { useState, useEffect } from 'react';
import Button from '../Button';
import teamService from '../../services/teamService';
import { useTheme } from '../../contexts/ThemeContext';

const TeamInvitations = ({ teamId, teamName }) => {
    const { darkMode } = useTheme();
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        role: 'member',
        expires_in_days: 7,
        max_uses: 1,
    });

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
    const itemCardClass = darkMode 
        ? 'border-gray-700 hover:border-indigo-500' 
        : 'border-slate-200 hover:border-indigo-300';
    const linkBoxClass = darkMode 
        ? 'bg-gray-700 border-gray-600 text-gray-300' 
        : 'bg-slate-50 border-slate-200 text-slate-700';

    useEffect(() => {
        if (teamId) {
            loadInvitations();
        }
    }, [teamId]);

    const loadInvitations = async () => {
        setLoading(true);
        try {
            const response = await teamService.getInvitations(teamId);
            if (response.success) {
                setInvitations(response.data || []);
            }
        } catch (error) {
            console.error('Error loading invitations:', error);
        } finally {
            setLoading(false);
        }
    };

    const createInvitation = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const response = await teamService.createInvitation(teamId, inviteForm);
            if (response.success) {
                setInvitations([response.data, ...invitations]);
                setShowCreateForm(false);
                setInviteForm({ role: 'member', expires_in_days: 7, max_uses: 1 });
            }
        } catch (error) {
            console.error('Error creating invitation:', error);
        } finally {
            setCreating(false);
        }
    };

    const revokeInvitation = async (invitationId) => {
        if (!confirm('هل تريد إلغاء هذه الدعوة؟')) return;

        try {
            const response = await teamService.revokeInvitation(teamId, invitationId);
            if (response.success) {
                setInvitations(invitations.filter(inv => inv.id !== invitationId));
            }
        } catch (error) {
            console.error('Error revoking invitation:', error);
        }
    };

    const copyInviteLink = (invitation) => {
        const link = `${window.location.origin}/teams/join/${invitation.token}`;
        navigator.clipboard.writeText(link);
        setCopiedId(invitation.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getStatusBadge = (invitation) => {
        if (invitation.revoked_at) {
            return <span className={`px-2 py-1 ${darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'} rounded-full text-xs font-bold`}>ملغاة</span>;
        }
        if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
            return <span className={`px-2 py-1 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} rounded-full text-xs font-bold`}>منتهية</span>;
        }
        if (invitation.max_uses && invitation.uses_count >= invitation.max_uses) {
            return <span className={`px-2 py-1 ${darkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'} rounded-full text-xs font-bold`}>مستنفذة</span>;
        }
        return <span className={`px-2 py-1 ${darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'} rounded-full text-xs font-bold`}>نشطة</span>;
    };

    return (
        <div className={`${cardClass} rounded-2xl p-6 border-2 shadow-lg`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-black ${textPrimary} flex items-center`}>
                    <i className="fas fa-link ml-2 text-indigo-500"></i>
                    روابط الدعوة
                </h3>
                <Button
                    type="button"
                    variant="primary"
                    icon="fa-plus"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    size="sm"
                >
                    {showCreateForm ? 'إلغاء' : 'إنشاء رابط دعوة'}
                </Button>
            </div>

            {showCreateForm && (
                <form onSubmit={createInvitation} className={`mb-6 rounded-xl p-4 border-2 ${darkMode ? 'bg-indigo-900/30 border-indigo-700' : 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200'}`}>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-slate-700'} mb-2`}>
                                <i className={`fas fa-user-tag ml-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}></i>
                                الدور
                            </label>
                            <select
                                className={`form-select w-full border-2 rounded-lg px-3 py-2 ${inputClass}`}
                                value={inviteForm.role}
                                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                            >
                                <option value="member">عضو</option>
                                <option value="viewer">مشاهد</option>
                            </select>
                        </div>
                        <div>
                            <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-slate-700'} mb-2`}>
                                <i className={`fas fa-calendar-alt ml-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}></i>
                                صلاحية الرابط (أيام)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="30"
                                className={`form-input w-full border-2 rounded-lg px-3 py-2 ${inputClass}`}
                                value={inviteForm.expires_in_days}
                                onChange={(e) => setInviteForm({ ...inviteForm, expires_in_days: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-slate-700'} mb-2`}>
                                <i className={`fas fa-hashtag ml-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}></i>
                                عدد الاستخدامات
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                className={`form-input w-full border-2 rounded-lg px-3 py-2 ${inputClass}`}
                                value={inviteForm.max_uses}
                                onChange={(e) => setInviteForm({ ...inviteForm, max_uses: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button type="submit" variant="success" loading={creating} icon="fa-check">
                            إنشاء الرابط
                        </Button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i>
                    <p className={`mt-2 ${textSecondary}`}>جاري التحميل...</p>
                </div>
            ) : invitations.length === 0 ? (
                <div className={`text-center py-12 ${emptyBg} rounded-xl`}>
                    <i className={`fas fa-link text-4xl ${darkMode ? 'text-gray-600' : 'text-slate-300'} mb-3`}></i>
                    <p className={textSecondary}>لم يتم إنشاء أي روابط دعوة بعد</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'} mt-1`}>أنشئ رابط دعوة لدعوة أعضاء جدد للفريق</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {invitations.map((invitation) => (
                        <div
                            key={invitation.id}
                            className={`border-2 ${itemCardClass} rounded-xl p-4 hover:shadow-md transition-all`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        {getStatusBadge(invitation)}
                                        <span className={`px-2 py-1 ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'} rounded-full text-xs font-bold`}>
                                            {invitation.role === 'member' ? 'عضو' : 'مشاهد'}
                                        </span>
                                    </div>

                                    <div className={`${linkBoxClass} rounded-lg p-3 mb-2 font-mono text-sm break-all border`}>
                                        {`${window.location.origin}/teams/join/${invitation.token}`}
                                    </div>

                                    <div className={`flex flex-wrap gap-3 text-xs ${textSecondary}`}>
                                        <span className="flex items-center gap-1">
                                            <i className="fas fa-calendar"></i>
                                            ينتهي: {new Date(invitation.expires_at).toLocaleDateString('ar-SA')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <i className="fas fa-chart-line"></i>
                                            الاستخدامات: {invitation.uses_count}/{invitation.max_uses || '∞'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <i className="fas fa-user"></i>
                                            بواسطة: {invitation.created_by?.name}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => copyInviteLink(invitation)}
                                        className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-bold transition-all hover:shadow-md flex items-center gap-2"
                                        title="نسخ الرابط"
                                    >
                                        <i className={`fas ${copiedId === invitation.id ? 'fa-check' : 'fa-copy'}`}></i>
                                        {copiedId === invitation.id ? 'تم النسخ' : 'نسخ'}
                                    </button>
                                    {!invitation.revoked_at && (
                                        <button
                                            onClick={() => revokeInvitation(invitation.id)}
                                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-all hover:shadow-md"
                                            title="إلغاء الدعوة"
                                        >
                                            <i className="fas fa-ban"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeamInvitations;
