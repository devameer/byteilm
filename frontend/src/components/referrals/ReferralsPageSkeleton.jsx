import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ReferralsPageSkeleton = () => {
    const { darkMode } = useTheme();
    
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-3">
                    <div className={`h-8 rounded w-48 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-5 rounded w-64 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                </div>
            </div>

            {/* Summary Card Skeleton */}
            <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
                <div className={`h-6 rounded w-32 mb-4 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`h-20 rounded-lg ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-20 rounded-lg ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`rounded-xl p-5 border transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                        <div className={`h-4 rounded w-24 mb-3 ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                        <div className={`h-8 rounded w-16 ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                    </div>
                ))}
            </div>

            {/* Tables Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                    <div key={i} className={`rounded-xl shadow-sm border p-6 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                        <div className={`h-6 rounded w-32 mb-4 ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((j) => (
                                <div key={j} className={`h-16 rounded-lg ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReferralsPageSkeleton;

