import React from "react";
import { useTheme } from "../../../contexts/ThemeContext";

const STATS_CONFIG = [
    { key: "total", label: "الإجمالي", icon: "fa-th", bgColor: "bg-blue-100", textColor: "text-blue-600" },
    { key: "pending", label: "قيد الانتظار", icon: "fa-clock", bgColor: "bg-yellow-100", textColor: "text-yellow-600" },
    { key: "in_progress", label: "قيد التنفيذ", icon: "fa-spinner", bgColor: "bg-blue-100", textColor: "text-blue-600" },
    { key: "completed", label: "مكتملة", icon: "fa-check-circle", bgColor: "bg-green-100", textColor: "text-green-600" },
    { key: "overdue", label: "متأخرة", icon: "fa-exclamation-triangle", bgColor: "bg-red-100", textColor: "text-red-600" },
];

function TaskStatsBar({ stats }) {
    const { darkMode } = useTheme();
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {STATS_CONFIG.map((stat) => (
                <div key={stat.key} className={`rounded-xl border p-6 hover:shadow-lg transition-all duration-300 group ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm mb-1 font-medium ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>{stat.label}</p>
                            <p className={`text-3xl font-black ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>{stats?.[stat.key] ?? 0}</p>
                        </div>
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                            darkMode ? `${stat.bgColor.replace('100', '900/30')}` : stat.bgColor
                        }`}>
                            <i className={`fas ${stat.icon} ${stat.textColor} text-2xl`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default TaskStatsBar;
