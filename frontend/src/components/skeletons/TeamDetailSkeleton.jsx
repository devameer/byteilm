import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const TeamDetailSkeleton = () => {
    const { darkMode } = useTheme();
    
    // Theme-aware skeleton colors
    const bgCard = darkMode ? 'bg-gray-800 border-slate-700' : 'bg-white border-slate-200';
    const bgSkeleton = darkMode ? 'bg-gray-700' : 'bg-gray-200';
    const bgSkeletonLight = darkMode ? 'bg-gray-600' : 'bg-gray-100';
    const bgSkeletonDark = darkMode ? 'bg-gray-600' : 'bg-gray-300';
    const bgStats = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200';
    
    return (
        <div className={`${bgCard} rounded-2xl p-6 border-2 shadow-lg animate-pulse`}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl ${bgSkeleton}`}></div>
                    <div className="flex-1 space-y-2">
                        <div className={`h-8 ${bgSkeleton} rounded w-48`}></div>
                        <div className={`h-4 ${bgSkeletonLight} rounded w-64`}></div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={`rounded-xl border-2 ${bgStats} p-5`}>
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className={`h-3 ${bgSkeleton} rounded w-20`}></div>
                                    <div className={`h-8 ${bgSkeletonDark} rounded w-12`}></div>
                                </div>
                                <div className={`w-12 h-12 ${bgSkeleton} rounded-lg`}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="space-y-3">
                    <div className={`h-20 ${bgSkeletonLight} rounded-lg`}></div>
                    <div className={`h-32 ${bgSkeletonLight} rounded-lg`}></div>
                </div>
            </div>
        </div>
    );
};

export default TeamDetailSkeleton;
