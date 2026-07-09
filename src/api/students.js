// =============================================================================
// src/api/students.js
// -----------------------------------------------------------------------------
// Student API calls - supports multiple applications per student.
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
  getUniversityPrograms,
} from './client';
import { normalizeList } from './utils';

// ── Get student profile ──────────────────────────────────────────────────────
export function getStudentProfile() {
  return getMyProfile();
}

// ── Get ALL applications for the logged-in student ─────────────────────────
export async function getStudentApplications() {
  const response = await getApplications();
  const list = Array.isArray(response.data) ? response.data : response.data.results ?? [];
  return list;
}

// ── Get application progress (first application - used by dashboard header) ─
export async function getApplicationProgress() {
  const applications = await getStudentApplications();
  const firstApp = applications[0] || null;
  return {
    data: {
      status: firstApp ? firstApp.status : 'DRAFT',
      applicationId: firstApp?.id ?? null,
      universityName: firstApp?.university_name ?? firstApp?.destination_university?.name ?? null,
      totalApplications: applications.length,
      applications: applications,
    },
  };
}

// ── Get universities catalog ────────────────────────────────────────────────
export async function getUniversities(params) {
  const response = await getUniversitiesRaw(params);
  const { results, count } = normalizeList(response.data);
  return { data: { results, count } };
}

// ── Get programs for a specific university ──────────────────────────────────
export async function getUniversityProgramsList(universityId) {
  const response = await getUniversityPrograms(universityId);
  return response.data;
}

// ── Create application for a specific program ───────────────────────────────
export async function applyToProgram(universityId, programId) {
  const payload = {
    destination_university: universityId,
    program: programId,
    status: 'DRAFT',
  };
  const createResponse = await createApplication(payload);
  const applicationId = createResponse.data.id;
  // Submit immediately so it moves to SUBMITTED
  const submitResponse = await submitApplication(applicationId);
  return submitResponse.data ?? createResponse.data;
}

// ── Create application for a university (without program) ───────────────────
export async function applyToUniversity(universityId) {
  const payload = {
    destination_university: universityId,
    status: 'DRAFT',
  };
  const createResponse = await createApplication(payload);
  const applicationId = createResponse.data.id;
  const submitResponse = await submitApplication(applicationId);
  return submitResponse.data ?? createResponse.data;
}

// ── Document checklist ──────────────────────────────────────────────────────
export async function getDocumentChecklist() {
  const applications = await getStudentApplications();
  const activeApp = applications.find((app) => app.status === 'COMPLIANCE_PHASE');
  if (!activeApp) return { data: [] };
  return getDocumentChecklistRaw(activeApp.id);
}

// ── Upload document ─────────────────────────────────────────────────────────
export function uploadDocument(documentId, file) {
  return uploadDocumentRaw(documentId, file);
}

// ── High School tracking ────────────────────────────────────────────────────
export function updateHighSchoolTracking(isEnabled) {
  return updateMyProfile({ is_high_school_track: isEnabled });
}

// ── Get a specific application by ID ────────────────────────────────────────
export async function getApplicationById(applicationId) {
  const applications = await getStudentApplications();
  return applications.find((app) => app.id === applicationId) || null;
}

// ── Check if a student has already applied to a specific program ────────────
export async function hasAppliedToProgram(programId) {
  const applications = await getStudentApplications();
  return applications.some((app) => app.program === programId);
}

// ── Get applications grouped by university ──────────────────────────────────
export async function getApplicationsByUniversity() {
  const applications = await getStudentApplications();
  const grouped = {};
  applications.forEach((app) => {
    const uniName = app.university_name || app.destination_university?.name || 'Unknown';
    if (!grouped[uniName]) {
      grouped[uniName] = {
        universityId: app.destination_university,
        universityName: uniName,
        applications: [],
      };
    }
    grouped[uniName].applications.push(app);
  });
  return Object.values(grouped);
}