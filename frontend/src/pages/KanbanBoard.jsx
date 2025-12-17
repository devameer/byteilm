import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import taskService from "../services/taskService";
import courseService from "../services/courseService";
import lessonService from "../services/lessonService";
import Modal from "../components/Modal";
import { useTheme } from "../contexts/ThemeContext";
import SearchableSelect from "../components/SearchableSelect";

const KanbanBoard = () => {
  const { projectId } = useParams();
  const { darkMode, toggleDarkMode } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [draggedTask, setDraggedTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState("pending");
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    source_type: "none",
    course_id: "",
    lesson_id: "",
  });
  const [kanbanLookups, setKanbanLookups] = useState({ courses: [], lessons: [] });

  const columns = [
    {
      id: "pending",
      title: "قيد الانتظار",
      color: darkMode
        ? "bg-gradient-to-br from-gray-800 to-gray-900"
        : "bg-gradient-to-br from-gray-100 to-gray-200",
      headerColor: darkMode
        ? "bg-gradient-to-r from-gray-700 to-gray-800"
        : "bg-gradient-to-r from-gray-500 to-gray-600",
      icon: "⏳",
      accentColor: darkMode ? "border-gray-600" : "border-gray-400",
    },
    {
      id: "in_progress",
      title: "قيد التنفيذ",
      color: darkMode
        ? "bg-gradient-to-br from-blue-900 to-indigo-950"
        : "bg-gradient-to-br from-blue-50 to-blue-100",
      headerColor: darkMode
        ? "bg-gradient-to-r from-blue-700 to-indigo-800"
        : "bg-gradient-to-r from-blue-500 to-indigo-600",
      icon: "🚀",
      accentColor: darkMode ? "border-blue-600" : "border-blue-400",
    },
    {
      id: "completed",
      title: "مكتمل",
      color: darkMode
        ? "bg-gradient-to-br from-green-900 to-emerald-950"
        : "bg-gradient-to-br from-green-50 to-emerald-100",
      headerColor: darkMode
        ? "bg-gradient-to-r from-green-700 to-emerald-800"
        : "bg-gradient-to-r from-green-500 to-emerald-600",
      icon: "✅",
      accentColor: darkMode ? "border-green-600" : "border-green-400",
    },
  ];

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  // Load courses for quick add
  useEffect(() => {
    if (showAddTaskModal) {
      courseService.getCourses({ active: true })
        .then((response) => {
          const courses = response?.success ? response.data : response?.data ?? [];
          setKanbanLookups((prev) => ({ ...prev, courses }));
        })
        .catch(() => {
          setKanbanLookups((prev) => ({ ...prev, courses: [] }));
        });
    }
  }, [showAddTaskModal]);

  // Load lessons when course is selected
  useEffect(() => {
    if (newTaskData.source_type === "lesson" && newTaskData.course_id) {
      lessonService.getLessons({ course_id: newTaskData.course_id })
        .then((response) => {
          const lessons = response?.success ? response.data : response?.data ?? [];
          setKanbanLookups((prev) => ({ ...prev, lessons }));
        })
        .catch(() => {
          setKanbanLookups((prev) => ({ ...prev, lessons: [] }));
        });
    } else {
      setKanbanLookups((prev) => ({ ...prev, lessons: [] }));
      if (newTaskData.lesson_id) {
        setNewTaskData((prev) => ({ ...prev, lesson_id: "" }));
      }
    }
  }, [newTaskData.course_id, newTaskData.source_type]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + K: Quick add task
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowAddTaskModal(true);
      }
      // Escape: Close modals
      if (e.key === "Escape") {
        setShowTaskModal(false);
        setShowAddTaskModal(false);
      }
      // Ctrl/Cmd + F: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.getTasks(
        projectId ? { project_id: projectId } : {}
      );

      // Handle response format: { success: true, data: [...] }
      if (response && response.success && Array.isArray(response.data)) {
        setTasks(response.data);
      } else if (response && Array.isArray(response.data)) {
        setTasks(response.data);
      } else if (Array.isArray(response)) {
        setTasks(response);
      } else {
        console.warn("Unexpected response format:", response);
        setTasks([]);
      }
    } catch (err) {
      console.error("Kanban fetch error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "حدث خطأ غير متوقع";
      setError(errorMessage);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const moveTask = async (taskId, newStatus) => {
    try {
      const taskIndex = tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return;

      // Optimistic update
      const updatedTasks = [...tasks];
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        status: newStatus,
      };
      setTasks(updatedTasks);

      // API call
      await taskService.updateTask(taskId, { status: newStatus });
    } catch (err) {
      setError(err.message);
      // Revert on error
      fetchTasks();
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => {
      const matchesStatus = task.status === status;
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPriority =
        filterPriority === "all" || task.priority === filterPriority;

      return matchesStatus && matchesSearch && matchesPriority;
    });
  };

  const getStatistics = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const urgent = tasks.filter((t) => t.priority === "urgent").length;
    const high = tasks.filter((t) => t.priority === "high").length;

    return { total, completed, inProgress, pending, urgent, high };
  };

  const handleQuickAddTask = async () => {
    if (!newTaskData.title.trim()) return;

    try {
      const taskPayload = {
        title: newTaskData.title,
        description: newTaskData.description || null,
        priority: newTaskData.priority,
        due_date: newTaskData.due_date || null,
        status: newTaskColumn,
        project_id: projectId || null,
        source_type: newTaskData.source_type,
        course_id: newTaskData.course_id || null,
        lesson_id: newTaskData.lesson_id || null,
        is_lesson: newTaskData.source_type === "lesson" ? true : false,
      };

      const response = await taskService.create(taskPayload);
      if (response && response.success) {
        setTasks([...tasks, response.data]);
        setNewTaskData({
          title: "",
          description: "",
          priority: "medium",
          due_date: "",
          source_type: "none",
          course_id: "",
          lesson_id: "",
        });
        setShowAddTaskModal(false);
      } else {
        setError(response?.message || "فشل في إضافة المهمة");
      }
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err.response?.data?.message || "فشل في إضافة المهمة");
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: "bg-red-100 text-red-800 border-red-300",
      high: "bg-orange-100 text-orange-800 border-orange-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      low: "bg-green-100 text-green-800 border-green-300",
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      urgent: "🔥",
      high: "⬆️",
      medium: "➡️",
      low: "⬇️",
    };
    return icons[priority] || icons.medium;
  };

  // Skeleton component for loading state
  const TaskSkeleton = () => (
    <div className="bg-white rounded-lg shadow p-4 mb-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );

  const ColumnSkeleton = () => (
    <div className="bg-gray-50 rounded-lg shadow">
      <div className="bg-gray-200 p-4 rounded-t-lg">
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
      <div className="p-4">
        <TaskSkeleton />
        <TaskSkeleton />
        <TaskSkeleton />
      </div>
    </div>
  );

  if (error && !loading) {
    return (
      <div
        className={`p-6 min-h-screen ${
          darkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div
          className={`${
            darkMode
              ? "bg-red-900/20 border-red-800"
              : "bg-red-50 border-red-200"
          } border-2 rounded-xl p-6 ${
            darkMode ? "text-red-400" : "text-red-700"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <i
                className={`fas fa-exclamation-circle text-3xl ${
                  darkMode ? "text-red-500" : "text-red-500"
                }`}
              ></i>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">
                حدث خطأ أثناء تحميل المهام
              </h3>
              <p className="text-sm mb-4">{error}</p>
              <button
                onClick={fetchTasks}
                className={`px-4 py-2 ${
                  darkMode
                    ? "bg-red-700 hover:bg-red-800"
                    : "bg-red-600 hover:bg-red-700"
                } text-white rounded-lg font-bold transition-all flex items-center gap-2`}
              >
                <i className="fas fa-redo"></i>
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
      } p-6`}
    >
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1
              className={`text-4xl font-black mb-2 ${
                darkMode
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
                  : "text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"
              }`}
            >
              🎯 لوحة Kanban
            </h1>
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
              إدارة مهامك بشكل مرئي وفعال
            </p>
          </div>

          <div className="flex gap-3">
            {/* Dark Mode Toggle */}

            <button
              onClick={() => setShowAddTaskModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
              title="اختصار لوحة المفاتيح: Ctrl+K"
            >
              <i className="fas fa-plus"></i>
              <span>إضافة مهمة</span>
            </button>
            <Link
              to="/tasks"
              className={`px-6 py-3 rounded-xl font-bold border-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 hover:border-indigo-500"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-indigo-300"
              }`}
            >
              <i className="fas fa-list"></i>
              <span>عرض القائمة</span>
            </Link>
            <button
              className={`px-4 py-3 rounded-xl font-bold border-2 shadow-md hover:shadow-lg transition-all ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 hover:border-indigo-500"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-indigo-300"
              }`}
              title="اختصارات لوحة المفاتيح"
              onClick={() => {
                alert(
                  "اختصارات لوحة المفاتيح:\n\nCtrl+K: إضافة مهمة جديدة\nCtrl+F: البحث في المهام\nEsc: إغلاق النوافذ المنبثقة"
                );
              }}
            >
              <i className="fas fa-keyboard"></i>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div
              className={`rounded-xl p-4 shadow-md border-2 transition-colors ${
                darkMode
                  ? "bg-gray-800 border-indigo-900"
                  : "bg-white border-indigo-100"
              }`}
            >
              <div
                className={`text-2xl font-black ${
                  darkMode ? "text-indigo-400" : "text-indigo-600"
                }`}
              >
                {getStatistics().total}
              </div>
              <div
                className={
                  darkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"
                }
              >
                إجمالي المهام
              </div>
            </div>
            <div
              className={`rounded-xl p-4 shadow-md border-2 transition-colors ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              }`}
            >
              <div
                className={`text-2xl font-black ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {getStatistics().pending}
              </div>
              <div
                className={
                  darkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"
                }
              >
                قيد الانتظار
              </div>
            </div>
            <div
              className={`rounded-xl p-4 shadow-md border-2 transition-colors ${
                darkMode
                  ? "bg-gray-800 border-blue-900"
                  : "bg-white border-blue-100"
              }`}
            >
              <div
                className={`text-2xl font-black ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                {getStatistics().inProgress}
              </div>
              <div
                className={
                  darkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"
                }
              >
                قيد التنفيذ
              </div>
            </div>
            <div
              className={`rounded-xl p-4 shadow-md border-2 transition-colors ${
                darkMode
                  ? "bg-gray-800 border-green-900"
                  : "bg-white border-green-100"
              }`}
            >
              <div
                className={`text-2xl font-black ${
                  darkMode ? "text-green-400" : "text-green-600"
                }`}
              >
                {getStatistics().completed}
              </div>
              <div
                className={
                  darkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"
                }
              >
                مكتملة
              </div>
            </div>
            <div
              className={`rounded-xl p-4 shadow-md border-2 transition-colors ${
                darkMode
                  ? "bg-gray-800 border-red-900"
                  : "bg-white border-red-100"
              }`}
            >
              <div
                className={`text-2xl font-black ${
                  darkMode ? "text-red-400" : "text-red-600"
                }`}
              >
                {getStatistics().urgent}
              </div>
              <div
                className={
                  darkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"
                }
              >
                عاجلة
              </div>
            </div>
            <div
              className={`rounded-xl p-4 shadow-md border-2 transition-colors ${
                darkMode
                  ? "bg-gray-800 border-orange-900"
                  : "bg-white border-orange-100"
              }`}
            >
              <div
                className={`text-2xl font-black ${
                  darkMode ? "text-orange-400" : "text-orange-600"
                }`}
              >
                {getStatistics().high}
              </div>
              <div
                className={
                  darkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"
                }
              >
                عالية
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div
          className={`flex flex-col md:flex-row gap-4 rounded-xl p-4 shadow-md border-2 transition-colors ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-100"
          }`}
        >
          <div className="flex-1 relative">
            <i
              className={`fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 ${
                darkMode ? "text-gray-500" : "text-gray-400"
              }`}
            ></i>
            <input
              type="text"
              placeholder="ابحث في المهام..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pr-12 pl-4 py-3 border-2 rounded-lg transition-all ${
                darkMode
                  ? "bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900"
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              }`}
            />
          </div>
          <div className="flex gap-2">
            {["all", "urgent", "high", "medium", "low"].map((priority) => (
              <button
                key={priority}
                onClick={() => setFilterPriority(priority)}
                className={`px-4 py-3 rounded-lg font-bold transition-all ${
                  filterPriority === priority
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                    : darkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {priority === "all"
                  ? "الكل"
                  : priority === "urgent"
                  ? "عاجلة"
                  : priority === "high"
                  ? "عالية"
                  : priority === "medium"
                  ? "متوسطة"
                  : "منخفضة"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <>
            <ColumnSkeleton />
            <ColumnSkeleton />
            <ColumnSkeleton />
          </>
        ) : (
          columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            return (
              <div
                key={column.id}
                className={`${column.color} rounded-2xl shadow-xl border-4 ${column.accentColor} transition-all hover:shadow-2xl`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add(
                    "ring-4",
                    "ring-indigo-400",
                    "scale-105"
                  );
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove(
                    "ring-4",
                    "ring-indigo-400",
                    "scale-105"
                  );
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove(
                    "ring-4",
                    "ring-indigo-400",
                    "scale-105"
                  );
                  const taskId = e.dataTransfer.getData("task-id");
                  moveTask(parseInt(taskId), column.id);
                }}
              >
                {/* Column Header */}
                <div
                  className={`${column.headerColor} p-5 rounded-t-xl text-white relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-white opacity-10 transform -skew-y-3"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{column.icon}</span>
                      <div>
                        <h2 className="font-black text-xl">{column.title}</h2>
                        <p className="text-xs opacity-90">
                          {columnTasks.length} مهمة
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setNewTaskColumn(column.id);
                        setShowAddTaskModal(true);
                      }}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    >
                      <i className="fas fa-plus text-sm"></i>
                    </button>
                  </div>
                </div>

                {/* Tasks Container */}
                <div className="p-4 min-h-96 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
                  {columnTasks.map((task, index) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("task-id", task.id);
                        setDraggedTask(task);
                        e.currentTarget.style.opacity = "0.5";
                      }}
                      onDragEnd={(e) => {
                        setDraggedTask(null);
                        e.currentTarget.style.opacity = "1";
                      }}
                      onClick={() => handleTaskClick(task)}
                      className={`rounded-xl shadow-lg p-4 mb-4 cursor-move hover:shadow-2xl transition-all transform hover:-translate-y-1 border-2 group animate-fade-in ${
                        darkMode
                          ? "bg-gray-800 border-gray-700 hover:border-indigo-500"
                          : "bg-white border-gray-100 hover:border-indigo-300"
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Priority Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${getPriorityColor(
                            task.priority
                          )} flex items-center gap-1`}
                        >
                          <span>{getPriorityIcon(task.priority)}</span>
                          <span>
                            {task.priority === "urgent"
                              ? "عاجلة"
                              : task.priority === "high"
                              ? "عالية"
                              : task.priority === "medium"
                              ? "متوسطة"
                              : "منخفضة"}
                          </span>
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <i className="fas fa-grip-vertical text-gray-400"></i>
                        </div>
                      </div>

                      {/* Task Title */}
                      <h3
                        className={`font-bold mb-2 text-lg line-clamp-2 ${
                          darkMode ? "text-gray-200" : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </h3>

                      {/* Task Description */}
                      {task.description && (
                        <p
                          className={`text-sm mb-4 line-clamp-2 ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {task.description}
                        </p>
                      )}

                      {/* Task Footer */}
                      <div
                        className={`flex items-center justify-between pt-3 border-t-2 ${
                          darkMode ? "border-gray-700" : "border-gray-100"
                        }`}
                      >
                        <div
                          className={`flex items-center gap-2 text-xs ${
                            darkMode ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          <i className="fas fa-calendar-alt"></i>
                          <span>
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString(
                                  "ar-SA"
                                )
                              : "لا يوجد تاريخ"}
                          </span>
                        </div>

                        {/* Project Badge */}
                        {task.project && (
                          <div
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                              darkMode
                                ? "bg-indigo-900/50 text-indigo-300"
                                : "bg-indigo-100 text-indigo-700"
                            }`}
                          >
                            <i className="fas fa-folder"></i>
                            <span className="truncate max-w-20">
                              {task.project.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Empty State */}
                  {columnTasks.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4 opacity-20">
                        {column.icon}
                      </div>
                      <p className="text-gray-400 font-medium">لا توجد مهام</p>
                      <button
                        onClick={() => {
                          setNewTaskColumn(column.id);
                          setShowAddTaskModal(true);
                        }}
                        className="mt-4 px-4 py-2 rounded-lg font-medium border-2 transition-all ${
                          darkMode 
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700 hover:border-indigo-500' 
                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-indigo-300'
                        }"
                      >
                        إضافة ما همة +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Task Details Modal */}
      {showTaskModal && selectedTask && (
        <Modal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          title="تفاصيل المهمة"
        >
          <div className="space-y-4">
            <div>
              <h3
                className={`text-2xl font-bold mb-2 ${
                  darkMode ? "text-gray-200" : "text-gray-900"
                }`}
              >
                {selectedTask.title}
              </h3>
              <div className="flex gap-2 mb-4">
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${getPriorityColor(
                    selectedTask.priority
                  )}`}
                >
                  {getPriorityIcon(selectedTask.priority)}{" "}
                  {selectedTask.priority === "urgent"
                    ? "عاجلة"
                    : selectedTask.priority === "high"
                    ? "عالية"
                    : selectedTask.priority === "medium"
                    ? "متوسطة"
                    : "منخفضة"}
                </span>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${
                    darkMode
                      ? "bg-blue-900/50 text-blue-300 border-blue-700"
                      : "bg-blue-100 text-blue-800 border-blue-300"
                  }`}
                >
                  {selectedTask.status === "pending"
                    ? "قيد الانتظار"
                    : selectedTask.status === "in_progress"
                    ? "قيد التنفيذ"
                    : "مكتملة"}
                </span>
              </div>
            </div>

            {selectedTask.description && (
              <div
                className={`rounded-lg p-4 ${
                  darkMode ? "bg-gray-900/50" : "bg-gray-50"
                }`}
              >
                <h4
                  className={`font-bold mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  الوصف:
                </h4>
                <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                  {selectedTask.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div
                className={`rounded-lg p-4 ${
                  darkMode ? "bg-indigo-900/30" : "bg-indigo-50"
                }`}
              >
                <div
                  className={`text-sm mb-1 ${
                    darkMode ? "text-indigo-400" : "text-indigo-600"
                  }`}
                >
                  تاريخ الاستحقاق
                </div>
                <div
                  className={`font-bold ${
                    darkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {selectedTask.due_date
                    ? new Date(selectedTask.due_date).toLocaleDateString(
                        "ar-SA"
                      )
                    : "لا يوجد"}
                </div>
              </div>
              {selectedTask.project && (
                <div
                  className={`rounded-lg p-4 ${
                    darkMode ? "bg-purple-900/30" : "bg-purple-50"
                  }`}
                >
                  <div
                    className={`text-sm mb-1 ${
                      darkMode ? "text-purple-400" : "text-purple-600"
                    }`}
                  >
                    المشروع
                  </div>
                  <div
                    className={`font-bold ${
                      darkMode ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    {selectedTask.project.name}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Link
                to={`/tasks/${selectedTask.id}`}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-bold text-center transition-all"
              >
                📝 تعديل المهمة
              </Link>
              <button
                onClick={() => setShowTaskModal(false)}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <Modal
          isOpen={showAddTaskModal}
          onClose={() => setShowAddTaskModal(false)}
          title="إضافة مهمة جديدة"
        >
          <div className="space-y-4">
            <div>
              <label
                className={`block text-sm font-bold mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                عنوان المهمة
              </label>
              <input
                type="text"
                value={newTaskData.title}
                onChange={(e) =>
                  setNewTaskData({ ...newTaskData, title: e.target.value })
                }
                className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                  darkMode
                    ? "bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900"
                    : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                }`}
                placeholder="أدخل عنوان المهمة..."
              />
            </div>

            <div>
              <label
                className={`block text-sm font-bold mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                الوصف
              </label>
              <textarea
                value={newTaskData.description}
                onChange={(e) =>
                  setNewTaskData({
                    ...newTaskData,
                    description: e.target.value,
                  })
                }
                className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                  darkMode
                    ? "bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900"
                    : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                }`}
                rows="3"
                placeholder="وصف المهمة..."
              />
            </div>

            <div>
              <label
                className={`block text-sm font-bold mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                مصدر المهمة
              </label>
              <select
                value={newTaskData.source_type}
                onChange={(e) =>
                  setNewTaskData({ ...newTaskData, source_type: e.target.value, course_id: "", lesson_id: "" })
                }
                className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                  darkMode
                    ? "bg-gray-900 border-gray-700 text-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900"
                    : "bg-white border-gray-200 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                }`}
              >
                <option value="none">مستقلة</option>
                <option value="lesson">درس</option>
              </select>
            </div>

            {newTaskData.source_type === "lesson" && (
              <>
                <div>
                  <label
                    className={`block text-sm font-bold mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    الدورة
                  </label>
                  <select
                    value={newTaskData.course_id}
                    onChange={(e) =>
                      setNewTaskData({ ...newTaskData, course_id: e.target.value, lesson_id: "" })
                    }
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                      darkMode
                        ? "bg-gray-900 border-gray-700 text-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900"
                        : "bg-white border-gray-200 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    }`}
                  >
                    <option value="">اختر دورة</option>
                    {kanbanLookups.courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                {newTaskData.course_id && (
                  <div>
                    <SearchableSelect
                      label="الدرس"
                      value={newTaskData.lesson_id}
                      onChange={(lessonId) =>
                        setNewTaskData({ ...newTaskData, lesson_id: lessonId })
                      }
                      options={kanbanLookups.lessons.map((lesson) => ({
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
                {newTaskData.source_type === "lesson" && !newTaskData.course_id && (
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
                <label
                  className={`block text-sm font-bold mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  الأولوية
                </label>
                <select
                  value={newTaskData.priority}
                  onChange={(e) =>
                    setNewTaskData({ ...newTaskData, priority: e.target.value })
                  }
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                    darkMode
                      ? "bg-gray-900 border-gray-700 text-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900"
                      : "bg-white border-gray-200 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  }`}
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجلة</option>
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-bold mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  تاريخ الاستحقاق
                </label>
                <input
                  type="date"
                  value={newTaskData.due_date}
                  onChange={(e) =>
                    setNewTaskData({ ...newTaskData, due_date: e.target.value })
                  }
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                    darkMode
                      ? "bg-gray-900 border-gray-700 text-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900"
                      : "bg-white border-gray-200 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  }`}
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-bold mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                الحالة
              </label>
              <div className="flex gap-2">
                {columns.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setNewTaskColumn(col.id)}
                    className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                      newTaskColumn === col.id
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                        : darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {col.icon} {col.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleQuickAddTask}
                disabled={!newTaskData.title.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ✅ إضافة المهمة
              </button>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                إلغاء
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default KanbanBoard;
