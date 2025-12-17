import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function UsageItem({ title, used, limit, icon, formatter, unit = '' }) {
  const { darkMode } = useTheme();
  
  const formatValue = (value) => {
    if (formatter) return formatter(value);
    return `${value}${unit}`;
  };

  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isUnlimited = limit === -1 || limit === 0;

  const getProgressColor = () => {
    if (isUnlimited) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    if (percentage >= 100) return 'bg-gradient-to-r from-red-500 to-red-600';
    if (percentage >= 80) return 'bg-gradient-to-r from-orange-500 to-orange-600';
    return 'bg-gradient-to-r from-blue-500 to-indigo-500';
  };

  return (
    <div className={`p-4 rounded-xl border transition-colors duration-300 ${
      darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <i className={`fas ${icon} ${
            darkMode ? 'text-indigo-400' : 'text-indigo-600'
          }`}></i>
          <span className={`text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>{title}</span>
        </div>
        <span className={`text-sm font-bold ${
          darkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>
          {formatValue(used)}
          {!isUnlimited && (
            <span className={`text-xs font-normal ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}> / {formatValue(limit)}</span>
          )}
        </span>
      </div>
      
      {!isUnlimited ? (
        <>
          <div className={`w-full rounded-full h-2 mb-1 ${
            darkMode ? 'bg-gray-600' : 'bg-gray-200'
          }`}>
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className={`text-xs text-center ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {percentage.toFixed(0)}% مستخدم
          </div>
        </>
      ) : (
        <div className="text-xs text-center text-green-600 font-medium">
          ✨ غير محدود
        </div>
      )}
    </div>
  );
}

export default UsageItem;
