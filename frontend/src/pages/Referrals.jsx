import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import referralService from '../services/referralService';
import Button from '../components/Button.jsx';
import ReferralsPageSkeleton from '../components/referrals/ReferralsPageSkeleton';

function Referrals() {
    const { darkMode } = useTheme();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copyMessage, setCopyMessage] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadSummary = async () => {
            try {
                const response = await referralService.getSummary();
                if (response.success && isMounted) {
                    setSummary(response.data);
                } else if (isMounted) {
                    setError('تعذر تحميل بيانات الإحالات حالياً.');
                }
            } catch (err) {
                if (isMounted) {
                    // Ignore canceled errors (they're not real errors, just duplicate request prevention)
                    if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
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
                        console.error("Network error loading referrals:", err);
                    }
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadSummary();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleCopy = useCallback((value) => {
        if (!value) {
            return;
        }

        if (!navigator?.clipboard) {
            setCopyMessage('متصفحك لا يدعم النسخ التلقائي، يرجى نسخ الرابط يدوياً.');
            setTimeout(() => setCopyMessage(''), 4000);
            return;
        }

        navigator.clipboard
            .writeText(value)
            .then(() => {
                setCopyMessage('تم نسخ الرابط إلى الحافظة ✅');
                setTimeout(() => setCopyMessage(''), 2500);
            })
            .catch(() => {
                setCopyMessage('تعذر نسخ الرابط تلقائياً، يمكنك نسخه يدوياً.');
                setTimeout(() => setCopyMessage(''), 4000);
            });
    }, []);

    // Safe access with defaults - must be before any conditional returns
    const statsData = summary?.stats || {};
    const pointsBalance = summary?.points_balance ?? 0;
    const rewardType = summary?.reward_type || 'points';
    const rewardPointsPerReferral = summary?.reward_points_per_referral ?? 0;
    const referralCode = summary?.code || '';
    const shareUrl = summary?.share_url || '';
    const recentReferrals = Array.isArray(summary?.recent_referrals) ? summary.recent_referrals : [];
    const recentVisits = Array.isArray(summary?.recent_visits) ? summary.recent_visits : [];

    // Move useMemo before conditional returns to follow Rules of Hooks
    const stats = useMemo(() => [
        {
            label: 'إجمالي الإحالات',
            value: statsData.total_referrals ?? 0,
            icon: 'fa-users',
            color: darkMode ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-50 text-indigo-600',
        },
        {
            label: 'قيد المعالجة',
            value: statsData.pending_referrals ?? 0,
            icon: 'fa-hourglass-half',
            color: darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-600',
        },
        {
            label: 'المكتملة',
            value: statsData.completed_referrals ?? 0,
            icon: 'fa-circle-check',
            color: darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-600',
        },
        {
            label: 'تمت مكافأتهم',
            value: statsData.rewarded_referrals ?? 0,
            icon: 'fa-gift',
            color: darkMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-600',
        },
    ], [statsData, darkMode]);

    // Conditional returns must come AFTER all hooks
    if (loading) {
        return <ReferralsPageSkeleton />;
    }

    if (error) {
        return (
            <div className={`p-8 rounded-xl shadow-sm border text-center transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-red-800' : 'bg-white border-red-200'
            }`}>
                <i className="fas fa-triangle-exclamation text-red-500 text-3xl mb-4" />
                <p className={`font-semibold mb-2 ${
                    darkMode ? 'text-red-400' : 'text-red-600'
                }`}>{error}</p>
                <p className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                    يرجى المحاولة لاحقاً أو التواصل مع فريق الدعم في حال استمرار المشكلة.
                </p>
            </div>
        );
    }

    if (!summary) {
        return null;
    }

    const clickStats = [
        {
            label: 'إجمالي النقرات',
            value: statsData.clicks_total ?? 0,
            icon: 'fa-mouse-pointer',
        },
        {
            label: 'زوار فريدون',
            value: statsData.clicks_unique ?? 0,
            icon: 'fa-user-check',
        },
        {
            label: 'تحويلات ناجحة',
            value: statsData.clicks_converted ?? 0,
            icon: 'fa-user-plus',
        },
    ];

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <div className={`rounded-2xl p-6 border shadow-sm transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className={`text-2xl font-bold mb-1 transition-colors duration-300 ${
                            darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>برنامج الإحالات</h1>
                        <p className={`transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            شارك رابطك الشخصي، وامنح أصدقاءك تجربة رائعة مع الحصول على مكافآت لكل تسجيل ناجح.
                        </p>
                    </div>
                    <div className="text-left">
                        <div className={`text-sm transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>رصيد النقاط</div>
                        <div className={`text-2xl font-semibold transition-colors duration-300 ${
                            darkMode ? 'text-indigo-400' : 'text-indigo-600'
                        }`}>
                            {Number(pointsBalance).toLocaleString('en-US')} نقطة
                        </div>
                        <p className={`text-xs mt-1 transition-colors duration-300 ${
                            darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                            {rewardType === 'points' && rewardPointsPerReferral > 0
                                ? `تحصل على ${rewardPointsPerReferral} نقطة عن كل إحالة ناجحة`
                                : 'تابع الإحصائيات لمعرفة مكافآتك'}
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className={`p-4 rounded-xl border transition-colors duration-300 ${
                        darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                    }`}>
                        <div className={`text-sm mb-1 transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>رمز الإحالة الخاص بك</div>
                        <div className="flex items-center justify-between gap-3">
                            <span className={`font-mono text-lg font-semibold transition-colors duration-300 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                                {referralCode || 'غير متوفر'}
                            </span>
                            {referralCode && (
                                <Button
                                    variant="outline"
                                    icon="fa-copy"
                                    onClick={() => handleCopy(referralCode)}
                                >
                                    نسخ الرمز
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl border transition-colors duration-300 ${
                        darkMode ? 'border-indigo-700 bg-indigo-900/30' : 'border-indigo-200 bg-indigo-50'
                    }`}>
                        <div className={`text-sm mb-1 transition-colors duration-300 ${
                            darkMode ? 'text-indigo-400' : 'text-indigo-600'
                        }`}>رابط المشاركة</div>
                        <div className="flex flex-col md:flex-row md:items-center md:gap-3">
                            <span className={`font-mono text-sm break-all transition-colors duration-300 ${
                                darkMode ? 'text-indigo-300' : 'text-indigo-700'
                            }`}>
                                {shareUrl || 'غير متوفر'}
                            </span>
                            {shareUrl && (
                                <Button
                                    variant="secondary"
                                    icon="fa-share-alt"
                                    className="mt-3 md:mt-0"
                                    onClick={() => handleCopy(shareUrl)}
                                >
                                    نسخ الرابط
                                </Button>
                            )}
                        </div>
                        {copyMessage && (
                            <p className={`text-xs mt-2 flex items-center gap-2 transition-colors duration-300 ${
                                darkMode ? 'text-indigo-300' : 'text-indigo-700'
                            }`}>
                                <i className="fas fa-info-circle" />
                                {copyMessage}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => (
                    <div
                        key={item.label}
                        className={`border rounded-2xl p-5 shadow-sm transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm transition-colors duration-300 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>{item.label}</p>
                                <p className={`text-2xl font-bold mt-1 transition-colors duration-300 ${
                                    darkMode ? 'text-gray-100' : 'text-gray-900'
                                }`}>
                                    {Number(item.value || 0).toLocaleString('en-US')}
                                </p>
                            </div>
                            <span className={`p-3 rounded-xl ${item.color}`}>
                                <i className={`fas ${item.icon}`} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={`rounded-2xl border p-6 shadow-sm transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
                <h2 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                    darkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>أداء الرابط</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    {clickStats.map((item) => (
                        <div
                            key={item.label}
                            className={`rounded-xl border p-4 transition-colors duration-300 ${
                                darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm transition-colors duration-300 ${
                                        darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>{item.label}</p>
                                    <p className={`text-xl font-semibold mt-1 transition-colors duration-300 ${
                                        darkMode ? 'text-gray-100' : 'text-gray-900'
                                    }`}>
                                        {Number(item.value || 0).toLocaleString('en-US')}
                                    </p>
                                </div>
                                <span className={`p-2 rounded-lg border transition-colors duration-300 ${
                                    darkMode 
                                        ? 'bg-gray-800 text-indigo-400 border-indigo-700' 
                                        : 'bg-white text-indigo-600 border-indigo-100'
                                }`}>
                                    <i className={`fas ${item.icon}`} />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className={`rounded-2xl border p-6 shadow-sm transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-lg font-semibold transition-colors duration-300 ${
                            darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>آخر الإحالات</h2>
                        <span className={`text-sm transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                            آخر {recentReferrals.length} إحالات مسجلة
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className={`min-w-full divide-y text-sm ${
                            darkMode ? 'divide-gray-700' : 'divide-gray-200'
                        }`}>
                            <thead className={`transition-colors duration-300 ${
                                darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-600'
                            }`}>
                                <tr>
                                    <th className="px-3 py-2 text-right font-semibold">المستخدم</th>
                                    <th className="px-3 py-2 text-right font-semibold">الحالة</th>
                                    <th className="px-3 py-2 text-right font-semibold">المكافأة</th>
                                    <th className="px-3 py-2 text-right font-semibold">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y transition-colors duration-300 ${
                                darkMode ? 'divide-gray-700' : 'divide-gray-100'
                            }`}>
                                {recentReferrals.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className={`px-3 py-6 text-center transition-colors duration-300 ${
                                                darkMode ? 'text-gray-400' : 'text-gray-500'
                                            }`}
                                        >
                                            لم يتم تسجيل إحالات بعد.
                                        </td>
                                    </tr>
                                ) : (
                                    recentReferrals.map((referral) => (
                                        <tr key={referral.id || Math.random()} className={`transition-colors duration-300 ${
                                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                        }`}>
                                            <td className="px-3 py-3">
                                                <div className={`font-semibold transition-colors duration-300 ${
                                                    darkMode ? 'text-gray-100' : 'text-gray-900'
                                                }`}>
                                                    {referral.referred_name || '—'}
                                                </div>
                                                <div className={`text-xs transition-colors duration-300 ${
                                                    darkMode ? 'text-gray-500' : 'text-gray-500'
                                                }`}>
                                                    {referral.referred_email || '—'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors duration-300 ${
                                                        referral.status === 'rewarded'
                                                            ? darkMode 
                                                                ? 'bg-emerald-900/30 text-emerald-300'
                                                                : 'bg-emerald-50 text-emerald-600'
                                                            : referral.status === 'completed'
                                                                ? darkMode
                                                                    ? 'bg-indigo-900/30 text-indigo-300'
                                                                    : 'bg-indigo-50 text-indigo-600'
                                                                : darkMode
                                                                    ? 'bg-amber-900/30 text-amber-300'
                                                                    : 'bg-amber-50 text-amber-600'
                                                    }`}
                                                >
                                                    {referral.status === 'pending'
                                                        ? 'قيد المعالجة'
                                                        : referral.status === 'completed'
                                                            ? 'مكتملة'
                                                            : referral.status === 'rewarded'
                                                                ? 'تم منح المكافأة'
                                                                : 'غير محدد'}
                                                </span>
                                            </td>
                                            <td className={`px-3 py-3 transition-colors duration-300 ${
                                                darkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                                {referral.reward_type === 'points' && referral.reward_value
                                                    ? `${Number(referral.reward_value || 0).toLocaleString('en-US')} نقطة`
                                                    : '—'}
                                            </td>
                                            <td className={`px-3 py-3 text-xs transition-colors duration-300 ${
                                                darkMode ? 'text-gray-500' : 'text-gray-500'
                                            }`}>
                                                {referral.rewarded_at || referral.completed_at || referral.created_at || '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={`rounded-2xl border p-6 shadow-sm transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-lg font-semibold transition-colors duration-300 ${
                            darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>أحدث النقرات</h2>
                        <span className={`text-sm transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                            آخر {recentVisits.length} زيارات مسجلة
                        </span>
                    </div>
                    <div className="space-y-4">
                        {recentVisits.length === 0 ? (
                            <div className={`text-center py-6 transition-colors duration-300 ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                                لم يتم تسجيل زيارات بعد.
                            </div>
                        ) : (
                            recentVisits.map((visit) => (
                                <div
                                    key={visit.id || Math.random()}
                                    className={`border rounded-xl p-4 transition-colors duration-300 ${
                                        darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`font-semibold transition-colors duration-300 ${
                                            darkMode ? 'text-gray-100' : 'text-gray-900'
                                        }`}>
                                            {visit.ip_address || 'عنوان غير معروف'}
                                        </div>
                                        <span
                                            className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors duration-300 ${
                                                visit.converted
                                                    ? darkMode
                                                        ? 'bg-emerald-900/30 text-emerald-300'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                    : darkMode
                                                        ? 'bg-gray-700 text-gray-400'
                                                        : 'bg-gray-200 text-gray-600'
                                            }`}
                                        >
                                            {visit.converted ? 'تحوّل ناجح' : 'زيارة فقط'}
                                        </span>
                                    </div>
                                    <div className={`text-xs space-y-1 transition-colors duration-300 ${
                                        darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                        {visit.landing_page && (
                                            <div>
                                                <i className="fas fa-link ml-1 text-indigo-500" />
                                                {visit.landing_page}
                                            </div>
                                        )}
                                        {visit.created_at && (
                                            <div>
                                                <i className="fas fa-clock ml-1 text-indigo-500" />
                                                {visit.created_at}
                                            </div>
                                        )}
                                        {visit.converted_at && (
                                            <div>
                                                <i className="fas fa-check ml-1 text-emerald-500" />
                                                تحويل: {visit.converted_at}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className={`rounded-2xl border p-6 shadow-sm transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
                <h2 className={`text-lg font-semibold mb-3 transition-colors duration-300 ${
                    darkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>كيف يعمل برنامج الإحالة؟</h2>
                <ol className={`list-decimal list-inside space-y-2 text-sm transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                    <li>انسخ رابط الإحالة الخاص بك وشاركه مع أصدقائك عبر البريد أو منصات التواصل.</li>
                    <li>عندما يقوم صديقك بالتسجيل عبر الرابط، يتم تسجيل الإحالة تلقائياً.</li>
                    <li>بعد اكتمال التسجيل، تُضاف مكافأتك إلى رصيد النقاط ويمكنك متابعتها من هذه الصفحة.</li>
                </ol>
            </div>
        </div>
        </div>
    );
}

export default Referrals;
