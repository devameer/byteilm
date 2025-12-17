import api from "./api";
import { cleanParams } from "../utils/apiHelpers";

const taskService = {
    list(params = {}) {
        const cleanedParams = cleanParams(params);
        return api.get("/tasks", { params: cleanedParams }).then((response) => response.data);
    },
    retrieve(id) {
        return api.get(`/tasks/${id}`).then((response) => response.data);
    },
    create(payload) {
        return api.post("/tasks", payload).then((response) => response.data);
    },
    update(id, payload) {
        return api
            .put(`/tasks/${id}`, payload)
            .then((response) => response.data);
    },
    remove(id) {
        return api.delete(`/tasks/${id}`).then((response) => response.data);
    },
    complete(id) {
        return api
            .post(`/tasks/${id}/complete`)
            .then((response) => response.data);
    },
    reorder(tasks) {
        return api
            .post("/tasks/reorder", { tasks })
            .then((response) => response.data);
    },
    // Backwards compatibility helpers for legacy imports
    getTasks(params = {}) {
        return this.list(params);
    },
    getTask(id) {
        return this.retrieve(id);
    },
    createTask(payload) {
        return this.create(payload);
    },
    updateTask(id, payload) {
        return this.update(id, payload);
    },
    deleteTask(id) {
        return this.remove(id);
    },
    completeTask(id) {
        return this.complete(id);
    },
    delete(id) {
        return this.remove(id);
    },
};

export default taskService;
