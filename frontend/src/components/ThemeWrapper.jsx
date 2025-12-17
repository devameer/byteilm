import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * ThemeWrapper & Themed Components
 * 
 * A collection of theme-aware components that automatically adapt to dark/light mode.
 * All components use the ThemeContext to detect the current theme.
 * 
 * Usage Examples:
 * 
 * 1. ThemedCard:
 *    <ThemedCard>
 *      <h3>Card Title</h3>
 *      <p>Card content</p>
 *    </ThemedCard>
 * 
 * 2. ThemedHeader:
 *    <ThemedHeader 
 *      title="Page Title" 
 *      subtitle="Page description"
 *      actions={<ThemedButton>Action</ThemedButton>}
 *    />
 * 
 * 3. ThemedButton:
 *    <ThemedButton variant="primary" onClick={handleClick}>
 *      Click Me
 *    </ThemedButton>
 * 
 * 4. Form Inputs:
 *    <ThemedLabel required>Label</ThemedLabel>
 *    <ThemedInput placeholder="Enter text" />
 *    <ThemedSelect><option>Option</option></ThemedSelect>
 *    <ThemedTextarea rows={4} />
 * 
 * 5. ThemedBadge:
 *    <ThemedBadge variant="success">Active</ThemedBadge>
 * 
 * All components automatically adjust colors, borders, and shadows based on theme.
 */
const ThemeWrapper = ({ children, className = '' }) => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`min-h-full transition-colors duration-300 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Card component with dark mode support
 */
export const ThemedCard = ({ children, className = '', hover = true }) => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`
      rounded-xl border-2 p-6 shadow-lg transition-all duration-300
      ${darkMode 
        ? 'bg-gray-800 border-gray-700 text-gray-200' 
        : 'bg-white border-gray-100 text-gray-900'
      }
      ${hover ? 'hover:shadow-2xl hover:-translate-y-1' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

/**
 * Section Header with dark mode support
 */
export const ThemedHeader = ({ title, subtitle, actions, className = '' }) => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 ${className}`}>
      <div>
        <h2 className={`text-3xl font-black mb-2 ${
          darkMode 
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400' 
            : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600'
        }`}>
          {title}
        </h2>
        {subtitle && (
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
};

/**
 * Button with dark mode support
 */
export const ThemedButton = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const { darkMode } = useTheme();
  
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white',
    secondary: darkMode 
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-2 border-gray-600' 
      : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-indigo-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  };
  
  return (
    <button
      className={`
        px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl 
        transform hover:scale-105 transition-all duration-300
        flex items-center gap-2
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Input with dark mode support
 */
export const ThemedInput = ({ className = '', ...props }) => {
  const { darkMode } = useTheme();
  
  return (
    <input
      className={`
        w-full px-4 py-3 border-2 rounded-lg transition-all
        ${darkMode 
          ? 'bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900' 
          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
        }
        ${className}
      `}
      {...props}
    />
  );
};

/**
 * Select with dark mode support
 */
export const ThemedSelect = ({ className = '', children, ...props }) => {
  const { darkMode } = useTheme();
  
  return (
    <select
      className={`
        w-full px-4 py-3 border-2 rounded-lg transition-all
        ${darkMode 
          ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900' 
          : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
  );
};

/**
 * Textarea with dark mode support
 */
export const ThemedTextarea = ({ className = '', ...props }) => {
  const { darkMode } = useTheme();
  
  return (
    <textarea
      className={`
        w-full px-4 py-3 border-2 rounded-lg transition-all resize-none
        ${darkMode 
          ? 'bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900' 
          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
        }
        ${className}
      `}
      {...props}
    />
  );
};

/**
 * Badge with dark mode support
 */
export const ThemedBadge = ({ children, variant = 'default', className = '' }) => {
  const { darkMode } = useTheme();
  
  const variants = {
    default: darkMode 
      ? 'bg-gray-700 text-gray-200 border-gray-600' 
      : 'bg-gray-100 text-gray-700 border-gray-200',
    primary: darkMode 
      ? 'bg-indigo-900/50 text-indigo-300 border-indigo-700' 
      : 'bg-indigo-100 text-indigo-700 border-indigo-200',
    success: darkMode 
      ? 'bg-green-900/50 text-green-300 border-green-700' 
      : 'bg-green-100 text-green-700 border-green-200',
    warning: darkMode 
      ? 'bg-yellow-900/50 text-yellow-300 border-yellow-700' 
      : 'bg-yellow-100 text-yellow-700 border-yellow-200',
    danger: darkMode 
      ? 'bg-red-900/50 text-red-300 border-red-700' 
      : 'bg-red-100 text-red-700 border-red-200',
  };
  
  return (
    <span className={`
      px-3 py-1 text-xs font-bold rounded-full border-2
      ${variants[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
};

/**
 * Label with dark mode support
 */
export const ThemedLabel = ({ children, className = '', required = false }) => {
  const { darkMode } = useTheme();
  
  return (
    <label className={`
      block text-sm font-bold mb-2
      ${darkMode ? 'text-gray-300' : 'text-gray-700'}
      ${className}
    `}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

/**
 * Empty State with dark mode support
 */
export const ThemedEmptyState = ({ icon, title, description, action }) => {
  const { darkMode } = useTheme();
  
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4 opacity-20">{icon}</div>
      <h3 className={`text-xl font-bold mb-2 ${
        darkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {title}
      </h3>
      <p className={`mb-6 ${
        darkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>
        {description}
      </p>
      {action}
    </div>
  );
};

export default ThemeWrapper;
