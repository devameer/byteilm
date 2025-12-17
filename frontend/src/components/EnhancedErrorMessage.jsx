import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  WifiIcon,
  ServerIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

/**
 * Enhanced Error Message Component
 * مكون محسّن لعرض رسائل الأخطاء بشكل واضح ومفيد
 *
 * @param {string} type - نوع الخطأ: validation, network, server, permission, warning, info
 * @param {string} message - نص رسالة الخطأ
 * @param {string} title - عنوان الخطأ (اختياري)
 * @param {string} actionLabel - نص زر الإجراء
 * @param {function} onAction - دالة عند النقر على زر الإجراء
 * @param {boolean} dismissible - إمكانية إغلاق الرسالة
 * @param {function} onDismiss - دالة عند إغلاق الرسالة
 * @param {number} autoHide - إخفاء تلقائي بعد عدد ثواني (0 = لا)
 */
const EnhancedErrorMessage = ({
  type = 'error',
  message,
  title,
  actionLabel,
  onAction,
  dismissible = true,
  onDismiss,
  autoHide = 0,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHide * 1000);

      return () => clearTimeout(timer);
    }
  }, [autoHide]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      setTimeout(onDismiss, 300); // Wait for animation
    }
  };

  const errorTypes = {
    error: {
      icon: ExclamationCircleIcon,
      color: 'danger',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-900 dark:text-red-200',
      iconColor: 'text-red-600 dark:text-red-400',
      title: 'خطأ',
      iconBg: 'bg-red-100 dark:bg-red-900/40'
    },
    validation: {
      icon: ExclamationTriangleIcon,
      color: 'warning',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-900 dark:text-yellow-200',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      title: 'خطأ في التحقق من البيانات',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/40'
    },
    network: {
      icon: WifiIcon,
      color: 'danger',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-900 dark:text-orange-200',
      iconColor: 'text-orange-600 dark:text-orange-400',
      title: 'خطأ في الاتصال',
      iconBg: 'bg-orange-100 dark:bg-orange-900/40'
    },
    server: {
      icon: ServerIcon,
      color: 'danger',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-900 dark:text-red-200',
      iconColor: 'text-red-600 dark:text-red-400',
      title: 'خطأ في الخادم',
      iconBg: 'bg-red-100 dark:bg-red-900/40'
    },
    permission: {
      icon: LockClosedIcon,
      color: 'warning',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-900 dark:text-amber-200',
      iconColor: 'text-amber-600 dark:text-amber-400',
      title: 'صلاحيات غير كافية',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      color: 'warning',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-900 dark:text-yellow-200',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      title: 'تحذير',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/40'
    },
    info: {
      icon: InformationCircleIcon,
      color: 'info',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-900 dark:text-blue-200',
      iconColor: 'text-blue-600 dark:text-blue-400',
      title: 'معلومة',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40'
    }
  };

  const config = errorTypes[type] || errorTypes.error;
  const Icon = config.icon;
  const displayTitle = title || config.title;

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`
        ${config.bgColor}
        ${config.borderColor}
        border-r-4
        rounded-lg
        p-4
        shadow-soft
        animate-fade-in-down
        transition-all
        duration-300
        ${className}
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`${config.iconBg} rounded-full p-2 flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {displayTitle && (
            <h3 className={`font-bold mb-1 ${config.textColor}`}>
              {displayTitle}
            </h3>
          )}
          <p className={`text-sm ${config.textColor} leading-relaxed`}>
            {message}
          </p>

          {/* Action Button */}
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className={`
                mt-3
                px-4 py-2
                text-sm font-medium
                rounded-lg
                transition-all
                ${config.iconColor}
                hover:bg-white dark:hover:bg-gray-800
                border-2 ${config.borderColor}
              `}
            >
              {actionLabel}
            </button>
          )}
        </div>

        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`
              flex-shrink-0
              rounded-lg
              p-1.5
              transition-colors
              ${config.textColor}
              hover:bg-white dark:hover:bg-gray-800
            `}
            aria-label="إغلاق"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Auto-hide progress bar */}
      {autoHide > 0 && (
        <div className="mt-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.iconColor} bg-current`}
            style={{
              animation: `shrink ${autoHide}s linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Helper function to get user-friendly error messages
 */
export const getUserFriendlyErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.response?.status === 404) {
    return 'المورد المطلوب غير موجود.';
  }

  if (error?.response?.status === 401) {
    return 'يجب عليك تسجيل الدخول للوصول إلى هذا المحتوى.';
  }

  if (error?.response?.status === 403) {
    return 'ليس لديك صلاحيات كافية لتنفيذ هذا الإجراء.';
  }

  if (error?.response?.status === 500) {
    return 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
  }

  if (error?.response?.status === 422) {
    return error?.response?.data?.message || 'البيانات المدخلة غير صحيحة.';
  }

  if (error?.message === 'Network Error') {
    return 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى.';
  }

  if (error?.code === 'ECONNABORTED') {
    return 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.';
  }

  return error?.response?.data?.message || error?.message || 'حدث خطأ غير متوقع.';
};

/**
 * Helper function to determine error type
 */
export const getErrorType = (error) => {
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return 'permission';
  }

  if (error?.response?.status === 422) {
    return 'validation';
  }

  if (error?.response?.status === 500 || error?.response?.status === 502 || error?.response?.status === 503) {
    return 'server';
  }

  if (error?.message === 'Network Error' || error?.code === 'ECONNABORTED') {
    return 'network';
  }

  return 'error';
};

// CSS for progress bar animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;
document.head.appendChild(style);

export default EnhancedErrorMessage;
