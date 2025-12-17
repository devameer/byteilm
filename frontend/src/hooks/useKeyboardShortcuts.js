import { useEffect, useCallback } from 'react';

/**
 * Keyboard Shortcuts Hook
 * يوفر نظام إدارة اختصارات لوحة المفاتيح
 *
 * @param {Array} shortcuts - مصفوفة من الاختصارات
 * @param {Object} options - خيارات إضافية
 *
 * مثال على الاستخدام:
 * useKeyboardShortcuts([
 *   {
 *     keys: ['ctrl', 'k'],
 *     action: () => openCommandPalette(),
 *     description: 'فتح لوحة الأوامر'
 *   }
 * ]);
 */

export const useKeyboardShortcuts = (shortcuts, options = {}) => {
  const { enabled = true, preventDefault = true } = options;

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const modifier = ctrlKey || metaKey;

    shortcuts.forEach(({ keys, action, preventDefault: preventDefaultLocal = preventDefault, disabled = false }) => {
      if (disabled) return;

      const matches = keys.every(k => {
        const lowerKey = k.toLowerCase();

        if (lowerKey === 'ctrl' || lowerKey === 'cmd' || lowerKey === 'meta') {
          return modifier;
        }
        if (lowerKey === 'shift') return shiftKey;
        if (lowerKey === 'alt') return altKey;

        return lowerKey === key.toLowerCase();
      });

      if (matches) {
        if (preventDefaultLocal) {
          event.preventDefault();
          event.stopPropagation();
        }
        action(event);
      }
    });
  }, [shortcuts, enabled, preventDefault]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
};

/**
 * Global Keyboard Shortcuts Hook
 * للاختصارات التي تعمل في كل أنحاء التطبيق
 */
export const useGlobalShortcuts = (callbacks = {}) => {
  useKeyboardShortcuts([
    {
      keys: ['ctrl', 'k'],
      action: callbacks.openCommandPalette || (() => console.log('Command Palette')),
      description: 'فتح لوحة الأوامر'
    },
    {
      keys: ['ctrl', 'n'],
      action: callbacks.newTask || (() => console.log('New Task')),
      description: 'إنشاء مهمة جديدة'
    },
    {
      keys: ['ctrl', 'p'],
      action: callbacks.newProject || (() => console.log('New Project')),
      description: 'إنشاء مشروع جديد'
    },
    {
      keys: ['ctrl', 'd'],
      action: callbacks.toggleDarkMode || (() => console.log('Toggle Dark Mode')),
      description: 'تبديل الوضع الليلي'
    },
    {
      keys: ['ctrl', 'b'],
      action: callbacks.toggleSidebar || (() => console.log('Toggle Sidebar')),
      description: 'فتح/إغلاق القائمة الجانبية'
    },
    {
      keys: ['ctrl', '/'],
      action: callbacks.showShortcuts || (() => console.log('Show Shortcuts')),
      description: 'عرض الاختصارات'
    },
    {
      keys: ['esc'],
      action: callbacks.closeModal || (() => console.log('Close Modal')),
      description: 'إغلاق النافذة المنبثقة',
      preventDefault: false
    },
    {
      keys: ['/'],
      action: callbacks.focusSearch || (() => console.log('Focus Search')),
      description: 'التركيز على البحث',
      preventDefault: true
    },
    {
      keys: ['?'],
      action: callbacks.showHelp || (() => console.log('Show Help')),
      description: 'عرض المساعدة'
    }
  ]);
};

/**
 * Format keyboard shortcut for display
 * @param {Array} keys - مصفوفة المفاتيح
 * @returns {string} - النص المنسق للعرض
 */
export const formatShortcut = (keys) => {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

  return keys.map(key => {
    const lowerKey = key.toLowerCase();

    if (lowerKey === 'ctrl' || lowerKey === 'cmd' || lowerKey === 'meta') {
      return isMac ? '⌘' : 'Ctrl';
    }
    if (lowerKey === 'shift') return '⇧';
    if (lowerKey === 'alt') return isMac ? '⌥' : 'Alt';
    if (lowerKey === 'esc') return 'Esc';

    return key.charAt(0).toUpperCase() + key.slice(1);
  }).join(' + ');
};

export default useKeyboardShortcuts;
