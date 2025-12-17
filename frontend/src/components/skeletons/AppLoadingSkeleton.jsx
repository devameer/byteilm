import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const AppLoadingSkeleton = () => {
    // Try to get theme, but default to light if context not available yet
    let darkMode = false;
    try {
        const theme = useTheme();
        darkMode = theme?.darkMode || false;
    } catch {
        darkMode = false;
    }

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Header Skeleton */}
            <header className={`h-16 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
                    {/* Logo */}
                    <div className={`w-32 h-8 rounded-lg animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    
                    {/* Nav Items */}
                    <div className="hidden md:flex items-center gap-6">
                        <div className={`w-16 h-4 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                        <div className={`w-20 h-4 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                        <div className={`w-16 h-4 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    </div>

                    {/* User Avatar */}
                    <div className={`w-10 h-10 rounded-full animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                </div>
            </header>

            {/* Sidebar + Main Content */}
            <div className="flex">
                {/* Sidebar Skeleton */}
                <aside className={`hidden md:block w-64 min-h-[calc(100vh-4rem)] ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="p-4 space-y-4">
                        {/* Sidebar Items */}
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                <div className={`h-4 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ width: `${60 + Math.random() * 40}%` }}></div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content Skeleton */}
                <main className="flex-1 p-6">
                    {/* Page Title */}
                    <div className={`w-48 h-8 rounded-lg mb-6 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                                <div className={`w-20 h-4 rounded mb-2 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                <div className={`w-16 h-8 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                            </div>
                        ))}
                    </div>

                    {/* Content Cards */}
                    <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                        <div className={`w-32 h-6 rounded mb-4 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                        
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-lg animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                    <div className="flex-1 space-y-2">
                                        <div className={`h-4 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ width: `${50 + Math.random() * 30}%` }}></div>
                                        <div className={`h-3 rounded animate-pulse ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`} style={{ width: `${30 + Math.random() * 20}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppLoadingSkeleton;
