import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const AES_SECRET = process.env.NEXT_PUBLIC_AES_SECRET || '';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Decrypt AES-encrypted response data
export const decryptData = (encryptedData: string) => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, AES_SECRET);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decrypted);
    } catch {
        console.error('Decryption failed');
        return null;
    }
};

// Auth API
export const authAPI = {
    register: (data: { name: string; email: string; password: string }) =>
        api.post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
};

// Tasks API
export interface TaskQuery {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
}

export const tasksAPI = {
    getAll: (params?: TaskQuery) => api.get('/tasks', { params }),
    getOne: (id: string) => api.get(`/tasks/${id}`),
    create: (data: { title: string; description?: string; status?: string }) =>
        api.post('/tasks', data),
    update: (id: string, data: { title?: string; description?: string; status?: string }) =>
        api.put(`/tasks/${id}`, data),
    delete: (id: string) => api.delete(`/tasks/${id}`),
};

export default api;
