import { useTheme } from "../../../contexts/ThemeContext";
import TaskCard from "./TaskCard";

function TaskList({ tasks, onEdit, onComplete, onQuickView, selectedTasks = [], onToggleSelect, viewMode = 'grid' }) {
    const { darkMode } = useTheme();

    if (!tasks.length) {
        return (
            <div className={`rounded-2xl border-2 p-12 text-center transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    darkMode ? 'bg-gray-900' : 'bg-gray-100'
                }`}>
                    <i className={`fas fa-tasks text-3xl ${
                        darkMode ? 'text-gray-600' : 'text-gray-400'
                    }`}></i>
                </div>
                <p className={`text-lg font-medium ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>لا توجد مهام ضمن هذا الفلتر</p>
            </div>
        );
    }

    return (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-4'}>
            {tasks.map((task) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onComplete={onComplete}
                    onQuickView={onQuickView}
                    selected={selectedTasks.includes(task.id)}
                    onToggleSelect={onToggleSelect}
                />
            ))}
        </div>
    );
}

export default TaskList;
