import React, { memo } from 'react';

const BADGE_VARIANTS = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
};

const Badge = memo(function Badge({ children, variant = 'primary', icon, className = '' }) {
    const variantClass = BADGE_VARIANTS[variant] || BADGE_VARIANTS.primary;

    return (
        <span className={`badge ${variantClass} ${className}`}>
            {icon && <i className={`fas ${icon} ml-1`} />}
            {children}
        </span>
    );
});

Badge.displayName = 'Badge';

export default Badge;
