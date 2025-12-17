import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const PromptsPageSkeleton = () => {
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

            {/* Prompt Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                        {/* Title */}
                        <div className={`h-6 rounded w-3/4 mb-4 ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>

                        {/* Content */}
                        <div className="space-y-2 mb-4">
                            <div className={`h-4 rounded w-full ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-4 rounded w-full ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-4 rounded w-5/6 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                            <div className={`h-9 rounded-lg flex-1 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-9 rounded-lg w-9 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PromptsPageSkeleton;

