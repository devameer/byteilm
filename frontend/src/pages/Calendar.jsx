import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import calendarService from "../services/calendarService";
import taskService from "../services/taskService";
import courseService from "../services/courseService";
import lessonService from "../services/lessonService";
import CalendarHeader from "../components/calendar/CalendarHeader";
import CalendarFilters from "../components/calendar/CalendarFilters";
import QuickStats from "../components/calendar/QuickStats";
import CalendarItemCard from "../components/calendar/CalendarItemCard";
import NotificationToast from "../components/calendar/NotificationToast";
import FullCalendarView from "../components/calendar/FullCalendarView";
import TimelineView from "../components/calendar/TimelineView";
import AgendaView from "../components/calendar/AgendaView";
import PomodoroTimer from "../components/calendar/PomodoroTimer";
import ProductivityWidget from "../components/calendar/ProductivityWidget";
import CalendarPageSkeleton from "../components/skeletons/CalendarPageSkeleton";
import SearchableSelect from "../components/SearchableSelect";

function formatDateISO(date) {
    const target = date instanceof Date ? date : new Date(date);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, "0");
    const day = String(target.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function isSameDay(dateA, dateB) {
    return formatDateISO(dateA) === formatDateISO(dateB);
}

function Calendar() {
    const { darkMode } = useTheme();
    const calendarRef = useRef(null);
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [calendarData, setCalendarData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [todayItems, setTodayItems] = useState([]);
    const [tomorrowItems, setTomorrowItems] = useState([]);
    const [weekItems, setWeekItems] = useState([]);
    const [overdueItems, setOverdueItems] = useState([]);
    
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("list");
    const [activeView, setActiveView] = useState("calendar"); // calendar, timeline, agenda
    
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddForm, setQuickAddForm] = useState({
        title: "",
        source_type: "none",
        course_id: "",
        lesson_id: "",
        priority: "medium",
        scheduled_date: formatDateISO(new Date()),
    });
    const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
    const [quickAddLookups, setQuickAddLookups] = useState({ courses: [], lessons: [] });
    
    const [selectedDay, setSelectedDay] = useState(null);
    const [dayItems, setDayItems] = useState([]);
    const [notification, setNotification] = useState(null);
    const [quickViewItem, setQuickViewItem] = useState(null);

    const showNotification = useCallback((message, type = "info") => {
        setNotification({ id: Date.now(), message, type });
    }, []);

    const filterActiveTasks = useCallback((tasks) => {
        if (!Array.isArray(tasks)) return [];
        return tasks.filter((task) => task.status !== "completed");
    }, []);

    const fetchCalendarData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await calendarService.getCalendarData(formatDateISO(currentDate));
            if (response.success) {
                setCalendarData(response.data);
            } else {
                // Handle API error response
                const errorMessage = response.message || "تعذر تحميل بيانات التقويم";
                console.error("Calendar API error:", response);
                showNotification(errorMessage, "error");
                // Set empty data to prevent UI errors
                setCalendarData({
                    items_by_date: {},
                    month: "",
                    year: new Date().getFullYear(),
                    month_number: new Date().getMonth() + 1,
                    days_in_month: new Date().getDate(),
                    first_day_of_week: 0,
                });
            }
        } catch (error) {
            // Ignore canceled errors (they're not real errors, just duplicate request prevention)
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                // Request was cancelled due to duplicate - this is expected behavior
                setLoading(false);
                return;
            }
            
            console.error("Failed to load calendar data:", error);
            // Only show error if it's a real error (not network timeout or canceled)
            const errorMessage = error?.response?.data?.message || error?.message;
            if (errorMessage && !errorMessage.includes('timeout') && !errorMessage.includes('canceled')) {
                showNotification(errorMessage, "error");
            } else if (error?.response?.status >= 500) {
                showNotification("حدث خطأ في الخادم. يرجى المحاولة لاحقاً", "error");
            } else if (!error?.response) {
                // Network error - don't show error, just log it
                console.error("Network error loading calendar data:", error);
            }
            // Set empty data to prevent UI errors
            setCalendarData({
                items_by_date: {},
                month: "",
                year: new Date().getFullYear(),
                month_number: new Date().getMonth() + 1,
                days_in_month: new Date().getDate(),
                first_day_of_week: 0,
            });
        } finally {
            setLoading(false);
        }
    }, [currentDate, showNotification]);

    const fetchSupportData = useCallback(async () => {
        try {
            const [todayResponse, tomorrowResponse, weekResponse, overdueResponse] = await Promise.all([
                taskService.getTasks({ filter: "today" }),
                taskService.getTasks({ filter: "tomorrow" }),
                taskService.getTasks({ quick_date: "this_week" }),
                taskService.getTasks({ filter: "overdue" }),
            ]);

            setTodayItems(filterActiveTasks(todayResponse?.success ? todayResponse.data : []));
            setTomorrowItems(filterActiveTasks(tomorrowResponse?.success ? tomorrowResponse.data : []));
            setWeekItems(filterActiveTasks(weekResponse?.success ? weekResponse.data : []));
            setOverdueItems(filterActiveTasks(overdueResponse?.success ? overdueResponse.data : []));
        } catch (error) {
            // Ignore canceled errors (they're not real errors, just duplicate request prevention)
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return;
            }
            console.error("Failed to load supplemental calendar data:", error);
        }
    }, [filterActiveTasks]);

    useEffect(() => {
        fetchCalendarData();
        fetchSupportData();
    }, [fetchCalendarData, fetchSupportData]);

    // Load courses for quick add
    useEffect(() => {
        if (isQuickAddOpen) {
            courseService.getCourses({ active: true })
                .then((response) => {
                    const courses = response?.success ? response.data : response?.data ?? [];
                    setQuickAddLookups((prev) => ({ ...prev, courses }));
                })
                .catch(() => {
                    setQuickAddLookups((prev) => ({ ...prev, courses: [] }));
                });
        }
    }, [isQuickAddOpen]);

    // Load lessons when course is selected
    useEffect(() => {
        if (quickAddForm.source_type === "lesson" && quickAddForm.course_id) {
            lessonService.getLessons({ course_id: quickAddForm.course_id })
                .then((response) => {
                    const lessons = response?.success ? response.data : response?.data ?? [];
                    setQuickAddLookups((prev) => ({ ...prev, lessons }));
                })
                .catch(() => {
                    setQuickAddLookups((prev) => ({ ...prev, lessons: [] }));
                });
        } else {
            setQuickAddLookups((prev) => ({ ...prev, lessons: [] }));
            if (quickAddForm.lesson_id) {
                setQuickAddForm((prev) => ({ ...prev, lesson_id: "" }));
            }
        }
    }, [quickAddForm.course_id, quickAddForm.source_type]);

    const handlePreviousMonth = () => {
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.prev();
            setCurrentDate(calendarApi.getDate());
        } else {
            const updated = new Date(currentDate);
            updated.setMonth(updated.getMonth() - 1);
            setCurrentDate(updated);
        }
    };

    const handleNextMonth = () => {
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.next();
            setCurrentDate(calendarApi.getDate());
        } else {
            const updated = new Date(currentDate);
            updated.setMonth(updated.getMonth() + 1);
            setCurrentDate(updated);
        }
    };

    const handleToday = () => {
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.today();
            setCurrentDate(calendarApi.getDate());
        } else {
            setCurrentDate(new Date());
        }
    };

    const toggleViewMode = () => {
        setViewMode((prev) => (prev === "list" ? "grid" : "list"));
    };

    const handleQuickAddFieldChange = (event) => {
        const { name, value } = event.target;
        setQuickAddForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleQuickAddSubmit = async (event) => {
        event.preventDefault();
        setQuickAddSubmitting(true);
        try {
            const payload = {
                title: quickAddForm.title || undefined,
                priority: quickAddForm.priority,
                scheduled_date: quickAddForm.scheduled_date || formatDateISO(new Date()),
                source_type: quickAddForm.source_type,
                course_id: quickAddForm.course_id || null,
                lesson_id: quickAddForm.lesson_id || null,
                is_lesson: quickAddForm.source_type === "lesson" ? true : false,
            };
            const response = await taskService.create(payload);
            if (response.success) {
                showNotification("تمت الإضافة بنجاح!", "success");
                setQuickAddForm({
                    title: "",
                    source_type: "none",
                    course_id: "",
                    lesson_id: "",
                    priority: "medium",
                    scheduled_date: formatDateISO(new Date()),
                });
                setIsQuickAddOpen(false);
                await Promise.all([fetchSupportData(), fetchCalendarData()]);
            } else {
                showNotification(
                    response.message || "تعذر إضافة العنصر",
                    "error"
                );
            }
        } catch (error) {
            // Ignore canceled errors
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return;
            }
            console.error("Quick add failed:", error);
            showNotification("حدث خطأ أثناء الإضافة", "error");
        } finally {
            setQuickAddSubmitting(false);
        }
    };

    const handleCompleteItem = async (item) => {
        if (!item || item.status === "completed") {
            return;
        }
        const confirmation = window.confirm(
            "هل أنت متأكد من إتمام هذه المهمة؟"
        );
        if (!confirmation) {
            return;
        }
        try {
            const response = await calendarService.completeItem(item.id);
            if (response.success) {
                showNotification(
                    response.message || "تم إكمال العنصر بنجاح",
                    "success"
                );
                await Promise.all([fetchSupportData(), fetchCalendarData()]);
                if (selectedDay) {
                    const response = await calendarService.getItemsForDate(formatDateISO(selectedDay));
                    if (response.success) {
                        setDayItems(response.data || []);
                    }
                }
            } else {
                showNotification(
                    response.message || "تعذر إكمال المهمة",
                    "error"
                );
            }
        } catch (error) {
            // Ignore canceled errors
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return;
            }
            console.error("Failed to complete item:", error);
            showNotification("تعذر إكمال المهمة", "error");
        }
    };

    const handleDayClick = async (date) => {
        setSelectedDay(date);
        try {
            const response = await calendarService.getItemsForDate(formatDateISO(date));
            if (response.success) {
                setDayItems(response.data || []);
            }
        } catch (error) {
            // Ignore canceled errors
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return;
            }
            console.error("Failed to load day items:", error);
            setDayItems([]);
        }
    };

    const handleQuickView = (item) => {
        setQuickViewItem(item);
    };

    const handleCloseQuickView = () => {
        setQuickViewItem(null);
    };

    const matchesFilter = useCallback((item) => {
        switch (filter) {
            case "lessons":
                return item.type === "lesson";
            case "tasks":
                return item.type === "task";
            case "urgent":
                return item.priority === "urgent";
            default:
                return true;
        }
    }, [filter]);

    const matchesSearch = useCallback((item) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const haystack = [item.title, item.description, item.course?.name, item.project?.name, item.lesson?.name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return haystack.includes(term);
    }, [searchTerm]);

    const applyFilters = useCallback(
        (items) => {
            if (!Array.isArray(items)) return [];
            return items.filter((item) => matchesFilter(item) && matchesSearch(item));
        },
        [matchesFilter, matchesSearch]
    );

    const filteredTodayItems = useMemo(() => applyFilters(todayItems), [applyFilters, todayItems]);
    const filteredTomorrowItems = useMemo(() => applyFilters(tomorrowItems), [applyFilters, tomorrowItems]);
    const filteredOverdueItems = useMemo(() => applyFilters(overdueItems), [applyFilters, overdueItems]);
    const filteredDayItems = useMemo(() => applyFilters(dayItems), [applyFilters, dayItems]);

    const fullCalendarEvents = useMemo(() => {
        if (!calendarData?.items_by_date) return [];
        const events = [];
        Object.entries(calendarData.items_by_date).forEach(([dateStr, items]) => {
            items.forEach((item) => {
                events.push({
                    id: item.id,
                    title: item.title,
                    start: item.scheduled_date || dateStr,
                    backgroundColor: item.priority === "urgent" ? "#dc2626" : item.priority === "high" ? "#f97316" : item.is_lesson ? "#3b82f6" : "#8b5cf6",
                    borderColor: item.priority === "urgent" ? "#dc2626" : item.priority === "high" ? "#f97316" : item.is_lesson ? "#3b82f6" : "#8b5cf6",
                    extendedProps: {
                        ...item,
                    },
                });
            });
        });
        return events;
    }, [calendarData]);

    const handleEventClick = useCallback((event) => {
        const item = event.extendedProps;
        setQuickViewItem(item);
    }, []);

    const handleEventDrop = useCallback(async ({ event, revert }) => {
        try {
            const newDate = formatDateISO(event.start);
            const response = await calendarService.updateItemDate(event.id, newDate);
            if (!response.success) {
                showNotification("تعذر تحديث التاريخ", "error");
                revert();
            } else {
                showNotification("تم تحديث التاريخ بنجاح", "success");
                await Promise.all([fetchCalendarData(), fetchSupportData()]);
            }
        } catch (error) {
            // Ignore canceled errors
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return;
            }
            console.error("Failed to update event date:", error);
            showNotification("تعذر تحديث التاريخ", "error");
            revert();
        }
    }, [showNotification, fetchCalendarData, fetchSupportData]);

    const handleEventResize = useCallback(async ({ event, revert }) => {
        try {
            const newDate = formatDateISO(event.start);
            const response = await calendarService.updateItemDate(event.id, newDate);
            if (!response.success) {
                showNotification("تعذر تحديث الحدث", "error");
                revert();
            } else {
                showNotification("تم تحديث الحدث بنجاح", "success");
                await Promise.all([fetchCalendarData(), fetchSupportData()]);
            }
        } catch (error) {
            // Ignore canceled errors
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return;
            }
            console.error("Failed to resize event:", error);
            showNotification("تعذر تحديث الحدث", "error");
            revert();
        }
    }, [showNotification, fetchCalendarData, fetchSupportData]);

    if (loading && !calendarData) {
        return <CalendarPageSkeleton />;
    }

    return (
        <div className="max-w-[1600px] mx-auto px-4 py-6">
            <NotificationToast
                notification={notification}
                onClose={() => setNotification(null)}
            />

            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className={`text-3xl font-bold flex items-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            <svg className="w-8 h-8 ml-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            التقويم الموحد
                        </h1>
                        <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            إدارة ذكية للدروس والمهام
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setIsQuickAddOpen(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm hover:shadow transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>إضافة سريعة</span>
                        </button>
                        {/* View Switcher */}
                        <div className={`inline-flex rounded-lg border p-1 ${
                            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'
                        }`}>
                            <button
                                type="button"
                                onClick={() => setActiveView("calendar")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    activeView === "calendar"
                                        ? "bg-indigo-600 text-white"
                                        : darkMode
                                        ? "text-gray-300 hover:bg-gray-700"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                <svg className="w-4 h-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                التقويم
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveView("timeline")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    activeView === "timeline"
                                        ? "bg-indigo-600 text-white"
                                        : darkMode
                                        ? "text-gray-300 hover:bg-gray-700"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                <svg className="w-4 h-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                الجدول الزمني
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveView("agenda")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    activeView === "agenda"
                                        ? "bg-indigo-600 text-white"
                                        : darkMode
                                        ? "text-gray-300 hover:bg-gray-700"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                <svg className="w-4 h-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                جدول الأعمال
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={toggleViewMode}
                            className={`px-4 py-2 border rounded-lg shadow-sm hover:shadow transition-colors duration-200 flex items-center gap-2 text-sm ${
                                darkMode
                                    ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                                    : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={viewMode === "list" ? "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                            <span>
                                {viewMode === "list"
                                    ? "عرض الشبكة"
                                    : "عرض القائمة"}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => window.open("/calendar/export", "_blank")}
                            className={`px-4 py-2 border rounded-lg shadow-sm hover:shadow transition-colors duration-200 flex items-center gap-2 text-sm ${
                                darkMode
                                    ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                                    : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>تصدير</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className={`px-4 py-2 border rounded-lg shadow-sm hover:shadow transition-colors duration-200 flex items-center gap-2 text-sm ${
                                darkMode
                                    ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                                    : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
            </div>

            <CalendarHeader
                currentDate={currentDate}
                onPrevMonth={handlePreviousMonth}
                onNextMonth={handleNextMonth}
                onToday={handleToday}
            />

            <QuickStats
                todayCount={todayItems.length}
                tomorrowCount={tomorrowItems.length}
                weekCount={weekItems.length}
                overdueCount={overdueItems.length}
            />

            <CalendarFilters
                filter={filter}
                onFilterChange={setFilter}
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {activeView === "calendar" && (
                        <div className={`rounded-2xl shadow-sm border p-6 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                            <FullCalendarView
                                calendarRef={calendarRef}
                                events={fullCalendarEvents}
                                onEventClick={handleEventClick}
                                onDateClick={handleDayClick}
                                onEventDrop={handleEventDrop}
                                onEventResize={handleEventResize}
                            />
                        </div>
                    )}

                    {activeView === "timeline" && (
                        <TimelineView
                            date={selectedDay || new Date()}
                            items={selectedDay ? filteredDayItems : filteredTodayItems}
                            onEventClick={handleQuickView}
                            onComplete={handleCompleteItem}
                        />
                    )}

                    {activeView === "agenda" && (
                        <AgendaView
                            currentDate={currentDate}
                            calendarData={calendarData}
                            onEventClick={handleQuickView}
                            onComplete={handleCompleteItem}
                        />
                    )}
                </div>

                <div className="space-y-6">
                    {/* Productivity Widget */}
                    <ProductivityWidget
                        todayItems={todayItems}
                        weekItems={weekItems}
                        completedToday={todayItems.filter(item => item.status === 'completed').length}
                        totalToday={todayItems.length}
                    />

                    {/* Pomodoro Timer */}
                    <PomodoroTimer
                        task={quickViewItem}
                        onComplete={() => {
                            if (quickViewItem) {
                                handleCompleteItem(quickViewItem);
                            }
                        }}
                    />

                    {selectedDay && (
                        <div className={`rounded-2xl shadow-sm border p-6 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                            <h3 className={`text-xl font-black mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                {selectedDay.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </h3>
                            {filteredDayItems.length > 0 ? (
                                viewMode === "list" ? (
                                    <div className="space-y-3">
                                        {filteredDayItems.map((item) => (
                                            <CalendarItemCard key={item.id} item={item} compact onComplete={handleCompleteItem} onQuickView={handleQuickView} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {filteredDayItems.map((item) => (
                                            <CalendarItemCard key={item.id} item={item} compact onComplete={handleCompleteItem} onQuickView={handleQuickView} />
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8">
                                    <svg className={`w-16 h-16 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>لا توجد مهام في هذا اليوم</p>
                                </div>
                            )}
                        </div>
                    )}

                    {filteredOverdueItems.length > 0 && (
                        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-sm border-2 border-red-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-red-300' : 'text-red-900'}`}>
                                    مهام متأخرة ({filteredOverdueItems.length})
                                </h3>
                            </div>
                            {viewMode === "list" ? (
                                <div className="space-y-3">
                                    {filteredOverdueItems.slice(0, 5).map((item) => (
                                        <CalendarItemCard key={item.id} item={item} compact onComplete={handleCompleteItem} onQuickView={handleQuickView} />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredOverdueItems.slice(0, 5).map((item) => (
                                        <CalendarItemCard key={item.id} item={item} compact onComplete={handleCompleteItem} onQuickView={handleQuickView} />
                                    ))}
                                </div>
                            )}
                            {filteredOverdueItems.length > 5 && (
                                <Link to="/tasks?filter=overdue" className="block mt-4 text-center text-sm font-bold text-red-600 hover:text-red-700">
                                    عرض جميع المهام المتأخرة ({filteredOverdueItems.length})
                                </Link>
                            )}
                        </div>
                    )}

                    {filteredTodayItems.length > 0 && (
                        <div className={`rounded-2xl shadow-sm border p-6 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                    اليوم ({filteredTodayItems.length})
                                </h3>
                            </div>
                            {viewMode === "list" ? (
                                <div className="space-y-3">
                                    {filteredTodayItems.slice(0, 5).map((item) => (
                                        <CalendarItemCard key={item.id} item={item} compact onComplete={handleCompleteItem} onQuickView={handleQuickView} />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredTodayItems.slice(0, 5).map((item) => (
                                        <CalendarItemCard key={item.id} item={item} compact onComplete={handleCompleteItem} onQuickView={handleQuickView} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {filteredTomorrowItems.length > 0 && (
                        <div className={`rounded-2xl shadow-sm border p-6 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                    غداً ({filteredTomorrowItems.length})
                                </h3>
                            </div>
                            {viewMode === "list" ? (
                                <div className="space-y-3">
                                    {filteredTomorrowItems.slice(0, 5).map((item) => (
                                        <CalendarItemCard key={item.id} item={item} compact onComplete={handleCompleteItem} onQuickView={handleQuickView} />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredTomorrowItems.slice(0, 5).map((item) => (
                                        <CalendarItemCard key={item.id} item={item} compact onComplete={handleCompleteItem} onQuickView={handleQuickView} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isQuickAddOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setIsQuickAddOpen(false)}>
                    <div className={`rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                    }`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-2xl font-black ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                إضافة سريعة
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsQuickAddOpen(false)}
                                className={`transition-colors ${
                                    darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleQuickAddSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="title" className={`block text-sm font-bold mb-2 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    العنوان
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={quickAddForm.title}
                                    onChange={handleQuickAddFieldChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                        darkMode
                                            ? 'bg-gray-900 border-gray-700 text-gray-200'
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="أدخل العنوان"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="source_type" className={`block text-sm font-bold mb-2 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    مصدر المهمة
                                </label>
                                <select
                                    id="source_type"
                                    name="source_type"
                                    value={quickAddForm.source_type}
                                    onChange={handleQuickAddFieldChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                        darkMode
                                            ? 'bg-gray-900 border-gray-700 text-gray-200'
                                            : 'border-gray-300'
                                    }`}
                                >
                                    <option value="none">مستقلة</option>
                                    <option value="lesson">درس</option>
                                </select>
                            </div>
                            {quickAddForm.source_type === "lesson" && (
                                <>
                                    <div>
                                        <label className={`block text-sm font-bold mb-2 ${
                                            darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                            الدورة
                                        </label>
                                        <select
                                            value={quickAddForm.course_id}
                                            onChange={(e) => setQuickAddForm((prev) => ({ ...prev, course_id: e.target.value, lesson_id: "" }))}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                                darkMode
                                                    ? 'bg-gray-900 border-gray-700 text-gray-200'
                                                    : 'border-gray-300'
                                            }`}
                                        >
                                            <option value="">اختر دورة</option>
                                            {quickAddLookups.courses.map((course) => (
                                                <option key={course.id} value={course.id}>
                                                    {course.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {quickAddForm.course_id && (
                                        <div>
                                            <SearchableSelect
                                                label="الدرس"
                                                value={quickAddForm.lesson_id}
                                                onChange={(lessonId) => setQuickAddForm((prev) => ({ ...prev, lesson_id: lessonId }))}
                                                options={quickAddLookups.lessons.map((lesson) => ({
                                                    value: lesson.id,
                                                    label: lesson.name,
                                                    name: lesson.name,
                                                }))}
                                                placeholder="اختر درساً"
                                                searchPlaceholder="ابحث عن درس..."
                                                emptyMessage="لا توجد دروس متاحة"
                                            />
                                        </div>
                                    )}
                                    {quickAddForm.source_type === "lesson" && !quickAddForm.course_id && (
                                        <div className={`p-3 rounded-lg border-2 ${
                                            darkMode 
                                                ? 'bg-gray-800/50 border-gray-700 text-gray-400' 
                                                : 'bg-gray-50 border-gray-200 text-gray-500'
                                        }`}>
                                            <p className="text-sm text-center">
                                                يرجى اختيار الدورة أولاً لعرض الدروس المتاحة
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="priority" className={`block text-sm font-bold mb-2 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        الأولوية
                                    </label>
                                    <select
                                        id="priority"
                                        name="priority"
                                        value={quickAddForm.priority}
                                        onChange={handleQuickAddFieldChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                            darkMode
                                                ? 'bg-gray-900 border-gray-700 text-gray-200'
                                                : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="low">منخفضة</option>
                                        <option value="medium">متوسطة</option>
                                        <option value="high">عالية</option>
                                        <option value="urgent">عاجلة</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="scheduled_date" className={`block text-sm font-bold mb-2 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        تاريخ التنفيذ
                                    </label>
                                    <input
                                        type="date"
                                        id="scheduled_date"
                                        name="scheduled_date"
                                        value={quickAddForm.scheduled_date}
                                        onChange={handleQuickAddFieldChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                            darkMode
                                                ? 'bg-gray-900 border-gray-700 text-gray-200'
                                                : 'border-gray-300'
                                        }`}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={quickAddSubmitting}
                                    className="flex-1 px-4 py-2 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {quickAddSubmitting ? "جاري الإضافة..." : "إضافة"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsQuickAddOpen(false)}
                                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                                        darkMode
                                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {quickViewItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={handleCloseQuickView}>
                    <div className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                    }`} onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${quickViewItem.is_lesson ? "bg-white/20 text-white" : "bg-white/20 text-white"}`}>
                                            <i className={`fas ${quickViewItem.is_lesson ? "fa-book" : "fa-tasks"} ml-1`} />
                                            {quickViewItem.is_lesson ? "درس" : "مهمة"}
                                        </span>
                                        {quickViewItem.priority && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                                                <i className="fas fa-flag ml-1" />
                                                {quickViewItem.priority === "urgent" ? "عاجل" : quickViewItem.priority === "high" ? "عالي" : quickViewItem.priority === "medium" ? "متوسط" : "منخفض"}
                                            </span>
                                        )}
                                        {quickViewItem.status && (
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                quickViewItem.status === "completed" ? "bg-green-100 text-green-700" :
                                                quickViewItem.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                                                "bg-yellow-100 text-yellow-700"
                                            }`}>
                                                <i className={`fas ${quickViewItem.status === "completed" ? "fa-check-circle" : quickViewItem.status === "in_progress" ? "fa-spinner fa-spin" : "fa-clock"} ml-1`} />
                                                {quickViewItem.status === "completed" ? "مكتملة" : quickViewItem.status === "in_progress" ? "قيد التنفيذ" : "قيد الانتظار"}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-black">{quickViewItem.title}</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCloseQuickView}
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {quickViewItem.description && (
                                <div>
                                    <h3 className={`text-sm font-bold mb-2 flex items-center gap-2 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        <i className="fas fa-align-right text-indigo-600" />
                                        الوصف
                                    </h3>
                                    <p className={`p-4 rounded-lg ${
                                        darkMode ? 'text-gray-300 bg-gray-900' : 'text-gray-600 bg-gray-50'
                                    }`}>{quickViewItem.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {quickViewItem.scheduled_date && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-2">
                                            <i className="fas fa-calendar text-blue-600" />
                                            التاريخ المحدد
                                        </h3>
                                        <p className="text-gray-700 font-medium">{quickViewItem.scheduled_date}</p>
                                    </div>
                                )}

                                {quickViewItem.course && (
                                    <div className="bg-indigo-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-bold text-indigo-700 mb-2 flex items-center gap-2">
                                            <i className="fas fa-graduation-cap text-indigo-600" />
                                            الدورة
                                        </h3>
                                        <p className="text-gray-700 font-medium">{quickViewItem.course.name}</p>
                                    </div>
                                )}

                                {quickViewItem.project && (
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-bold text-purple-700 mb-2 flex items-center gap-2">
                                            <i className="fas fa-project-diagram text-purple-600" />
                                            المشروع
                                        </h3>
                                        <p className="text-gray-700 font-medium">{quickViewItem.project.name}</p>
                                    </div>
                                )}

                                {quickViewItem.lesson && (
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-2">
                                            <i className="fas fa-book-open text-green-600" />
                                            الدرس
                                        </h3>
                                        <p className="text-gray-700 font-medium">{quickViewItem.lesson.name}</p>
                                    </div>
                                )}
                            </div>

                            {quickViewItem.tags && quickViewItem.tags.length > 0 && (
                                <div>
                                    <h3 className={`text-sm font-bold mb-2 flex items-center gap-2 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        <i className="fas fa-tags text-indigo-600" />
                                        الوسوم
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {quickViewItem.tags.map((tag) => (
                                            <span key={tag} className={`px-3 py-1 text-sm rounded-full font-medium ${
                                                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={`flex gap-3 pt-4 border-t ${
                                darkMode ? 'border-gray-700' : 'border-gray-200'
                            }`}>
                                <Link
                                    to={`/tasks/${quickViewItem.id}`}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                                >
                                    <i className="fas fa-external-link-alt ml-2" />
                                    فتح التفاصيل الكاملة
                                </Link>
                                {quickViewItem.status !== "completed" && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleCompleteItem(quickViewItem);
                                            handleCloseQuickView();
                                        }}
                                        className="inline-flex items-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                                    >
                                        <i className="fas fa-check ml-2" />
                                        إكمال
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Calendar;
