import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import projectService from "../services/projectService";
import Modal from "../components/Modal";

const STATUS_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "active", label: "نشط" },
  { value: "completed", label: "مكتمل" },
  { value: "on_hold", label: "معلق" },
  { value: "cancelled", label: "ملغى" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "منخفضة" },
  { value: "medium", label: "متوسطة" },
  { value: "high", label: "مرتفعة" },
  { value: "urgent", label: "عاجلة" },
];

function Projects() {
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

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(err.response?.data?.message || "تعذر تحميل المشاريع");
    } finally {
      setLoading(false);
    }
  };

  const statusStyles = useMemo(
    () => ({
      active: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      on_hold: "bg-yellow-100 text-yellow-700",
      cancelled: "bg-red-100 text-red-700",
    }),
    []
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
      low: "bg-emerald-100 text-emerald-700",
      medium: "bg-blue-100 text-blue-700",
      high: "bg-orange-100 text-orange-700",
      urgent: "bg-red-100 text-red-700",
    }),
    []
  );

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
    } catch (err) {
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
    } catch (err) {
      setError(err.response?.data?.message || "تعذر حذف المشروع");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await projectService.toggleStatus(id);
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || "تعذر تغيير حالة المشروع");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المشاريع</h1>
          <p className="text-gray-600 mt-1">
            تتبع تقدم مشاريعك والمهام المرتبطة بكل مشروع
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + مشروع جديد
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === item.value
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
          جاري تحميل المشاريع...
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          لا توجد مشاريع تحت هذا الفلتر.
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl shadow-md p-6 space-y-4 border border-gray-100"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {project.name}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        statusStyles[project.status] ??
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {statusLabels[project.status] ?? project.status}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        priorityBadge[project.priority] ??
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      أولوية:{" "}
                      {priorityLabels[project.priority] ?? project.priority}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-600 max-w-2xl">
                      {project.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {project.start_date && (
                      <div>
                        <span className="font-semibold">البداية:</span>{" "}
                        {project.start_date}
                      </div>
                    )}
                    {project.due_date && (
                      <div>
                        <span className="font-semibold">الموعد النهائي:</span>{" "}
                        {project.due_date}
                      </div>
                    )}
                    {project.tasks_count !== undefined && (
                      <div>
                        <span className="font-semibold">المهام:</span>{" "}
                        {project.tasks_count}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/projects/${project.id}`}
                    className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                  >
                    تفاصيل المشروع
                  </Link>
                  <button
                    onClick={() => handleOpenEdit(project)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleToggleStatus(project.id)}
                    className="px-4 py-2 text-sm font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition"
                  >
                    تبديل الحالة
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                  >
                    حذف
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>نسبة الإنجاز</span>
                  <span className="font-semibold text-blue-600">
                    {project.progress ?? 0}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${Math.min(project.progress ?? 0, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
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
              className="block text-sm font-medium text-gray-700 mb-2"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              الوصف
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formState.description}
              onChange={handleFormChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                حالة المشروع
              </label>
              <select
                id="status"
                name="status"
                value={formState.status}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.filter((option) => option.value !== "all").map(
                  (option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                الأولوية
              </label>
              <select
                id="priority"
                name="priority"
                value={formState.priority}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                تاريخ البدء
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                value={formState.start_date}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="due_date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                تاريخ النهاية
              </label>
              <input
                id="due_date"
                name="due_date"
                type="date"
                value={formState.due_date}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="color"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              لون المشروع (اختياري)
            </label>
            <input
              id="color"
              name="color"
              type="color"
              value={formState.color ?? "#2563eb"}
              onChange={handleFormChange}
              className="h-10 w-20 border border-gray-200 rounded"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving
                ? "جاري الحفظ..."
                : formMode === "create"
                ? "إنشاء المشروع"
                : "تحديث المشروع"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Projects;
