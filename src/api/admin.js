// =============================================================================
// src/api/admin.js
// -----------------------------------------------------------------------------
// Named Axios wrappers consumed by AdminReviewDesk.jsx. Same pattern as
// Phase 3's src/api/students.js: one function per endpoint, no URL strings
// or Axios calls ever appear inside the component file itself.
// =============================================================================

import apiClient from './client';

// GET a paginated, filterable queue of applications awaiting admin review.
// `params` may include: { page, status, search }
// Expected response: DRF pagination shape { count, next, previous, results }
// where each result is a summary row:
//   { id, student_name, university_name, status, submitted_at }
export function getApplicationQueue(params) {
  return apiClient.get('/admin/applications/', { params });
}

// GET full detail for a single application, including its nested document
// list, for the right-hand inspection panel.
// Expected response:
//   { id, student_name, university_name, status,
//     documents: [{ id, document_name, file_url, status, admin_comment }] }
export function getApplicationDetail(applicationId) {
  return apiClient.get(`/admin/applications/${applicationId}/`);
}

// PATCH a single document's status to VERIFIED (no comment required —
// verification is a simple confirmation, not a rejection).
export function verifyDocument(documentId) {
  return apiClient.patch(`/admin/documents/${documentId}/`, { status: 'VERIFIED' });
}

// PATCH a single document's status to ACTION_REQUIRED, attaching the
// mandatory admin_comment explaining what the student needs to fix.
// The frontend guardrail (ReasonGate component) guarantees `comment` is
// always a non-empty, trimmed string by the time this is called — but we
// still never trust the client alone; the backend serializer should also
// reject a blank admin_comment on this transition.
export function flagDocument(documentId, comment) {
  return apiClient.patch(`/admin/documents/${documentId}/`, {
    status: 'ACTION_REQUIRED',
    admin_comment: comment,
  });
}

// PATCH the whole application forward to the next pipeline stage.
export function approveApplication(applicationId, nextStatus) {
  return apiClient.patch(`/admin/applications/${applicationId}/`, { status: nextStatus });
}

// PATCH the whole application to REJECTED, attaching the mandatory
// rejection reason (again guarded client-side by ReasonGate).
export function rejectApplication(applicationId, comment) {
  return apiClient.patch(`/admin/applications/${applicationId}/`, {
    status: 'REJECTED',
    admin_comment: comment,
  });
}