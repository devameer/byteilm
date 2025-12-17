import React from "react";

function Pagination({ page = 1, total = 1, onPageChange, hasNext }) {
    return (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-sm text-gray-600">
            <div>
                الصفحة {page} من {total}
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange?.(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                    السابق
                </button>
                <button
                    type="button"
                    onClick={() => onPageChange?.(page + 1)}
                    disabled={!hasNext}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                    التالي
                </button>
            </div>
        </div>
    );
}

export default Pagination;
