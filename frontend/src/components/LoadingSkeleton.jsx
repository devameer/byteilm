import React from 'react';

export const Skeleton = ({ className = '', width, height }) => {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={style}
    />
  );
};

export const TextSkeleton = ({ lines = 3, className = '' }) => {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="1rem"
          className={`mb-2 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
};

export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <Skeleton height="1.5rem" width="60%" className="mb-4" />
      <TextSkeleton lines={3} />
      <div className="mt-4 flex gap-2">
        <Skeleton height="2rem" width="5rem" />
        <Skeleton height="2rem" width="5rem" />
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} height="1rem" width="100%" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className={`border-b border-gray-100 p-4 flex gap-4 ${
              rowIndex === rows - 1 ? '' : 'border-b'
            }`}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} height="1rem" width="100%" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ListSkeleton = ({ items = 5, className = '' }) => {
  return (
    <div className={className}>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 ${
            index === items - 1 ? '' : 'mb-3'
          }`}
        >
          <div className="flex items-start gap-4">
            <Skeleton width="3rem" height="3rem" className="rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Skeleton height="1.25rem" width="40%" className="mb-2" />
              <TextSkeleton lines={2} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;

