import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

function CalendarFilters({
  filter,
  onFilterChange,
  searchTerm,
  onSearchChange,
}) {
  const { darkMode } = useTheme();
  const filters = [
    { id: "all", label: "الكل", icon: "M4 6h16M4 12h16M4 18h16" },
    {
      id: "lessons",
      label: "دروس",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    },
    {
      id: "tasks",
      label: "مهام",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    },
    {
      id: "urgent",
      label: "عاجل",
      icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    },
  ];

  return (
    <div
      className={`my-4 rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
      }`}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg
                className={`w-5 h-5 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="ابحث في المهام والدروس..."
              className={`w-full pl-4 pr-12 py-3 border-2 rounded-xl transition-all duration-300 ${
                darkMode
                  ? "bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              } focus:outline-none`}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              className={`
                group flex items-center gap-2 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-300
                ${
                  filter === f.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105"
                    : darkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                }
              `}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={f.icon}
                />
              </svg>
              <span className="text-sm">{f.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CalendarFilters;
