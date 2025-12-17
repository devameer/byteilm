import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const LessonMediaSkeleton = () => {
    const { darkMode } = useTheme();
    
    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
            <div className="container mx-auto px-4 py-8 animate-pulse">
                {/* Header Skeleton */}
                <div className="mb-6 space-y-4">
                    <div className={`h-6 rounded w-20 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-9 rounded w-96 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-5 rounded w-full max-w-2xl ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                </div>

                {/* Tabs Skeleton */}
                <div className="mb-6 border-b border-gray-700">
                    <div className="flex gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={`h-10 rounded-t w-24 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                        ))}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <div className={`rounded-lg shadow p-6 ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            {/* Video Player Skeleton */}
                            <div className={`w-full aspect-video rounded-lg ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>

                            {/* Controls Skeleton */}
                            <div className="mt-4 flex gap-2">
                                <div className={`h-10 rounded w-10 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                                <div className={`flex-1 h-10 rounded ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                                <div className={`h-10 rounded w-20 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}></div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Card 1 */}
                        <div className={`rounded-lg shadow p-6 ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div className={`h-6 rounded w-32 mb-4 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <div className={`h-4 rounded w-16 ${
                                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                        }`}></div>
                                        <div className={`h-5 rounded w-24 ${
                                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                        }`}></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className={`rounded-lg shadow p-6 ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div className={`h-6 rounded w-32 mb-4 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex justify-between">
                                        <div className={`h-4 rounded w-20 ${
                                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                        }`}></div>
                                        <div className={`h-4 rounded w-16 ${
                                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                        }`}></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className={`rounded-lg shadow p-6 ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div className={`h-6 rounded w-32 mb-4 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className={`h-10 rounded ${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LessonMediaSkeleton;
