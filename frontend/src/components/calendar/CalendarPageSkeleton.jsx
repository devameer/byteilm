import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const CalendarPageSkeleton = () => {
    const { darkMode } = useTheme();

    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className={`rounded-2xl shadow-sm border p-6 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
                <div className="flex items-center justify-between mb-4">
                    <div className={`h-8 rounded w-48 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                    <div className="flex gap-2">
                        <div className={`h-10 w-32 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                        <div className={`h-10 w-32 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`h-6 rounded w-64 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                </div>
            </div>

            {/* Stats Bar Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`rounded-xl shadow-sm border p-4 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div className="space-y-2 flex-1">
                                <div className={`h-4 rounded w-20 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                <div className={`h-8 rounded w-12 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                            </div>
                            <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Calendar Grid Skeleton */}
            <div className={`rounded-2xl shadow-sm border overflow-hidden ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
                {/* Calendar Header */}
                <div className={`grid grid-cols-7 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day, i) => (
                        <div key={i} className={`p-4 text-center border-r last:border-r-0 ${
                            darkMode ? 'border-gray-700' : 'border-gray-100'
                        }`}>
                            <div className={`h-5 rounded w-16 mx-auto ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className={`grid grid-cols-7 divide-x ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                    {Array.from({ length: 35 }).map((_, i) => (
                        <div key={i} className={`min-h-32 p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <div className={`h-6 w-6 rounded-full mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                            <div className="space-y-2">
                                {i % 3 === 0 && (
                                    <>
                                        <div className={`h-8 rounded ${darkMode ? 'bg-indigo-900/40' : 'bg-indigo-100'}`}></div>
                                        {i % 6 === 0 && <div className={`h-8 rounded ${darkMode ? 'bg-green-900/40' : 'bg-green-100'}`}></div>}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 rounded-2xl shadow-sm border p-6 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                    <div className={`h-6 rounded w-32 mb-4 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${
                                darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'
                            }`}>
                                <div className={`w-3 h-3 rounded-full mt-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                <div className="flex-1 space-y-2">
                                    <div className={`h-5 rounded w-3/4 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                    <div className={`h-3 rounded w-1/2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                    <div className="flex gap-2">
                                        <div className={`h-5 rounded-full w-16 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                        <div className={`h-5 rounded-full w-20 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Filters Skeleton */}
                    <div className={`rounded-2xl shadow-sm border p-6 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}>
                        <div className={`h-6 rounded w-24 mb-4 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="space-y-2">
                                    <div className={`h-4 rounded w-20 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                    <div className={`h-10 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats Skeleton */}
                    <div className={`rounded-2xl shadow-sm border p-6 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}>
                        <div className={`h-6 rounded w-32 mb-4 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${
                                    darkMode ? 'bg-gray-900' : 'bg-gray-50'
                                }`}>
                                    <div className={`h-4 rounded w-24 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                    <div className={`h-6 rounded w-8 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarPageSkeleton;
