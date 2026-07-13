// =============================================================================
// src/api/admin.js  (CORRECTED)
// -----------------------------------------------------------------------------
// Admin API calls - connected to real backend endpoints.
// =============================================================================

import apiClient from './client';  // <-- MUST HAVE THIS IMPORT!
import { normalizeList } from './utils';

// CONFIRMED against ApplicationSerializer._validate_status_transition
export const FORWARD_TRANSITIONS = {
  SUBMITTED: 'UNDER_REVIEW',
  UNDER_REVIEW: 'COMPLIANCE_PHASE',
  COMPLIANCE_PHASE: 'APPROVED',
};

// ── Applications ──────────────────────────────────────────────────────────────
export async function getApplicationQueue(params) {
  const response = await apiClient.get('/applications/', { params });
  const { results, count } = normalizeList(response.data);
  return { data: { results, count } };
}

export async function getApplicationDetail(applicationId) {
  const response = await apiClient.get(`/applications/${applicationId}/`);
  return { data: { ...response.data, documents: response.data.document_checklist ?? [] } };
}

export function verifyDocument(documentId) {
  return apiClient.patch(`/documents/${documentId}/review/`, { verification_status: 'APPROVED' });
}

export function flagDocument(documentId, comment) {
  return apiClient.patch(`/documents/${documentId}/review/`, { 
    verification_status: 'ACTION_REQUIRED', 
    admin_comment: comment 
  });
}

export function approveApplication(applicationId, currentStatus) {
  const nextStatus = FORWARD_TRANSITIONS[currentStatus];
  return apiClient.post(`/applications/${applicationId}/advance/`, { status: nextStatus });
}

export function rejectApplication(applicationId, comment) {
  return apiClient.post(`/applications/${applicationId}/reject/`, { 
    status: 'REJECTED', 
    rejection_reason: comment 
  });
}

// ── Universities ──────────────────────────────────────────────────────────────
export function registerUniversity(payload) {
  return apiClient.post('/universities/', payload);
}

// ── Super Admin API Calls ──────────────────────────────────────────────────
export function getUnverifiedAdmins() {
  return apiClient.get('/users/unverified-admins/');
}

export function verifyAdmin(userId) {
  return apiClient.post(`/users/${userId}/verify/`);
}

export function rejectAdmin(userId) {
  return apiClient.post(`/users/${userId}/reject/`);
}