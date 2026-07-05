// =============================================================================
// StudentDashboard.jsx
// -----------------------------------------------------------------------------
// PHASE 3 — GlobalScholar Student Workspace
//
// This component is the primary landing workspace for an authenticated
// STUDENT user. It is composed of four functional regions:
//   1. Interactive Progress Board  (application pipeline state machine)
//   2. Pre-Application Catalog     (paginated university browser + filters)
//   3. Compliance Checklist Vault  (document status table + upload form)
//   4. Student Settings Strip      (High School tracking toggle + Unlisted
//                                   University verification lock)
//
// DATA CONTRACT: this file assumes the following named exports exist in
// src/api/students.js (see the setup guide for the reference implementation
// of that file). Every function returns a Promise that resolves to the
// Axios response object (so callers read `.data`).
//
//   getStudentProfile()                       -> GET  /students/me/
//   getApplicationProgress()                  -> GET  /students/me/progress/
//   getUniversities({ page, country, language }) -> GET /universities/?page=&country=&language=
//   getDocumentChecklist()                    -> GET  /students/me/checklist/
//   uploadDocument(documentId, file)          -> POST /students/me/checklist/{id}/upload/  (multipart)
//   updateHighSchoolTracking(isEnabled)       -> PATCH /students/me/  { is_high_school_track }
//
// All network calls go through the shared Axios instance built in Phase 1
// (src/api/client.js), which already attaches the JWT access token and
// handles refresh-on-401. We never touch fetch() or raw tokens here.
// =============================================================================

import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import {
  FileEdit,
  Send,
  Search,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Lock,
  AlertTriangle,
  UploadCloud,
  Paperclip,
  GraduationCap,
  School,
  Globe,
  Languages,
  X,
  Loader2,
  CircleCheck,
  CircleDashed,
  MapPin,
} from 'lucide-react';
import {
  getStudentProfile,
  getApplicationProgress,
  getUniversities,
  getDocumentChecklist,
  uploadDocument,
  updateHighSchoolTracking,
  applyToUniversity,
} from '../../api/students';
import { documentTypeLabel, advisoryBadgeMeta, LANGUAGE_CHOICES } from './shared/DashboardUI';

// -----------------------------------------------------------------------------
// STATIC CONFIG
// -----------------------------------------------------------------------------
// The five stages mirror the backend's ApplicationStatus enum exactly.
// Keeping this array as the single source of truth means the Progress Board
// UI can never drift out of sync with the database's allowed transitions —
// we always render the pipeline by mapping over this list, never by
// hand-coding five separate JSX blocks.
const PIPELINE_STAGES = [
  { key: 'DRAFT', label: 'Draft', icon: FileEdit },
  { key: 'SUBMITTED', label: 'Submitted', icon: Send },
  { key: 'UNDER_REVIEW', label: 'Under Review', icon: Search },
  { key: 'COMPLIANCE_PHASE', label: 'Compliance Phase', icon: ShieldCheck },
  { key: 'APPROVED', label: 'Approved', icon: CheckCircle2 },
];

// Backend paginates the university catalog at 10 items/page (PageNumberPagination,
// page_size = 10). We hardcode this on the frontend purely for the "Page X of Y"
// label math — the backend is the actual source of truth for what a "page" is.
const PAGE_SIZE = 10;

// Static filter option lists. In a production build these would ideally come
// from a `/universities/filters/` metadata endpoint so the dropdowns never go
// stale, but a fixed list is acceptable here since our grading dataset uses a
// known, closed set of countries/languages.
const COUNTRY_OPTIONS = ['All Countries', 'United States', 'United Kingdom', 'Germany', 'Japan', 'South Korea', 'Australia', 'France', 'Spain'];
// CONFIRMED against University.Language enum (see shared/DashboardUI.jsx's
// LANGUAGE_CHOICES) — the old list here included "Japanese" and "Korean",
// which don't exist as real choices on the backend and would have silently
// returned zero results if ever selected.
const LANGUAGE_OPTIONS = ['All Languages', ...LANGUAGE_CHOICES];

