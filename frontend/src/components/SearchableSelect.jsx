import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { useTheme } from '../contexts/ThemeContext';

/**
 * SearchableSelect Component
 * A searchable dropdown select component
 */
function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'اختر...',
  searchPlaceholder = 'ابحث...',
  className = '',
  disabled = false,
  required = false,
  label,
  emptyMessage = 'لا توجد نتائج',
}) {
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const wrapperRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return options;
    }
    const search = debouncedSearch.toLowerCase();
    return options.filter((option) =>
      (option.label || option.name || String(option.value))
        .toLowerCase()
        .includes(search)
    );
  }, [options, debouncedSearch]);

  // Get selected option label
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const baseClasses = `relative ${className}`;
  const inputClasses = `w-full border-2 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 font-medium transition-all text-right ${
    darkMode
      ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
      : 'bg-white border-gray-300 focus:border-blue-500'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;

  return (
    <div className={baseClasses} ref={wrapperRef}>
      {label && (
        <label
          className={`block text-sm font-bold mb-2 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={inputClasses}
        >
          <div className="flex items-center justify-between">
            <span className={selectedOption ? '' : 'text-gray-400'}>
              {selectedOption
                ? selectedOption.label || selectedOption.name
                : placeholder}
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div
            className={`absolute z-50 w-full mt-1 rounded-lg shadow-lg border-2 ${
              darkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            } max-h-64 overflow-hidden`}
          >
            {/* Search input */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className={`w-full px-3 py-2 rounded border ${
                  darkMode
                    ? 'bg-gray-900 border-gray-600 text-gray-200 placeholder-gray-500'
                    : 'bg-white border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div
                  className={`px-4 py-3 text-center text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = String(option.value) === String(value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full text-right px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${
                        isSelected
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : darkMode
                          ? 'text-gray-200'
                          : 'text-gray-900'
                      }`}
                    >
                      {option.label || option.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchableSelect;

