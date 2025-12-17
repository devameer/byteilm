import api from "./api";
import { cleanParams } from "../utils/apiHelpers";

const calendarService = {
    list(params = {}) {
        const cleanedParams = cleanParams(params);
        return api
            .get("/calendar/data", { params: cleanedParams })
            .then((response) => response.data);
    },
    metadata() {
        return api.get("/calendar/metadata").then((response) => response.data);
    },
    statistics(period = "week") {
        return api
            .get("/calendar/statistics", { params: { period } })
            .then((response) => response.data);
    },
    itemsForDate(date) {
        return api
            .get(`/calendar/items/${date}`)
            .then((response) => response.data);
    },
    move(itemId, date) {
        return api
            .post("/calendar/move", { item_id: itemId, new_date: date })
            .then((response) => response.data);
    },
    complete(itemId) {
        return api
            .post("/calendar/complete", { item_id: itemId })
            .then((response) => response.data);
    },
    quickAdd(payload) {
        return api
            .post("/calendar/quick-add", payload)
            .then((response) => response.data);
    },
    updateItemDate(itemId, newDate) {
        return api
            .put(`/calendar/items/${itemId}/date`, { scheduled_date: newDate })
            .then((response) => response.data);
    },
    search(query, filters = {}) {
        const cleanedParams = cleanParams({ q: query, ...filters });
        return api
            .get("/calendar/search", { params: cleanedParams })
            .then((response) => response.data);
    },
    // Legacy helpers for backward compatibility
    getCalendarData(date = null) {
        return this.list(date ? { date } : {});
    },
    getItemsForDate(date) {
        return this.itemsForDate(date);
    },
    moveItem(itemId, date) {
        return this.move(itemId, date);
    },
    completeItem(itemId) {
        return this.complete(itemId);
    },
    getStatistics(period = "week") {
        return this.statistics(period);
    },
    getMetadata() {
        return this.metadata();
    },
};

export default calendarService;
