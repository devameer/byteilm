import api from './api';

const referralService = {
    async getSummary() {
        const response = await api.get('/referrals/summary');
        return response.data;
    },
};

export default referralService;
