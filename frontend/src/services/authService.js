import api, { getCsrfToken } from './api';

const authService = {
    /**
     * Login user
     */
    async login(email, password) {
        await getCsrfToken();
        const response = await api.post('/auth/login', { email, password });
        if (response.data.success && response.data.data.token) {
            localStorage.setItem('auth_token', response.data.data.token);
        }
        return response.data;
    },

    /**
     * Register new user
     */
    async register(name, email, password, password_confirmation, referral_code = null) {
        await getCsrfToken();
        
        const payload = {
            name,
            email,
            password,
            password_confirmation,
        };

        if (referral_code) {
            payload.referral_code = referral_code;
        }

        const response = await api.post('/auth/register', payload);
        if (response.data.success && response.data.data.token) {
            localStorage.setItem('auth_token', response.data.data.token);
        }
        return response.data;
    },

    /**
     * Get current authenticated user
     */
    async getUser() {
        const response = await api.get('/auth/user');
        return response.data;
    },

    /**
     * Logout user
     */
    async logout() {
        try {
            await api.post('/auth/logout');
        } finally {
            localStorage.removeItem('auth_token');
        }
    },

    /**
     * Logout from all devices
     */
    async logoutAll() {
        try {
            await api.post('/auth/logout-all');
        } finally {
            localStorage.removeItem('auth_token');
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    },

    /**
     * Send password reset link
     */
    async forgotPassword(email) {
        await getCsrfToken();
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    /**
     * Reset password with token
     */
    async resetPassword(token, email, password, password_confirmation) {
        await getCsrfToken();
        const response = await api.post('/auth/reset-password', {
            token,
            email,
            password,
            password_confirmation,
        });
        return response.data;
    },
};

export default authService;

export const { login, register, getUser, logout, logoutAll, isAuthenticated, forgotPassword, resetPassword } = authService;
