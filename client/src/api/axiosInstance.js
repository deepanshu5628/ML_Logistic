// src/api/axiosInstance.js
import axios from 'axios';

// Create an Axios instance with a default base URL
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 Request Interceptor: Add token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ⚠️ Response Interceptor: Handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('⛔ Unauthorized! Redirecting to login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // force redirect
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
