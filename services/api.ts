import axios from 'axios';
import { Platform } from 'react-native';

const API_URL = Platform.select({
    android: 'http://10.0.2.2:5000/api',
    ios: 'http://localhost:5000/api',
    default: 'http://localhost:5000/api',
});

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
