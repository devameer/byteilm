import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const TeamsPageSkeleton = () => {
    const { darkMode } = useTheme();
    
    // Theme-aware skeleton colors
    const bgCard = darkMode ? 'bg-gray-800 border-slate-700' : 'bg-white border-slate-200';
    const bgSkeleton = darkMode ? 'bg-gray-700' : 'bg-gray-200';
    const bgSkeletonLight = darkMode ? 'bg-gray-600' : 'bg-gray-100';
    const bgSkeletonDark = darkMode ? 'bg-gray-600' : 'bg-gray-300';
    const bgHeader = darkMode ? 'bg-gray-700' : 'bg-gray-200';
    const bgInputBox = darkMode ? 'bg-gray-700' : 'bg-gray-50';
    const borderLight = darkMode ? 'border-slate-600' : 'border-slate-100';
    const borderMedium = darkMode ? 'border-gray-600' : 'border-gray-200';
    
    return (
        <div className="grid gap-6 lg:grid-cols-3 animate-pulse">
            {/* Sidebar - Create Team & List */}
            <div className="space-y-6 lg:col-span-1">
                {/* Create Team Form Skeleton */}
                <div className={`${bgCard} rounded-2xl p-6 border-2 shadow-lg`}>
                    <div className="flex items-center mb-4">
                        <div className={`w-10 h-10 rounded-lg ${bgSkeleton} mr-3`}></div>
                        <div className={`h-6 ${bgSkeleton} rounded w-32`}></div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className={`h-4 ${bgSkeleton} rounded w-20 mb-2`}></div>
                            <div className={`h-10 ${bgSkeletonLight} rounded-lg`}></div>
                        </div>
                        <div>
                            <div className={`h-4 ${bgSkeleton} rounded w-24 mb-2`}></div>
                            <div className={`h-24 ${bgSkeletonLight} rounded-lg`}></div>
                        </div>
                        <div className={`h-12 ${bgSkeleton} rounded-lg`}></div>
                    </div>
                </div>

                {/* Teams List Skeleton */}
                <div className={`${bgCard} rounded-2xl border-2 shadow-lg overflow-hidden`}>
                    <div className={`${bgHeader} p-4`}>
                        <div className={`h-6 ${bgSkeletonDark} rounded w-32`}></div>
                    </div>

                    <div className={`p-4 border-b ${borderLight}`}>
                        <div className={`h-10 ${bgSkeletonLight} rounded-lg`}></div>
                    </div>

                    <div className={`divide-y ${borderLight}`}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 space-y-2">
                                        <div className={`h-5 ${bgSkeleton} rounded w-3/4`}></div>
                                        <div className={`h-3 ${bgSkeletonLight} rounded w-1/2`}></div>
                                        <div className="flex gap-2">
                                            <div className={`h-5 ${bgSkeletonLight} rounded-full w-16`}></div>
                                            <div className={`h-5 ${bgSkeletonLight} rounded-full w-12`}></div>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-10 ${bgSkeleton} rounded-lg`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content - Team Details Skeleton */}
            <div className="lg:col-span-2 space-y-6">
                {/* Team Header Skeleton */}
                <div className={`${bgCard} rounded-2xl p-6 border-2 shadow-lg`}>
                    <div className={`${bgHeader} -m-6 mb-6 p-6 rounded-t-2xl`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-xl ${bgSkeletonDark}`}></div>
                                <div className="space-y-2">
                                    <div className={`h-8 ${bgSkeletonDark} rounded w-48`}></div>
                                    <div className={`h-4 ${bgSkeletonDark} rounded w-64`}></div>
                                </div>
                            </div>
                            <div className={`h-10 w-32 ${bgSkeletonDark} rounded-lg`}></div>
                        </div>
                    </div>

                    {/* Team Form Skeleton */}
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <div className={`h-4 ${bgSkeleton} rounded w-20`}></div>
                                <div className={`h-10 ${bgSkeletonLight} rounded-lg`}></div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <div className={`h-4 ${bgSkeleton} rounded w-24`}></div>
                                <div className={`h-24 ${bgSkeletonLight} rounded-lg`}></div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Skeleton */}
                    <div className="grid gap-4 md:grid-cols-3 mt-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={`rounded-xl border-2 ${borderMedium} ${bgInputBox} p-5`}>
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
                </div>

                {/* Members Section Skeleton */}
                <div className={`${bgCard} rounded-2xl p-6 border-2 shadow-lg space-y-4`}>
                    <div className="flex items-center justify-between">
                        <div className={`h-6 ${bgSkeleton} rounded w-32`}></div>
                        <div className={`h-6 ${bgSkeletonLight} rounded-full w-40`}></div>
                    </div>

                    {/* Add Member Form Skeleton */}
                    <div className={`${bgInputBox} rounded-xl p-4 border-2 ${borderMedium}`}>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className={`md:col-span-2 h-10 ${bgSkeleton} rounded-lg`}></div>
                            <div className={`h-10 ${bgSkeleton} rounded-lg`}></div>
                        </div>
                    </div>

                    {/* Members Table Skeleton */}
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={`flex items-center gap-4 p-4 rounded-xl ${bgInputBox}`}>
                                <div className={`w-10 h-10 rounded-full ${bgSkeleton}`}></div>
                                <div className="flex-1 space-y-2">
                                    <div className={`h-4 ${bgSkeleton} rounded w-32`}></div>
                                    <div className={`h-3 ${bgSkeletonLight} rounded w-48`}></div>
                                </div>
                                <div className={`h-8 ${bgSkeleton} rounded-lg w-24`}></div>
                                <div className={`h-8 ${bgSkeleton} rounded-lg w-20`}></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Resources Section Skeleton */}
                <div className={`${bgCard} rounded-2xl p-6 border-2 shadow-lg space-y-4`}>
                    <div className={`h-6 ${bgSkeleton} rounded w-32`}></div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {[1, 2].map((i) => (
                            <div key={i} className={`border-2 ${borderMedium} rounded-xl p-4 ${bgInputBox}`}>
                                <div className={`h-5 ${bgSkeleton} rounded w-24 mb-3`}></div>
                                <div className="space-y-2">
                                    {[1, 2, 3].map((j) => (
                                        <div key={j} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'} border-2`}>
                                            <div className="flex-1 space-y-2">
                                                <div className={`h-4 ${bgSkeleton} rounded w-3/4`}></div>
                                                <div className={`h-3 ${bgSkeletonLight} rounded w-1/2`}></div>
                                            </div>
                                            <div className={`w-5 h-5 ${bgSkeleton} rounded`}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamsPageSkeleton;
