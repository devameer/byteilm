import { useEffect, useState } from "react";
import projectService from "../../../services/projectService";
import courseService from "../../../services/courseService";
import lessonService from "../../../services/lessonService";
import taskService from "../../../services/taskService";

const BASE_FORM = {
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    scheduled_date: "",
    due_date: "",
    source_type: "none",
    project_id: "",
    course_id: "",
    lesson_id: "",
    estimated_duration: "",
    link: "",
};

export function useTaskForm({ onSuccess }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState("create");
    const [formState, setFormState] = useState(BASE_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [lookups, setLookups] = useState({ projects: [], courses: [], lessons: [] });
    const [currentTaskId, setCurrentTaskId] = useState(null);

    useEffect(() => {
        const extract = (response) => {
            if (!response) {
                return [];
            }
            if (response.success && Array.isArray(response.data)) {
                return response.data;
            }
            if (Array.isArray(response)) {
                return response;
            }
            return response.data ?? [];
        };

        (async () => {
            try {
                const [projectsResponse, coursesResponse] = await Promise.all([
                    projectService.getProjects({ status: "active" }),
                    courseService.getCourses({ active: true }),
                ]);
                setLookups((prev) => ({
                    ...prev,
                    projects: extract(projectsResponse),
                    courses: extract(coursesResponse),
                }));
            } catch (error) {
                // Ignore canceled errors (they're not real errors, just duplicate request prevention)
                if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                    return;
                }
                console.error("Failed to load lookups", error);
            }
        })();
    }, []);

    useEffect(() => {
        if (formState.source_type === "lesson" && formState.course_id) {
            lessonService
                .getLessons({ course_id: formState.course_id })
                .then((response) => {
                    const list = Array.isArray(response)
                        ? response
                        : response?.success
                        ? response.data
                        : response?.data ?? [];
                    setLookups((prev) => ({
                        ...prev,
                        lessons: list,
                    }));
                })
                .catch(() => {
                    setLookups((prev) => ({ ...prev, lessons: [] }));
                });
        } else {
            setLookups((prev) => ({ ...prev, lessons: [] }));
            // Clear lesson_id when course is changed or source_type is not lesson
            if (formState.lesson_id) {
                setFormState((prev) => ({ ...prev, lesson_id: "" }));
            }
        }
    }, [formState.course_id, formState.source_type]);

    const openCreate = () => {
        setMode("create");
        setFormState(BASE_FORM);
        setCurrentTaskId(null);
        setModalOpen(true);
    };

    const openEdit = (task) => {
        setMode("edit");
        setCurrentTaskId(task.id);
        const sourceType = task.lesson_id ? "lesson" : task.course_id ? "course" : task.project_id ? "project" : "none";
        setFormState({
            title: task.title ?? "",
            description: task.description ?? "",
            priority: task.priority ?? "medium",
            status: task.status ?? "pending",
            scheduled_date: task.scheduled_date ?? "",
            due_date: task.due_date ?? "",
            source_type: sourceType,
            project_id: task.project_id ?? "",
            course_id: task.course_id ?? "",
            lesson_id: task.lesson_id ?? "",
            estimated_duration: task.estimated_duration ?? "",
            link: task.link ?? "",
        });
        setModalOpen(true);
    };

    const close = () => setModalOpen(false);

    const submit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            if (mode === "create") {
                await taskService.create(formState);
            } else if (currentTaskId) {
                await taskService.update(currentTaskId, formState);
            }
            setModalOpen(false);
            onSuccess?.();
        } finally {
            setSubmitting(false);
        }
    };

    return {
        modalOpen,
        openCreate,
        openEdit,
        close,
        mode,
        submitting,
        formState,
        setFormState,
        lookups,
        submit,
    };
}
