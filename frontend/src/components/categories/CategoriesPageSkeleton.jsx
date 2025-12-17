import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const CategoriesPageSkeleton = () => {
    const { darkMode } = useTheme();
    
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-3">
                    <div className={`h-8 rounded w-64 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-5 rounded w-96 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                </div>
                <div className={`h-10 rounded-lg w-32 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
            </div>

            {/* Category Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

                            {/* Description */}
                            <div className="space-y-2">
                                <div className={`h-4 rounded w-full ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                                <div className={`h-4 rounded w-5/6 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4">
                                <div className={`h-4 rounded w-20 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                                <div className={`h-4 rounded w-20 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                            </div>

                            {/* Progress Bar */}
                            <div className={`h-2 rounded-full ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                                <div className={`h-full rounded-full w-3/4 ${
                                    darkMode ? 'bg-gray-600' : 'bg-gray-300'
                                }`}></div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <div className={`h-9 rounded-lg flex-1 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                                <div className={`h-9 rounded-lg w-9 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoriesPageSkeleton;

