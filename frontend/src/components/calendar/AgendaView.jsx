import React, { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext";

function AgendaView({ currentDate, calendarData, onEventClick, onComplete }) {
    const { darkMode } = useTheme();
    // Get next 7 days starting from current date
    const agendaDays = useMemo(() => {
        const days = [];
        const today = new Date(currentDate);

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            const dateStr = date.toISOString().split('T')[0];
            const items = calendarData?.items_by_date?.[dateStr] || [];

            days.push({
                date,
                dateStr,
                items: items.sort((a, b) => {
                    // Sort by time if available, then by priority
                    const timeA = a.scheduled_time || "09:00";
                    const timeB = b.scheduled_time || "09:00";
                    return timeA.localeCompare(timeB);
                }),
            });
        }

        return days;
    }, [currentDate, calendarData]);

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isTomorrow = (date) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return date.toDateString() === tomorrow.toDateString();
    };

    const getDayLabel = (date) => {
        if (isToday(date)) return "اليوم";
        if (isTomorrow(date)) return "غداً";
        return date.toLocaleDateString('ar-EG', { weekday: 'long' });
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            urgent: { text: "عاجل", color: "bg-red-100 text-red-700" },
            high: { text: "عالي", color: "bg-orange-100 text-orange-700" },
            medium: { text: "متوسط", color: "bg-blue-100 text-blue-700" },
            low: { text: "منخفض", color: "bg-gray-100 text-gray-700" },
        };
        return badges[priority] || badges.low;
    };

    const getTypeIcon = (isLesson) => {
        return isLesson ? (
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            </div>
        ) : (
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            </div>
        );
    };

    const totalTasks = agendaDays.reduce((sum, day) => sum + day.items.length, 0);

    return (
        <div className={`rounded-2xl shadow-sm border transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className={`text-2xl font-black ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            جدول الأعمال
                        </h2>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            الأسبوع القادم
                        </p>
                    </div>
                    <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {totalTasks} {totalTasks === 1 ? 'مهمة' : 'مهام'}
                    </div>
                </div>
            </div>

            <div className="p-6 max-h-[600px] overflow-y-auto">
                {totalTasks === 0 ? (
                    <div className="text-center py-12">
                        <svg className={`w-16 h-16 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>لا توجد مهام قادمة</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {agendaDays.map(({ date, dateStr, items }) => (
                            <div key={dateStr}>
                                {/* Date Header */}
                                <div className={`sticky top-0 z-10 pb-3 mb-4 border-b-2 ${
                                    isToday(date)
                                        ? 'border-indigo-600'
                                        : darkMode ? 'border-gray-700' : 'border-gray-200'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`text-center rounded-xl p-3 min-w-[70px] ${
                                            isToday(date)
                                                ? 'bg-indigo-600 text-white'
                                                : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            <div className="text-2xl font-black">
                                                {date.getDate()}
                                            </div>
                                            <div className="text-xs font-medium">
                                                {date.toLocaleDateString('ar-EG', { month: 'short' })}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className={`text-lg font-black ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                                {getDayLabel(date)}
                                            </h3>
                                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                        {items.length > 0 && (
                                            <div className="mr-auto">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                                                    {items.length} {items.length === 1 ? 'مهمة' : 'مهام'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Tasks List */}
                                {items.length > 0 ? (
                                    <div className="space-y-3">
                                        {items.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => onEventClick(item)}
                                                className={`group rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                                                    darkMode
                                                        ? 'bg-gray-900 hover:bg-gray-700 border border-gray-700 hover:border-indigo-500'
                                                        : 'bg-gray-50 hover:bg-white border border-gray-200 hover:border-indigo-300'
                                                }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Icon */}
                                                    {getTypeIcon(item.is_lesson)}

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <h4 className={`font-bold text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                                                {item.title}
                                                            </h4>
                                                            {item.scheduled_time && (
                                                                <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700">
                                                                    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    {item.scheduled_time}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {item.description && (
                                                            <p className={`text-sm mb-3 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {item.description}
                                                            </p>
                                                        )}

                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {item.priority && (
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${getPriorityBadge(item.priority).color}`}>
                                                                    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                                                    </svg>
                                                                    {getPriorityBadge(item.priority).text}
                                                                </span>
                                                            )}
                                                            {item.course && (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
                                                                    {item.course.name}
                                                                </span>
                                                            )}
                                                            {item.project && (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
                                                                    {item.project.name}
                                                                </span>
                                                            )}
                                                            {item.estimated_duration && (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                                                    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    {item.estimated_duration} دقيقة
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    {item.status !== "completed" && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onComplete(item);
                                                            }}
                                                            className={`flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 text-green-600 rounded-lg transition-all ${
                                                                darkMode ? 'hover:bg-green-900/30' : 'hover:bg-green-50'
                                                            }`}
                                                            title="إكمال"
                                                        >
                                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={`text-center py-8 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <svg className={`w-12 h-12 mx-auto mb-2 opacity-50 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        لا توجد مهام في هذا اليوم
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AgendaView;
