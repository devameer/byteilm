import React, { useEffect, memo } from "react";
import { useTheme } from "../../contexts/ThemeContext";

function NotificationToast({ notification, onClose }) {
    const { darkMode } = useTheme();
    useEffect(() => {
        if (!notification) {
            return;
        }
        const timer = window.setTimeout(onClose, 3000);
        return () => window.clearTimeout(timer);
    }, [notification, onClose]);

    if (!notification) {
        return null;
    }

    const toneMap = {
        success: "bg-green-500",
        error: "bg-red-500",
        info: "bg-blue-500",
    };

    const tone = toneMap[notification.type] || toneMap.info;

    return (
        <div
            className={`${tone} fixed top-4 left-1/2 z-50 -translate-x-1/2 transform px-6 py-3 text-white shadow-lg rounded-lg`}
        >
            {notification.message}
        </div>
    );
}

export default memo(NotificationToast);
