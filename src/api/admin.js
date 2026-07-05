// =============================================================================
// src/api/admin.js  (CORRECTED against your real models.py / serializers.py)
// -----------------------------------------------------------------------------
// Three confirmed field-name/value bugs fixed here:
//   1. GET /applications/<id>/ already nests the full checklist as
//      `document_checklist` (see ApplicationSerializer) — no second network
//      call needed. The old version fired a redundant GET /documents/ call.
//   2. DocumentChecklist has NO `status` field. The real field is
//      `verification_status`, and there is no `VERIFIED` value in its
//      choices — the "document approved" value is `APPROVED`.
//   3. Application-level rejection uses `rejection_reason` (confirmed on
//      the Application model and enforced by ApplicationSerializer's
//      `_validate_status_transition`). `admin_comment` only exists on
//      DocumentChecklist, for flagging an individual document — these are
//      two different fields on two different models, not interchangeable.
//
// AdminReviewDesk.jsx's DocumentInspector needed matching updates for the
// nested student_detail/university_detail fields and doc.verification_status
// — see that file's own comments.
// =============================================================================

import { getApplications, getApplication, reviewDocument, advanceApplication, createUniversity } from './client';
import { normalizeList } from './utils';

// CONFIRMED against ApplicationSerializer._validate_status_transition — this
// is the exact linear pipeline your backend enforces. Mirroring it here lets
// the frontend always send a status transition your backend will actually
// accept, instead of guessing/hardcoding one fixed target (which is exactly
// what broke "Approve" on a SUBMITTED application: the old code always sent
// COMPLIANCE_PHASE, which is only valid from UNDER_REVIEW).
export const FORWARD_TRANSITIONS = {
  SUBMITTED: 'UNDER_REVIEW',
  UNDER_REVIEW: 'COMPLIANCE_PHASE',
  COMPLIANCE_PHASE: 'APPROVED',
};

export async function getApplicationQueue(params) {
  const response = await getApplications(params);
  const { results, count } = normalizeList(response.data);
  return { data: { results, count } };
}

// The detail/retrieve serializer (ApplicationSerializer) already embeds the
// full document_checklist array — we just relabel it to `documents` so
// DocumentInspector's existing `detail.documents.map(...)` keeps working
// without needing to touch that component's JSX.
export async function getApplicationDetail(applicationId) {
  const response = await getApplication(applicationId);
  return { data: { ...response.data, documents: response.data.document_checklist ?? [] } };
}

// verification_status: 'APPROVED' is the real "this document is good" value
// on DocumentChecklist — there is no 'VERIFIED' in its choices.
export function verifyDocument(documentId) {
  return reviewDocument(documentId, { verification_status: 'APPROVED' });
}

export function flagDocument(documentId, comment) {
  return reviewDocument(documentId, { verification_status: 'ACTION_REQUIRED', admin_comment: comment });
}

// FIXED: takes the application's CURRENT status and looks up the one valid
// forward transition, rather than accepting/assuming a target status from
// the caller. This is what makes Approve work correctly regardless of which
// stage the application is currently sitting in.
export function approveApplication(applicationId, currentStatus) {
  const nextStatus = FORWARD_TRANSITIONS[currentStatus];
  return advanceApplication(applicationId, nextStatus ? { status: nextStatus } : {});
}

// rejection_reason (NOT admin_comment) is the field ApplicationSerializer's
// _validate_status_transition actually requires when status -> REJECTED.
export function rejectApplication(applicationId, comment) {
  return advanceApplication(applicationId, { status: 'REJECTED', rejection_reason: comment });
}

// NEW: registers a University entity. ASSUMPTION FLAGGED — I have not seen
// universities/models.py or its serializer, so these field names are a
// best-effort guess based on what the Application model's clean() method
// references (university.minimum_gpa) and what the public catalog displays
// (name, country, languages_offered). If POST /universities/ 400s, paste me
// the error body and I'll correct the field names in one place.
export function registerUniversity(payload) {
  return createUniversity(payload);
}