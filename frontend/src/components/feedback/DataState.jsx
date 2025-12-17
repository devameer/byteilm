import React from "react";
import LoadingSpinner from "../LoadingSpinner";
import { useTheme } from "../../contexts/ThemeContext";

function DataState({ loading, error, onRetry, children }) {
    const { darkMode } = useTheme();
    
    if (loading) {
        return (
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'} rounded-xl shadow-sm border p-12 text-center`}>
                <LoadingSpinner size="md" text="" />
                <p className="mt-4">جاري تحميل البيانات...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${darkMode ? 'bg-red-900/30 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-800'} border rounded-xl p-6 text-center space-y-3`}>
                <p>{typeof error === "string" ? error : "حدث خطأ غير متوقع"}</p>
                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        إعادة المحاولة
                    </button>
                )}
            </div>
        );
    }

    return <>{children}</>;
}

export default DataState;
