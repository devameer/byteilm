import React from 'react';

const ALERT_TYPES = {
    success: {
        classes: 'alert-success',
        icon: 'fa-check-circle',
    },
    error: {
        classes: 'alert-error',
        icon: 'fa-exclamation-circle',
    },
    warning: {
        classes: 'alert-warning',
        icon: 'fa-exclamation-triangle',
    },
    info: {
        classes: 'alert-info',
        icon: 'fa-info-circle',
    },
};

function Alert({ type = 'info', title, message, onClose, children }) {
    const alertType = ALERT_TYPES[type] || ALERT_TYPES.info;

    return (
        <div className={`alert ${alertType.classes}`}>
            <div className="flex-shrink-0">
                <i className={`fas ${alertType.icon} text-xl`} />
            </div>
            <div className="flex-1">
                {title && <h4 className="font-bold mb-1">{title}</h4>}
                {message && <p className="text-sm">{message}</p>}
                {children}
            </div>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
                    aria-label="إغلاق"
                >
                    <i className="fas fa-times" />
                </button>
            )}
        </div>
    );
}

export default Alert;
