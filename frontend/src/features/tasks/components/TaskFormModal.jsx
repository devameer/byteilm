import React from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import Modal from "../../../components/Modal";
import SearchableSelect from "../../../components/SearchableSelect";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "../constants";

function TaskFormModal({ isOpen, mode, formState, onChange, onSubmit, onClose, submitting, lookups }) {
    const { darkMode } = useTheme();
    
    return (
        <Modal title={mode === "create" ? "مهمة جديدة" : "تعديل المهمة"} isOpen={isOpen} onClose={onClose} size="md">
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className={`block text-sm font-bold mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>العنوان</label>
                    <input
                        value={formState.title}
                        onChange={(event) => onChange({ ...formState, title: event.target.value })}
                        className={`w-full border-2 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 transition-all ${
                            darkMode
                                ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500 placeholder-gray-500'
                                : 'bg-white border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="أدخل عنوان المهمة"
                        required
                    />
                </div>
                <div>
                    <label className={`block text-sm font-bold mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>الوصف</label>
                    <textarea
                        value={formState.description}
                        onChange={(event) => onChange({ ...formState, description: event.target.value })}
                        className={`w-full border-2 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 transition-all ${
                            darkMode
                                ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500 placeholder-gray-500'
                                : 'bg-white border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="أدخل وصف المهمة (اختياري)"
                        rows={3}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>الأولوية</label>
                        <select
                            value={formState.priority}
                            onChange={(event) => onChange({ ...formState, priority: event.target.value })}
                            className={`w-full border-2 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 font-medium transition-all ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                    : 'bg-white border-gray-300 focus:border-blue-500'
                            }`}
                        >
                            {PRIORITY_OPTIONS.filter((option) => option.value).map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>الحالة</label>
                        <select
                            value={formState.status}
                            onChange={(event) => onChange({ ...formState, status: event.target.value })}
                            className={`w-full border-2 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 font-medium transition-all ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                    : 'bg-white border-gray-300 focus:border-blue-500'
                            }`}
                        >
                            {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>تاريخ التنفيذ</label>
                        <input
                            type="date"
                            value={formState.scheduled_date}
                            onChange={(event) => onChange({ ...formState, scheduled_date: event.target.value })}
                            className={`w-full border-2 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 transition-all ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                    : 'bg-white border-gray-300 focus:border-blue-500'
                            }`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>تاريخ الاستحقاق</label>
                        <input
                            type="date"
                            value={formState.due_date}
                            onChange={(event) => onChange({ ...formState, due_date: event.target.value })}
                            className={`w-full border-2 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 transition-all ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                    : 'bg-white border-gray-300 focus:border-blue-500'
                            }`}
                        />
                    </div>
                </div>
                <div>
                    <label className={`block text-sm font-bold mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>مصدر المهمة</label>
                    <select
                        value={formState.source_type}
                        onChange={(event) => onChange({ ...formState, source_type: event.target.value })}
                        className={`w-full border-2 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 font-medium transition-all ${
                            darkMode
                                ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                : 'bg-white border-gray-300 focus:border-blue-500'
                        }`}
                    >
                        <option value="none">مستقلة</option>
                        <option value="project">مشروع</option>
                        <option value="course">دورة</option>
                        <option value="lesson">درس</option>
                    </select>
                </div>
                {formState.source_type === "project" && (
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>المشروع</label>
                        <select
                            value={formState.project_id}
                            onChange={(event) => onChange({ ...formState, project_id: event.target.value })}
                            className={`w-full border-2 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 font-medium transition-all ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                    : 'bg-white border-gray-300 focus:border-blue-500'
                            }`}
                        >
                            <option value="">اختر مشروعاً</option>
                            {(lookups.projects || []).map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {(formState.source_type === "course" || formState.source_type === "lesson") && (
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>الدورة</label>
                        <select
                            value={formState.course_id}
                            onChange={(event) => onChange({ ...formState, course_id: event.target.value })}
                            className={`w-full border-2 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 font-medium transition-all ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500'
                                    : 'bg-white border-gray-300 focus:border-blue-500'
                            }`}
                        >
                            <option value="">اختر دورة</option>
                            {(lookups.courses || []).map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {formState.source_type === "lesson" && formState.course_id && (
                    <div>
                        <SearchableSelect
                            label="الدرس"
                            value={formState.lesson_id}
                            onChange={(lessonId) => onChange({ ...formState, lesson_id: lessonId })}
                            options={(lookups.lessons || []).map((lesson) => ({
                                value: lesson.id,
                                label: lesson.name,
                                name: lesson.name,
                            }))}
                            placeholder="اختر درساً"
                            searchPlaceholder="ابحث عن درس..."
                            emptyMessage={formState.course_id ? "لا توجد دروس متاحة" : "يرجى اختيار الدورة أولاً"}
                            required={formState.source_type === "lesson"}
                            disabled={!formState.course_id}
                        />
                    </div>
                )}
                {formState.source_type === "lesson" && !formState.course_id && (
                    <div className={`p-4 rounded-lg border-2 ${
                        darkMode 
                            ? 'bg-gray-800/50 border-gray-700 text-gray-400' 
                            : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                        <p className="text-sm text-center">
                            يرجى اختيار الدورة أولاً لعرض الدروس المتاحة
                        </p>
                    </div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className={`px-5 py-2.5 border-2 rounded-lg font-bold transition-all ${
                            darkMode
                                ? 'border-gray-700 text-gray-300 hover:bg-gray-700'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        إلغاء
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? "جاري الحفظ..." : "حفظ"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default TaskFormModal;
