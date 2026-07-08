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
// Only add Authorization header if we have a token AND the request is NOT
// to a public endpoint.
apiClient.interceptors.request.use(
  (config) => {
    // List of public endpoints that don't need authentication
    const publicEndpoints = [
      '/universities/',
      '/universities',
      '/auth/login/',
      '/auth/register/',
      '/auth/token/refresh/',
    ];
    
    // Check if this request is to a public endpoint
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
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 if this wasn't already a retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH);
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });
          if (refreshResponse?.status === 200) {
            const newAccessToken = refreshResponse.data.access;
            localStorage.setItem(TOKEN_KEYS.ACCESS, newAccessToken);
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear session
          localStorage.removeItem(TOKEN_KEYS.ACCESS);
          localStorage.removeItem(TOKEN_KEYS.REFRESH);
          localStorage.removeItem(TOKEN_KEYS.USER);
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem(TOKEN_KEYS.ACCESS);
        localStorage.removeItem(TOKEN_KEYS.REFRESH);
        localStorage.removeItem(TOKEN_KEYS.USER);
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
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

// ── Universities (PUBLIC - no token needed) ─────────────────────────────
export const getUniversities = (params = {}) => apiClient.get('/universities/', { params });
export const getUniversity   = (id) => apiClient.get(`/universities/${id}/`);
export const createUniversity = (data) => apiClient.post('/universities/', data);
export const updateUniversity = (id, data) => apiClient.patch(`/universities/${id}/`, data);

// ── Programs ─────────────────────────────────────────────────────────────
export const getUniversityPrograms = (universityId) => apiClient.get(`/universities/${universityId}/programs/`);
export const getProgram   = (id) => apiClient.get(`/programs/${id}/`);
export const createProgram = (universityId, data) => apiClient.post(`/universities/${universityId}/programs/`, data);

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