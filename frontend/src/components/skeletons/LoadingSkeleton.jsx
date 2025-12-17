import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const Skeleton = ({ className = '', width, height, darkMode: propDarkMode }) => {
  const theme = useTheme();
  const darkMode = propDarkMode !== undefined ? propDarkMode : theme?.darkMode;
  
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;
  
  const bgColor = darkMode ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <div
      className={`animate-pulse ${bgColor} rounded ${className}`}
      style={style}
    />
  );
};

export const TextSkeleton = ({ lines = 3, className = '', darkMode: propDarkMode }) => {
  const theme = useTheme();
  const darkMode = propDarkMode !== undefined ? propDarkMode : theme?.darkMode;
  
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="1rem"
          darkMode={darkMode}
          className={`mb-2 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
};

export const CardSkeleton = ({ className = '' }) => {
  const { darkMode } = useTheme();
  const bgCard = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  
  return (
    <div className={`${bgCard} rounded-xl shadow-sm border p-6 ${className}`}>
      <Skeleton height="1.5rem" width="60%" className="mb-4" darkMode={darkMode} />
      <TextSkeleton lines={3} darkMode={darkMode} />
      <div className="mt-4 flex gap-2">
        <Skeleton height="2rem" width="5rem" darkMode={darkMode} />
        <Skeleton height="2rem" width="5rem" darkMode={darkMode} />
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, columns = 4, className = '' }) => {
  const { darkMode } = useTheme();
  const bgCard = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const borderLight = darkMode ? 'border-gray-700' : 'border-gray-100';
  
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className={`${bgCard} rounded-xl shadow-sm border`}>
        {/* Header */}
        <div className={`border-b ${borderColor} p-4 flex gap-4`}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} height="1rem" width="100%" darkMode={darkMode} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className={`border-b ${borderLight} p-4 flex gap-4 ${
              rowIndex === rows - 1 ? '' : 'border-b'
            }`}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} height="1rem" width="100%" darkMode={darkMode} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ListSkeleton = ({ items = 5, className = '' }) => {
  const { darkMode } = useTheme();
  const bgCard = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  
  return (
    <div className={className}>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className={`${bgCard} rounded-lg shadow-sm border p-4 mb-3 ${
            index === items - 1 ? '' : 'mb-3'
          }`}
        >
          <div className="flex items-start gap-4">
            <Skeleton width="3rem" height="3rem" className="rounded-full flex-shrink-0" darkMode={darkMode} />
            <div className="flex-1">
              <Skeleton height="1.25rem" width="40%" className="mb-2" darkMode={darkMode} />
              <TextSkeleton lines={2} darkMode={darkMode} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
