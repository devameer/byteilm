/**
 * Accessibility Utilities
 * مجموعة من الأدوات المساعدة لتحسين إمكانية الوصول (WCAG 2.1)
 */

/**
 * Trap focus within a container
 * يحصر التركيز داخل عنصر معين (مفيد للـ Modals)
 *
 * @param {HTMLElement} element - العنصر الذي نريد حصر التركيز داخله
 * @returns {Function} - دالة لإيقاف حصر التركيز
 */
export const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTab);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTab);
  };
};

/**
 * Announce to screen readers
 * يعلن نصاً لقارئات الشاشة
 *
 * @param {string} message - الرسالة المراد الإعلان عنها
 * @param {string} priority - الأولوية: 'polite' أو 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Check if reduced motion is preferred
 * يتحقق إذا كان المستخدم يفضل تقليل الحركة
 *
 * @returns {boolean}
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get accessible label
 * ينشئ label يمكن الوصول إليه للعناصر
 *
 * @param {string} label - النص الأساسي
 * @param {string} description - وصف إضافي (اختياري)
 * @returns {Object} - خصائص aria للعنصر
 */
export const getAccessibleLabel = (label, description = '') => {
  const id = `label-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = description ? `desc-${Math.random().toString(36).substr(2, 9)}` : null;

  return {
    'aria-label': label,
    'aria-describedby': descriptionId,
    id: id,
    description: description,
    descriptionId: descriptionId
  };
};

/**
 * Check color contrast ratio
 * يتحقق من نسبة التباين بين لونين
 *
 * @param {string} foreground - اللون الأمامي (hex)
 * @param {string} background - اللون الخلفي (hex)
 * @returns {Object} - معلومات التباين
 */
export const checkColorContrast = (foreground, background) => {
  // تحويل hex إلى RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // حساب اللمعان النسبي
  const getLuminance = (rgb) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) return null;

  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio: ratio.toFixed(2),
    passAA: ratio >= 4.5,      // WCAG AA for normal text
    passAAA: ratio >= 7,        // WCAG AAA for normal text
    passAALarge: ratio >= 3,    // WCAG AA for large text
    passAAALarge: ratio >= 4.5  // WCAG AAA for large text
  };
};

/**
 * Generate unique ID for aria attributes
 * ينشئ معرف فريد لخصائص aria
 *
 * @param {string} prefix - البادئة
 * @returns {string}
 */
export const generateAriaId = (prefix = 'aria') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Handle escape key
 * يدير مفتاح Escape بشكل يمكن الوصول إليه
 *
 * @param {Function} callback - الدالة التي ستنفذ عند الضغط على Escape
 * @returns {Function} - دالة لإزالة المستمع
 */
export const handleEscapeKey = (callback) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      callback();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Get ARIA attributes for button
 * يحصل على خصائص ARIA للأزرار
 *
 * @param {Object} options
 * @returns {Object}
 */
export const getButtonAriaAttributes = ({
  label,
  pressed = null,
  expanded = null,
  controls = null,
  hasPopup = null,
  disabled = false
}) => {
  const attributes = {
    'aria-label': label,
    'aria-disabled': disabled
  };

  if (pressed !== null) attributes['aria-pressed'] = pressed;
  if (expanded !== null) attributes['aria-expanded'] = expanded;
  if (controls) attributes['aria-controls'] = controls;
  if (hasPopup) attributes['aria-haspopup'] = hasPopup;

  return attributes;
};

/**
 * Get ARIA attributes for input
 * يحصل على خصائص ARIA لحقول الإدخال
 *
 * @param {Object} options
 * @returns {Object}
 */
export const getInputAriaAttributes = ({
  label,
  required = false,
  invalid = false,
  errorMessage = null,
  description = null
}) => {
  const errorId = invalid && errorMessage ? generateAriaId('error') : null;
  const descId = description ? generateAriaId('desc') : null;

  const attributes = {
    'aria-label': label,
    'aria-required': required,
    'aria-invalid': invalid
  };

  if (errorId) attributes['aria-errormessage'] = errorId;
  if (descId) attributes['aria-describedby'] = descId;

  return {
    attributes,
    errorId,
    descId
  };
};

/**
 * Focus first error in form
 * يركز على أول خطأ في النموذج
 *
 * @param {HTMLElement} formElement - عنصر النموذج
 */
export const focusFirstError = (formElement) => {
  const firstError = formElement.querySelector('[aria-invalid="true"]');
  if (firstError) {
    firstError.focus();
    announceToScreenReader('يرجى تصحيح الأخطاء في النموذج', 'assertive');
  }
};

/**
 * Skip to content link
 * رابط للتخطي إلى المحتوى الرئيسي
 *
 * @returns {Object} - خصائص الرابط
 */
export const getSkipToContentAttributes = (targetId = 'main-content') => {
  return {
    href: `#${targetId}`,
    className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg',
    onClick: (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView();
      }
    }
  };
};

/**
 * Manage focus history
 * يدير تاريخ التركيز (مفيد للعودة إلى العنصر السابق بعد إغلاق modal)
 */
export class FocusManager {
  constructor() {
    this.previousFocus = null;
  }

  saveFocus() {
    this.previousFocus = document.activeElement;
  }

  restoreFocus() {
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  }
}

/**
 * Check if element is visible
 * يتحقق إذا كان العنصر مرئياً
 *
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export const isElementVisible = (element) => {
  return !!(
    element.offsetWidth ||
    element.offsetHeight ||
    element.getClientRects().length
  );
};

/**
 * Get readable file size
 * يحول حجم الملف إلى نص قابل للقراءة
 *
 * @param {number} bytes
 * @returns {string}
 */
export const getReadableFileSize = (bytes) => {
  if (bytes === 0) return '0 بايت';

  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format date in accessible way
 * ينسق التاريخ بطريقة يمكن الوصول إليها
 *
 * @param {Date|string} date
 * @returns {Object}
 */
export const getAccessibleDate = (date) => {
  const dateObj = new Date(date);
  const now = new Date();
  const diff = now - dateObj;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  let relativeText = '';
  if (days === 0) relativeText = 'اليوم';
  else if (days === 1) relativeText = 'أمس';
  else if (days < 7) relativeText = `منذ ${days} أيام`;
  else relativeText = dateObj.toLocaleDateString('ar-SA');

  return {
    formatted: dateObj.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    relative: relativeText,
    iso: dateObj.toISOString(),
    ariaLabel: `${relativeText}, ${dateObj.toLocaleDateString('ar-SA')}`
  };
};

export default {
  trapFocus,
  announceToScreenReader,
  prefersReducedMotion,
  getAccessibleLabel,
  checkColorContrast,
  generateAriaId,
  handleEscapeKey,
  getButtonAriaAttributes,
  getInputAriaAttributes,
  focusFirstError,
  getSkipToContentAttributes,
  FocusManager,
  isElementVisible,
  getReadableFileSize,
  getAccessibleDate
};
