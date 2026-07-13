// src/api/client.js
// Centralized network engine for GlobalScholar.

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export const TOKEN_KEYS = {
  ACCESS:  'gs_access_token',
  REFRESH: 'gs_refresh_token',
  USER:    'gs_user',
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// ── REQUEST INTERCEPTOR ────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const publicEndpoints = [
      '/universities/',
      '/universities',
      '/auth/login/',
      '/auth/register/',
      '/auth/token/refresh/',
    ];
    
    const isPublic = publicEndpoints.some((endpoint) => config.url?.startsWith(endpoint));
    
    if (!isPublic) {
      const accessToken = localStorage.getItem(TOKEN_KEYS.ACCESS);
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR ───────────────────────────────────────────────────
// Track if we're already refreshing to avoid multiple refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's not a 401 or already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh if it's the refresh endpoint itself
    if (originalRequest.url?.includes('/auth/token/refresh/')) {
      return Promise.reject(error);
    }

    // If we're already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH);

    if (!refreshToken) {
      // No refresh token - redirect to login
      isRefreshing = false;
      localStorage.removeItem(TOKEN_KEYS.ACCESS);
      localStorage.removeItem(TOKEN_KEYS.REFRESH);
      localStorage.removeItem(TOKEN_KEYS.USER);
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const refreshResponse = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });

      if (refreshResponse?.status === 200) {
        const newAccessToken = refreshResponse.data.access;
        localStorage.setItem(TOKEN_KEYS.ACCESS, newAccessToken);
        
        // Process any queued requests
        processQueue(null, newAccessToken);
        
        // Retry the original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } else {
        throw new Error('Refresh failed');
      }
    } catch (refreshError) {
      // Refresh failed - clear tokens and redirect to login
      processQueue(refreshError, null);
      localStorage.removeItem(TOKEN_KEYS.ACCESS);
      localStorage.removeItem(TOKEN_KEYS.REFRESH);
      localStorage.removeItem(TOKEN_KEYS.USER);
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ══════════════════════════════════════════════════════════════════════════
// ENDPOINT FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════

// ── Auth ─────────────────────────────────────────────────────────────────
export const registerUser  = (data) => apiClient.post('/auth/register/', data);
export const loginUser     = (email, password) => apiClient.post('/auth/login/', { email, password });
export const logoutUser    = (refreshToken) => apiClient.post('/auth/logout/', { refresh: refreshToken });
export const refreshAccessToken = (refreshToken) => apiClient.post('/auth/token/refresh/', { refresh: refreshToken });

// ── Users ────────────────────────────────────────────────────────────────
export const getMyProfile    = () => apiClient.get('/users/me/');
export const updateMyProfile = (data) => apiClient.patch('/users/me/', data);

// ── Universities (PUBLIC) ────────────────────────────────────────────────
export const getUniversities = (params = {}) => apiClient.get('/universities/', { params });
export const getUniversity   = (id) => apiClient.get(`/universities/${id}/`);
export const createUniversity = (data) => apiClient.post('/universities/', data);
export const updateUniversity = (id, data) => apiClient.patch(`/universities/${id}/`, data);

// ── Programs ─────────────────────────────────────────────────────────────
export const getUniversityPrograms = (universityId) => apiClient.get(`/universities/${universityId}/programs/`);
export const getProgram   = (id) => apiClient.get(`/programs/${id}/`);
export const createProgram = (universityId, data) => apiClient.post(`/universities/${universityId}/programs/`, data);
export const updateProgram = (id, data) => apiClient.patch(`/programs/${id}/`, data);
export const deleteProgram = (id) => apiClient.delete(`/programs/${id}/`);

// ── Applications ─────────────────────────────────────────────────────────
export const getApplications  = (params = {}) => apiClient.get('/applications/', { params });
export const getApplication   = (id) => apiClient.get(`/applications/${id}/`);
export const createApplication = (data) => apiClient.post('/applications/', data);
export const submitApplication = (id) => apiClient.post(`/applications/${id}/submit/`);
export const advanceApplication = (id, data) => apiClient.post(`/applications/${id}/advance/`, data);

// ── Approve/Reject ───────────────────────────────────────────────────────
export const approveApplication = (id) => apiClient.post(`/applications/${id}/approve/`);
export const rejectApplication = (id, data) => apiClient.post(`/applications/${id}/reject/`, data);

// ── Documents ────────────────────────────────────────────────────────────
export const getDocumentChecklist = (applicationId) => apiClient.get(`/applications/${applicationId}/documents/`);

export const uploadDocument = (documentId, file) => {
  const formData = new FormData();
  formData.append('file_attachment', file);
  return apiClient.patch(`/documents/${documentId}/upload/`, formData, {
    headers: { 'Content-Type': undefined },
  });
};

export const reviewDocument = (documentId, data) => apiClient.patch(`/documents/${documentId}/review/`, data);

// ── Bulk Document Upload ─────────────────────────────────────────────────
export const bulkUploadDocuments = (applicationId, files) => {
  const formData = new FormData();
  Object.keys(files).forEach((key) => {
    if (files[key]) {
      formData.append(key, files[key]);
    }
  });
  return apiClient.post(`/applications/${applicationId}/upload-documents/`, formData, {
    headers: { 'Content-Type': undefined },
  });
};

// ── Credit Transfers ─────────────────────────────────────────────────────
export const getCreditTransfers  = (applicationId) => apiClient.get(`/applications/${applicationId}/credits/`);
export const getCreditTransfer   = (id) => apiClient.get(`/credits/${id}/`);
export const createCreditTransfer = (applicationId, data) => apiClient.post(`/applications/${applicationId}/credits/`, data);
export const updateCreditTransfer = (id, data) => apiClient.patch(`/credits/${id}/`, data);

// ── Notifications ────────────────────────────────────────────────────────
export const getNotifications = () => apiClient.get('/notifications/');
export const getUnreadCount = () => apiClient.get('/notifications/unread-count/');
export const markNotificationRead = (id) => apiClient.post(`/notifications/${id}/read/`);
export const markAllNotificationsRead = () => apiClient.post('/notifications/mark-all-read/');

export default apiClient;