import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const DashboardSkeleton = () => {
    const { darkMode } = useTheme();
    
    // Theme-aware skeleton colors
    const bgCard = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
    const bgSkeleton = darkMode ? 'bg-gray-700' : 'bg-gray-200';
    const bgSkeletonLight = darkMode ? 'bg-gray-600' : 'bg-gray-100';
    const bgSkeletonDark = darkMode ? 'bg-gray-600' : 'bg-gray-300';
    const bgHero = darkMode ? 'from-gray-700 to-gray-800' : 'from-gray-200 to-gray-300';
    const bgOverlay = darkMode ? 'bg-gray-600' : 'bg-white/40';
    const bgOverlayLight = darkMode ? 'bg-gray-600/50' : 'bg-white/30';
    const bgOverlayBox = darkMode ? 'bg-gray-700/50' : 'bg-white/20';
    const bgStats = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200';
    
    return (
        <div className="space-y-6 animate-pulse">
            {/* Hero Section Skeleton */}
            <div className={`bg-gradient-to-br ${bgHero} rounded-3xl p-6 lg:p-8 shadow-2xl`}>
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                        <div className="space-y-2">
                            <div className={`h-8 ${bgOverlay} rounded-lg w-64`}></div>
                            <div className={`h-4 ${bgOverlayLight} rounded w-48`}></div>
                        </div>
                        <div className={`h-10 ${bgOverlayLight} rounded-2xl w-48`}></div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`${bgOverlayBox} rounded-2xl p-4`}>
                                <div className={`h-3 ${bgOverlayLight} rounded w-24 mb-2`}></div>
                                <div className={`h-8 ${bgOverlay} rounded w-16`}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`${bgCard} rounded-2xl shadow-sm border p-6`}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className={`h-4 ${bgSkeleton} rounded w-20 mb-3`}></div>
                                <div className={`h-10 ${bgSkeletonDark} rounded w-16`}></div>
                            </div>
                            <div className={`w-12 h-12 ${bgSkeleton} rounded-xl`}></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area Skeleton */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Daily Activity Chart Skeleton */}
                    <div className={`${bgCard} rounded-2xl shadow-sm border p-6`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className={`h-6 ${bgSkeleton} rounded w-32`}></div>
                            <div className={`h-4 ${bgSkeleton} rounded w-24`}></div>
                        </div>
                        <div className={`h-72 ${bgSkeletonLight} rounded-xl`}></div>
                    </div>

                    {/* Weekly Charts Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map((i) => (
                            <div key={i} className={`${bgCard} rounded-2xl shadow-sm border p-6`}>
                                <div className={`h-6 ${bgSkeleton} rounded w-32 mb-6`}></div>
                                <div className={`h-48 ${bgSkeletonLight} rounded-xl`}></div>
                            </div>
                        ))}
                    </div>

                    {/* Top Courses Skeleton */}
                    <div className={`${bgCard} rounded-2xl shadow-sm border p-6`}>
                        <div className={`h-6 ${bgSkeleton} rounded w-32 mb-6`}></div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                    <div className={`w-12 h-12 ${bgSkeleton} rounded-xl flex-shrink-0`}></div>
                                    <div className="flex-1 space-y-2">
                                        <div className={`h-4 ${bgSkeleton} rounded w-3/4`}></div>
                                        <div className={`h-2 ${bgSkeletonLight} rounded-full w-full`}></div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <div className={`h-6 ${bgSkeleton} rounded w-12`}></div>
                                        <div className={`h-3 ${bgSkeletonLight} rounded w-12`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Skeleton */}
                <div className="space-y-6">
                    {/* Quick Actions Skeleton */}
                    <div className={`${bgCard} rounded-2xl shadow-sm border p-6`}>
                        <div className={`h-6 ${bgSkeleton} rounded w-32 mb-6`}></div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                    <div className={`w-10 h-10 ${bgSkeleton} rounded-lg flex-shrink-0`}></div>
                                    <div className="flex-1 space-y-2">
                                        <div className={`h-4 ${bgSkeleton} rounded w-24`}></div>
                                        <div className={`h-3 ${bgSkeletonLight} rounded w-32`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Lessons Skeleton */}
                    <div className={`${bgCard} rounded-2xl shadow-sm border p-6`}>
                        <div className={`h-6 ${bgSkeleton} rounded w-32 mb-6`}></div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl">
                                    <div className={`w-10 h-10 ${bgSkeleton} rounded-lg flex-shrink-0`}></div>
                                    <div className="flex-1 space-y-2">
                                        <div className={`h-4 ${bgSkeleton} rounded w-full`}></div>
                                        <div className={`h-3 ${bgSkeletonLight} rounded w-3/4`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Badges Skeleton */}
                    <div className={`${bgCard} rounded-2xl shadow-sm border p-6`}>
                        <div className={`h-6 ${bgSkeleton} rounded w-32 mb-6`}></div>
                        <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`p-4 rounded-xl ${bgStats}`}>
                                    <div className="text-center space-y-2">
                                        <div className={`h-8 w-8 ${bgSkeleton} rounded-full mx-auto`}></div>
                                        <div className={`h-4 ${bgSkeleton} rounded w-16 mx-auto`}></div>
                                        <div className={`h-3 ${bgSkeletonLight} rounded w-full`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Usage Widget Skeleton */}
                    <div className={`${bgCard} rounded-2xl shadow-sm border p-6`}>
                        <div className={`h-6 ${bgSkeleton} rounded w-32 mb-6`}></div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 ${bgSkeleton} rounded-lg`}></div>
                                            <div className={`h-4 ${bgSkeleton} rounded w-20`}></div>
                                        </div>
                                        <div className={`h-4 ${bgSkeleton} rounded w-16`}></div>
                                    </div>
                                    <div className={`h-2 ${bgSkeletonLight} rounded-full w-full`}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
