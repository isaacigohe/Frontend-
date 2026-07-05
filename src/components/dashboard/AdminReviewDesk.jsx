// =============================================================================
// AdminReviewDesk.jsx
// -----------------------------------------------------------------------------
// PHASE 4a — GlobalScholar Admin (HOME_ADMIN) Review Split-Panel Desk
//
// Two-panel layout:
//   LEFT  — a dense, paginated, filterable queue of applications awaiting
//           review (StatusFilter + search box, 10 rows/page).
//   RIGHT — a document inspection viewer for whichever application row is
//           currently selected: every submitted document, its status, a
//           "View" link to the file, and per-document VERIFY / FLAG actions,
//           plus application-level APPROVE / REJECT actions.
//
// SAFETY GUARDRAIL (rule 3): any action that records a negative outcome —
// rejecting the whole application, or flagging a single document as
// ACTION_REQUIRED — routes through the <ReasonGate> component below. That
// component renders a textarea + a Confirm button, and the Confirm button's
// `disabled` prop is wired directly to `comment.trim().length === 0`. There
// is no code path that can submit a rejection/flag with an empty reason —
// the button is inert until the admin types something real.
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Inbox,
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  Send,
  Plus,
  Lock,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { CustomDropdown, Badge, PaginationFooter, LoadingRow, EmptyState, documentTypeLabel, LANGUAGE_CHOICES } from './shared/DashboardUI';
import {
  getApplicationQueue,
  getApplicationDetail,
  verifyDocument,
  flagDocument,
  approveApplication,
  rejectApplication,
  registerUniversity,
  FORWARD_TRANSITIONS,
} from '../../api/admin';

const PAGE_SIZE = 10;
const STATUS_FILTER_OPTIONS = ['All Statuses', 'SUBMITTED', 'UNDER_REVIEW', 'COMPLIANCE_PHASE', 'APPROVED', 'REJECTED'];

// Maps an application/document status string to a Badge `tone`. Centralized
// here so both the queue table and the inspection panel render identical
// colors for the identical status value.
function toneForStatus(status) {
  switch (status) {
    case 'APPROVED':
    case 'VERIFIED':
      return 'emerald';
    case 'REJECTED':
    case 'ACTION_REQUIRED':
      return 'red';
    case 'UNDER_REVIEW':
    case 'AWAITING_REVIEW':
      return 'amber';
    case 'COMPLIANCE_PHASE':
      return 'orange';
    default:
      return 'slate';
  }
}

