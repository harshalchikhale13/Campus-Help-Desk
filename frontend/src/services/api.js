/**
 * API Service
 * Handles all HTTP requests to backend
 */
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log('🚨 URGENT DEBUG: React is trying to contact the Backend at:', API_URL);

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========== USER ENDPOINTS ==========

export const userAPI = {
  register: (userData) => axiosInstance.post('/users/register', userData),
  login: (email, password) => axiosInstance.post('/users/login', { email, password }),
  getProfile: () => axiosInstance.get('/users/profile'),
  updateProfile: (userData) => axiosInstance.put('/users/profile', userData),
  getAllUsers: (params) => axiosInstance.get('/users', { params }),
  getUserById: (id) => axiosInstance.get(`/users/${id}`),
  toggleUserStatus: (id) => axiosInstance.put(`/users/${id}/toggle-status`),
};

// ========== COMPLAINT ENDPOINTS ==========

export const complaintAPI = {
  createComplaint: (data) => axiosInstance.post('/complaints', data),
  getComplaint: (id) => axiosInstance.get(`/complaints/${id}`),
  getAllComplaints: (params) => axiosInstance.get('/complaints', { params }),
  updateStatus: (id, data) => axiosInstance.put(`/complaints/${id}/status`, data),
  addUpdate: (id, data) => axiosInstance.post(`/complaints/${id}/updates`, data),
  getHistory: (id) => axiosInstance.get(`/complaints/${id}/history`),
  getStats: () => axiosInstance.get('/complaints/stats/overview'),
  deleteComplaint: (id) => axiosInstance.delete(`/complaints/${id}`),
};

// ========== NOTIFICATION ENDPOINTS ==========

export const notificationAPI = {
  getNotifications: (params) => axiosInstance.get('/notifications', { params }),
  markAsRead: (id) => axiosInstance.put(`/notifications/${id}/read`),
};

// ========== AI ENDPOINTS ==========
export const aiAPI = {
  analyze: (data) => axiosInstance.post('/ai/analyze', data),
  chat: (data) => axiosInstance.post('/ai/chat', data),
};

export default axiosInstance;
