import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";

function AuthCard({ children, footer }) {
  const { darkMode } = useTheme();
  
  return (
    <>
      {children}
      
      {footer && (
        <div className={`px-8 py-6 rounded-b-3xl border-t-2 text-center space-y-4 transition-colors duration-300 ${
          darkMode 
            ? 'bg-gray-900/50 border-gray-700' 
            : 'bg-gray-50 border-gray-100'
        }`}>
          {footer}
        </div>
      )}
    </>
  );
}

export default AuthCard;
