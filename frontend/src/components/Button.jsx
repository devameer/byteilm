import React, { memo } from 'react';

const BUTTON_VARIANTS = {
    primary: 'btn-primary btn-md',
    secondary: 'btn-secondary btn-md',
    success: 'btn-success btn-md',
    danger: 'btn-danger btn-md',
    outline: 'btn-outline btn-md',
};

const Button = memo(function Button({
    children,
    variant = 'primary',
    type = 'button',
    onClick,
    disabled = false,
    loading = false,
    icon,
    fullWidth = false,
    size = 'md',
    className = '',
    ...props
}) {
    const variantClass = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
    const widthClass = fullWidth ? 'w-full' : '';
    const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn-md';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`btn ${variantClass.split(' ')[0]} ${sizeClass} ${widthClass} ${className}`}
            {...props}
        >
            {loading ? (
                <>
                    <i className="fas fa-spinner fa-spin" />
                    <span>جاري المعالجة...</span>
                </>
            ) : (
                <>
                    {icon && <i className={`fas ${icon}`} />}
                    <span>{children}</span>
                </>
            )}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
