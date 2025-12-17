import React from 'react';

/**
 * Generic Empty State Component
 * مكون عام لعرض الحالات الفارغة بشكل جذاب ومفيد
 *
 * @param {Component} icon - أيقونة Heroicon
 * @param {string} title - العنوان الرئيسي
 * @param {string} description - الوصف التفصيلي
 * @param {function} action - دالة عند النقر على الزر
 * @param {string} actionLabel - نص الزر
 * @param {string} illustration - رابط صورة توضيحية (اختياري)
 * @param {string} size - حجم المكون (sm, md, lg)
 */
const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  secondaryAction,
  secondaryActionLabel,
  illustration,
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: {
      container: 'py-8',
      icon: 'w-16 h-16',
      iconWrapper: 'w-16 h-16 mb-4',
      title: 'text-lg',
      description: 'text-sm',
      button: 'btn-md'
    },
    md: {
      container: 'py-16',
      icon: 'w-12 h-12',
      iconWrapper: 'w-24 h-24 mb-6',
      title: 'text-2xl',
      description: 'text-base',
      button: 'btn-lg'
    },
    lg: {
      container: 'py-24',
      icon: 'w-16 h-16',
      iconWrapper: 'w-32 h-32 mb-8',
      title: 'text-3xl',
      description: 'text-lg',
      button: 'btn-lg'
    }
  };

  const sizeConfig = sizes[size] || sizes.md;

  return (
    <div className={`flex flex-col items-center justify-center ${sizeConfig.container} px-4 text-center animate-fade-in ${className}`}>
      {illustration ? (
        <img
          src={illustration}
          alt={title}
          className="w-64 h-64 mb-6 opacity-75 dark:opacity-60"
          loading="lazy"
        />
      ) : Icon && (
        <div className={`${sizeConfig.iconWrapper} bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-full flex items-center justify-center`}>
          <Icon className={`${sizeConfig.icon} text-primary-600 dark:text-primary-400`} />
        </div>
      )}

      <h3 className={`${sizeConfig.title} font-bold mb-2 text-gray-900 dark:text-gray-100`}>
        {title}
      </h3>

      <p className={`${sizeConfig.description} text-gray-600 dark:text-gray-400 mb-6 max-w-md`}>
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex gap-3 flex-wrap justify-center">
          {action && (
            <button onClick={action} className={`btn btn-primary ${sizeConfig.button}`}>
              {actionLabel}
            </button>
          )}
          {secondaryAction && (
            <button onClick={secondaryAction} className={`btn btn-outline ${sizeConfig.button}`}>
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
