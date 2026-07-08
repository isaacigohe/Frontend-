// =============================================================================
// src/api/hostcoord.js
// -----------------------------------------------------------------------------
// Host Coordinator API calls - connected to real backend endpoints.
// =============================================================================

import apiClient from './client';

// ── Applications ─────────────────────────────────────────────────────────
// Get all applications (filtered server-side by host_university)
export function getHostApplications(params = {}) {
  return apiClient.get('/applications/', { params });
}

// Get a single application detail
export function getHostApplicationDetail(id) {
  return apiClient.get(`/applications/${id}/`);
}

// Advance an application to the next stage
export function advanceHostApplication(id, data) {
  return apiClient.post(`/applications/${id}/advance/`, data);
}

// Approve an application (direct)
export function approveHostApplication(id) {
  return apiClient.post(`/applications/${id}/approve/`);
}

// Reject an application with reason
export function rejectHostApplication(id, rejectionReason) {
  return apiClient.post(`/applications/${id}/reject/`, { rejection_reason: rejectionReason });
}

// ── Documents ────────────────────────────────────────────────────────────
// Get document checklist for an application
export function getHostDocumentChecklist(applicationId) {
  return apiClient.get(`/applications/${applicationId}/documents/`);
}

// Review a document (approve or flag)
export function reviewHostDocument(documentId, data) {
  return apiClient.patch(`/documents/${documentId}/review/`, data);
}

// ── Credit Transfers ─────────────────────────────────────────────────────
// Get credit transfers for an application
export function getHostCreditTransfers(applicationId) {
  return apiClient.get(`/applications/${applicationId}/credits/`);
}

// Create a credit transfer
export function createHostCreditTransfer(applicationId, data) {
  return apiClient.post(`/applications/${applicationId}/credits/`, data);
}

// Update a credit transfer
export function updateHostCreditTransfer(id, data) {
  return apiClient.patch(`/credits/${id}/`, data);
}

// ── Notifications ────────────────────────────────────────────────────────
export function getHostNotifications() {
  return apiClient.get('/notifications/');
}

export function getHostUnreadCount() {
  return apiClient.get('/notifications/unread-count/');
}

export function markHostNotificationRead(id) {
  return apiClient.post(`/notifications/${id}/read/`);
}

// ── University ───────────────────────────────────────────────────────────
// Get the host coordinator's assigned university
export function getHostUniversity() {
  return apiClient.get('/users/me/');
}