import React from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { PRIORITY_OPTIONS, QUICK_DATE_OPTIONS, STATUS_OPTIONS } from "../constants";

function TaskFiltersPanel({ filters, onChange, onReset }) {
    const { darkMode } = useTheme();
    
    return (
        <div className={`rounded-2xl border-2 p-6 space-y-6 shadow-sm transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className={`text-lg font-black flex items-center gap-2 ${
                    darkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                    <i className="fas fa-filter text-blue-600"></i>
                    <span>تصفية المهام</span>
                </h3>
                <button
                    type="button"
                    onClick={onReset}
                    className="px-4 py-2 text-sm font-bold text-red-600 hover:text-red-700 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-all"
                >
                    <i className="fas fa-redo ml-1"></i>
                    إعادة التعيين
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                    <label className={`block text-sm font-bold mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                        <i className="fas fa-search ml-1 text-blue-600"></i>
                        بحث
                    </label>
                    <input
                        type="search"
                        value={filters.search}
                        onChange={(event) => onChange("search", event.target.value)}
                        className={`w-full border-2 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 transition-all ${
                            darkMode
                                ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="ابحث عن مهمة..."
                    />
                </div>
                <div>
                    <label className={`block text-sm font-bold mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                        <i className="fas fa-circle ml-1 text-blue-600"></i>
                        الحالة
                    </label>
                    <select
                        value={filters.status}
                        onChange={(event) => onChange("status", event.target.value)}
                        className={`w-full border-2 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 font-medium transition-all ${
                            darkMode
                                ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                : 'border-gray-300 focus:border-blue-500'
                        }`}
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={`block text-sm font-bold mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                        <i className="fas fa-flag ml-1 text-blue-600"></i>
                        الأولوية
                    </label>
                    <select
                        value={filters.priority}
                        onChange={(event) => onChange("priority", event.target.value)}
                        className={`w-full border-2 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 font-medium transition-all ${
                            darkMode
                                ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                : 'border-gray-300 focus:border-blue-500'
                        }`}
                    >
                        {PRIORITY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={`block text-sm font-bold mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                        <i className="fas fa-calendar ml-1 text-blue-600"></i>
                        فلتر زمني
                    </label>
                    <select
                        value={filters.quick_date}
                        onChange={(event) => onChange("quick_date", event.target.value)}
                        className={`w-full border-2 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 font-medium transition-all ${
                            darkMode
                                ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                : 'border-gray-300 focus:border-blue-500'
                        }`}
                    >
                        {QUICK_DATE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className={`flex flex-wrap items-center gap-3 pt-4 border-t-2 ${
                darkMode ? 'border-gray-700' : 'border-gray-100'
            }`}>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>ترتيب حسب:</span>
                    <select
                        value={filters.order_by}
                        onChange={(event) => onChange("order_by", event.target.value)}
                        className={`border-2 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 ${
                            darkMode
                                ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                : 'border-gray-300 focus:border-blue-500'
                        }`}
                    >
                        <option value="scheduled_date">التاريخ</option>
                        <option value="priority">الأولوية</option>
                        <option value="title">العنوان</option>
                    </select>
                    <button
                        type="button"
                        onClick={() =>
                            onChange(
                                "order_direction",
                                filters.order_direction === "asc" ? "desc" : "asc"
                            )
                        }
                        className={`px-4 py-2 border-2 rounded-lg font-bold text-sm transition-all ${
                            darkMode
                                ? 'border-gray-700 text-gray-300 hover:bg-gray-700'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <i className={`fas fa-arrow-${filters.order_direction === "asc" ? "up" : "down"} ml-1`}></i>
                        {filters.order_direction === "asc" ? "تصاعدي" : "تنازلي"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TaskFiltersPanel;
