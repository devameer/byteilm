import React from "react";
import { useTheme } from "../../../contexts/ThemeContext";

const STATUS_BADGES = {
    pending: { text: "قيد الانتظار", classes: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "fa-clock" },
    in_progress: { text: "قيد التنفيذ", classes: "bg-blue-100 text-blue-700 border-blue-200", icon: "fa-spinner" },
    completed: { text: "مكتملة", classes: "bg-green-100 text-green-700 border-green-200", icon: "fa-check-circle" },
    cancelled: { text: "ملغاة", classes: "bg-gray-100 text-gray-600 border-gray-200", icon: "fa-ban" },
};

const PRIORITY_CONFIG = {
    urgent: { text: "عاجلة", classes: "bg-red-50 text-red-700 border-red-200", icon: "fa-fire" },
    high: { text: "عالية", classes: "bg-orange-50 text-orange-700 border-orange-200", icon: "fa-arrow-up" },
    medium: { text: "متوسطة", classes: "bg-blue-50 text-blue-700 border-blue-200", icon: "fa-minus" },
    low: { text: "منخفضة", classes: "bg-green-50 text-green-700 border-green-200", icon: "fa-arrow-down" },
};

function TaskCard({ task, onEdit, onComplete, onQuickView, selected, onToggleSelect }) {
    const { darkMode } = useTheme();
    const statusMeta = STATUS_BADGES[task.status];
    const priorityMeta = PRIORITY_CONFIG[task.priority];

    return (
        <div className={`border-2 rounded-xl p-5 space-y-4 hover:shadow-md transition-all duration-300 group relative ${
            selected
                ? 'border-blue-500 shadow-lg'
                : darkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-100'
        }`}>
            {onToggleSelect && (
                <div className="absolute top-4 right-4">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleSelect(task.id)}
                        className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            )}
            
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 pr-8">
                    <h3 className={`text-lg font-bold group-hover:text-blue-600 transition-colors mb-2 ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                        {task.title}
                    </h3>
                    {task.description && (
                        <p className={`text-sm line-clamp-2 leading-relaxed ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            {task.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {statusMeta && (
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${statusMeta.classes}`}>
                        <i className={`fas ${statusMeta.icon} mr-1`} />
                        {statusMeta.text}
                    </span>
                )}
                {priorityMeta && (
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${priorityMeta.classes}`}>
                        <i className={`fas ${priorityMeta.icon} mr-1`} />
                        {priorityMeta.text}
                    </span>
                )}
            </div>

            <div className={`space-y-2 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
                {task.scheduled_date && (
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            darkMode ? 'bg-blue-900/30' : 'bg-blue-50'
                        }`}>
                            <i className="fas fa-calendar text-blue-600 text-xs" />
                        </div>
                        <span className="font-medium">{task.scheduled_date}</span>
                    </div>
                )}
                {task.project && (
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            darkMode ? 'bg-purple-900/30' : 'bg-purple-50'
                        }`}>
                            <i className="fas fa-briefcase text-purple-600 text-xs" />
                        </div>
                        <span className="font-medium">{task.project.name}</span>
                    </div>
                )}
                {task.course && (
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'
                        }`}>
                            <i className="fas fa-graduation-cap text-indigo-600 text-xs" />
                        </div>
                        <span className="font-medium">{task.course.name}</span>
                    </div>
                )}
            </div>

            <div className={`flex items-center gap-2 pt-3 border-t ${
                darkMode ? 'border-gray-700' : 'border-gray-100'
            }`}>
                {onQuickView && (
                    <button
                        type="button"
                        onClick={() => onQuickView(task)}
                        className="flex-1 px-3 py-2 border-2 border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all font-bold text-sm"
                    >
                        <i className="fas fa-eye ml-1" />
                        عرض سريع
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => onEdit?.(task)}
                    className={`flex-1 px-3 py-2 border-2 rounded-lg transition-all font-bold text-sm ${
                        darkMode
                            ? 'border-gray-700 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <i className="fas fa-edit ml-1" />
                    تعديل
                </button>
                {task.status !== "completed" && (
                    <button
                        type="button"
                        onClick={() => onComplete?.(task)}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-bold text-sm"
                    >
                        <i className="fas fa-check ml-1" />
                        إكمال
                    </button>
                )}
            </div>
        </div>
    );
}

export default TaskCard;
