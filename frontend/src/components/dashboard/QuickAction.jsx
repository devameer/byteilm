import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

function QuickAction({ title, description, icon, color = "indigo", onClick, link }) {
  const { darkMode } = useTheme();
  const colors = {
    indigo: "from-indigo-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    orange: "from-orange-500 to-yellow-500",
    pink: "from-pink-500 to-rose-500",
  };

  const Component = link ? "a" : "button";

  return (
    <Component
      href={link}
      onClick={onClick}
      className={`group relative rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border hover:border-transparent hover:-translate-y-1 cursor-pointer ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
      
      <div className="relative flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-bold mb-1 group-hover:text-indigo-600 transition-colors ${
            darkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            {title}
          </h3>
          <p className={`text-sm leading-relaxed ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {description}
          </p>
        </div>

        <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all duration-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
    </Component>
  );
}

export default QuickAction;
