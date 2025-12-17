import React, { memo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Card = memo(function Card({ title, children, footer, headerAction, className = '' }) {
    const { darkMode } = useTheme();
    
    return (
        <div className={`card ${className}`}>
            {(title || headerAction) && (
                <div className="card-header">
                    <div className="flex items-center justify-between">
                        {title && <h3 className={`text-lg font-bold transition-colors duration-300 ${
                            darkMode ? 'text-gray-100' : 'text-gray-800'
                        }`}>{title}</h3>}
                        {headerAction && <div>{headerAction}</div>}
                    </div>
                </div>
            )}
            <div className="card-body">
                {children}
            </div>
            {footer && (
                <div className={`px-6 py-4 border-t transition-colors duration-300 ${
                    darkMode 
                        ? 'bg-gray-900/50 border-gray-700' 
                        : 'bg-gray-50 border-gray-200'
                }`}>
                    {footer}
                </div>
            )}
        </div>
    );
});

Card.displayName = 'Card';

export default Card;
