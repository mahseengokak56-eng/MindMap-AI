import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getMoodHistory = () => api.get('/mood/history');
export const logMood = (data) => api.post('/mood', data);
export const getActivityHistory = () => api.get('/activity');
export const logActivity = (data) => api.post('/activity', data);
export const getPrediction = () => api.get('/predict');
export const getSuggestions = () => api.get('/suggestions');
export const triggerSOS = () => api.post('/sos');

export default api;
