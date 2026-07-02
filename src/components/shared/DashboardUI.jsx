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

// =============================================================================
// BADGE COMPONENTS
// =============================================================================
const TONE_STYLES = {
  slate: 'border-slate-400 text-slate-600',
  navy: 'border-slate-800 text-slate-800',
  emerald: 'border-emerald-500 text-emerald-700',
  amber: 'border-amber-500 text-amber-700',
  orange: 'border-orange-500 text-orange-700',
  red: 'border-red-600 text-red-700',
};

// Badge — generic border-only status chip. `tone` picks a Tailwind color
// family; the badge itself never fills a solid background, matching the
// "border-only" institutional badge rule used across every dashboard.
export function Badge({ tone = 'slate', children }) {
  return (
    <span className={`inline-block border ${TONE_STYLES[tone]} px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-none`}>
      {children}
    </span>
  );
}

// AdvisoryBadge — Explicit safely-guarded wrapper to eliminate "LUNKNOWN" errors.
// It catches bad, empty, or missing warning levels instantly and maps it to your index.css rule.
export function AdvisoryBadge({ level }) {
  const cleanLevel = level && level !== 'UNKNOWN' ? `L${level}` : 'UNKNOWN';
  
  if (cleanLevel === 'UNKNOWN') {
    return (
      <span className="badge-advisory-unknown">
        ⚠️ Advisory Unknown
      </span>
    );
  }

  // Choose visual weight dynamically based on danger level
  const tone = level >= 3 ? 'red' : level === 2 ? 'orange' : 'emerald';
  return (
    <Badge tone={tone}>
      Advisory {cleanLevel}
    </Badge>
  );
}

// =============================================================================
// LAYOUT & UTILITY COMPONENTS
// =============================================================================

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