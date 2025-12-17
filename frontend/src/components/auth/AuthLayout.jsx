import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";

function AuthLayout({ children, title, subtitle, icon }) {
  const { darkMode } = useTheme();
  
  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500'
    }`} dir="rtl">
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-20 -right-20 w-96 h-96 rounded-full blur-3xl animate-float ${
          darkMode ? 'bg-indigo-500/10' : 'bg-white/10'
        }`}></div>
        <div className={`absolute bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl animate-float ${
          darkMode ? 'bg-purple-500/10' : 'bg-purple-400/20'
        }`} style={{animationDelay: '1s'}}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl animate-pulse ${
          darkMode ? 'bg-pink-500/5' : 'bg-gradient-to-br from-pink-400/10 to-yellow-400/10'
        }`}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <Link
          to="/"
          className="flex items-center justify-center gap-3 mb-8 group animate-fade-in-down"
        >
          <div className={`w-14 h-14 rounded-2xl backdrop-blur-md border flex items-center justify-center shadow-2xl group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
            darkMode 
              ? 'bg-gray-800/50 border-gray-700/50' 
              : 'bg-white/10 border-white/20'
          }`}>
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="text-3xl font-black text-white drop-shadow-lg">منصتك</span>
        </Link>

        <div className={`backdrop-blur-xl rounded-3xl shadow-2xl animate-fade-in-up border transition-colors duration-300 ${
          darkMode 
            ? 'bg-gray-800/95 border-gray-700/50' 
            : 'bg-white/95 border-white/50'
        }`}>
          <div className="p-8 space-y-6">
            <div className="text-center space-y-4">
              {icon && (
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-xl mb-2 animate-float">
                  {icon}
                </div>
              )}
              {title && (
                <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className={`text-lg transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {subtitle}
                </p>
              )}
            </div>

            {children}
          </div>
        </div>

        <div className="text-center mt-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <Link
            to="/"
            className={`inline-flex items-center gap-2 text-sm font-bold transition-colors group backdrop-blur-sm px-6 py-3 rounded-2xl border ${
              darkMode 
                ? 'text-gray-300 hover:text-white bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50' 
                : 'text-white/90 hover:text-white bg-white/10 border-white/20 hover:bg-white/20'
            }`}
          >
            <svg
              className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
