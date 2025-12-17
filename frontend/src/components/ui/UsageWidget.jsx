import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

export default function UsageWidget({ usage, compact = false, showWarning = true }) {
  const { darkMode } = useTheme();
  if (!usage) return null;

  const formatStorage = (mb) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  const describeLimit = (limit) => {
    return limit <= 0 ? 'غير محدود' : limit.toString();
  };

  const calculatePercentage = (used, limit) => {
    if (limit <= 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const isNearLimit = (used, limit) => {
    if (limit <= 0) return false;
    const percentage = (used / limit) * 100;
    return percentage >= 80 && percentage < 100;
  };

  const isLimitReached = (used, limit) => {
    if (limit <= 0) return false;
    return used >= limit;
  };

  const getProgressColor = (used, limit) => {
    if (limit <= 0) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return 'bg-gradient-to-r from-red-500 to-red-600';
    if (percentage >= 80) return 'bg-gradient-to-r from-orange-500 to-orange-600';
    return 'bg-gradient-to-r from-blue-500 to-indigo-500';
  };

  const usageItems = [
    {
      label: 'المشاريع',
      icon: '📁',
      used: usage.projects?.used || 0,
      limit: usage.projects?.limit || 0,
    },
    {
      label: 'الدورات',
      icon: '📚',
      used: usage.courses?.used || 0,
      limit: usage.courses?.limit || 0,
    },
    {
      label: 'الدروس',
      icon: '📝',
      used: usage.lessons?.used || 0,
      limit: usage.lessons?.limit || 0,
    },
    {
      label: 'التخزين',
      icon: '💾',
      used: usage.storage?.used_mb || 0,
      limit: usage.storage?.limit_mb || 0,
      formatter: formatStorage,
    },
    {
      label: 'طلبات AI',
      icon: '🤖',
      used: usage.ai_requests?.used || 0,
      limit: usage.ai_requests?.limit || 0,
    },
  ];

  if (compact) {
    return (
      <div className={`rounded-lg shadow-sm border p-3 transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
          darkMode ? 'text-gray-200' : 'text-gray-700'
        }`}>
          <span>📊</span>
          استخدام الباقة
        </h3>
        <div className="space-y-2">
          {usageItems.map((item) => {
            const percentage = calculatePercentage(item.used, item.limit);
            const nearLimit = isNearLimit(item.used, item.limit);
            const limitReached = isLimitReached(item.used, item.limit);

            return (
              <div key={item.label} className="text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className={`flex items-center gap-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <span>{item.icon}</span>
                    {item.label}
                  </span>
                  <span className={`font-medium ${
                    limitReached 
                      ? 'text-red-600' 
                      : darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {item.formatter ? item.formatter(item.used) : item.used} / {describeLimit(item.limit)}
                  </span>
                </div>
                {item.limit > 0 && (
                  <div className={`w-full rounded-full h-1.5 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(item.used, item.limit)}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                )}
                {showWarning && nearLimit && (
                  <div className="text-orange-600 flex items-center gap-1 mt-1">
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    <span>قريب من الحد</span>
                  </div>
                )}
                {showWarning && limitReached && (
                  <div className="text-red-600 flex items-center gap-1 mt-1">
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    <span>الحد مستهلك</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {usage.plan && (
          <div className={`mt-3 pt-3 border-t ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <span className={`text-xs ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>الخطة الحالية: </span>
            <span className="text-xs font-semibold text-indigo-600">{usage.plan.name}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className={`text-lg font-bold flex items-center gap-2 ${
          darkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
          <span>📊</span>
          استهلاك الباقة
        </h3>
        {usage.plan && (
          <span className="badge badge-info">{usage.plan.name}</span>
        )}
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usageItems.map((item) => {
            const percentage = calculatePercentage(item.used, item.limit);
            const nearLimit = isNearLimit(item.used, item.limit);
            const limitReached = isLimitReached(item.used, item.limit);

            return (
              <div key={item.label} className={`rounded-lg p-4 border transition-colors duration-300 ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold flex items-center gap-2 ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    <span className="text-xl">{item.icon}</span>
                    {item.label}
                  </span>
                  <span className={`text-sm font-bold ${
                    limitReached 
                      ? 'text-red-600' 
                      : darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    {item.formatter ? item.formatter(item.used) : item.used}
                    <span className={`font-normal ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}> / {describeLimit(item.limit)}</span>
                  </span>
                </div>
                {item.limit > 0 && (
                  <>
                    <div className={`w-full rounded-full h-2.5 mb-2 ${
                      darkMode ? 'bg-gray-600' : 'bg-gray-200'
                    }`}>
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor(item.used, item.limit)}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className={`text-xs text-center ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {percentage.toFixed(0)}% مستخدم
                    </div>
                  </>
                )}
                {item.limit <= 0 && (
                  <div className="text-xs text-green-600 text-center font-medium">
                    ✨ غير محدود
                  </div>
                )}
                {showWarning && nearLimit && (
                  <div className="mt-2 text-xs text-orange-600 flex items-center justify-center gap-1 bg-orange-50 rounded py-1">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    <span>⚠️ أنت قريب من استهلاك الحد</span>
                  </div>
                )}
                {showWarning && limitReached && (
                  <div className="mt-2 text-xs text-red-600 flex items-center justify-center gap-1 bg-red-50 rounded py-1 font-semibold">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    <span>🚫 الحد مستهلك بالكامل</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
