import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";

function StatsCard({ title, value, icon, color = "indigo", change, changeType = "up", link }) {
  const { darkMode } = useTheme();
  const colors = {
    indigo: "from-indigo-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    orange: "from-orange-500 to-yellow-500",
    pink: "from-pink-500 to-rose-500",
    purple: "from-purple-500 to-indigo-500",
  };

  const changeColors = {
    up: "text-green-600 bg-green-50",
    down: "text-red-600 bg-red-50",
    neutral: "text-gray-600 bg-gray-50",
  };

  return (
    <div className={`group relative rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border hover:border-transparent hover:-translate-y-1 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    }`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
          </div>
          
          {change && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${changeColors[changeType]}`}>
              {changeType === "up" && "+"}{change}%
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className={`text-sm font-medium ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>{title}</p>
          <p className={`text-3xl font-black ${
            darkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>{value}</p>
        </div>

        {link && (
          <Link to={link} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 group-hover:gap-3 transition-all duration-300">
            عرض التفاصيل
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}

export default StatsCard;
