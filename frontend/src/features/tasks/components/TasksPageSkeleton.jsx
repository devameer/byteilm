import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

const TasksPageSkeleton = () => {
    const { darkMode } = useTheme();
    
    return (
        <div className={`rounded-2xl shadow-sm border p-8 transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
            <div className="space-y-6 animate-pulse">
                {/* Stats Bar Skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`rounded-xl p-4 border ${
                            darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'
                        }`}>
                            <div className={`h-4 rounded w-20 mb-2 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-8 rounded w-12 ${
                                darkMode ? 'bg-gray-600' : 'bg-gray-300'
                            }`}></div>
                        </div>
                    ))}
                </div>

                {/* Task Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className={`rounded-xl shadow-sm border-2 p-6 ${
                            darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 space-y-2">
                                    <div className={`h-5 rounded w-3/4 ${
                                        darkMode ? 'bg-gray-600' : 'bg-gray-300'
                                    }`}></div>
                                    <div className={`h-3 rounded w-1/2 ${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}></div>
                                </div>
                                <div className={`w-6 h-6 rounded ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2 mb-4">
                                <div className={`h-3 rounded w-full ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                                <div className={`h-3 rounded w-5/6 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <div className={`h-6 rounded-full w-20 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                                <div className={`h-6 rounded-full w-16 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                            </div>

                            {/* Footer */}
                            <div className={`flex items-center justify-between pt-4 border-t ${
                                darkMode ? 'border-gray-700' : 'border-gray-100'
                            }`}>
                                <div className={`h-4 rounded w-24 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                                <div className="flex gap-2">
                                    <div className={`w-8 h-8 rounded-lg ${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}></div>
                                    <div className={`w-8 h-8 rounded-lg ${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TasksPageSkeleton;
