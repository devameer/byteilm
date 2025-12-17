import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const CoursesPageSkeleton = () => {
    const { darkMode } = useTheme();
    
    return (
        <>
            {/* Header Skeleton */}
            {/* <div className="space-y-3 animate-pulse">
                <div className={`h-8 rounded w-48 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`h-5 rounded w-96 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
            </div> */}

            {/* Filter Buttons Skeleton */}
            {/* <div className="flex gap-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-10 rounded-lg w-24 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                ))}
            </div> */}

            {/* Course Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className={`rounded-2xl ring-1 shadow-sm overflow-hidden transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-100'
                        }`}>
                            {/* Image Skeleton */}
                            <div className={`h-48 w-full ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>

                            {/* Content */}
                            <div className="p-5 space-y-4">
                                {/* Title */}
                                <div className={`h-6 rounded w-3/4 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>

                                {/* Category */}
                                <div className={`h-4 rounded w-32 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={`rounded-xl px-4 py-3 ${
                                        darkMode ? 'bg-gray-900/50' : 'bg-slate-50/80'
                                    }`}>
                                        <div className={`h-3 rounded w-16 mb-2 ${
                                            darkMode ? 'bg-gray-600' : 'bg-gray-300'
                                        }`}></div>
                                        <div className={`h-5 rounded w-8 ${
                                            darkMode ? 'bg-gray-600' : 'bg-gray-300'
                                        }`}></div>
                                    </div>
                                    <div className={`rounded-xl px-4 py-3 ${
                                        darkMode ? 'bg-gray-900/50' : 'bg-slate-50/80'
                                    }`}>
                                        <div className={`h-3 rounded w-16 mb-2 ${
                                            darkMode ? 'bg-gray-600' : 'bg-gray-300'
                                        }`}></div>
                                        <div className={`h-5 rounded w-8 ${
                                            darkMode ? 'bg-gray-600' : 'bg-gray-300'
                                        }`}></div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <div className={`h-3 rounded w-20 ${
                                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                        }`}></div>
                                        <div className={`h-3 rounded w-10 ${
                                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                        }`}></div>
                                    </div>
                                    <div className={`h-2 rounded-full ${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}></div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <div className={`h-9 rounded-lg ${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}></div>
                                    <div className={`h-9 rounded-lg ${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}></div>
                                    <div className={`h-9 rounded-lg ${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}></div>
                                    <div className={`h-9 rounded-lg ${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
    );
};

export default CoursesPageSkeleton;
