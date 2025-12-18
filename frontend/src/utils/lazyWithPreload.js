import { lazy } from 'react';

/**
 * Lazy loading محسّن مع إمكانية Preload
 * يسمح بتحميل Component قبل الحاجة إليه
 */
export function lazyWithPreload(importFunc) {
  const LazyComponent = lazy(importFunc);
  LazyComponent.preload = importFunc;
  return LazyComponent;
}

/**
 * Preload صفحات معينة عند hover على الروابط
 * @param {Function} preloadFunc - الدالة المُرجعة من lazyWithPreload
 */
export function preloadOnHover(preloadFunc) {
  return () => {
    if (preloadFunc && typeof preloadFunc === 'function') {
      preloadFunc();
    }
  };
}

/**
 * Preload صفحات معينة بعد فترة (Idle Time)
 * @param {Array} preloadFuncs - مصفوفة من دوال الـ preload
 * @param {Number} delay - التأخير بالميلي ثانية (افتراضي 2000ms)
 */
export function preloadAfterDelay(preloadFuncs, delay = 2000) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      setTimeout(() => {
        preloadFuncs.forEach(func => {
          if (func && typeof func === 'function') {
            func();
          }
        });
      }, delay);
    });
  } else {
    setTimeout(() => {
      preloadFuncs.forEach(func => {
        if (func && typeof func === 'function') {
          func();
        }
      });
    }, delay);
  }
}
