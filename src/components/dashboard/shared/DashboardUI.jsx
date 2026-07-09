// =============================================================================
// src/components/dashboard/shared/DashboardUI.jsx
// -----------------------------------------------------------------------------
// Small, reusable presentational primitives shared across every role
// dashboard (Student, Admin, Host Coordinator). Pulling these out once we
// have a second and third dashboard avoids copy-pasting the same dropdown/
// badge/pagination JSX into every new file — a single bug fix here fixes it
// everywhere these are used.
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// CustomDropdown — hand-built listbox (not a native <select>) so the
// institutional border styling is fully under our control. See the
// click-outside pattern explained inline below.
export function CustomDropdown({ label, icon: Icon, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Any mousedown outside our container closes the panel — the standard
    // way to make a custom dropdown behave like a native one.
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-48 items-center justify-between border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 rounded-none hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
      >
        <span className="truncate">{value}</span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul className="absolute z-20 mt-1 max-h-56 w-48 overflow-y-auto border border-slate-300 bg-white shadow-sm rounded-none">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
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

// Badge — generic border-only status chip. `tone` picks a Tailwind color
// family; the badge itself never fills a solid background, matching the
// "border-only" institutional badge rule used across every dashboard.
const TONE_STYLES = {
  slate: 'border-slate-400 text-slate-600',
  navy: 'border-slate-800 text-slate-800',
  emerald: 'border-emerald-500 text-emerald-700',
  amber: 'border-amber-500 text-amber-700',
  orange: 'border-orange-500 text-orange-700',
  red: 'border-red-600 text-red-700',
};
export function Badge({ tone = 'slate', children }) {
  return (
    <span className={`inline-block border ${TONE_STYLES[tone]} px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-none`}>
      {children}
    </span>
  );
}

// PaginationFooter — the same "Page X of Y" + Prev/Next strip used by every
// paginated table (Phase 3's catalog, Phase 4's applicant queue).
export function PaginationFooter({ page, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
      <span className="text-xs text-slate-500">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex items-center gap-1 border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 rounded-none hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex items-center gap-1 border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 rounded-none hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// LoadingRow — consistent inline spinner + label used inside any panel body
// while its data is in flight.
export function LoadingRow({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

// EmptyState — consistent "nothing here" placeholder for empty tables/lists.
export function EmptyState({ label }) {
  return <div className="p-10 text-center text-sm text-slate-400">{label}</div>;
}

// DOCUMENT_TYPE_LABELS — the real DocumentChecklist model has no
// "document_name" field, only a `document_type` CODE (e.g. "PASSPORT_SCAN").
// This maps each code to the exact human-readable label from the Django
// model's own TextChoices, so the frontend and backend never disagree on
// what a document type is called. Falls back to a title-cased version of
// the raw code for any type added on the backend later that this map
// hasn't been updated for yet, so it never renders blank.
export const DOCUMENT_TYPE_LABELS = {
  PASSPORT_SCAN: 'Passport Scan',
  VISA_COPY: 'Visa Copy',
  BANK_STATEMENT: 'Bank Statement',
  ACADEMIC_TRANSCRIPT: 'Academic Transcript',
  LANGUAGE_TEST_RESULT: 'Language Test Result',
  REFERENCE_LETTER: 'Reference Letter',
  PERSONAL_STATEMENT: 'Personal Statement',
  MEDICAL_CLEARANCE: 'Medical Clearance',
  INSURANCE_PROOF: 'Proof of Health Insurance',
  HOUSING_CONFIRMATION: 'Housing Confirmation Letter',
};

export function documentTypeLabel(code) {
  if (DOCUMENT_TYPE_LABELS[code]) return DOCUMENT_TYPE_LABELS[code];
  if (!code) return 'Document';
  return code
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// -----------------------------------------------------------------------------
// CONFIRMED against universities/models.py — University.AdvisoryLevel is a
// TextChoices of STRING CODES, not a 1-4 number as earlier guessed. Fixing
// this in exactly one shared place so ExploreCatalog, UniversityDetail, and
// StudentDashboard's catalog can never disagree on what the badge shows.
// -----------------------------------------------------------------------------
const ADVISORY_META = {
  UNKNOWN: { tone: 'slate', label: 'Advisory Unknown' },
  NORMAL: { tone: 'emerald', label: 'No Advisory' },
  LEVEL_1: { tone: 'emerald', label: 'Level 1 — Normal Precautions' },
  LEVEL_2: { tone: 'amber', label: 'Level 2 — Increased Caution' },
  LEVEL_3: { tone: 'orange', label: 'Level 3 — Reconsider Travel' },
  LEVEL_4: { tone: 'red', label: 'Level 4 — Do Not Travel' },
};

export function advisoryBadgeMeta(code) {
  return ADVISORY_META[code] || ADVISORY_META.UNKNOWN;
}

// CONFIRMED against University.Language — the real, closed set of language
// values the backend actually accepts. Using anything outside this list as a
// filter value (the old code had "Japanese"/"Korean", which don't exist in
// this enum) silently returns zero results rather than erroring, which is
// exactly the kind of bug that's invisible until someone notices an empty
// table.
export const LANGUAGE_CHOICES = ['English', 'French', 'German', 'Spanish', 'Mandarin', 'Arabic', 'Portuguese', 'Other'];

// CONFIRMED against Program.DegreeLevel.
export const DEGREE_LEVEL_LABELS = {
  BACHELOR: "Bachelor's",
  MASTER: "Master's",
  PHD: 'PhD',
  EXCHANGE: 'Exchange / Non-degree',
  DIPLOMA: 'Diploma',
};

export function degreeLevelLabel(code) {
  return DEGREE_LEVEL_LABELS[code] || code;
}
// Add this to the exports at the bottom of DashboardUI.jsx
export { ProgressBar } from './ProgressBar';