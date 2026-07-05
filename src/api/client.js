// src/api/client.js
// Centralized network engine for GlobalScholar.
// Every API call in the app goes through this one file.
// If the backend URL ever changes, we update it here only.

import axios from 'axios';

// Base URL — points to our live Django backend on Render.
// Falls back to localhost if VITE_API_URL is not set in .env
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

// localStorage key names — centralized so we never typo a key string
export const TOKEN_KEYS = {
  ACCESS:  'gs_access_token',
  REFRESH: 'gs_refresh_token',
  USER:    'gs_user',
};

// Custom Axios instance — pre-configured with base URL and headers
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000, // 20s — Render free tier can be slow waking from sleep
});

// ── REQUEST INTERCEPTOR ────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem(TOKEN_KEYS.ACCESS);
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR ───────────────────────────────────────────────────
// Runs after every response returns from Django.
// If a request fails with 401 (expired token), we silently use the refresh
// token to get a new access token and retry the original request once.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // FIX: was this request even carrying a session in the first place?
      // Check BEFORE deciding this 401 means "your session expired." An
      // anonymous visitor on the public Explore page (no access token ever
      // set) hitting an endpoint that turns out to require auth would
      // previously get force-redirected to /login via a hard page reload —
      // that's the "clicking a university sometimes blanks the page" bug.
      // There was no session for that visitor, so there's nothing to
      // "expire." We let the error propagate normally instead, so the
      // calling component's own error state handles it in-place (e.g. the
      // programs drawer shows "Could not load programs") rather than the
      // whole app yanking a logged-out visitor off the page they're on.
      const hadAccessToken = Boolean(localStorage.getItem(TOKEN_KEYS.ACCESS));
      if (!hadAccessToken) {
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH);

      if (refreshToken) {
        const refreshResponse = await axios
          .post(`${BASE_URL}/auth/token/refresh/`, { refresh: refreshToken })
          .catch(() => null);

        if (refreshResponse?.status === 200) {
          const newAccessToken = refreshResponse.data.access;
          localStorage.setItem(TOKEN_KEYS.ACCESS, newAccessToken);
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      }

      // Refresh failed or no refresh token — AND we know there WAS a real
      // access token on this request — so this is a genuine expired session.
      localStorage.removeItem(TOKEN_KEYS.ACCESS);
      localStorage.removeItem(TOKEN_KEYS.REFRESH);
      localStorage.removeItem(TOKEN_KEYS.USER);
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ══════════════════════════════════════════════════════════════════════════
// ENDPOINT FUNCTIONS — one per Django view, named after the action
// ══════════════════════════════════════════════════════════════════════════

// ── Auth ─────────────────────────────────────────────────────────────────
export const registerUser  = (data) => apiClient.post('/auth/register/', data);
export const loginUser     = (email, password) => apiClient.post('/auth/login/', { email, password });
export const logoutUser    = (refreshToken) => apiClient.post('/auth/logout/', { refresh: refreshToken });
export const refreshAccessToken = (refreshToken) => apiClient.post('/auth/token/refresh/', { refresh: refreshToken });

// ── Users ────────────────────────────────────────────────────────────────
export const getMyProfile    = () => apiClient.get('/users/me/');
export const updateMyProfile = (data) => apiClient.patch('/users/me/', data);

// ── Universities (public — no token needed for GET) ────────────────────────
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

// ── Documents ────────────────────────────────────────────────────────────
export const getDocumentChecklist = (applicationId) => apiClient.get(`/applications/${applicationId}/documents/`);

// Uploads use FormData since we're sending a real file, not JSON
export const uploadDocument = (documentId, file) => {
  const formData = new FormData();
  formData.append('file_attachment', file);
  return apiClient.patch(`/documents/${documentId}/upload/`, formData, {
    headers: { 'Content-Type': undefined }, // let browser set multipart boundary
  });
};

export const reviewDocument = (documentId, data) => apiClient.patch(`/documents/${documentId}/review/`, data);

// ── Credit Transfers ─────────────────────────────────────────────────────
export const getCreditTransfers  = (applicationId) => apiClient.get(`/applications/${applicationId}/credits/`);
export const getCreditTransfer   = (id) => apiClient.get(`/credits/${id}/`);
export const createCreditTransfer = (applicationId, data) => apiClient.post(`/applications/${applicationId}/credits/`, data);
export const updateCreditTransfer = (id, data) => apiClient.patch(`/credits/${id}/`, data);

export default apiClient;