// -----------------------------------------------------------------------------
// ReasonGate — the reusable safety-guardrail widget.
// -----------------------------------------------------------------------------
// Renders a bordered comment box + a Confirm button. `onConfirm` only ever
// fires with a trimmed, non-empty string, because the button that calls it
// is disabled whenever `isValid` is false. `isSubmitting` is passed in from
// the parent so the button also locks while the network request for the
// PREVIOUS confirm click is still in flight, preventing a double-submit.
function ReasonGate({ label, confirmLabel, tone, onConfirm, onCancel, isSubmitting }) {
  const [comment, setComment] = useState('');

  // This is the entire guardrail: a plain boolean derived from state on
  // every render. No timers, no separate "armed" flag to fall out of sync —
  // if the trimmed string is empty, the button is disabled, full stop.
  const isValid = comment.trim().length > 0;

  return (
    <div className={`border ${tone === 'red' ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'} p-3 rounded-none`}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">{label}</label>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={3}
        placeholder="Describe exactly what the student must correct…"
        className="w-full resize-none border border-slate-300 bg-white p-2 text-sm text-slate-800 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
      />
      <div className="mt-2 flex items-center justify-between">
        {/* Inline hint that disappears once the textarea becomes valid —
            tells the admin exactly why the Confirm button is greyed out. */}
        {!isValid && <span className="text-[11px] font-medium text-slate-500">A description is required to submit.</span>}
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 rounded-none hover:border-slate-400"
          >
            Cancel
          </button>
          <button
            type="button"
            // THE GUARDRAIL: disabled whenever the trimmed comment is empty
            // OR a submission from this gate is already in flight.
            disabled={!isValid || isSubmitting}
            onClick={() => onConfirm(comment.trim())}
            className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-none disabled:cursor-not-allowed disabled:opacity-40 ${
              tone === 'red'
                ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
                : 'border-amber-600 bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// LEFT PANEL — Applicant Review Queue
// -----------------------------------------------------------------------------
function ApplicantQueue({ selectedId, onSelect }) {
  const [applications, setApplications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchInput, setSearchInput] = useState(''); // the raw <input> value, updates every keystroke
  const [searchQuery, setSearchQuery] = useState(''); // the debounced value actually sent to the API
  const [isLoading, setIsLoading] = useState(true);

  // Debounce the search box: wait 400ms after the admin stops typing before
  // updating `searchQuery` (and therefore firing a network request). Without
  // this, every keystroke would fire its own API call.
  useEffect(() => {
    const timeoutId = setTimeout(() => setSearchQuery(searchInput), 400);
    // If the admin types again before 400ms elapses, this cleanup cancels
    // the previous timer so only the LAST keystroke's timer ever fires.
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page };
      if (statusFilter !== 'All Statuses') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const response = await getApplicationQueue(params);
      setApplications(response.data.results);
      setTotalCount(response.data.count);
    } catch (err) {
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Any filter change resets to page 1, same reasoning as the Phase 3
  // catalog: staying on a deep page of a newly-narrowed result set risks
  // landing on an empty page.
  function handleStatusChange(value) {
    setStatusFilter(value);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <section className="flex h-full flex-col border border-slate-200 bg-white shadow-sm rounded-none">
      <div className="space-y-3 border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Applicant Review Queue</h2>
        </div>
        <div className="flex gap-2">
          {/* Search box — filters by student or university name server-side. */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search student or university…"
              className="w-full border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm text-slate-800 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
          <CustomDropdown value={statusFilter} options={STATUS_FILTER_OPTIONS} onChange={handleStatusChange} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingRow label="Loading queue…" />
        ) : applications.length === 0 ? (
          <EmptyState label="No applications match the current filters." />
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">University</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => onSelect(app.id)}
                  className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                    selectedId === app.id ? 'bg-slate-100' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{app.student_name}</td>
                  <td className="px-4 py-3 text-slate-600">{app.university_name}</td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(app.status)}>{app.status.replace(/_/g, ' ')}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PaginationFooter page={page} totalPages={totalPages} onPageChange={setPage} />
    </section>
  );
}

// -----------------------------------------------------------------------------
// RIGHT PANEL — Document Inspection Viewer
// -----------------------------------------------------------------------------
function DocumentInspector({ applicationId, onApplicationMutated }) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // `activeGate` tracks which guardrail box (if any) is currently open, and
  // for which target. Only one ReasonGate can be open at a time across the
  // whole panel — this keeps the review flow linear and prevents the admin
  // from accidentally firing two contradictory actions at once.
  //   { type: 'REJECT_APPLICATION' } | { type: 'FLAG_DOCUMENT', documentId } | null
  const [activeGate, setActiveGate] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!applicationId) return;
    setIsLoading(true);
    setActiveGate(null); // switching applications always closes any open gate
    try {
      const response = await getApplicationDetail(applicationId);
      setDetail(response.data);
    } catch (err) {
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  // Re-fetch every time the SELECTED application id changes (i.e. the admin
  // clicks a different row in the left panel).
  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // -- Document-level actions -------------------------------------------------
  async function handleVerifyDocument(documentId) {
    setActionError(null);
    try {
      await verifyDocument(documentId);
      await fetchDetail(); // re-pull so the badge flips to VERIFIED immediately
    } catch (err) {
      setActionError('Could not verify the document. Please retry.');
    }
  }

  // Called by ReasonGate's onConfirm — comment is guaranteed non-empty here.
  async function handleFlagDocument(documentId, comment) {
    setIsSubmittingAction(true);
    setActionError(null);
    try {
      await flagDocument(documentId, comment);
      setActiveGate(null);
      await fetchDetail();
    } catch (err) {
      setActionError('Could not flag the document. Please retry.');
    } finally {
      setIsSubmittingAction(false);
    }
  }

  // -- Application-level actions ----------------------------------------------
  // FIXED BUG: this used to always send a hardcoded 'COMPLIANCE_PHASE'
  // target regardless of the application's actual current status. That's
  // exactly what broke Approve on a SUBMITTED application — your backend's
  // transition table only allows SUBMITTED -> UNDER_REVIEW, and rejected
  // the invalid SUBMITTED -> COMPLIANCE_PHASE jump with a 400, which the
  // old catch block flattened into a generic "please retry" message. Now
  // we pass `detail.status` (the application's REAL current status) into
  // approveApplication(), which looks up the one valid next stage from the
  // confirmed FORWARD_TRANSITIONS table.
  async function handleApprove() {
    setActionError(null);
    try {
      await approveApplication(applicationId, detail.status);
      await fetchDetail();
      if (onApplicationMutated) onApplicationMutated();
    } catch (err) {
      // Surface the backend's real validation message when available,
      // instead of a generic string that hides what actually went wrong.
      const backendMessage = err?.response?.data?.status?.[0] || err?.response?.data?.detail;
      setActionError(backendMessage || 'Could not advance the application. Please retry.');
    }
  }

  async function handleReject(comment) {
    setIsSubmittingAction(true);
    setActionError(null);
    try {
      await rejectApplication(applicationId, comment);
      setActiveGate(null);
      await fetchDetail();
      if (onApplicationMutated) onApplicationMutated();
    } catch (err) {
      setActionError('Could not reject the application. Please retry.');
    } finally {
      setIsSubmittingAction(false);
    }
  }

  // --- Empty / loading states --------------------------------------------
  if (!applicationId) {
    return (
      <section className="flex h-full flex-col items-center justify-center gap-2 border border-slate-200 bg-white shadow-sm rounded-none p-10 text-center">
        <FileText className="h-6 w-6 text-slate-300" />
        <p className="text-sm text-slate-400">Select an applicant from the queue to inspect their documents.</p>
      </section>
    );
  }

  if (isLoading || !detail) {
    return (
      <section className="flex h-full flex-col border border-slate-200 bg-white shadow-sm rounded-none">
        <LoadingRow label="Loading application detail…" />
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col border border-slate-200 bg-white shadow-sm rounded-none">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            {/* CONFIRMED: the retrieve/detail serializer (ApplicationSerializer)
                does NOT expose flat student_name/university_name — those only
                exist on the LIST serializer. Detail nests student_detail /
                university_detail instead. We try the nested shape first and
                fall back to a flat field in case your UserPublicSerializer /
                UniversityListSerializer use a different name than assumed
                (full_name vs name) — update the fallback chain here if the
                header still shows blank. */}
            <h2 className="text-sm font-bold text-slate-900">
              {detail.student_detail?.full_name ?? detail.student_detail?.name ?? detail.student_name ?? 'Student'}
            </h2>
            <p className="text-xs text-slate-500">
              {detail.university_detail?.name ?? detail.university_name ?? 'University'}
            </p>
          </div>
          <Badge tone={toneForStatus(detail.status)}>{detail.status.replace(/_/g, ' ')}</Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {actionError && (
          <div className="mb-3 flex items-center gap-2 border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 rounded-none">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {actionError}
          </div>
        )}

        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Submitted Documents</h3>
        <div className="space-y-2">
          {detail.documents.map((doc) => (
            <div key={doc.id} className="border border-slate-200 p-3 rounded-none">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  {/* CONFIRMED: DocumentChecklist has no document_name field —
                      only a document_type CODE. documentTypeLabel() maps it
                      to the exact label from the Django model's TextChoices. */}
                  <span className="text-sm font-medium text-slate-800">{documentTypeLabel(doc.document_type)}</span>
                  {/* CONFIRMED: the real field is verification_status — the
                      model has no `status` field at all. */}
                  <Badge tone={toneForStatus(doc.verification_status)}>{doc.verification_status.replace(/_/g, ' ')}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {/* file_attachment is null until the student uploads —
                      only render View once there's something to view. */}
                  {doc.file_attachment && (
                    <a
                      href={doc.file_attachment}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-900"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleVerifyDocument(doc.id)}
                    className="flex items-center gap-1 border border-emerald-600 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 rounded-none hover:bg-emerald-50"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verify
                  </button>
                  <button
                    type="button"
                    // Opens the guardrail for THIS document. Note this does
                    // not itself change any status — it only reveals the
                    // ReasonGate, which is the only thing that can submit.
                    onClick={() => setActiveGate({ type: 'FLAG_DOCUMENT', documentId: doc.id })}
                    className="flex items-center gap-1 border border-red-600 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 rounded-none hover:bg-red-50"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Flag
                  </button>
                </div>
              </div>

              {/* Prior admin_comment stays visible even outside the gate,
                  so the reviewer can see what was previously flagged. */}
              {doc.verification_status === 'ACTION_REQUIRED' && doc.admin_comment && activeGate?.documentId !== doc.id && (
                <p className="mt-2 border-l-2 border-red-400 pl-2 text-xs text-slate-600">{doc.admin_comment}</p>
              )}

              {/* The guardrail box itself — only mounted for the document
                  whose id matches activeGate.documentId. */}
              {activeGate?.type === 'FLAG_DOCUMENT' && activeGate.documentId === doc.id && (
                <div className="mt-3">
                  <ReasonGate
                    label="Reason this document requires action"
                    confirmLabel="Submit Flag"
                    tone="red"
                    isSubmitting={isSubmittingAction}
                    onCancel={() => setActiveGate(null)}
                    onConfirm={(comment) => handleFlagDocument(doc.id, comment)}
                  />
                </div>
              )}
            </div>
          ))}
          {detail.documents.length === 0 && <EmptyState label="No documents submitted yet." />}
        </div>
      </div>

      {/* Application-level action bar, pinned to the bottom of the panel.
          APPROVED and REJECTED are terminal states in your transition table
          (both map to an empty array of allowed next statuses) — there is
          nothing a valid Approve/Reject click could do from here, so the
          bar is replaced with a plain finalized notice instead of buttons
          that would just 400 if clicked. */}
      <div className="border-t border-slate-200 p-4">
        {detail.status === 'APPROVED' || detail.status === 'REJECTED' ? (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Lock className="h-3.5 w-3.5" />
            This application is finalized ({detail.status.replace(/_/g, ' ')}) — no further action possible.
          </div>
        ) : activeGate?.type === 'REJECT_APPLICATION' ? (
          <ReasonGate
            label="Reason for rejecting this application"
            confirmLabel="Confirm Rejection"
            tone="red"
            isSubmitting={isSubmittingAction}
            onCancel={() => setActiveGate(null)}
            onConfirm={handleReject}
          />
        ) : (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveGate({ type: 'REJECT_APPLICATION' })}
              className="flex items-center gap-1.5 border border-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-700 rounded-none hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="flex items-center gap-1.5 border border-slate-800 bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white rounded-none hover:bg-slate-900"
            >
              <ArrowRight className="h-4 w-4" />
              {/* Dynamic label: shows the REAL next stage this click will
                  move to, computed from the same table admin.js uses to
                  build the request — so the button never promises a
                  transition the backend won't actually accept. */}
              Advance to {(FORWARD_TRANSITIONS[detail.status] || 'Next Stage').replace(/_/g, ' ')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// RegisterUniversityPanel — inline slide-down form (same pattern as
// ReasonGate) for an admin to register a new partner university directly
// from the review desk.
// -----------------------------------------------------------------------------
// CONFIRMED against universities/models.py (previously a guess):
//   - `name`, `country` are required (no blank=True on the model).
//   - `minimum_gpa` is REQUIRED (DecimalField with no null/blank) — this was
//     already right by luck. Client-side validation now enforces it too.
//   - There is NO `languages_offered` field. The real field is
//     `primary_language`, a closed enum (see LANGUAGE_CHOICES) — rendered as
//     a dropdown instead of free text so it's impossible to submit a value
//     the backend doesn't recognize.
//   - `city` and `website` are optional (blank=True, default "").
//   - `language_test_required` (bool) and `minimum_language_score` (only
//     meaningful when the checkbox is on) are optional extras included for
//     completeness since they exist and are simple to set correctly.
//   - `travel_advisory_level` / `advisory_last_updated` are NOT submitted —
//     confirmed read_only on the serializer (scraper-populated only).
function RegisterUniversityPanel({ isOpen, onClose, onRegistered }) {
  const [formValues, setFormValues] = useState({
    name: '',
    country: '',
    city: '',
    website: '',
    minimum_gpa: '',
    primary_language: 'English',
    language_test_required: false,
    minimum_language_score: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(field, value) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }

  // Required per the model: name, country, minimum_gpa (0.00-4.00, enforced
  // server-side too by UniversitySerializer.validate_minimum_gpa).
  const gpaValue = Number(formValues.minimum_gpa);
  const isGpaValid = formValues.minimum_gpa !== '' && gpaValue >= 0 && gpaValue <= 4.0;
  const isValid = formValues.name.trim().length > 0 && formValues.country.trim().length > 0 && isGpaValid;

  async function handleSubmit() {
    if (!isValid) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: formValues.name.trim(),
        country: formValues.country.trim(),
        city: formValues.city.trim() || '',
        website: formValues.website.trim() || '',
        minimum_gpa: gpaValue,
        primary_language: formValues.primary_language,
        language_test_required: formValues.language_test_required,
        minimum_language_score: formValues.language_test_required && formValues.minimum_language_score
          ? Number(formValues.minimum_language_score)
          : null,
      };
      await registerUniversity(payload);
      setFormValues({
        name: '',
        country: '',
        city: '',
        website: '',
        minimum_gpa: '',
        primary_language: 'English',
        language_test_required: false,
        minimum_language_score: '',
      });
      if (onRegistered) onRegistered();
      onClose();
    } catch (err) {
      const responseData = err?.response?.data;
      const firstKey = responseData && typeof responseData === 'object' ? Object.keys(responseData)[0] : null;
      const firstValue = firstKey ? responseData[firstKey] : null;
      setError(Array.isArray(firstValue) ? firstValue[0] : 'Could not register the university. Check required fields.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="mb-6 border border-slate-300 bg-white p-4 shadow-sm rounded-none">
      <div className="mb-3 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Register New University</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          value={formValues.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="University name *"
          className="border border-slate-300 px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        <input
          value={formValues.country}
          onChange={(e) => handleChange('country', e.target.value)}
          placeholder="Country *"
          className="border border-slate-300 px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        <input
          value={formValues.city}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="City"
          className="border border-slate-300 px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        <input
          value={formValues.website}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="Website URL"
          className="border border-slate-300 px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        <div>
          <input
            value={formValues.minimum_gpa}
            onChange={(e) => handleChange('minimum_gpa', e.target.value)}
            placeholder="Minimum GPA * (0.00-4.00)"
            type="number"
            step="0.01"
            min="0"
            max="4"
            className={`w-full border px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400 ${
              formValues.minimum_gpa && !isGpaValid ? 'border-red-400' : 'border-slate-300'
            }`}
          />
          {formValues.minimum_gpa && !isGpaValid && <p className="mt-1 text-[11px] text-red-600">Must be between 0.00 and 4.00.</p>}
        </div>
        {/* Real enum dropdown — CONFIRMED against University.Language. A
            free-text field here could submit a value the backend rejects;
            a closed select cannot. */}
        <select
          value={formValues.primary_language}
          onChange={(e) => handleChange('primary_language', e.target.value)}
          className="border border-slate-300 bg-white px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
        >
          {LANGUAGE_CHOICES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        <input
          type="checkbox"
          checked={formValues.language_test_required}
          onChange={(e) => handleChange('language_test_required', e.target.checked)}
        />
        Language test required
      </label>
      {formValues.language_test_required && (
        <input
          value={formValues.minimum_language_score}
          onChange={(e) => handleChange('minimum_language_score', e.target.value)}
          placeholder="Minimum language test score"
          type="number"
          step="0.01"
          className="mt-2 w-64 border border-slate-300 px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
      )}

      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 rounded-none hover:border-slate-400"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!isValid || isSubmitting}
          onClick={handleSubmit}
          className="flex items-center gap-1.5 border border-slate-800 bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white rounded-none hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Register University
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TOP-LEVEL: AdminReviewDesk
// -----------------------------------------------------------------------------
export default function AdminReviewDesk() {
  // The single piece of state that ties the two panels together: which
  // application row is currently selected in the left queue. Lifting it up
  // to this parent is what lets clicking a row on the left drive what
  // renders on the right — classic "lift state up" React pattern.
  const [selectedId, setSelectedId] = useState(null);

  // Bumping this counter forces ApplicantQueue's effect to re-fire (via a
  // `key` prop below) after an approve/reject mutates the queue's underlying
  // data, so the left panel's status column stays in sync with actions
  // taken in the right panel.
  const [queueRefreshToken, setQueueRefreshToken] = useState(0);

  // Whether the Register University panel is expanded.
  const [isRegisterPanelOpen, setIsRegisterPanelOpen] = useState(false);

  return (
    <div className="bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Admin Review Desk</h1>
            <p className="text-xs text-slate-500">Inspect submitted documents and progress or reject applications.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsRegisterPanelOpen((prev) => !prev)}
            className="flex items-center gap-1.5 border border-slate-800 bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white rounded-none hover:bg-slate-900"
          >
            <Plus className="h-3.5 w-3.5" />
            Register University
          </button>
        </header>

        <RegisterUniversityPanel
          isOpen={isRegisterPanelOpen}
          onClose={() => setIsRegisterPanelOpen(false)}
          onRegistered={() => setQueueRefreshToken((n) => n + 1)}
        />

        {/* Fixed-height split panel: grid with two columns on large screens,
            stacked on small screens. h-[75vh] gives both panels their own
            independent internal scroll area (overflow-y-auto inside each). */}
        <div className="grid h-[75vh] grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <ApplicantQueue key={queueRefreshToken} selectedId={selectedId} onSelect={setSelectedId} />
          <DocumentInspector applicationId={selectedId} onApplicationMutated={() => setQueueRefreshToken((n) => n + 1)} />
        </div>
      </div>
    </div>
  );
}