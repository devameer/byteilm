import React from 'react';

const TeamDetailSkeleton = () => {
    return (
        <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg animate-pulse">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-200"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-8 bg-gray-200 rounded w-48"></div>
                        <div className="h-4 bg-gray-100 rounded w-64"></div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
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

                {/* Content */}
                <div className="space-y-3">
                    <div className="h-20 bg-gray-100 rounded-lg"></div>
                    <div className="h-32 bg-gray-100 rounded-lg"></div>
                </div>
            </div>
        </div>
    );
};

export default TeamDetailSkeleton;
