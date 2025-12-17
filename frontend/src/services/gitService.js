import api from './api';

const gitService = {
    /**
     * Trigger git pull operation on the server
     */
    async pullLatest() {
        const response = await api.post('/git/pull');
        return response.data;
    },
};

export default gitService;
