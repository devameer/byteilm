import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

function TimelineView({ date, items, onEventClick, onComplete }) {
    const { darkMode } = useTheme();
    // Generate time slots from 6 AM to 11 PM
    const timeSlots = [];
    for (let hour = 6; hour < 24; hour++) {
        timeSlots.push({
            hour,
            label: hour > 12 ? `${hour - 12}:00 م` : hour === 12 ? `${hour}:00 م` : `${hour}:00 ص`,
        });
    }

    // Group items by hour
    const itemsByHour = items.reduce((acc, item) => {
        // If item has a time in scheduled_date, extract it
        let hour = 9; // Default to 9 AM if no time specified

        if (item.scheduled_time) {
            const [h] = item.scheduled_time.split(":");
            hour = parseInt(h, 10);
        }

        if (!acc[hour]) acc[hour] = [];
        acc[hour].push(item);
        return acc;
    }, {});

    const getPriorityColor = (priority) => {
        if (darkMode) {
            switch (priority) {
                case "urgent": return "border-l-red-500 bg-red-900/30";
                case "high": return "border-l-orange-500 bg-orange-900/30";
                case "medium": return "border-l-blue-500 bg-blue-900/30";
                default: return "border-l-gray-500 bg-gray-800";
            }
        } else {
            switch (priority) {
                case "urgent": return "border-l-red-500 bg-red-50";
                case "high": return "border-l-orange-500 bg-orange-50";
                case "medium": return "border-l-blue-500 bg-blue-50";
                default: return "border-l-gray-500 bg-gray-50";
            }
        }
    };

    const getTypeIcon = (isLesson) => {
        return isLesson ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        );
    };

    return (
        <div className={`rounded-2xl shadow-sm border transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className={`text-2xl font-black ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            جدول اليوم
                        </h2>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {items.length} {items.length === 1 ? 'مهمة' : 'مهام'}
                    </div>
                </div>
            </div>

            <div className="p-6 max-h-[600px] overflow-y-auto">
                {items.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className={`w-16 h-16 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>لا توجد مهام في هذا اليوم</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {timeSlots.map(({ hour, label }) => {
                            const hourItems = itemsByHour[hour] || [];

                            return (
                                <div key={hour} className="flex items-start gap-4">
                                    {/* Time label */}
                                    <div className={`w-20 text-sm font-semibold pt-3 text-left flex-shrink-0 ${
                                        darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                        {label}
                                    </div>

                                    {/* Timeline bar */}
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-3 h-3 rounded-full mt-3.5 ${
                                            darkMode ? 'bg-indigo-500' : 'bg-indigo-600'
                                        }`}></div>
                                        <div className={`absolute top-6 bottom-0 right-[5px] w-0.5 ${
                                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                        }`}></div>
                                    </div>

                                    {/* Events */}
                                    <div className="flex-1 pb-6 space-y-2">
                                        {hourItems.length > 0 ? (
                                            hourItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className={`border-r-4 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(item.priority)}`}
                                                    onClick={() => onEventClick(item)}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                                    {getTypeIcon(item.is_lesson)}
                                                                </div>
                                                                <h4 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                                                    {item.title}
                                                                </h4>
                                                            </div>

                                                            {item.description && (
                                                                <p className={`text-sm mt-1 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                    {item.description}
                                                                </p>
                                                            )}

                                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                                {item.course && (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
                                                                        <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                                                        </svg>
                                                                        {item.course.name}
                                                                    </span>
                                                                )}
                                                                {item.project && (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
                                                                        <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                                                        </svg>
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

                                                        {item.status !== "completed" && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onComplete(item);
                                                                }}
                                                                className={`flex-shrink-0 p-2 text-green-600 rounded-lg transition-colors ${
                                                                    darkMode ? 'hover:bg-green-900/30' : 'hover:bg-green-50'
                                                                }`}
                                                                title="إكمال"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className={`text-sm py-2 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                                                لا توجد مهام
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TimelineView;
