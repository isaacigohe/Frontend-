// =============================================================================
// src/api/students.js
// -----------------------------------------------------------------------------
// Thin, named-function wrappers around the shared Axios instance from Phase 1
// (src/api/client.js). Each function here corresponds to exactly one Django
// REST endpoint. Keeping these in one file means StudentDashboard.jsx never
// imports Axios directly or repeats a URL string — if a route path changes,
// it changes in exactly one place.
//
// Adjust the URL strings below to match your actual Django urls.py routes;
// the paths here follow the REST convention implied by the assignment brief.
// =============================================================================

import apiClient from './client';

// GET the logged-in student's own profile record.
export function getStudentProfile() {
  return apiClient.get('/students/me/');
}

// GET the logged-in student's current application pipeline status.
// Expected response shape: { status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW'
//                                    | 'COMPLIANCE_PHASE' | 'APPROVED' }
export function getApplicationProgress() {
  return apiClient.get('/students/me/progress/');
}

// GET a paginated slice of the university catalog.
// `params` may include: { page, country, language }
// The backend is expected to use DRF's PageNumberPagination (page_size=10)
// and return { count, next, previous, results }.
export function getUniversities(params) {
  return apiClient.get('/universities/', { params });
}

// GET the logged-in student's compliance document checklist.
// Expected response shape: an array of
//   { id, document_name, status, admin_comment, updated_at }
export function getDocumentChecklist() {
  return apiClient.get('/students/me/checklist/');
}

// POST a replacement/initial file for a single checklist item.
// Uses multipart/form-data since we're sending a binary File object.
export function uploadDocument(documentId, file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post(`/students/me/checklist/${documentId}/upload/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// PATCH the student's High School tracking flag.
export function updateHighSchoolTracking(isEnabled) {
  return apiClient.patch('/students/me/', { is_high_school_track: isEnabled });
}