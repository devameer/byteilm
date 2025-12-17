import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const PublicNavbar = ({ scrolled: externalScrolled }) => {
  const [scrolled, setScrolled] = useState(externalScrolled || false);
  const { darkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    if (externalScrolled !== undefined) {
      setScrolled(externalScrolled);
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [externalScrolled]);

  return (
    <nav
      className={`fixed w-full top-0 z-50 transition-all duration-500 ${
        scrolled
          ? darkMode 
            ? "bg-gray-800/95 backdrop-blur-lg shadow-lg py-3" 
            : "bg-white/95 backdrop-blur-lg shadow-lg py-3"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className={`text-2xl font-black transition-all duration-300 ${scrolled ? 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent' : 'text-white'}`}>
              منصتك
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <Link to="/" className={`text-sm font-bold transition-all duration-300 hover:scale-105 ${
              scrolled 
                ? darkMode ? "text-gray-300 hover:text-indigo-400" : "text-gray-700 hover:text-indigo-600" 
                : "text-white/90 hover:text-white"
            }`}>
              الرئيسية
            </Link>
            <Link to="/features" className={`text-sm font-bold transition-all duration-300 hover:scale-105 ${
              scrolled 
                ? darkMode ? "text-gray-300 hover:text-indigo-400" : "text-gray-700 hover:text-indigo-600" 
                : "text-white/90 hover:text-white"
            }`}>
              المميزات
            </Link>
            <a href="/#pricing" className={`text-sm font-bold transition-all duration-300 hover:scale-105 ${
              scrolled 
                ? darkMode ? "text-gray-300 hover:text-indigo-400" : "text-gray-700 hover:text-indigo-600" 
                : "text-white/90 hover:text-white"
            }`}>
              الأسعار
            </a>
            <a href="/#testimonials" className={`text-sm font-bold transition-all duration-300 hover:scale-105 ${
              scrolled 
                ? darkMode ? "text-gray-300 hover:text-indigo-400" : "text-gray-700 hover:text-indigo-600" 
                : "text-white/90 hover:text-white"
            }`}>
              آراء العملاء
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${
                scrolled
                  ? darkMode 
                    ? "bg-gray-700 hover:bg-gray-600 text-yellow-400" 
                    : "bg-gray-100 hover:bg-gray-200 text-indigo-600"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                  darkMode 
                    ? "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
                    : "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                } />
              </svg>
            </button>
            <Link
              to="/login"
              className={`hidden sm:inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                scrolled 
                  ? darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100" 
                  : "text-white hover:bg-white/10"
              }`}
            >
              تسجيل الدخول
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              ابدأ مجاناً
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
