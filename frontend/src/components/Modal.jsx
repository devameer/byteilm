import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';

const SIZE_MAP = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4',
};

function Modal({ title, isOpen, onClose, children, size = 'md', footer = null, closeOnBackdrop = true }) {
    const { darkMode } = useTheme();
    
    useEffect(() => {
        if (isOpen) {
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';

            // Handle ESC key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    onClose?.();
                }
            };

            document.addEventListener('keydown', handleEscape);

            return () => {
                document.body.style.overflow = 'unset';
                document.removeEventListener('keydown', handleEscape);
            };
        }
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const sizeClass = SIZE_MAP[size] ?? SIZE_MAP.md;

    const handleBackdropClick = (e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
            onClose?.();
        }
    };

    return createPortal(
        <div
            className={darkMode ? 'dark' : ''}
        >
            <div
                className="modal-backdrop"
                onClick={handleBackdropClick}
                role="presentation"
            >
                <div
                    className={`modal-content ${sizeClass} animate-scale-in`}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <h2 id="modal-title" className={`text-xl font-bold ${
                            darkMode ? 'text-gray-100' : 'text-gray-800'
                        }`}>{title}</h2>
                        <button
                            onClick={onClose}
                            className={`transition-colors duration-200 ${
                                darkMode
                                    ? 'text-gray-300 hover:text-gray-100'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                            aria-label="إغلاق النموذج"
                            type="button"
                        >
                            <i className="fas fa-times text-xl" />
                        </button>
                    </div>
                    <div className="modal-body">
                        {children}
                    </div>
                    {footer && (
                        <div className="modal-footer">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default Modal;
