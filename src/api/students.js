// =============================================================================
// src/api/students.js  (REWRITTEN to delegate to client.js)
// -----------------------------------------------------------------------------
// This file no longer talks to Axios directly. Every call below wraps an
// already-verified function exported from client.js — that's the single
// source of truth for endpoint paths, HTTP methods, and payload shapes
// (e.g. the upload field is `file_attachment` via PATCH, not `file` via
// POST — that mismatch in the previous version of this file would have
// silently broken every document upload).
//
// StudentDashboard.jsx does NOT need to change — every exported function
// name and return shape below is unchanged from before.
// =============================================================================

import {
  getMyProfile,
  updateMyProfile,
  getUniversities as getUniversitiesRaw,
  getApplications,
  createApplication,
  submitApplication,
  getDocumentChecklist as getDocumentChecklistRaw,
  uploadDocument as uploadDocumentRaw,
} from './client';
import { normalizeList } from './utils';

// Private helper: fetch the logged-in student's own application record.
// Assumes GET /applications/ is scoped server-side to return only the
// requesting student's own application(s), and that a student has at most
// one active application (confirmed with you — one at a time).
async function getMyApplication() {
  const response = await getApplications();
  const list = Array.isArray(response.data) ? response.data : response.data.results ?? [];
  return list[0] ?? null;
}

export function getStudentProfile() {
  return getMyProfile();
}

export async function getApplicationProgress() {
  const application = await getMyApplication();
  return {
    data: {
      status: application ? application.status : 'DRAFT',
      applicationId: application?.id ?? null,
      universityName: application?.university_name ?? application?.university?.name ?? null,
    },
  };
}

// GET a paginated slice of the university catalog, normalized to always
// return { results, count } regardless of whether the backend paginates.
export async function getUniversities(params) {
  const response = await getUniversitiesRaw(params);
  const { results, count } = normalizeList(response.data);
  return { data: { results, count } };
}

export async function getDocumentChecklist() {
  const application = await getMyApplication();
  if (!application) return { data: [] };
  return getDocumentChecklistRaw(application.id);
}

// Delegates straight to client.js's uploadDocument — which correctly PATCHes
// with a `file_attachment` field, matching your real DocumentUploadView.
export function uploadDocument(documentId, file) {
  return uploadDocumentRaw(documentId, file);
}

export function updateHighSchoolTracking(isEnabled) {
  return updateMyProfile({ is_high_school_track: isEnabled });
}

// Implements the approved "Select University -> Create Application" flow:
// create a DRAFT application, then immediately submit it.
//
// CONFIRMED against applications/models.py: the foreign key field on
// Application is `destination_university`, not `university`. This was
// wrong in the previous version of this file and would have 400'd on
// every single application attempt — thanks for pasting the model.
export async function applyToUniversity(universityId) {
  const createResponse = await createApplication({ destination_university: universityId });
  const applicationId = createResponse.data.id;
  const submitResponse = await submitApplication(applicationId);
  return submitResponse.data ?? createResponse.data;
}