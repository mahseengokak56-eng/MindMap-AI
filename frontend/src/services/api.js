import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);

export const getMoodHistory = () => api.get('/mood/history');
export const logMood = (data) => api.post('/mood', data);
export const getActivityHistory = () => api.get('/activity');
export const logActivity = (data) => api.post('/activity', data);
export const getPrediction = () => api.get('/predict');
export const getSuggestions = () => api.get('/suggestions');
export const triggerSOS = () => api.post('/sos');
export const sendMessage = (data) => api.post('/chat', data);
export const getProfile = () => api.get('/profile');
export const updateEmergencyContact = (data) => api.put('/profile/emergency', data);

export default api;
