import React, { useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import PageShell from "../../../components/layout/PageShell";
import Toast from "../../../components/feedback/Toast";
import { useToast } from "../../../hooks/useToast";
import { useTasksCollection } from "../hooks/useTasksCollection";
import { useTaskForm } from "../hooks/useTaskForm";
import TaskFiltersPanel from "../components/TaskFiltersPanel";
import TaskStatsBar from "../components/TaskStatsBar";
import TaskList from "../components/TaskList";
import TaskFormModal from "../components/TaskFormModal";
import TasksPageSkeleton from "../components/TasksPageSkeleton";
import taskService from "../../../services/taskService";
import { Link } from "react-router-dom";

function TasksPage() {
  const { darkMode } = useTheme();
  const tasksState = useTasksCollection();
  const form = useTaskForm({ onSuccess: tasksState.refresh });
  const { toast, show, dismiss } = useToast();
  const [viewMode, setViewMode] = useState("grid");
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [quickViewTask, setQuickViewTask] = useState(null);

  const handleComplete = async (task) => {
    try {
      await taskService.complete(task.id);
      show("تم إنهاء المهمة", "success");
      tasksState.refresh();
    } catch (error) {
      console.error(error);
      show("تعذر إكمال المهمة", "error");
    }
  };

  const handleQuickView = (task) => {
    setQuickViewTask(task);
  };

  const handleCloseQuickView = () => {
    setQuickViewTask(null);
  };

  const handleToggleSelect = (taskId) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === tasksState.tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasksState.tasks.map((task) => task.id));
    }
  };

  const handleBulkComplete = async () => {
    if (selectedTasks.length === 0) return;

    const confirmation = window.confirm(
      `هل تريد إكمال ${selectedTasks.length} مهمة؟`
    );
    if (!confirmation) return;

    try {
      await Promise.all(selectedTasks.map((id) => taskService.complete(id)));
      show(`تم إكمال ${selectedTasks.length} مهمة بنجاح`, "success");
      setSelectedTasks([]);
      tasksState.refresh();
    } catch (error) {
      console.error(error);
      show("تعذر إكمال بعض المهام", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;

    const confirmation = window.confirm(
      `هل تريد حذف ${selectedTasks.length} مهمة؟ هذا الإجراء لا يمكن التراجع عنه.`
    );
    if (!confirmation) return;

    try {
      await Promise.all(selectedTasks.map((id) => taskService.delete(id)));
      show(`تم حذف ${selectedTasks.length} مهمة بنجاح`, "success");
      setSelectedTasks([]);
      tasksState.refresh();
    } catch (error) {
      console.error(error);
      show("تعذر حذف بعض المهام", "error");
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30"
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        <Toast toast={toast} onClose={dismiss} />

        <div
          className={`rounded-2xl shadow-lg border-2 p-8 transition-colors duration-300 ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-100"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex-1">
              <h1
                className={`text-4xl font-black flex items-center gap-3 mb-2 ${
                  darkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <i className="fas fa-tasks text-white text-xl"></i>
                </div>
                المهام
              </h1>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                تتبع جميع المهام وترتيبها حسب الأولوية -{" "}
                {tasksState.tasks.length} مهمة
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/kanban"
                className={`px-4 py-2.5 border-2 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 text-sm font-medium ${
                  darkMode
                    ? "bg-gray-900 border-gray-700 hover:border-indigo-500 hover:bg-gray-700 text-gray-300"
                    : "bg-white border-gray-300 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700"
                }`}
              >
                <i className="fas fa-columns"></i>
                <span>عرض Kanban</span>
              </Link>

              <button
                type="button"
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className={`px-4 py-2.5 border-2 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 text-sm font-medium ${
                  darkMode
                    ? "bg-gray-900 border-gray-700 hover:border-indigo-500 hover:bg-gray-700 text-gray-300"
                    : "bg-white border-gray-300 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700"
                }`}
              >
                <i
                  className={`fas ${
                    viewMode === "grid" ? "fa-list" : "fa-th-large"
                  }`}
                ></i>
                <span>
                  {viewMode === "grid" ? "عرض القائمة" : "عرض الشبكة"}
                </span>
              </button>

              {selectedTasks.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleBulkComplete}
                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm font-bold"
                  >
                    <i className="fas fa-check-double"></i>
                    <span>إكمال ({selectedTasks.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm font-bold"
                  >
                    <i className="fas fa-trash"></i>
                    <span>حذف ({selectedTasks.length})</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={form.openCreate}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm font-bold"
              >
                <i className="fas fa-plus"></i>
                <span>مهمة جديدة</span>
              </button>
            </div>
          </div>
        </div>

        {tasksState.error && (
          <div className={`p-4 border-2 rounded-xl flex items-center gap-3 transition-colors duration-300 ${
            darkMode
              ? 'bg-red-900/30 border-red-800 text-red-300'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <i className="fas fa-exclamation-circle text-xl"></i>
            <span>تعذر تحميل المهام</span>
            <button
              onClick={tasksState.refresh}
              className={`mr-auto px-4 py-2 rounded-lg transition-all font-bold text-sm ${
                darkMode
                  ? 'bg-red-700 hover:bg-red-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        <TaskStatsBar stats={tasksState.stats} />
        <TaskFiltersPanel
          filters={tasksState.filters}
          onChange={tasksState.setFilter}
          onReset={tasksState.resetFilters}
        />

        {tasksState.loading ? (
          <TasksPageSkeleton />
        ) : (
          <>
            {tasksState.tasks.length > 0 && (
              <div className="flex items-center gap-2 px-4">
                <input
                  type="checkbox"
                  checked={selectedTasks.length === tasksState.tasks.length}
                  onChange={handleSelectAll}
                  className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span
                  className={`text-sm font-bold ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  تحديد الكل ({tasksState.tasks.length} مهمة)
                </span>
              </div>
            )}

            <TaskList
              tasks={tasksState.tasks}
              onEdit={form.openEdit}
              onComplete={handleComplete}
              onQuickView={handleQuickView}
              selectedTasks={selectedTasks}
              onToggleSelect={handleToggleSelect}
              viewMode={viewMode}
            />
          </>
        )}

        <TaskFormModal
          isOpen={form.modalOpen}
          mode={form.mode}
          formState={form.formState}
          onChange={form.setFormState}
          onSubmit={form.submit}
          onClose={form.close}
          submitting={form.submitting}
          lookups={form.lookups}
        />

        {quickViewTask && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={handleCloseQuickView}
          >
            <div
              className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-black mb-2">
                      {quickViewTask.title}
                    </h2>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/20">
                        {quickViewTask.status}
                      </span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/20">
                        {quickViewTask.priority}
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
                {quickViewTask.description && (
                  <div>
                    <h3
                      className={`text-sm font-bold mb-2 flex items-center gap-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <i className="fas fa-align-right text-blue-600"></i>
                      الوصف
                    </h3>
                    <p
                      className={`p-4 rounded-lg leading-relaxed ${
                        darkMode
                          ? "bg-gray-900 text-gray-300"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {quickViewTask.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {quickViewTask.scheduled_date && (
                    <div className={`p-4 rounded-lg transition-colors duration-300 ${
                      darkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50'
                    }`}>
                      <h3 className={`text-sm font-bold mb-1 ${
                        darkMode ? 'text-blue-400' : 'text-blue-700'
                      }`}>
                        التاريخ المحدد
                      </h3>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {quickViewTask.scheduled_date}
                      </p>
                    </div>
                  )}
                  {quickViewTask.project && (
                    <div className={`p-4 rounded-lg transition-colors duration-300 ${
                      darkMode ? 'bg-purple-900/30 border border-purple-800' : 'bg-purple-50'
                    }`}>
                      <h3 className={`text-sm font-bold mb-1 ${
                        darkMode ? 'text-purple-400' : 'text-purple-700'
                      }`}>
                        المشروع
                      </h3>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {quickViewTask.project.name}
                      </p>
                    </div>
                  )}
                  {quickViewTask.course && (
                    <div className={`p-4 rounded-lg transition-colors duration-300 ${
                      darkMode ? 'bg-indigo-900/30 border border-indigo-800' : 'bg-indigo-50'
                    }`}>
                      <h3 className={`text-sm font-bold mb-1 ${
                        darkMode ? 'text-indigo-400' : 'text-indigo-700'
                      }`}>
                        الدورة
                      </h3>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {quickViewTask.course.name}
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className={`flex gap-3 pt-4 border-t ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <button
                    onClick={() => {
                      form.openEdit(quickViewTask);
                      handleCloseQuickView();
                    }}
                    className="flex-1 text-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    <i className="fas fa-edit ml-2"></i>
                    تعديل المهمة
                  </button>
                  {quickViewTask.status !== "completed" && (
                    <button
                      onClick={() => {
                        handleComplete(quickViewTask);
                        handleCloseQuickView();
                      }}
                      className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      <i className="fas fa-check ml-2"></i>
                      إكمال
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TasksPage;
