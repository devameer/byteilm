import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import teamService from '../services/teamService';
import Button from '../components/Button';

const JoinTeam = () => {
    const { darkMode } = useTheme();
    const { token } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [teamInfo, setTeamInfo] = useState(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                // Redirect to login with return URL
                navigate(`/login?redirect=/teams/join/${token}`);
            } else {
                handleJoinTeam();
            }
        }
    }, [authLoading, user, token]);

    const handleJoinTeam = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await teamService.acceptInvitation(token);

            if (response.success) {
                setSuccess(true);
                setTeamInfo(response.data);

                // Redirect to teams page after 3 seconds
                setTimeout(() => {
                    navigate('/teams');
                }, 3000);
            } else {
                setError(response.message || 'فشل الانضمام إلى الفريق');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'حدث خطأ أثناء الانضمام إلى الفريق';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${
                darkMode
                    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
                    : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
            }`} dir="rtl">
                <div className={`rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
                        <i className="fas fa-spinner fa-spin text-white text-3xl"></i>
                    </div>
                    <h2 className={`text-2xl font-black mb-2 ${
                        darkMode ? 'text-gray-100' : 'text-slate-800'
                    }`}>جاري المعالجة...</h2>
                    <p className={darkMode ? 'text-gray-400' : 'text-slate-600'}>يرجى الانتظار قليلاً</p>
                </div>
            </div>
        );
    }

    if (success && teamInfo) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${
                darkMode
                    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
                    : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
            }`} dir="rtl">
                <div className={`rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <i className="fas fa-check text-white text-4xl"></i>
                    </div>
                    <h2 className={`text-2xl font-black mb-2 transition-colors duration-300 ${
                        darkMode ? 'text-gray-100' : 'text-slate-800'
                    }`}>مرحباً بك في الفريق!</h2>
                    <p className={`mb-6 transition-colors duration-300 ${
                        darkMode ? 'text-gray-400' : 'text-slate-600'
                    }`}>تم انضمامك بنجاح إلى فريق</p>

                    <div className={`bg-gradient-to-r rounded-xl p-6 mb-6 border-2 transition-colors duration-300 ${
                        darkMode
                            ? 'from-indigo-900/30 to-blue-900/30 border-indigo-700'
                            : 'from-indigo-50 to-blue-50 border-indigo-200'
                    }`}>
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center">
                                <i className="fas fa-users text-white text-xl"></i>
                            </div>
                            <h3 className={`text-xl font-black transition-colors duration-300 ${
                                darkMode ? 'text-gray-100' : 'text-slate-800'
                            }`}>{teamInfo.team?.name || 'الفريق'}</h3>
                        </div>
                        {teamInfo.team?.description && (
                            <p className={`text-sm transition-colors duration-300 ${
                                darkMode ? 'text-gray-400' : 'text-slate-600'
                            }`}>{teamInfo.team.description}</p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Button
                            type="button"
                            variant="primary"
                            fullWidth
                            onClick={() => navigate('/teams')}
                            icon="fa-arrow-left"
                        >
                            الانتقال إلى صفحة الفرق
                        </Button>
                        <p className={`text-xs transition-colors duration-300 ${
                            darkMode ? 'text-gray-500' : 'text-slate-400'
                        }`}>سيتم تحويلك تلقائياً خلال 3 ثوانٍ...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${
                darkMode
                    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
                    : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
            }`} dir="rtl">
                <div className={`rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                        <i className="fas fa-exclamation-triangle text-white text-4xl"></i>
                    </div>
                    <h2 className={`text-2xl font-black mb-2 transition-colors duration-300 ${
                        darkMode ? 'text-gray-100' : 'text-slate-800'
                    }`}>حدث خطأ</h2>
                    <p className={`mb-6 transition-colors duration-300 ${
                        darkMode ? 'text-gray-400' : 'text-slate-600'
                    }`}>{error}</p>

                    <div className={`border-2 rounded-xl p-4 mb-6 transition-colors duration-300 ${
                        darkMode
                            ? 'bg-red-900/30 border-red-800'
                            : 'bg-red-50 border-red-200'
                    }`}>
                        <p className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
                            darkMode ? 'text-red-300' : 'text-red-700'
                        }`}>الأسباب المحتملة:</p>
                        <ul className={`text-xs text-right space-y-1 transition-colors duration-300 ${
                            darkMode ? 'text-red-400' : 'text-red-600'
                        }`}>
                            <li>• الرابط منتهي الصلاحية</li>
                            <li>• الرابط تم استخدامه بالكامل</li>
                            <li>• الرابط تم إلغاؤه من قبل مدير الفريق</li>
                            <li>• أنت بالفعل عضو في هذا الفريق</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <Button
                            type="button"
                            variant="primary"
                            fullWidth
                            onClick={() => navigate('/teams')}
                            icon="fa-arrow-left"
                        >
                            الانتقال إلى صفحة الفرق
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            fullWidth
                            onClick={() => navigate('/dashboard')}
                            icon="fa-home"
                        >
                            العودة إلى لوحة التحكم
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default JoinTeam;
