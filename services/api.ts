import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'x-carcard-app': 'true',
    },
});

// ── Auth interceptor: attach JWT token to every request ──
api.interceptors.request.use(async (config) => {
    try {
        const raw = await AsyncStorage.getItem('auth-storage');
        if (raw) {
            const parsed = JSON.parse(raw);
            const token = parsed?.state?.token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    } catch {
        // silently ignore — unauthenticated request
    }
    return config;
});

// ── Response interceptor: log errors clearly during development ──
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (__DEV__) {
            const method = error.config?.method?.toUpperCase() || '?';
            const url = error.config?.url || '?';
            const status = error.response?.status || 'NETWORK_ERROR';
            const message = error.response?.data?.message || error.message;
            console.warn(`⚠️ API ${method} ${url} → ${status}: ${message}`);
        }
        return Promise.reject(error);
    }
);

export default api;
