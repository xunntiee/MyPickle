import axios from 'axios';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
    // In development, use localhost
    if (import.meta.env.DEV) {
        return 'http://localhost:3000';
    }

    // In production, use Railway backend
    const productionApiUrl = import.meta.env.VITE_API_URL;
    if (productionApiUrl) {
        return productionApiUrl;
    }

    // Fallback for Vercel deployment
    return 'https://mypickle-production.up.railway.app';
};

const instance = axios.create({
    baseURL: getApiBaseUrl(),
});

export default instance;
