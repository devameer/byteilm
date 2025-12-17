import React, { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext";

function ProductivityWidget({ todayItems, weekItems, completedToday = 0, totalToday = 0 }) {
    const { darkMode } = useTheme();
    const stats = useMemo(() => {
        const completed = completedToday;
        const total = totalToday;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Calculate streak (مثال بسيط - يمكن تطويره ليعتمد على بيانات حقيقية)
        const streak = 7;

        // Performance rating
        let rating = "ممتاز";
        let ratingColor = "text-green-600";
        let ratingIcon = "🌟";

        if (completionRate >= 80) {
            rating = "ممتاز";
            ratingColor = "text-green-600";
            ratingIcon = "🌟";
        } else if (completionRate >= 60) {
            rating = "جيد جداً";
            ratingColor = "text-blue-600";
            ratingIcon = "⭐";
        } else if (completionRate >= 40) {
            rating = "جيد";
            ratingColor = "text-yellow-600";
            ratingIcon = "⚡";
        } else {
            rating = "يحتاج تحسين";
            ratingColor = "text-orange-600";
            ratingIcon = "💪";
        }

        return {
            completed,
            total,
            completionRate,
            streak,
            rating,
            ratingColor,
            ratingIcon,
        };
    }, [completedToday, totalToday]);

    return (
        <div className={`rounded-2xl shadow-lg p-6 transition-colors duration-300 ${
            darkMode
                ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-gray-100'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
        }`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-black">لوحة الإنتاجية</h3>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-indigo-200' : 'text-indigo-100'}`}>أداؤك اليوم</p>
                </div>
                <div className="text-4xl">{stats.ratingIcon}</div>
            </div>

            {/* Completion Circle */}
            <div className="relative mb-6">
                <svg className="w-32 h-32 mx-auto -rotate-90">
                    <circle
                        cx="50%"
                        cy="50%"
                        r="58"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="8"
                        fill="none"
                    />
                    <circle
                        cx="50%"
                        cy="50%"
                        r="58"
                        stroke="white"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 58}`}
                        strokeDashoffset={`${2 * Math.PI * 58 * (1 - stats.completionRate / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                    />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-3xl font-black">{stats.completionRate}%</div>
                        <div className={`text-xs ${darkMode ? 'text-indigo-200' : 'text-indigo-100'}`}>معدل الإنجاز</div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`backdrop-blur-sm rounded-xl p-3 ${
                    darkMode ? 'bg-white/5' : 'bg-white/10'
                }`}>
                    <div className="text-2xl font-black">{stats.completed}/{stats.total}</div>
                    <div className={`text-xs mt-1 ${darkMode ? 'text-indigo-200' : 'text-indigo-100'}`}>مهام مكتملة</div>
                </div>

                <div className={`backdrop-blur-sm rounded-xl p-3 ${
                    darkMode ? 'bg-white/5' : 'bg-white/10'
                }`}>
                    <div className="text-2xl font-black flex items-center gap-1">
                        {stats.streak} 🔥
                    </div>
                    <div className={`text-xs mt-1 ${darkMode ? 'text-indigo-200' : 'text-indigo-100'}`}>أيام متتالية</div>
                </div>
            </div>

            {/* Rating */}
            <div className={`backdrop-blur-sm rounded-xl p-3 text-center ${
                darkMode ? 'bg-white/5' : 'bg-white/10'
            }`}>
                <div className={`text-sm font-semibold ${darkMode ? 'text-indigo-200' : 'text-indigo-100'}`}>تقييم الأداء</div>
                <div className={`text-xl font-black mt-1 ${stats.ratingColor.replace('text-', 'text-white')}`}>
                    {stats.rating}
                </div>
            </div>

            {/* Quick Tips */}
            <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-white/10' : 'border-white/20'}`}>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-indigo-200' : 'text-indigo-100'}`}>
                    {stats.completionRate >= 80 ? (
                        "رائع! أنت في حالة إنتاجية عالية 🚀"
                    ) : stats.completionRate >= 60 ? (
                        "أداء جيد! استمر في التركيز 💪"
                    ) : stats.completionRate >= 40 ? (
                        "يمكنك فعل المزيد! حاول استخدام مؤقت بومودورو ⏱️"
                    ) : (
                        "ابدأ بمهمة صغيرة لبناء الزخم! 🎯"
                    )}
                </p>
            </div>
        </div>
    );
}

export default ProductivityWidget;
