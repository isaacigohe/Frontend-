// =============================================================================
// src/api/admin.js
// -----------------------------------------------------------------------------
// Admin API calls - connected to real backend endpoints.
// =============================================================================

import { getApplications, getApplication, reviewDocument, advanceApplication, createUniversity, apiClient } from './client';
import { normalizeList } from './utils';

// ── Status transitions ──────────────────────────────────────────────────────
export const FORWARD_TRANSITIONS = {
  SUBMITTED: 'UNDER_REVIEW',
  UNDER_REVIEW: 'HOST_REVIEW',
  HOST_REVIEW: 'APPROVED',
};

// ── Application Queue ──────────────────────────────────────────────────────
export async function getApplicationQueue(params) {
  const response = await getApplications(params);
  const { results, count } = normalizeList(response.data);
  return { data: { results, count } };
}

// ── Application Detail ─────────────────────────────────────────────────────
export async function getApplicationDetail(applicationId) {
  const response = await getApplication(applicationId);
  return { data: { ...response.data, documents: response.data.document_checklist ?? [] } };
}

// ── Document Reviews ───────────────────────────────────────────────────────
export function verifyDocument(documentId) {
  return reviewDocument(documentId, { verification_status: 'APPROVED' });
}

export function flagDocument(documentId, comment) {
  return reviewDocument(documentId, { verification_status: 'ACTION_REQUIRED', admin_comment: comment });
}

// ── Application Approve/Reject ─────────────────────────────────────────────
export function approveApplication(applicationId, currentStatus) {
  const nextStatus = FORWARD_TRANSITIONS[currentStatus];
  return advanceApplication(applicationId, nextStatus ? { status: nextStatus } : {});
}

export function rejectApplication(applicationId, comment) {
  return advanceApplication(applicationId, { status: 'REJECTED', rejection_reason: comment });
}

// ── University Registration ────────────────────────────────────────────────
export function registerUniversity(payload) {
  return createUniversity(payload);
}

// ── SUPER ADMIN FUNCTIONS ──────────────────────────────────────────────────
export function getUnverifiedAdmins() {
  return apiClient.get('/users/unverified-admins/');
}

export function verifyAdmin(userId) {
  return apiClient.post(`/users/${userId}/verify/`);
}

export function rejectAdmin(userId) {
  return apiClient.post(`/users/${userId}/reject/`);
}