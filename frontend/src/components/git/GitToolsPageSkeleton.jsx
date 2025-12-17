import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const GitToolsPageSkeleton = () => {
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

            {/* Tools Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                    <div key={i} className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                        {/* Title */}
                        <div className={`h-6 rounded w-32 mb-4 ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>

                        {/* Description */}
                        <div className="space-y-2 mb-4">
                            <div className={`h-4 rounded w-full ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-4 rounded w-5/6 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <div className={`h-10 rounded-lg flex-1 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-10 rounded-lg w-10 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GitToolsPageSkeleton;

