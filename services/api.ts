import axios from 'axios';
import { Platform } from 'react-native';

const API_URL = Platform.select({
    android: 'https://mozella-conoscopic-matt.ngrok-free.dev/api',
    ios: 'https://mozella-conoscopic-matt.ngrok-free.dev/api',
    default: 'https://mozella-conoscopic-matt.ngrok-free.dev/api',
});

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});

export default api;
