export const DEFAULT_FILTERS = {
    search: "",
    status: "all", // Changed from "" to "all" to show all tasks including completed
    priority: "",
    is_lesson: "",
    project_id: "",
    course_id: "",
    quick_date: "",
    type: "",
    date_from: "",
    date_to: "",
    order_by: "scheduled_date",
    order_direction: "asc",
};

export const STATUS_OPTIONS = [
    { value: "all", label: "كل الحالات" }, // Changed from "" to "all"
    { value: "pending", label: "قيد الانتظار" },
    { value: "in_progress", label: "قيد التنفيذ" },
    { value: "completed", label: "مكتملة" },
    { value: "cancelled", label: "ملغاة" },
];

export const PRIORITY_OPTIONS = [
    { value: "", label: "كل المستويات" },
    { value: "urgent", label: "عاجلة" },
    { value: "high", label: "مرتفعة" },
    { value: "medium", label: "متوسطة" },
    { value: "low", label: "منخفضة" },
];

export const QUICK_DATE_OPTIONS = [
    { value: "", label: "بدون" },
    { value: "today", label: "اليوم" },
    { value: "tomorrow", label: "الغد" },
    { value: "this_week", label: "هذا الأسبوع" },
    { value: "next_week", label: "الأسبوع القادم" },
    { value: "overdue", label: "متأخرة" },
];

export const STATS_TEMPLATE = {
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
};
