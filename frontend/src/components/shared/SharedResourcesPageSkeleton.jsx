import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const SharedResourcesPageSkeleton = () => {
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

            {/* Resource Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className={`rounded-lg shadow hover:shadow-md transition-all duration-200 p-6 border transition-colors duration-300 ${
                        darkMode
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                    }`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1">
                                <div className={`w-12 h-12 rounded-lg ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                                <div className="flex-1 space-y-2">
                                    <div className={`h-5 rounded w-3/4 ${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}></div>
                                    <div className={`h-4 rounded w-1/2 ${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}></div>
                                </div>
                            </div>
                            <div className={`h-6 rounded-full w-16 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                        </div>
                        <div className={`h-6 rounded-full w-24 ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SharedResourcesPageSkeleton;

