import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ProjectsPageSkeleton = () => {
    const { darkMode } = useTheme();
    
    return (
        <div className={`rounded-xl shadow-sm border p-8 transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className={`rounded-2xl shadow-lg border-2 overflow-hidden ${
                        darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
                    }`}>
                        {/* Header */}
                        <div className={`p-6 ${darkMode ? 'bg-gray-800/50' : 'bg-gradient-to-br from-gray-200 to-gray-300'}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 space-y-2">
                                    <div className={`h-6 rounded w-3/4 ${darkMode ? 'bg-gray-700' : 'bg-white/40'}`}></div>
                                    <div className={`h-4 rounded w-1/2 ${darkMode ? 'bg-gray-700' : 'bg-white/30'}`}></div>
                                </div>
                                <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white/30'}`}></div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <div className={`h-3 rounded w-16 ${darkMode ? 'bg-gray-700' : 'bg-white/30'}`}></div>
                                    <div className={`h-3 rounded w-12 ${darkMode ? 'bg-gray-700' : 'bg-white/30'}`}></div>
                                </div>
                                <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-white/20'}`}>
                                    <div className={`h-2 rounded-full w-2/3 ${darkMode ? 'bg-indigo-500' : 'bg-white/40'}`}></div>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className={`p-6 space-y-4 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                            {/* Description */}
                            <div className="space-y-2">
                                <div className={`h-3 rounded w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                <div className={`h-3 rounded w-5/6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                <div className={`h-3 rounded w-4/6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                            </div>

                            {/* Stats */}
                            <div className={`grid grid-cols-3 gap-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="text-center space-y-1">
                                        <div className={`h-6 rounded w-8 mx-auto ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                                        <div className={`h-3 rounded w-12 mx-auto ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                    </div>
                                ))}
                            </div>

                            {/* Dates */}
                            <div className={`flex items-center justify-between pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                <div className={`h-3 rounded w-24 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                <div className={`h-3 rounded w-20 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4">
                                <div className={`flex-1 h-10 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                <div className={`w-10 h-10 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                <div className={`w-10 h-10 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectsPageSkeleton;
