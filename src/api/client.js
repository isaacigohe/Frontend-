// src/api/client.js
// Centralized network engine for GlobalScholar with improved token refresh

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
  timeout: 30000,
});

export { apiClient };

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
    
    // For FormData, remove Content-Type so browser sets it
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────────────────
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

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/token/refresh/')) {
      localStorage.removeItem(TOKEN_KEYS.ACCESS);
      localStorage.removeItem(TOKEN_KEYS.REFRESH);
      localStorage.removeItem(TOKEN_KEYS.USER);
      window.location.href = '/login';
      return Promise.reject(error);
    }

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
      isRefreshing = false;
      localStorage.removeItem(TOKEN_KEYS.ACCESS);
      localStorage.removeItem(TOKEN_KEYS.REFRESH);
      localStorage.removeItem(TOKEN_KEYS.USER);
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      console.log('Refreshing token...');
      const refreshResponse = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });

      if (refreshResponse?.status === 200) {
        const newAccessToken = refreshResponse.data.access;
        localStorage.setItem(TOKEN_KEYS.ACCESS, newAccessToken);
        console.log('Token refreshed successfully');
        
        processQueue(null, newAccessToken);
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } else {
        throw new Error('Refresh failed');
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
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

export const registerUser  = (data) => apiClient.post('/auth/register/', data);
export const loginUser     = (email, password) => apiClient.post('/auth/login/', { email, password });
export const logoutUser    = (refreshToken) => apiClient.post('/auth/logout/', { refresh: refreshToken });
export const refreshAccessToken = (refreshToken) => apiClient.post('/auth/token/refresh/', { refresh: refreshToken });

export const getMyProfile    = () => apiClient.get('/users/me/');
export const updateMyProfile = (data) => apiClient.patch('/users/me/', data);

// ── Universities ──────────────────────────────────────────────────────────
export const getUniversities = (params = {}) => apiClient.get('/universities/', { params });
export const getUniversity   = (id) => apiClient.get(`/universities/${id}/`);

// Use FormData for all university updates
export const createUniversity = (data) => {
  let payload;
  let headers = {};

  if (data instanceof FormData) {
    payload = data;
    headers = { 'Content-Type': 'multipart/form-data' };
  } else {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    payload = formData;
    headers = { 'Content-Type': 'multipart/form-data' };
  }

  return apiClient.post('/universities/', payload, { headers });
};

// Always use FormData for university updates
export const updateUniversity = (id, data) => {
  let payload;
  let headers = {};

  if (data instanceof FormData) {
    payload = data;
    headers = { 'Content-Type': 'multipart/form-data' };
  } else {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    payload = formData;
    headers = { 'Content-Type': 'multipart/form-data' };
  }

  return apiClient.patch(`/universities/${id}/`, payload, { headers });
};

// ── Programs ─────────────────────────────────────────────────────────────
export const getUniversityPrograms = (universityId) => apiClient.get(`/universities/${universityId}/programs/`);
export const getProgram   = (id) => apiClient.get(`/programs/${id}/`);
export const createProgram = (universityId, data) => {
  return apiClient.post(`/universities/${universityId}/programs/`, data);
};
export const updateProgram = (id, data) => apiClient.patch(`/programs/${id}/`, data);
export const deleteProgram = (id) => apiClient.delete(`/programs/${id}/`);

// ── Applications ─────────────────────────────────────────────────────────
export const getApplications  = (params = {}) => apiClient.get('/applications/', { params });
export const getApplication   = (id) => apiClient.get(`/applications/${id}/`);
export const createApplication = (data) => apiClient.post('/applications/', data);
export const submitApplication = (id) => apiClient.post(`/applications/${id}/submit/`);
export const advanceApplication = (id, data) => apiClient.post(`/applications/${id}/advance/`, data);

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

// ── Manual Refresh ──────────────────────────────────────────────────────
export const manualRefreshToken = async () => {
  const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH);
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  try {
    const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });
    const newAccessToken = response.data.access;
    localStorage.setItem(TOKEN_KEYS.ACCESS, newAccessToken);
    return newAccessToken;
  } catch (error) {
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
    localStorage.removeItem(TOKEN_KEYS.USER);
    window.location.href = '/login';
    throw error;
  }
};

export default apiClient;