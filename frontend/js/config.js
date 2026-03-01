// Global Configuration for Project Hub
const CONFIG = {
    // Check if we are running on localhost (development) or a live domain (production)
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

    // Dynamically set the API URL
    get API_URL() {
        return this.isDevelopment
            ? 'http://localhost:3000/api'
            : 'https://projecthub-production-e712.up.railway.app/api';
    }
};
