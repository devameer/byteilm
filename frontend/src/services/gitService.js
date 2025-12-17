import api from './api';

const gitService = {
    /**
     * Trigger git pull operation on the server
     */
    async pullLatest() {
        const response = await api.post('/git/pull');
        return response.data;
    },

    /**
     * Run composer install on the server
     */
    async composerInstall() {
        const response = await api.post('/git/composer-install');
        return response.data;
    },

    /**
     * Run php artisan migrate on the server
     */
    async migrate() {
        const response = await api.post('/git/migrate');
        return response.data;
    },

    /**
     * Run php artisan migrate:fresh --seed on the server
     * WARNING: This will delete all data!
     */
    async migrateFresh() {
        const response = await api.post('/git/migrate-fresh');
        return response.data;
    },
};

export default gitService;
