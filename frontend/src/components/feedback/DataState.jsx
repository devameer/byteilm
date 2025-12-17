import React from "react";
import LoadingSpinner from "../LoadingSpinner";

function DataState({ loading, error, onRetry, children }) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-600">
                <LoadingSpinner size="md" text="" />
                <p className="mt-4">جاري تحميل البيانات...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-6 text-center space-y-3">
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
