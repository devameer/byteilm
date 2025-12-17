import React from 'react';

const AppLoadingSkeleton = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
            <div className="text-center space-y-6 p-8">
                {/* Logo Skeleton */}
                <div className="flex items-center justify-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl animate-pulse shadow-xl"></div>
                </div>

                {/* App Name Skeleton */}
                <div className="flex justify-center">
                    <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>

                {/* Loading Dots Animation */}
                <div className="flex items-center justify-center gap-2 py-4">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>

                {/* Loading Text */}
                <div className="flex justify-center">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Progress Bar */}
                <div className="max-w-xs mx-auto">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-progress"></div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-200/30 rounded-full blur-2xl animate-pulse"></div>
                    <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
            </div>

            <style>{`
                @keyframes progress {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(400%);
                    }
                }
                .animate-progress {
                    animation: progress 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default AppLoadingSkeleton;
