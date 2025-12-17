import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import projectService from "../services/projectService";
import Modal from "../components/Modal";
import ProjectsPageSkeleton from "../components/skeletons/ProjectsPageSkeleton";

const STATUS_OPTIONS = [
  { value: "all", label: "جميع الحالات", icon: "fa-layer-group" },
  { value: "active", label: "نشط", icon: "fa-play-circle" },
  { value: "completed", label: "مكتمل", icon: "fa-check-circle" },
  { value: "on_hold", label: "معلق", icon: "fa-pause-circle" },
  { value: "cancelled", label: "ملغى", icon: "fa-times-circle" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "منخفضة", icon: "fa-arrow-down" },
  { value: "medium", label: "متوسطة", icon: "fa-minus" },
  { value: "high", label: "مرتفعة", icon: "fa-arrow-up" },
  { value: "urgent", label: "عاجلة", icon: "fa-fire" },
];

function Projects() {
  const { darkMode } = useTheme();
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    status: "active",
    priority: "medium",
    start_date: "",
    due_date: "",
    color: "#2563eb",
  });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statistics, setStatistics] = useState(null);
  const [quickViewProject, setQuickViewProject] = useState(null);

  useEffect(() => {
    loadProjects();
    loadStatistics();
  }, [filter]);

  const loadProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filter !== "all") {
        params.status = filter;
      }

      const response = await projectService.getProjects(params);
      if (response.success) {
        setProjects(response.data);
      }
    } catch (err) {
      // Ignore canceled errors
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        setLoading(false);
        return;
      }
      // Only show error if it's a real error (not network timeout or canceled)
      const errorMessage = err?.response?.data?.message || err?.message;
      if (errorMessage && !errorMessage.includes('timeout') && !errorMessage.includes('canceled')) {
        setError(errorMessage);
      } else if (err?.response?.status >= 500) {
        setError("حدث خطأ في الخادم. يرجى المحاولة لاحقاً");
      } else if (!err?.response) {
        // Network error - don't show error, just log it
        console.error("Network error loading projects:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await projectService.getAllStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (err) {
      // Ignore canceled errors (they're not real errors, just duplicate request prevention)
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        return;
      }
      console.error("Failed to load statistics:", err);
    }
  };

  const statusStyles = useMemo(
    () => ({
      active: darkMode 
        ? "bg-blue-900/30 text-blue-300 border-blue-700" 
        : "bg-blue-100 text-blue-700 border-blue-200",
      completed: darkMode 
        ? "bg-green-900/30 text-green-300 border-green-700" 
        : "bg-green-100 text-green-700 border-green-200",
      on_hold: darkMode 
        ? "bg-yellow-900/30 text-yellow-300 border-yellow-700" 
        : "bg-yellow-100 text-yellow-700 border-yellow-200",
      cancelled: darkMode 
        ? "bg-red-900/30 text-red-300 border-red-700" 
        : "bg-red-100 text-red-700 border-red-200",
    }),
    [darkMode]
  );

  const statusLabels = useMemo(
    () => ({
      active: "نشط",
      completed: "مكتمل",
      on_hold: "معلق",
      cancelled: "ملغى",
    }),
    []
  );

  const priorityLabels = useMemo(
    () => ({
      low: "منخفضة",
      medium: "متوسطة",
      high: "مرتفعة",
      urgent: "عاجلة",
    }),
    []
  );

  const priorityBadge = useMemo(
    () => ({
      low: darkMode 
        ? "bg-emerald-900/30 text-emerald-300 border border-emerald-700" 
        : "bg-emerald-50 text-emerald-700 border border-emerald-200",
      medium: darkMode 
        ? "bg-blue-900/30 text-blue-300 border border-blue-700" 
        : "bg-blue-50 text-blue-700 border border-blue-200",
      high: darkMode 
        ? "bg-orange-900/30 text-orange-300 border border-orange-700" 
        : "bg-orange-50 text-orange-700 border border-orange-200",
      urgent: darkMode 
        ? "bg-red-900/30 text-red-300 border border-red-700" 
        : "bg-red-50 text-red-700 border border-red-200",
    }),
    [darkMode]
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesPriority =
        priorityFilter === "all" || project.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [projects, searchTerm, priorityFilter]);

  const handleOpenCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setFormState({
      name: "",
      description: "",
      status: "active",
      priority: "medium",
      start_date: "",
      due_date: "",
      color: "#2563eb",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (project) => {
    setFormMode("edit");
    setEditingId(project.id);
    setFormState({
      name: project.name,
      description: project.description ?? "",
      status: project.status,
      priority: project.priority ?? "medium",
      start_date: project.start_date ?? "",
      due_date: project.due_date ?? "",
      color: project.color ?? "#2563eb",
    });
    setModalOpen(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...formState,
        start_date: formState.start_date || null,
        due_date: formState.due_date || null,
        description: formState.description || null,
        color: formState.color || null,
      };

      if (formMode === "create") {
        await projectService.createProject(payload);
      } else if (editingId) {
        await projectService.updateProject(editingId, payload);
      }

      setModalOpen(false);
      await loadProjects();
      await loadStatistics();
    } catch (err) {
      // Ignore canceled errors
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        setSaving(false);
        return;
      }
      setError(err.response?.data?.message || "تعذر حفظ بيانات المشروع");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmation = window.confirm(
      "سيتم حذف المشروع وكل المهام المرتبطة به. هل تريد المتابعة؟"
    );
    if (!confirmation) {
      return;
    }
    try {
      await projectService.deleteProject(id);
      await loadProjects();
      await loadStatistics();
    } catch (err) {
      // Ignore canceled errors
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        return;
      }
      setError(err.response?.data?.message || "تعذر حذف المشروع");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await projectService.toggleStatus(id);
      await loadProjects();
      await loadStatistics();
    } catch (err) {
      // Ignore canceled errors
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        return;
      }
      setError(err.response?.data?.message || "تعذر تغيير حالة المشروع");
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await projectService.duplicateProject(id);
      await loadProjects();
      await loadStatistics();
    } catch (err) {
      // Ignore canceled errors
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        return;
      }
      setError(err.response?.data?.message || "تعذر نسخ المشروع");
    }
  };

  const handleQuickView = (project) => {
    setQuickViewProject(project);
  };

  const handleCloseQuickView = () => {
    setQuickViewProject(null);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
    }`}>
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={`text-4xl font-black flex items-center gap-3 ${
              darkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <i className="fas fa-project-diagram text-white text-xl"></i>
              </div>
              المشاريع
            </h1>
            <p className={`mt-2 text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              تتبع تقدم مشاريعك والمهام المرتبطة بكل مشروع
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className={`px-4 py-2.5 border rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 text-sm font-medium ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                  : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <i
                className={`fas ${
                  viewMode === "grid" ? "fa-list" : "fa-th-large"
                }`}
              ></i>
              <span>{viewMode === "grid" ? "عرض القائمة" : "عرض الشبكة"}</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm font-bold"
            >
              <i className="fas fa-plus"></i>
              <span>مشروع جديد</span>
            </button>
          </div>
        </div>

        {statistics && (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-colors duration-300`}>
            <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm mb-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>إجمالي المشاريع</p>
                  <p className={`text-3xl font-black ${
                    darkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    {statistics.total || projects.length}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  darkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  <i className="fas fa-layer-group text-blue-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm mb-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>المشاريع النشطة</p>
                  <p className="text-3xl font-black text-green-600">
                    {statistics.active ||
                      projects.filter((p) => p.status === "active").length}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  darkMode ? 'bg-green-900/30' : 'bg-green-100'
                }`}>
                  <i className="fas fa-play-circle text-green-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm mb-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    المشاريع المكتملة
                  </p>
                  <p className="text-3xl font-black text-indigo-600">
                    {statistics.completed ||
                      projects.filter((p) => p.status === "completed").length}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
                }`}>
                  <i className="fas fa-check-circle text-indigo-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm mb-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>نسبة الإنجاز</p>
                  <p className="text-3xl font-black text-purple-600">
                    {statistics.avg_progress || 0}%
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  darkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                }`}>
                  <i className="fas fa-chart-line text-purple-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <i className={`fas fa-search absolute right-3 top-1/2 -translate-y-1/2 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}></i>
                <input
                  type="text"
                  placeholder="ابحث عن مشروع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pr-10 pl-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-500'
                      : 'border-gray-300 bg-white'
                  }`}
                />
              </div>
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={`px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode
                  ? 'bg-gray-900 border-gray-700 text-gray-200'
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="all">جميع الأولويات</option>
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  filter === item.value
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : darkMode
                    ? "bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <i className={`fas ${item.icon}`}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className={`p-4 border-2 rounded-xl flex items-center gap-3 transition-colors duration-300 ${
            darkMode
              ? 'bg-red-900/30 border-red-800 text-red-300'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <i className="fas fa-exclamation-circle text-xl"></i>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <ProjectsPageSkeleton />
        ) : filteredProjects.length === 0 ? (
          <div className={`rounded-xl shadow-sm border p-12 text-center transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <i className={`fas fa-folder-open text-3xl ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}></i>
            </div>
            <p className={`text-lg font-medium ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              لا توجد مشاريع تحت هذا الفلتر
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredProjects.map((project) =>
              viewMode === "grid" ? (
                <div
                  key={project.id}
                  className={`rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 overflow-hidden group ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className={`text-xl font-black flex-1 group-hover:text-blue-600 transition-colors ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {project.name}
                      </h2>
                      <button
                        onClick={() => handleQuickView(project)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          darkMode
                            ? 'bg-gray-700 hover:bg-blue-900/30 text-gray-400 hover:text-blue-400'
                            : 'bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600'
                        }`}
                      >
                        <i className={`fas fa-eye ${
                          darkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'
                        }`}></i>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                          statusStyles[project.status]
                        }`}
                      >
                        <i className="fas fa-circle text-xs mr-1"></i>
                        {statusLabels[project.status]}
                      </span>
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                          priorityBadge[project.priority]
                        }`}
                      >
                        <i className="fas fa-flag mr-1"></i>
                        {priorityLabels[project.priority]}
                      </span>
                    </div>

                    {project.description && (
                      <p className={`text-sm line-clamp-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {project.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          التقدم
                        </span>
                        <span className="font-bold text-blue-600">
                          {project.progress || 0}%
                        </span>
                      </div>
                      <div className={`h-2.5 rounded-full overflow-hidden ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(project.progress || 0, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className={`flex flex-wrap gap-2 text-xs ${
                      darkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {project.start_date && (
                        <div className="flex items-center gap-1">
                          <i className="fas fa-calendar-alt"></i>
                          <span>{project.start_date}</span>
                        </div>
                      )}
                      {project.tasks_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <i className="fas fa-tasks"></i>
                          <span>{project.tasks_count} مهام</span>
                        </div>
                      )}
                    </div>

                    <div className={`flex gap-2 pt-3 border-t ${
                      darkMode ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                      <Link
                        to={`/projects/${project.id}`}
                        className={`flex-1 px-3 py-2 text-sm font-bold border rounded-lg transition-all text-center ${
                          darkMode
                            ? 'text-blue-400 border-blue-700 hover:bg-blue-900/30'
                            : 'text-blue-600 border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        <i className="fas fa-eye ml-1"></i>
                        عرض
                      </Link>
                      <button
                        onClick={() => handleOpenEdit(project)}
                        className={`px-3 py-2 text-sm font-bold border rounded-lg transition-all ${
                          darkMode
                            ? 'text-gray-300 border-gray-700 hover:bg-gray-700'
                            : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDuplicate(project.id)}
                        className={`px-3 py-2 text-sm font-bold border rounded-lg transition-all ${
                          darkMode
                            ? 'text-green-400 border-green-700 hover:bg-green-900/30'
                            : 'text-green-600 border-green-200 hover:bg-green-50'
                        }`}
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={project.id}
                  className={`rounded-xl shadow-sm hover:shadow-lg transition-all border p-6 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h2 className={`text-2xl font-black ${
                          darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {project.name}
                        </h2>
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            statusStyles[project.status]
                          }`}
                        >
                          {statusLabels[project.status]}
                        </span>
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            priorityBadge[project.priority]
                          }`}
                        >
                          {priorityLabels[project.priority]}
                        </span>
                      </div>
                      {project.description && (
                        <p className={`text-sm max-w-3xl ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {project.description}
                        </p>
                      )}
                      <div className={`flex flex-wrap gap-4 text-sm ${
                        darkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {project.start_date && (
                          <div className="flex items-center gap-1">
                            <i className="fas fa-calendar-alt"></i>
                            <span>البداية: {project.start_date}</span>
                          </div>
                        )}
                        {project.due_date && (
                          <div className="flex items-center gap-1">
                            <i className="fas fa-calendar-check"></i>
                            <span>النهاية: {project.due_date}</span>
                          </div>
                        )}
                        {project.tasks_count !== undefined && (
                          <div className="flex items-center gap-1">
                            <i className="fas fa-tasks"></i>
                            <span>{project.tasks_count} مهام</span>
                          </div>
                        )}
                      </div>
                      <div className="max-w-md space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            نسبة الإنجاز
                          </span>
                          <span className="font-bold text-blue-600">
                            {project.progress || 0}%
                          </span>
                        </div>
                        <div className={`h-2.5 rounded-full overflow-hidden ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{
                              width: `${Math.min(project.progress || 0, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/projects/${project.id}`}
                        className={`px-4 py-2 text-sm font-bold border-2 rounded-lg transition-all ${
                          darkMode
                            ? 'text-blue-400 border-blue-700 hover:bg-blue-900/30'
                            : 'text-blue-600 border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        <i className="fas fa-eye ml-1"></i>
                        عرض التفاصيل
                      </Link>
                      <button
                        onClick={() => handleOpenEdit(project)}
                        className={`px-4 py-2 text-sm font-bold border-2 rounded-lg transition-all ${
                          darkMode
                            ? 'text-gray-300 border-gray-700 hover:bg-gray-700'
                            : 'text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <i className="fas fa-edit ml-1"></i>
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDuplicate(project.id)}
                        className={`px-4 py-2 text-sm font-bold border-2 rounded-lg transition-all ${
                          darkMode
                            ? 'text-green-400 border-green-700 hover:bg-green-900/30'
                            : 'text-green-600 border-green-200 hover:bg-green-50'
                        }`}
                      >
                        <i className="fas fa-copy ml-1"></i>
                        نسخ
                      </button>
                      <button
                        onClick={() => handleToggleStatus(project.id)}
                        className={`px-4 py-2 text-sm font-bold border-2 rounded-lg transition-all ${
                          darkMode
                            ? 'text-indigo-400 border-indigo-700 hover:bg-indigo-900/30'
                            : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        <i className="fas fa-sync ml-1"></i>
                        تبديل الحالة
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className={`px-4 py-2 text-sm font-bold border-2 rounded-lg transition-all ${
                          darkMode
                            ? 'text-red-400 border-red-700 hover:bg-red-900/30'
                            : 'text-red-600 border-red-200 hover:bg-red-50'
                        }`}
                      >
                        <i className="fas fa-trash ml-1"></i>
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        <Modal
          title={
            formMode === "create" ? "إنشاء مشروع جديد" : "تعديل بيانات المشروع"
          }
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className={`block text-sm font-bold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                اسم المشروع
              </label>
                <input
                id="name"
                name="name"
                type="text"
                value={formState.name}
                onChange={handleFormChange}
                required
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  darkMode
                    ? 'bg-gray-900 border-gray-700 text-gray-200'
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className={`block text-sm font-bold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                الوصف
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={formState.description}
                onChange={handleFormChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  darkMode
                    ? 'bg-gray-900 border-gray-700 text-gray-200'
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="status"
                  className={`block text-sm font-bold mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  حالة المشروع
                </label>
                <select
                  id="status"
                  name="status"
                  value={formState.status}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {STATUS_OPTIONS.filter(
                    (option) => option.value !== "all"
                  ).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="priority"
                  className={`block text-sm font-bold mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  الأولوية
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formState.priority}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="start_date"
                  className={`block text-sm font-bold mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  تاريخ البدء
                </label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formState.start_date}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label
                  htmlFor="due_date"
                  className={`block text-sm font-bold mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  تاريخ الاستحقاق
                </label>
                <input
                  id="due_date"
                  name="due_date"
                  type="date"
                  value={formState.due_date}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="color"
                className={`block text-sm font-bold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                لون المشروع
              </label>
              <input
                id="color"
                name="color"
                type="color"
                value={formState.color}
                onChange={handleFormChange}
                className="w-full h-12 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? "جاري الحفظ..."
                  : formMode === "create"
                  ? "إنشاء المشروع"
                  : "حفظ التعديلات"}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                إلغاء
              </button>
            </div>
          </form>
        </Modal>

        {quickViewProject && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={handleCloseQuickView}
          >
            <div
              className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-black mb-2">
                      {quickViewProject.name}
                    </h2>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/20">
                        {statusLabels[quickViewProject.status]}
                      </span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/20">
                        {priorityLabels[quickViewProject.priority]}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseQuickView}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {quickViewProject.description && (
                  <div>
                    <h3 className={`text-sm font-bold mb-2 flex items-center gap-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <i className="fas fa-align-right text-blue-600"></i>
                      الوصف
                    </h3>
                    <p className={`p-4 rounded-lg ${
                      darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {quickViewProject.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {quickViewProject.start_date && (
                    <div className={`p-4 rounded-lg transition-colors duration-300 ${
                      darkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50'
                    }`}>
                      <h3 className={`text-sm font-bold mb-1 ${
                        darkMode ? 'text-blue-400' : 'text-blue-700'
                      }`}>
                        تاريخ البدء
                      </h3>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {quickViewProject.start_date}
                      </p>
                    </div>
                  )}
                  {quickViewProject.due_date && (
                    <div className={`p-4 rounded-lg transition-colors duration-300 ${
                      darkMode ? 'bg-indigo-900/30 border border-indigo-800' : 'bg-indigo-50'
                    }`}>
                      <h3 className={`text-sm font-bold mb-1 ${
                        darkMode ? 'text-indigo-400' : 'text-indigo-700'
                      }`}>
                        تاريخ الاستحقاق
                      </h3>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {quickViewProject.due_date}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className={`text-sm font-bold mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    نسبة الإنجاز
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className={`flex-1 h-3 rounded-full overflow-hidden ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            quickViewProject.progress || 0,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-xl font-black text-blue-600">
                      {quickViewProject.progress || 0}%
                    </span>
                  </div>
                </div>

                <div className={`flex gap-3 pt-4 border-t ${
                  darkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <Link
                    to={`/projects/${quickViewProject.id}`}
                    className="flex-1 text-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    <i className="fas fa-external-link-alt ml-2"></i>
                    فتح التفاصيل الكاملة
                  </Link>
                  <button
                    onClick={() => {
                      handleOpenEdit(quickViewProject);
                      handleCloseQuickView();
                    }}
                    className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    <i className="fas fa-edit ml-2"></i>
                    تعديل
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Projects;
