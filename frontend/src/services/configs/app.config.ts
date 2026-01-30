export const APP_CONFIG = {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    APP_NAME: 'Diamond Bid',
    APP_VERSION: '0.0.1',
    ENVIRONMENT: import.meta.env.MODE || 'development',
}

export default APP_CONFIG
