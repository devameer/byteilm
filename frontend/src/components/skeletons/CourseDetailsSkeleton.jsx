import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const CourseDetailsSkeleton = () => {
    const { darkMode } = useTheme();
    
    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
                : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
        }`}>
            <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-5 animate-pulse">
                {/* Breadcrumb Skeleton */}
                <div className="space-y-3">
                    <div className={`h-4 rounded w-48 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-8 rounded w-64 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-4 rounded w-40 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                </div>

                {/* Action Buttons Skeleton */}
                <div className="flex gap-2">
                    <div className={`h-10 rounded-lg w-32 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-10 rounded-lg w-32 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-10 rounded-lg w-32 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Main Content Skeleton */}
                    <div className={`lg:col-span-2 rounded-lg shadow-sm border p-5 space-y-5 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                        {/* Image Skeleton */}
                        <div className={`w-full h-60 rounded-lg ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>

                        {/* Stats Cards Skeleton */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`border rounded-lg p-4 ${
                                darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                            }`}>
                                <div className={`h-3 rounded w-20 mb-2 ${
                                    darkMode ? 'bg-gray-600' : 'bg-gray-300'
                                }`}></div>
                                <div className={`h-8 rounded w-12 ${
                                    darkMode ? 'bg-gray-600' : 'bg-gray-300'
                                }`}></div>
                            </div>
                            <div className={`border rounded-lg p-4 ${
                                darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                            }`}>
                                <div className={`h-3 rounded w-20 mb-2 ${
                                    darkMode ? 'bg-gray-600' : 'bg-gray-300'
                                }`}></div>
                                <div className={`h-8 rounded w-12 ${
                                    darkMode ? 'bg-gray-600' : 'bg-gray-300'
                                }`}></div>
                            </div>
                        </div>

                        {/* Progress Bar Skeleton */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <div className={`h-4 rounded w-24 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                                <div className={`h-4 rounded w-12 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                            </div>
                            <div className={`h-2.5 rounded-full ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                        </div>

                        {/* Lessons List Skeleton */}
                        <div className="space-y-3 mt-8">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className={`border rounded-lg p-4 ${
                                    darkMode ? 'bg-gray-900/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 space-y-2">
                                            <div className={`h-5 rounded w-3/4 ${
                                                darkMode ? 'bg-gray-600' : 'bg-gray-300'
                                            }`}></div>
                                            <div className={`h-3 rounded w-1/2 ${
                                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                            }`}></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className={`h-8 w-8 rounded ${
                                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                            }`}></div>
                                            <div className={`h-8 w-8 rounded ${
                                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                            }`}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="space-y-4">
                        <div className={`rounded-lg shadow-sm border p-5 space-y-4 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <div className={`h-6 rounded w-32 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-4 rounded w-full ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-4 rounded w-5/6 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-10 rounded-lg w-full ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                        </div>

                        <div className={`rounded-lg shadow-sm border p-5 space-y-4 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <div className={`h-6 rounded w-32 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-4 rounded w-full ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-4 rounded w-4/5 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-10 rounded-lg w-full ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetailsSkeleton;
