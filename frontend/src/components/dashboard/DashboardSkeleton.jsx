import React from 'react';

const DashboardSkeleton = () => {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Hero Section Skeleton */}
            <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl p-6 lg:p-8 shadow-2xl">
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                        <div className="space-y-2">
                            <div className="h-8 bg-white/40 rounded-lg w-64"></div>
                            <div className="h-4 bg-white/30 rounded w-48"></div>
                        </div>
                        <div className="h-10 bg-white/30 rounded-2xl w-48"></div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white/20 rounded-2xl p-4">
                                <div className="h-3 bg-white/30 rounded w-24 mb-2"></div>
                                <div className="h-8 bg-white/40 rounded w-16"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                                <div className="h-10 bg-gray-300 rounded w-16"></div>
                            </div>
                            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area Skeleton */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Daily Activity Chart Skeleton */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-6 bg-gray-200 rounded w-32"></div>
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="h-72 bg-gray-100 rounded-xl"></div>
                    </div>

                    {/* Weekly Charts Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
                                <div className="h-48 bg-gray-100 rounded-xl"></div>
                            </div>
                        ))}
                    </div>

                    {/* Top Courses Skeleton */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100">
                                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-2 bg-gray-100 rounded-full w-full"></div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <div className="h-6 bg-gray-200 rounded w-12"></div>
                                        <div className="h-3 bg-gray-100 rounded w-12"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Skeleton */}
                <div className="space-y-6">
                    {/* Quick Actions Skeleton */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                                        <div className="h-3 bg-gray-100 rounded w-32"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Lessons Skeleton */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                                        <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Badges Skeleton */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
                        <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                    <div className="text-center space-y-2">
                                        <div className="h-8 w-8 bg-gray-200 rounded-full mx-auto"></div>
                                        <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Usage Widget Skeleton */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                                        </div>
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full w-full"></div>
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