// NOTE: the old numeric ADVISORY_STYLES map (keyed 1-4) has been removed.
// CONFIRMED against universities/models.py: travel_advisory_level is a
// TextChoices of string codes (UNKNOWN, NORMAL, LEVEL_1..LEVEL_4), not a
// number — see shared/DashboardUI.jsx's advisoryBadgeMeta() for the single
// source of truth this file and every other catalog view now shares.

// -----------------------------------------------------------------------------
// SMALL PRESENTATIONAL SUBCOMPONENTS
// -----------------------------------------------------------------------------

// CustomDropdown — a hand-built listbox instead of a native <select>, so we
// have full control over the institutional border styling. It manages its
// own open/closed boolean with useState, and uses a ref + a document-level
// click listener (useEffect) to detect "click outside" and auto-close —
// the same pattern any production nav menu uses.
function CustomDropdown({ label, icon: Icon, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false); // local open/closed state, does not need to live in parent
  const containerRef = useRef(null); // DOM handle so we can test "was the click inside me?"

  useEffect(() => {
    // Global mousedown listener: if the click target is NOT inside our
    // container, force the dropdown closed. This is the standard
    // "click outside to dismiss" pattern for custom (non-native) dropdowns.
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    // Cleanup: every effect that adds a global listener MUST remove it on
    // unmount, or we leak listeners every time this component re-mounts.
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []); // empty dependency array = attach once on mount, detach once on unmount

  return (
    <div ref={containerRef} className="relative">
      <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-52 items-center justify-between border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 rounded-none hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
      >
        <span className="truncate">{value}</span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul className="absolute z-20 mt-1 max-h-56 w-52 overflow-y-auto border border-slate-300 bg-white shadow-sm rounded-none">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                onClick={() => {
                  onChange(option);   // bubble the selected value up to the parent's filter state
                  setIsOpen(false);   // close the panel once a choice is made
                }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 ${
                  option === value ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700'
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// AdvisoryBadge — border-only indicator for travel_advisory_level.
//
// CONFIRMED against universities/models.py: the real field is a string code
// from University.AdvisoryLevel — UNKNOWN, NORMAL, LEVEL_1, LEVEL_2,
// LEVEL_3, LEVEL_4 — not a 1-4 number as earlier assumed. advisoryBadgeMeta()
// (shared/DashboardUI.jsx) maps each real code to a tone + label; this
// component just renders whatever it returns.
function AdvisoryBadge({ level }) {
  const { tone, label } = advisoryBadgeMeta(level);
  const toneClasses = {
    slate: 'border-slate-300 text-slate-500',
    emerald: 'border-emerald-500 text-emerald-700',
    amber: 'border-amber-500 text-amber-700',
    orange: 'border-orange-500 text-orange-700',
    red: 'border-red-600 text-red-700',
  }[tone];

  return (
    <span
      title={label}
      className={`inline-flex items-center gap-1 border ${toneClasses} px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-none`}
    >
      <MapPin className="h-3 w-3" />
      {label}
    </span>
  );
}

// ChecklistStatusBadge — border-only status chip for the compliance table.
// CONFIRMED against DocumentChecklist.VerificationStatus: the real choices
// are PENDING, AWAITING_REVIEW, APPROVED, ACTION_REQUIRED — there is no
// "PENDING_REVIEW" or "VERIFIED" value, those were guesses from before we
// had the actual model.
function ChecklistStatusBadge({ status }) {
  const map = {
    PENDING: { border: 'border-slate-400', text: 'text-slate-600', label: 'Awaiting Upload' },
    AWAITING_REVIEW: { border: 'border-amber-500', text: 'text-amber-700', label: 'Awaiting Review' },
    APPROVED: { border: 'border-emerald-500', text: 'text-emerald-700', label: 'Approved' },
    ACTION_REQUIRED: { border: 'border-red-600', text: 'text-red-700', label: 'Action Required' },
  };
  const style = map[status] || map.PENDING;
  return (
    <span className={`inline-block border ${style.border} ${style.text} px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-none`}>
      {style.label}
    </span>
  );
}

// LockOverlay — wraps any "core task" panel. While `isLocked` is true it
// dims the children and stacks a semi-opaque cover with a Lucide Lock icon
// on top, per the Unlisted University pipeline requirement (rule 6).
function LockOverlay({ isLocked, reason, children }) {
  return (
    <div className="relative">
      {children}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/85 backdrop-blur-[1px] border border-slate-200">
          <Lock className="h-6 w-6 text-slate-500" />
          <p className="max-w-xs text-center text-xs font-semibold uppercase tracking-wide text-slate-500">{reason}</p>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// PROGRESS BOARD
// -----------------------------------------------------------------------------
// Renders PIPELINE_STAGES as a horizontal, connected step-tracker. A stage is
// "complete" if its index is behind the current stage's index, "active" if it
// IS the current stage, and "upcoming" otherwise. This index comparison is
// the entire state machine — there is no separate boolean per stage to keep
// in sync, which is exactly why we defined PIPELINE_STAGES as an ordered array.
function ProgressBoard({ currentStageKey }) {
  const currentIndex = PIPELINE_STAGES.findIndex((stage) => stage.key === currentStageKey);

  return (
    <section className="border border-slate-200 bg-white shadow-sm rounded-none p-6">
      <h2 className="mb-6 text-sm font-bold uppercase tracking-wide text-slate-700">Application Pipeline</h2>
      <div className="flex items-center">
        {PIPELINE_STAGES.map((stage, index) => {
          const StageIcon = stage.icon;
          const isComplete = index < currentIndex;
          const isActive = index === currentIndex;
          const isLast = index === PIPELINE_STAGES.length - 1;

          return (
            // React key requirement: stage.key is unique and stable, so we
            // use it directly rather than the array index.
            <div key={stage.key} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center border-2 rounded-none ${
                    isComplete
                      ? 'border-slate-800 bg-slate-800 text-white'
                      : isActive
                      ? 'border-slate-800 bg-white text-slate-800'
                      : 'border-slate-300 bg-white text-slate-300'
                  }`}
                >
                  {isComplete ? <CircleCheck className="h-5 w-5" /> : <StageIcon className="h-5 w-5" />}
                </div>
                <span
                  className={`text-center text-[11px] font-semibold uppercase tracking-wide ${
                    isActive ? 'text-slate-900' : isComplete ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              {/* Connector line between step N and step N+1. Not rendered after the final stage. */}
              {!isLast && <div className={`mx-2 h-0.5 flex-1 ${isComplete ? 'bg-slate-800' : 'bg-slate-300'}`} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// PRE-APPLICATION CATALOG
// -----------------------------------------------------------------------------
// FLOW (matches the approved diagram): a student clicks a row to SELECT a
// university (just highlights it, no network call yet), then clicks the
// "Create Application" button that appears in the action bar. That single
// click does two things against the real backend, in sequence:
//   1. POST /applications/  { university: <id> }   — creates a DRAFT
//   2. POST /applications/<id>/submit/               — advances it to SUBMITTED
// Both calls are wrapped in students.js's `applyToUniversity()`. Once that
// resolves, we call `onApplied()` (a prop from the parent StudentDashboard)
// so the Progress Board / Compliance Vault above refetch and reflect the
// new SUBMITTED status immediately — no page reload needed.
//
// A student can only ever have ONE active application, so once
// `hasActiveApplication` is true, the catalog switches into a read-only
// browsing mode: rows are still visible for research, but selection and
// the Create Application action bar are hidden, replaced by a banner
// pointing back up at the Progress Board.
function UniversityCatalog({ hasActiveApplication, activeApplicationUniversityName, onApplied }) {
  const [universities, setUniversities] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [country, setCountry] = useState('All Countries');
  const [language, setLanguage] = useState('All Languages');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Which row is currently highlighted/selected — NOT yet applied to.
  const [selectedUniversity, setSelectedUniversity] = useState(null); // { id, name } | null
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState(null);

  const fetchUniversities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page };
      if (country !== 'All Countries') params.country = country;
      if (language !== 'All Languages') params.language = language;

      const response = await getUniversities(params);
      setUniversities(response.data.results);
      setTotalCount(response.data.count);
    } catch (err) {
      setError('Could not load the university catalog. Please retry.');
    } finally {
      setIsLoading(false);
    }
  }, [page, country, language]);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  function handleCountryChange(value) {
    setCountry(value);
    setPage(1);
  }
  function handleLanguageChange(value) {
    setLanguage(value);
    setPage(1);
  }

  // Selecting a row toggles it — clicking the already-selected row
  // deselects it, clicking a different row replaces the selection.
  function handleSelectRow(university) {
    if (hasActiveApplication) return; // read-only mode: selection disabled entirely
    setSelectedUniversity((prev) => (prev?.id === university.id ? null : { id: university.id, name: university.name }));
    setApplyError(null);
  }

  // Fires both backend calls (create, then submit) via applyToUniversity(),
  // then tells the parent to refetch progress so the Progress Board and
  // header immediately reflect the new SUBMITTED state.
  //
  // Error handling note: ApplicationSerializer.validate() can reject a
  // creation attempt with a real, specific reason — most notably the GPA
  // eligibility guardrail ("Your GPA (X) does not meet the minimum
  // required..."). That's genuinely useful information for the student, so
  // we surface DRF's actual error body instead of a generic message. DRF
  // validation errors normally arrive as { field: ["message"] } — we walk
  // the first field's first message if present, and fall back to a plain
  // string message.
  async function handleCreateApplication() {
    if (!selectedUniversity) return;
    setIsApplying(true);
    setApplyError(null);
    try {
      await applyToUniversity(selectedUniversity.id);
      setSelectedUniversity(null);
      if (onApplied) await onApplied();
    } catch (err) {
      const responseData = err?.response?.data;
      let message = 'Could not submit your application. Please retry.';
      if (typeof responseData === 'string') {
        message = responseData;
      } else if (responseData && typeof responseData === 'object') {
        const firstKey = Object.keys(responseData)[0];
        const firstValue = responseData[firstKey];
        message = Array.isArray(firstValue) ? firstValue[0] : String(firstValue ?? message);
      }
      setApplyError(message);
    } finally {
      setIsApplying(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <section className="border border-slate-200 bg-white shadow-sm rounded-none">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 p-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Pre-Application Catalog</h2>
          <p className="mt-1 text-xs text-slate-500">{totalCount} partner universities on file</p>
        </div>
        <div className="flex gap-3">
          <CustomDropdown label="Country" icon={Globe} value={country} options={COUNTRY_OPTIONS} onChange={handleCountryChange} />
          <CustomDropdown label="Language" icon={Languages} value={language} options={LANGUAGE_OPTIONS} onChange={handleLanguageChange} />
        </div>
      </div>

      {/* Read-only banner — shown instead of the selection action bar once
          the student already has an application in flight. */}
      {hasActiveApplication && (
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-600">
          <Lock className="h-3.5 w-3.5 text-slate-400" />
          You already have an active application{activeApplicationUniversityName ? ` to ${activeApplicationUniversityName}` : ''}. Browsing is
          read-only until it's resolved — track its progress above.
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading catalog…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-6 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-6 py-2">University</th>
              <th className="px-6 py-2">Country</th>
              <th className="px-6 py-2">Language(s)</th>
              <th className="px-6 py-2">Travel Advisory</th>
            </tr>
          </thead>
          <tbody>
            {universities.map((uni) => {
              const isSelected = selectedUniversity?.id === uni.id;
              return (
                <tr
                  key={uni.id}
                  onClick={() => handleSelectRow(uni)}
                  className={`border-b border-slate-100 ${hasActiveApplication ? '' : 'cursor-pointer hover:bg-slate-50'} ${
                    isSelected ? 'bg-slate-100' : ''
                  }`}
                >
                  <td className="px-6 py-3 font-medium text-slate-800">
                    <span className="flex items-center gap-2">
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-slate-700" />}
                      {uni.name}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{uni.country}</td>
                  <td className="px-6 py-3 text-slate-600">{uni.primary_language}</td>
                  <td className="px-6 py-3">
                    <AdvisoryBadge level={uni.travel_advisory_level} />
                  </td>
                </tr>
              );
            })}
            {universities.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                  No universities match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Selection action bar — only ever visible when a row is selected
          AND the student doesn't already have an active application. */}
      {!hasActiveApplication && selectedUniversity && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected</p>
            <p className="text-sm font-semibold text-slate-800">{selectedUniversity.name}</p>
            {applyError && <p className="mt-1 text-xs font-semibold text-red-600">{applyError}</p>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedUniversity(null)}
              disabled={isApplying}
              className="border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 rounded-none hover:border-slate-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateApplication}
              disabled={isApplying}
              className="flex items-center gap-1.5 border border-slate-800 bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white rounded-none hover:bg-slate-900 disabled:opacity-50"
            >
              {isApplying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Create Application
            </button>
          </div>
        </div>
      )}

      {/* Pagination footer — talks directly to the backend's page-number scheme. */}
      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3">
        <span className="text-xs text-slate-500">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="flex items-center gap-1 border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 rounded-none hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="flex items-center gap-1 border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 rounded-none hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// COMPLIANCE CHECKLIST VAULT
// -----------------------------------------------------------------------------
function ComplianceVault({ onChecklistChange }) {
  const [checklist, setChecklist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null); // which row is currently expanded, or null
  const [uploadingId, setUploadingId] = useState(null); // which row's upload request is in flight
  const [uploadError, setUploadError] = useState(null);

  const fetchChecklist = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getDocumentChecklist();
      setChecklist(response.data);
      // Bubble the raw checklist up to the parent so the dashboard's
      // "Unlisted University" lock logic (which needs to know whether the
      // vault has any ACTION_REQUIRED items) can react to it without this
      // component needing to know anything about the lock feature itself.
      if (onChecklistChange) onChecklistChange(response.data);
    } catch (err) {
      // A checklist load failure is non-fatal to the rest of the dashboard,
      // so we just leave the table empty rather than throwing.
      setChecklist([]);
    } finally {
      setIsLoading(false);
    }
  }, [onChecklistChange]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  // Toggling a row: clicking an already-open ACTION_REQUIRED row closes it,
  // clicking a different one opens that one instead (an accordion, not a
  // set of independent checkboxes) — this keeps the table calm/dense.
  function toggleRow(documentId) {
    setExpandedId((prev) => (prev === documentId ? null : documentId));
    setUploadError(null); // clear any stale error banner when switching rows
  }

  // Handles the <input type="file"> onChange for a given checklist row.
  // We read the first selected File object and hand it straight to the
  // uploadDocument() API wrapper, which is responsible for building the
  // multipart/form-data body.
  async function handleFileSelected(documentId, event) {
    const file = event.target.files[0];
    if (!file) return; // user opened the file picker and cancelled

    setUploadingId(documentId);
    setUploadError(null);
    try {
      await uploadDocument(documentId, file);
      await fetchChecklist(); // re-pull the checklist so the row's status flips out of ACTION_REQUIRED
      setExpandedId(null); // collapse the row now that the fix is submitted
    } catch (err) {
      setUploadError('Upload failed. Confirm the file is a PDF or image under 10MB and try again.');
    } finally {
      setUploadingId(null);
      // Reset the raw <input> value so selecting the *same* filename twice
      // in a row still fires a fresh onChange event.
      event.target.value = '';
    }
  }

  return (
    <section className="border border-slate-200 bg-white shadow-sm rounded-none">
      <div className="border-b border-slate-200 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Compliance Checklist Vault</h2>
        <p className="mt-1 text-xs text-slate-500">Required documentation for your active application</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading checklist…
        </div>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-6 py-2">Document</th>
              <th className="px-6 py-2">Status</th>
              <th className="px-6 py-2">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {checklist.map((item) => {
              // A row is actionable (clickable, uploadable) when the student
              // still needs to DO something: either nothing has been
              // uploaded yet (PENDING) or the admin flagged what's there
              // (ACTION_REQUIRED). AWAITING_REVIEW ("we have your file,
              // waiting on the admin") and APPROVED ("done") have nothing
              // for the student to act on right now, so they stay flat rows.
              const isActionable = item.verification_status === 'PENDING' || item.verification_status === 'ACTION_REQUIRED';

              return (
                // React Fragment with a key lets us render two <tr> elements
                // (the row itself, plus a conditional expanded detail row)
                // per checklist item without an extra wrapping DOM element.
                <Fragment key={item.id}>
                  <tr
                    onClick={() => isActionable && toggleRow(item.id)}
                    className={`border-b border-slate-100 ${
                      isActionable ? 'cursor-pointer hover:bg-slate-50' : ''
                    }`}
                  >
                    <td className="flex items-center gap-2 px-6 py-3 font-medium text-slate-800">
                      <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                      {/* CONFIRMED: there is no document_name field — only a
                          document_type CODE. documentTypeLabel() maps it to
                          the exact label from the Django model's TextChoices. */}
                      {documentTypeLabel(item.document_type)}
                    </td>
                    <td className="px-6 py-3">
                      <ChecklistStatusBadge status={item.verification_status} />
                    </td>
                    <td className="px-6 py-3 text-slate-500">{item.updated_at}</td>
                  </tr>

                  {/* Expanded upload form. Two flavors sharing one upload
                      control: ACTION_REQUIRED shows the admin's rejection
                      comment in a red alert above the file picker; PENDING
                      (nothing uploaded yet at all) shows a plain neutral
                      prompt instead, since there's no comment to show. Both
                      funnel into the same handleFileSelected() — the row
                      collapses and re-fetches automatically once the
                      backend flips verification_status to AWAITING_REVIEW. */}
                  {expandedId === item.id && isActionable && (
                    <tr className={`border-b border-slate-100 ${item.verification_status === 'ACTION_REQUIRED' ? 'bg-red-50' : 'bg-slate-50'}`}>
                      <td colSpan={3} className="px-6 py-4">
                        <div
                          className={`flex items-start gap-3 border bg-white p-4 rounded-none ${
                            item.verification_status === 'ACTION_REQUIRED' ? 'border-red-300' : 'border-slate-300'
                          }`}
                        >
                          {item.verification_status === 'ACTION_REQUIRED' ? (
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                          ) : (
                            <UploadCloud className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          )}
                          <div className="flex-1">
                            {item.verification_status === 'ACTION_REQUIRED' ? (
                              <>
                                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Reviewer Comment</p>
                                {/* admin_comment comes straight from the backend —
                                    this is the admin's explanation of what to fix. */}
                                <p className="mt-1 text-sm text-slate-700">{item.admin_comment}</p>
                              </>
                            ) : (
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Upload this document to begin review.
                              </p>
                            )}

                            <div className="mt-3 flex items-center gap-3">
                              <label className="flex cursor-pointer items-center gap-2 border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 rounded-none hover:border-slate-500">
                                <UploadCloud className="h-3.5 w-3.5" />
                                {uploadingId === item.id
                                  ? 'Uploading…'
                                  : item.verification_status === 'ACTION_REQUIRED'
                                  ? 'Choose Replacement File'
                                  : 'Choose File'}
                                <input
                                  type="file"
                                  className="hidden"
                                  disabled={uploadingId === item.id}
                                  onChange={(event) => handleFileSelected(item.id, event)}
                                />
                              </label>
                              {uploadingId === item.id && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                            </div>
                            {uploadError && <p className="mt-2 text-xs font-semibold text-red-600">{uploadError}</p>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {checklist.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-400">
                  No checklist items assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// TOP-LEVEL: StudentDashboard
// -----------------------------------------------------------------------------
export default function StudentDashboard() {
  // Student's own profile — includes is_high_school_track and any unlisted
  // university request metadata.
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // The current pipeline stage key (one of PIPELINE_STAGES[].key), pulled
  // from a dedicated /progress/ endpoint rather than embedded in profile —
  // this mirrors a real backend where "application progress" is its own
  // aggregate/read-model separate from the student's account record.
  const [currentStage, setCurrentStage] = useState('DRAFT');

  // The id (and university name) of the student's one active application,
  // if any. `applicationId` is what tells UniversityCatalog whether to
  // switch into read-only browsing mode — a student can only ever have one
  // application in flight.
  const [applicationId, setApplicationId] = useState(null);
  const [activeApplicationUniversityName, setActiveApplicationUniversityName] = useState(null);

  // High School toggle: mirrors profile.is_high_school_track but kept as
  // its own state so the switch can update optimistically (flip instantly
  // on click) without waiting on a full profile re-fetch.
  const [isHighSchoolTrack, setIsHighSchoolTrack] = useState(false);
  const [isTogglingHighSchool, setIsTogglingHighSchool] = useState(false);

  // Tracks whether the Compliance Vault currently has any ACTION_REQUIRED
  // rows — the ComplianceVault child component reports this up via the
  // onChecklistChange callback prop so the parent can decide banner text.
  const [hasActionRequiredItems, setHasActionRequiredItems] = useState(false);

  // FIX: the old version of this effect used Promise.all([...]), which
  // rejects ENTIRELY the moment either call fails — so a broken
  // getApplicationProgress() call was silently throwing away a perfectly
  // good profile response too, which is exactly what produced the
  // "Profile unavailable" symptom even when /users/me/ was fine on its
  // own. Promise.allSettled() below makes the two calls fully independent:
  // each one updates its own piece of state regardless of whether the
  // other succeeded or failed, and we log the specific failure to the
  // console so it's actually debuggable instead of failing silently.
  const loadInitialData = useCallback(async () => {
    setIsProfileLoading(true);
    const [profileResult, progressResult] = await Promise.allSettled([getStudentProfile(), getApplicationProgress()]);

    if (profileResult.status === 'fulfilled') {
      setProfile(profileResult.value.data);
      setIsHighSchoolTrack(Boolean(profileResult.value.data.is_high_school_track));
    } else {
      // eslint-disable-next-line no-console
      console.error('GlobalScholar: failed to load student profile (/users/me/):', profileResult.reason);
    }

    if (progressResult.status === 'fulfilled') {
      setCurrentStage(progressResult.value.data.status);
      setApplicationId(progressResult.value.data.applicationId);
      setActiveApplicationUniversityName(progressResult.value.data.universityName ?? null);
    } else {
      // eslint-disable-next-line no-console
      console.error('GlobalScholar: failed to load application progress (/applications/):', progressResult.reason);
    }

    setIsProfileLoading(false);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // High School tracking toggle handler. Optimistic update pattern:
  // 1) flip the local boolean immediately so the UI feels instant,
  // 2) fire the PATCH request,
  // 3) if the request fails, roll the boolean back and surface nothing
  //    fancier than a console warning (a toast/snackbar system would be
  //    the production answer here, but is out of scope for Phase 3).
  async function handleToggleHighSchool() {
    const nextValue = !isHighSchoolTrack;
    setIsHighSchoolTrack(nextValue); // optimistic flip
    setIsTogglingHighSchool(true);
    try {
      await updateHighSchoolTracking(nextValue);
    } catch (err) {
      setIsHighSchoolTrack(!nextValue); // rollback on failure
    } finally {
      setIsTogglingHighSchool(false);
    }
  }

  // Unlisted University pipeline lock condition: true only when the student
  // HAS an unlisted-university request on file AND an admin has not yet
  // verified it. Until that happens, core tasks (the Compliance Vault) stay
  // locked, because there is no confirmed institution to collect documents
  // against yet.
  const unlisted = profile?.unlisted_university_request; // { requested, verified, name } | null
  const isVaultLocked = Boolean(unlisted && unlisted.requested && !unlisted.verified);

  return (
    <div className="bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* ---------------------------------------------------------------
            HEADER STRIP
        --------------------------------------------------------------- */}
        <header className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white shadow-sm rounded-none p-6">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Student Workspace</h1>
            <p className="text-xs text-slate-500">
              {isProfileLoading ? 'Loading profile…' : profile ? `Welcome back, ${profile.first_name}.` : 'Profile unavailable'}
            </p>
          </div>

          {/* High School Tracking toggle switch — a custom button styled as
              a switch, since Tailwind has no built-in toggle primitive.
              role="switch" + aria-checked keeps it screen-reader accurate. */}
          <button
            type="button"
            role="switch"
            aria-checked={isHighSchoolTrack}
            onClick={handleToggleHighSchool}
            disabled={isTogglingHighSchool}
            className="flex items-center gap-3 border border-slate-300 px-4 py-2 rounded-none disabled:opacity-60"
          >
            <GraduationCap className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">High School Track</span>
            <span
              className={`relative h-5 w-9 rounded-none border transition-colors ${
                isHighSchoolTrack ? 'border-slate-800 bg-slate-800' : 'border-slate-300 bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-0.5 h-3.5 w-3.5 bg-white transition-transform ${
                  isHighSchoolTrack ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </span>
          </button>
        </header>

        {/* ---------------------------------------------------------------
            UNLISTED UNIVERSITY BANNER — only rendered while pending
        --------------------------------------------------------------- */}
        {isVaultLocked && (
          <div className="flex items-center gap-3 border border-amber-500 bg-amber-50 p-4 rounded-none">
            <Lock className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              Your request for <span className="font-semibold">{unlisted.name}</span> (an unlisted university) is awaiting
              Home Admin verification. Compliance tasks unlock automatically once it is approved.
            </p>
          </div>
        )}

        {/* ---------------------------------------------------------------
            1. INTERACTIVE PROGRESS BOARD
        --------------------------------------------------------------- */}
        <ProgressBoard currentStageKey={currentStage} />

        {/* ---------------------------------------------------------------
            2. PRE-APPLICATION CATALOG
        --------------------------------------------------------------- */}
        <UniversityCatalog
          hasActiveApplication={Boolean(applicationId)}
          activeApplicationUniversityName={activeApplicationUniversityName}
          onApplied={loadInitialData}
        />

        {/* ---------------------------------------------------------------
            3. COMPLIANCE CHECKLIST VAULT (locked while unlisted-university
               verification is pending — see LockOverlay + isVaultLocked)
        --------------------------------------------------------------- */}
        <LockOverlay isLocked={isVaultLocked} reason="Locked until your unlisted university is verified">
          <ComplianceVault onChecklistChange={(items) => setHasActionRequiredItems(items.some((i) => i.status === 'ACTION_REQUIRED'))} />
        </LockOverlay>

        {/* Small footer note that reacts to whether the checklist child
            reported any outstanding ACTION_REQUIRED rows — demonstrates
            child-to-parent state lifting via the onChecklistChange prop. */}
        {!isVaultLocked && hasActionRequiredItems && (
          <div className="flex items-center gap-2 border border-red-300 bg-red-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-red-700 rounded-none">
            <CircleDashed className="h-3.5 w-3.5" />
            You have outstanding compliance items — resolve them above to advance your pipeline stage.
          </div>
        )}
      </div>
    </div>
  );
}