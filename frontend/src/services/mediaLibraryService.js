import api from "./api";

const mediaLibraryService = {
    async getVideos(params = {}) {
        const response = await api.get("/media-library/videos", { params });
        return response.data;
    },

    async uploadVideos(formData) {
        const response = await api.post("/media-library/videos", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

    async assignVideo(videoId, lessonId) {
        const response = await api.post(`/media-library/videos/${videoId}/assign`, {
            lesson_id: lessonId,
        });
        return response.data;
    },

    async detachVideo(videoId) {
        const response = await api.post(`/media-library/videos/${videoId}/detach`);
        return response.data;
    },

    async deleteVideo(videoId) {
        const response = await api.delete(`/media-library/videos/${videoId}`);
        return response.data;
    },
};

export default mediaLibraryService;

