import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";

function QuickStats({ todayCount, tomorrowCount, weekCount, overdueCount }) {
  const { darkMode } = useTheme();
  const stats = [
    {
      label: "اليوم",
      count: todayCount,
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      color: "from-blue-500 to-cyan-500",
      link: "/tasks?filter=today"
    },
    {
      label: "غداً",
      count: tomorrowCount,
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "from-green-500 to-emerald-500",
      link: "/tasks?filter=tomorrow"
    },
    {
      label: "هذا الأسبوع",
      count: weekCount,
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      color: "from-purple-500 to-pink-500",
      link: "/tasks?quick_date=this_week"
    },
    {
      label: "متأخرة",
      count: overdueCount,
      icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
      color: "from-red-500 to-orange-500",
      link: "/tasks?filter=overdue"
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          to={stat.link}
          className={`group relative rounded-2xl p-6 shadow-sm border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden ${
            darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-100'
          }`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

          <div className="relative">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
            </div>

            <div>
              <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {stat.label}
              </p>
              <p className={`text-3xl font-black ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {stat.count}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default QuickStats;
