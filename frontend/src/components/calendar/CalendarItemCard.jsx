import React, { memo } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";

const priorityBadgeMap = {
    urgent: {
        text: "عاجل",
        icon: "fa-fire",
        classes: "bg-red-100 text-red-700 border-red-200",
    },
    high: {
        text: "عالي",
        icon: "fa-arrow-up",
        classes: "bg-orange-100 text-orange-700 border-orange-200",
    },
    medium: {
        text: "متوسط",
        icon: "fa-minus",
        classes: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    low: {
        text: "منخفض",
        icon: "fa-arrow-down",
        classes: "bg-green-100 text-green-700 border-green-200",
    },
};

const statusBadgeMap = {
    pending: {
        text: "قيد الانتظار",
        icon: "fa-clock",
        classes: "bg-yellow-100 text-yellow-700",
    },
    in_progress: {
        text: "قيد التنفيذ",
        icon: "fa-spinner",
        classes: "bg-blue-100 text-blue-700",
    },
    completed: {
        text: "مكتملة",
        icon: "fa-check-circle",
        classes: "bg-green-100 text-green-700",
    },
    cancelled: {
        text: "ملغاة",
        icon: "fa-ban",
        classes: "bg-gray-100 text-gray-700",
    },
};

function truncateText(value, limit = 20) {
    if (!value) {
        return "";
    }
    return value.length > limit ? `${value.slice(0, limit)}...` : value;
}

function formatDateISO(date) {
    const target = date instanceof Date ? date : new Date(date);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, "0");
    const day = String(target.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function isSameDay(dateA, dateB) {
    return formatDateISO(dateA) === formatDateISO(dateB);
}

function CalendarItemCard({ item, onComplete, onQuickView }) {
    const { darkMode } = useTheme();
    const isLesson = Boolean(item?.is_lesson);
    const isCompleted = item?.status === "completed";
    const isOverdue = Boolean(item?.is_overdue);
    const priorityMeta = item?.priority
        ? priorityBadgeMap[item.priority]
        : null;
    const statusMeta = item?.status ? statusBadgeMap[item.status] : null;

    const baseClasses = darkMode
        ? isCompleted
            ? "border-green-700 bg-green-900/30"
            : isOverdue
            ? "border-red-700 bg-red-900/30"
            : item?.priority === "urgent"
            ? "border-orange-700 bg-orange-900/30"
            : "border-gray-700 bg-gray-800"
        : isCompleted
        ? "border-green-300 bg-green-50"
        : isOverdue
        ? "border-red-300 bg-red-50"
        : item?.priority === "urgent"
        ? "border-orange-300 bg-orange-50"
        : "border-gray-200 bg-white";

    return (
        <div
            className={`calendar-item group rounded-lg border-2 ${baseClasses} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 p-4`}
            data-is-lesson={isLesson ? "1" : "0"}
            data-priority={item?.priority ?? "medium"}
            data-title={item?.title ?? ""}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isLesson
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                        } mb-2`}
                    >
                        <i
                            className={`fas ${
                                isLesson ? "fa-book" : "fa-tasks"
                            } ml-1`}
                        />
                        {isLesson ? "درس" : "مهمة"}
                    </span>
                    <h3
                        className={`text-sm font-bold transition-colors group-hover:text-blue-600 ${
                            isCompleted
                                ? darkMode ? "line-through text-gray-500" : "line-through text-gray-500"
                                : darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                    >
                        {item?.title}
                    </h3>
                    {item?.description && (
                        <p className={`text-xs mt-1 line-clamp-2 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            {item.description}
                        </p>
                    )}
                </div>
                {statusMeta && (
                    <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusMeta.classes}`}
                    >
                        <i
                            className={`fas ${statusMeta.icon} ml-1 ${
                                item?.status === "in_progress" ? "fa-spin" : ""
                            }`}
                        />
                        {statusMeta.text}
                    </span>
                )}
            </div>

            <div className={`flex flex-wrap items-center gap-3 text-xs mb-3 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
                {priorityMeta && (
                    <span
                        className={`inline-flex items-center px-2 py-1 rounded-full border font-semibold ${priorityMeta.classes}`}
                    >
                        <i className={`fas ${priorityMeta.icon} ml-1`} />
                        {priorityMeta.text}
                    </span>
                )}

                {item?.course && (
                    <span className="flex items-center font-medium text-indigo-600">
                        <i className="fas fa-graduation-cap ml-1 text-indigo-500" />
                        {truncateText(item.course.name, 20)}
                    </span>
                )}

                {item?.project && (
                    <span className="flex items-center font-medium text-blue-600">
                        <i className="fas fa-project-diagram ml-1 text-blue-500" />
                        {truncateText(item.project.name, 20)}
                    </span>
                )}

                {item?.lesson && (
                    <span className="flex items-center font-medium text-purple-600">
                        <i className="fas fa-book-open ml-1 text-purple-500" />
                        {truncateText(item.lesson.name, 20)}
                    </span>
                )}

                {item?.scheduled_date && (
                    <span
                        className={`flex items-center ${
                            isOverdue ? "text-red-600 font-semibold" : ""
                        }`}
                    >
                        <i className="fas fa-calendar ml-1" />
                        {item.scheduled_date}
                        {item.scheduled_date &&
                            isSameDay(item.scheduled_date, new Date()) && (
                                <span className="mr-1 text-blue-600 font-bold">
                                    (اليوم)
                                </span>
                            )}
                        {item.scheduled_date &&
                            isSameDay(
                                item.scheduled_date,
                                addDays(new Date(), 1)
                            ) && (
                                <span className="mr-1 text-purple-600 font-bold">
                                    (غداً)
                                </span>
                            )}
                        {isOverdue && (
                            <span className="mr-1 text-red-600 font-bold">
                                (متأخر)
                            </span>
                        )}
                    </span>
                )}
            </div>

            {Array.isArray(item?.tags) && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className={`px-2 py-1 text-xs rounded-full ${
                                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            #{tag}
                        </span>
                    ))}
                    {item.tags.length > 3 && (
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                        }`}>
                            +{item.tags.length - 3}
                        </span>
                    )}
                </div>
            )}

            <div className={`flex items-center justify-between pt-3 border-t ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
                <div className="flex items-center gap-2">
                    {onQuickView && (
                        <button
                            type="button"
                            onClick={() => onQuickView(item)}
                            className="inline-flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-xs font-semibold"
                            title="عرض سريع"
                        >
                            <i className="fas fa-eye ml-1" />
                            عرض سريع
                        </button>
                    )}
                    <Link
                        to={`/tasks/${item?.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-semibold"
                        title="عرض التفاصيل"
                    >
                        <i className="fas fa-eye ml-1" />
                        عرض
                    </Link>
                </div>
                {!isCompleted ? (
                    <button
                        type="button"
                        onClick={() => onComplete?.(item)}
                        className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-semibold shadow-sm hover:shadow-md"
                    >
                        <i className="fas fa-check ml-1" />
                        إكمال
                    </button>
                ) : (
                    <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                        <i className="fas fa-check-double ml-1" />
                        مكتملة
                    </span>
                )}
            </div>
        </div>
    );
}

export default memo(CalendarItemCard);
