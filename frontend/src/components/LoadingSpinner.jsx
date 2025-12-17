import React from 'react';

function LoadingSpinner({ size = 'md', text = 'جاري التحميل...' }) {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };

    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className={`${sizeClasses[size]} relative`}>
                <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            </div>
            {text && (
                <p className="mt-4 text-gray-600 text-sm font-medium">{text}</p>
            )}
        </div>
    );
}

export default LoadingSpinner;
