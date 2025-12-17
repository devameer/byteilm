import React, { useEffect } from "react";

function Toast({ toast, onClose }) {
    useEffect(() => {
        if (!toast) {
            return undefined;
        }
        const timer = window.setTimeout(onClose, 3000);
        return () => window.clearTimeout(timer);
    }, [toast, onClose]);

    if (!toast) {
        return null;
    }

    const toneStyles = {
        success: "bg-green-600",
        error: "bg-red-600",
        info: "bg-indigo-600",
    };

    return (
        <div className={`${toneStyles[toast.tone] || toneStyles.info} fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 text-white rounded-lg shadow-lg z-50`}
        >
            {toast.message}
        </div>
    );
}

export default Toast;
