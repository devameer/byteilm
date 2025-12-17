import React from 'react';

const TeamsPageSkeleton = () => {
    return (
        <div className="grid gap-6 lg:grid-cols-3 animate-pulse">
            {/* Sidebar - Create Team & List */}
            <div className="space-y-6 lg:col-span-1">
                {/* Create Team Form Skeleton */}
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 mr-3"></div>
                        <div className="h-6 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                            <div className="h-10 bg-gray-100 rounded-lg"></div>
                        </div>
                        <div>
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-24 bg-gray-100 rounded-lg"></div>
                        </div>
                        <div className="h-12 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>

                {/* Teams List Skeleton */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
                    <div className="bg-gray-200 p-4">
                        <div className="h-6 bg-gray-300 rounded w-32"></div>
                    </div>

                    <div className="p-4 border-b border-slate-200">
                        <div className="h-10 bg-gray-100 rounded-lg"></div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                        <div className="flex gap-2">
                                            <div className="h-5 bg-gray-100 rounded-full w-16"></div>
                                            <div className="h-5 bg-gray-100 rounded-full w-12"></div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content - Team Details Skeleton */}
            <div className="lg:col-span-2 space-y-6">
                {/* Team Header Skeleton */}
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
                    <div className="bg-gray-200 -m-6 mb-6 p-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-gray-300"></div>
                                <div className="space-y-2">
                                    <div className="h-8 bg-gray-300 rounded w-48"></div>
                                    <div className="h-4 bg-gray-300 rounded w-64"></div>
                                </div>
                            </div>
                            <div className="h-10 w-32 bg-gray-300 rounded-lg"></div>
                        </div>
                    </div>

                    {/* Team Form Skeleton */}
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                                <div className="h-10 bg-gray-100 rounded-lg"></div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                                <div className="h-24 bg-gray-100 rounded-lg"></div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Skeleton */}
                    <div className="grid gap-4 md:grid-cols-3 mt-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-xl border-2 border-gray-200 bg-gray-50 p-5">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                                        <div className="h-8 bg-gray-300 rounded w-12"></div>
                                    </div>
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Members Section Skeleton */}
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="h-6 bg-gray-200 rounded w-32"></div>
                        <div className="h-6 bg-gray-100 rounded-full w-40"></div>
                    </div>

                    {/* Add Member Form Skeleton */}
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="md:col-span-2 h-10 bg-gray-200 rounded-lg"></div>
                            <div className="h-10 bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>

                    {/* Members Table Skeleton */}
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    <div className="h-3 bg-gray-100 rounded w-48"></div>
                                </div>
                                <div className="h-8 bg-gray-200 rounded-lg w-24"></div>
                                <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Resources Section Skeleton */}
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-32"></div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                                <div className="h-5 bg-gray-200 rounded w-24 mb-3"></div>
                                <div className="space-y-2">
                                    {[1, 2, 3].map((j) => (
                                        <div key={j} className="flex items-center justify-between p-3 rounded-lg bg-white border-2 border-gray-100">
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                            </div>
                                            <div className="w-5 h-5 bg-gray-200 rounded"></div>
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
