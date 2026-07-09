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
  Loader2,
  CircleCheck,
  CircleDashed,
  MapPin,
  Upload,
  Building2,
  ExternalLink,
} from 'lucide-react';
import {
  getStudentProfile,
  getApplicationProgress,
  getUniversities,
  getDocumentChecklist,
  uploadDocument,
  updateHighSchoolTracking,
  applyToUniversity,
  applyToProgram,
  getStudentApplications,
  getUniversityProgramsList,
} from '../../api/students';
import { bulkUploadDocuments } from '../../api/client';
import { documentTypeLabel, advisoryBadgeMeta, LANGUAGE_CHOICES, Badge } from './shared/DashboardUI';
import { Link } from 'react-router-dom';

// ── STATIC CONFIG ──────────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { key: 'DRAFT', label: 'Draft', icon: FileEdit },
  { key: 'SUBMITTED', label: 'Submitted', icon: Send },
  { key: 'UNDER_REVIEW', label: 'Under Review', icon: Search },
  { key: 'COMPLIANCE_PHASE', label: 'Compliance Phase', icon: ShieldCheck },
  { key: 'APPROVED', label: 'Approved', icon: CheckCircle2 },
];

const PAGE_SIZE = 10;
const COUNTRY_OPTIONS = ['All Countries', 'United States', 'United Kingdom', 'Germany', 'Japan', 'South Korea', 'Australia', 'France', 'Spain'];
const LANGUAGE_OPTIONS = ['All Languages', ...LANGUAGE_CHOICES];

function toneForStatus(status) {
  switch (status) {
    case 'APPROVED':
      return 'emerald';
    case 'REJECTED':
      return 'red';
    case 'UNDER_REVIEW':
      return 'amber';
    case 'COMPLIANCE_PHASE':
      return 'orange';
    case 'SUBMITTED':
      return 'navy';
    default:
      return 'slate';
  }
}

// ── STATUS BANNER ─────────────────────────────────────────────────────────────
function StatusBanner({ status, hasPendingDocuments, applicationCount }) {
  const statusMap = {
    DRAFT: { label: 'Draft', color: 'bg-slate-100 border-slate-300 text-slate-700', text: 'Your application is in draft mode. Complete and submit when ready.' },
    SUBMITTED: { label: 'Submitted', color: 'bg-navy-50 border-navy-200 text-navy-700', text: 'Your application has been submitted and is awaiting review.' },
    UNDER_REVIEW: { label: 'Under Review', color: 'bg-amber-50 border-amber-200 text-amber-700', text: 'Your application is currently being reviewed by the admin.' },
    COMPLIANCE_PHASE: { label: 'Compliance Phase', color: 'bg-gold-50 border-gold-300 text-navy-900', text: 'Your application has reached the compliance phase. Please upload all required documents below.' },
    APPROVED: { label: 'Approved', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', text: 'Congratulations! Your application has been approved.' },
    REJECTED: { label: 'Rejected', color: 'bg-crimson-50 border-crimson-200 text-crimson-700', text: 'Your application has been rejected. Please review the reason provided.' },
  };

  const info = statusMap[status] || statusMap.DRAFT;
  const isCompliance = status === 'COMPLIANCE_PHASE';

  return (
    <div className={`border p-4 rounded-none ${info.color}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide">Current Status</p>
          <p className="text-base font-bold">{info.label}</p>
          <p className="text-sm mt-0.5">{info.text}</p>
          {applicationCount > 1 && (
            <p className="text-xs mt-1 text-slate-600">You have {applicationCount} total applications.</p>
          )}
        </div>
        {isCompliance && hasPendingDocuments && (
          <span className="border border-red-500 bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-red-700">
            Action Required
          </span>
        )}
      </div>
    </div>
  );
}

// ── PROGRESS BOARD ──────────────────────────────────────────────────────────
function ProgressBoard({ currentStageKey, applicationCount }) {
  const currentIndex = PIPELINE_STAGES.findIndex((stage) => stage.key === currentStageKey);
  const stageLabels = {
    DRAFT: 'Complete and submit',
    SUBMITTED: 'Awaiting review',
    UNDER_REVIEW: 'Admin reviewing',
    COMPLIANCE_PHASE: 'Upload documents',
    APPROVED: 'Complete',
  };

  return (
    <section className="border border-slate-200 bg-white shadow-sm rounded-none p-6">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Application Pipeline</h2>
        <span className="text-xs text-slate-500">
          {applicationCount > 0 ? `Stage ${currentIndex + 1} of ${PIPELINE_STAGES.length}` : 'No active application'}
        </span>
      </div>

      {applicationCount === 0 ? (
        <p className="text-sm text-slate-500">You don't have any applications yet. Browse the catalog below to apply.</p>
      ) : (
        <div className="flex items-center">
          {PIPELINE_STAGES.map((stage, index) => {
            const StageIcon = stage.icon;
            const isComplete = index < currentIndex;
            const isActive = index === currentIndex;
            const isLast = index === PIPELINE_STAGES.length - 1;

            return (
              <div key={stage.key} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center border-2 rounded-none ${
                      isComplete
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : isActive
                        ? 'border-gold-500 bg-gold-500 text-navy-900'
                        : 'border-slate-300 bg-white text-slate-300'
                    }`}
                  >
                    {isComplete ? <CircleCheck className="h-5 w-5" /> : <StageIcon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`text-center text-[11px] font-semibold uppercase tracking-wide ${
                      isActive ? 'text-gold-700' : isComplete ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span className="text-center text-[9px] text-slate-400">
                    {isActive ? '◀ You are here' : isComplete ? '✓ Done' : ''}
                  </span>
                </div>
                {!isLast && <div className={`mx-2 h-0.5 flex-1 ${isComplete ? 'bg-slate-800' : 'bg-slate-300'}`} />}
              </div>
            );
          })}
        </div>
      )}

      {applicationCount > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-xs text-slate-500">
            {currentIndex < PIPELINE_STAGES.length - 1 ? (
              <>
                <span className="font-semibold">Next step:</span>{' '}
                {stageLabels[currentStageKey] || 'Proceed to next stage'}
              </>
            ) : (
              <span className="font-semibold text-emerald-600">Application process complete!</span>
            )}
          </p>
        </div>
      )}
    </section>
  );
}

// ── MY APPLICATIONS SECTION ──────────────────────────────────────────────────
function MyApplications({ applications, onRefresh }) {
  if (applications.length === 0) {
    return null;
  }

  return (
    <section className="border border-slate-200 bg-white shadow-sm rounded-none">
      <div className="border-b border-slate-200 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">My Applications</h2>
        <p className="mt-1 text-xs text-slate-500">You have {applications.length} application(s) in progress</p>
      </div>
      <div className="divide-y divide-slate-100">
        {applications.map((app) => (
          <div key={app.id} className="p-4 hover:bg-slate-50 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {app.destination_university?.name || app.university_name || 'University'}
                </p>
                {app.program_detail && (
                  <p className="text-xs text-slate-500">{app.program_detail.name}</p>
                )}
                {app.program && !app.program_detail && (
                  <p className="text-xs text-slate-500">Program ID: {app.program}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={toneForStatus(app.status)}>
                  {app.status?.replace(/_/g, ' ') || 'DRAFT'}
                </Badge>
                <span className="text-xs text-slate-400">
                  {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Draft'}
                </span>
                <Link
                  to={`/applications/${app.id}`}
                  className="text-xs font-semibold uppercase tracking-wide text-navy-600 hover:text-gold-600 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── SMALL PRESENTATIONAL SUBCOMPONENTS ──────────────────────────────────────
function CustomDropdown({ label, icon: Icon, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
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

function DocumentSummary({ checklist }) {
  const total = checklist.length;
  const uploaded = checklist.filter((doc) => doc.file_attachment !== null && doc.file_attachment !== '').length;
  const approved = checklist.filter((doc) => doc.verification_status === 'APPROVED').length;
  const pending = total - uploaded;
  const percentage = total > 0 ? Math.round((uploaded / total) * 100) : 0;

  return (
    <div className="border border-slate-200 bg-slate-50 p-3 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold uppercase tracking-wide text-slate-600">Document Progress</span>
        <span className="text-slate-600">
          {uploaded} of {total} uploaded ({percentage}%)
        </span>
      </div>
      <div className="mt-1 h-2 w-full bg-slate-200 rounded-none overflow-hidden">
        <div
          className="h-full bg-gold-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500">
        <span>Total: {total}</span>
        <span className="text-emerald-600">Uploaded: {uploaded}</span>
        <span className="text-amber-600">Pending: {pending}</span>
        <span className="text-emerald-700">Approved: {approved}</span>
      </div>
    </div>
  );
}

// ── PRE-APPLICATION CATALOG ─────────────────────────────────────────────────
function UniversityCatalog({ existingApplications, onApplied }) {
  const [universities, setUniversities] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [country, setCountry] = useState('All Countries');
  const [language, setLanguage] = useState('All Languages');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedUniversity, setExpandedUniversity] = useState(null);
  const [programsCache, setProgramsCache] = useState({});
  const [applyingToProgram, setApplyingToProgram] = useState(null);
  const [applyError, setApplyError] = useState(null);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const fetchUniversities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page };
      if (country !== 'All Countries') params.country = country;
      if (language !== 'All Languages') params.language = language;
      if (searchQuery) params.search = searchQuery;
      const response = await getUniversities(params);
      setUniversities(response.data.results);
      setTotalCount(response.data.count);
    } catch (err) {
      setError('Could not load the university catalog. Please retry.');
    } finally {
      setIsLoading(false);
    }
  }, [page, country, language, searchQuery]);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  // Check if student already applied to a program
  const hasAppliedToProgram = (programId) => {
    return existingApplications.some((app) => app.program === programId);
  };

  // Check if student already applied to a university
  const hasAppliedToUniversity = (universityId) => {
    return existingApplications.some((app) => app.destination_university === universityId);
  };

  // Get application for a program
  const getApplicationForProgram = (programId) => {
    return existingApplications.find((app) => app.program === programId);
  };

  async function handleToggleUniversity(universityId) {
    if (expandedUniversity === universityId) {
      setExpandedUniversity(null);
      return;
    }
    setExpandedUniversity(universityId);
    setApplyError(null);

    if (programsCache[universityId]) return;

    setProgramsCache((prev) => ({ ...prev, [universityId]: { status: 'loading' } }));
    try {
      const programs = await getUniversityProgramsList(universityId);
      setProgramsCache((prev) => ({ ...prev, [universityId]: { status: 'ready', programs: programs } }));
    } catch (err) {
      setProgramsCache((prev) => ({ ...prev, [universityId]: { status: 'error' } }));
    }
  }

  async function handleApplyToProgram(universityId, programId) {
    setApplyingToProgram(programId);
    setApplyError(null);
    try {
      await applyToProgram(universityId, programId);
      if (onApplied) await onApplied();
      // Refresh programs to update applied status
      const programs = await getUniversityProgramsList(universityId);
      setProgramsCache((prev) => ({ ...prev, [universityId]: { status: 'ready', programs: programs } }));
    } catch (err) {
      const responseData = err?.response?.data;
      let message = 'Could not apply to this program.';
      if (typeof responseData === 'object') {
        const firstKey = Object.keys(responseData)[0];
        message = responseData[firstKey]?.[0] || message;
      }
      setApplyError(message);
    } finally {
      setApplyingToProgram(null);
    }
  }

  function handleCountryChange(value) {
    setCountry(value);
    setPage(1);
  }
  function handleLanguageChange(value) {
    setLanguage(value);
    setPage(1);
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
          <div className="relative">
            <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Search className="h-3.5 w-3.5" />
              Search
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="University name…"
              className="w-52 border border-slate-300 bg-white px-3 py-2 text-sm text-navy-900 focus:border-gold-500 focus:outline-none"
            />
          </div>
          <CustomDropdown label="Country" icon={Globe} value={country} options={COUNTRY_OPTIONS} onChange={handleCountryChange} />
          <CustomDropdown label="Language" icon={Languages} value={language} options={LANGUAGE_OPTIONS} onChange={handleLanguageChange} />
        </div>
      </div>

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
        <div>
          {universities.map((uni) => {
            const isExpanded = expandedUniversity === uni.id;
            const uniHasApplied = hasAppliedToUniversity(uni.id);
            const cache = programsCache[uni.id];

            return (
              <div key={uni.id} className="border-b border-slate-100">
                {/* University Row */}
                <div
                  onClick={() => handleToggleUniversity(uni.id)}
                  className={`flex cursor-pointer items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors ${
                    isExpanded ? 'bg-slate-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-slate-800">{uni.name}</span>
                      {uniHasApplied && (
                        <span className="border border-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          Applied
                        </span>
                      )}
                      <AdvisoryBadge level={uni.travel_advisory_level} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {uni.city ? `${uni.city}, ` : ''}{uni.country} · {uni.primary_language}
                    </p>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Programs List (expanded) */}
                {isExpanded && (
                  <div className="bg-slate-50 px-6 py-4">
                    {!cache || cache.status === 'loading' ? (
                      <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading programs…
                      </div>
                    ) : cache.status === 'error' ? (
                      <p className="text-sm text-red-600">Could not load programs.</p>
                    ) : cache.programs.length === 0 ? (
                      <p className="text-sm text-slate-400">No programs available for this university.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {cache.programs.map((program) => {
                          const alreadyApplied = hasAppliedToProgram(program.id);
                          const existingApp = getApplicationForProgram(program.id);
                          const isApplying = applyingToProgram === program.id;

                          return (
                            <div key={program.id} className="border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-800">{program.name}</h4>
                                  <p className="text-xs text-slate-500">
                                    {program.degree_level?.replace(/_/g, ' ') || 'N/A'} · {program.duration_semesters} semester(s)
                                  </p>
                                  {program.application_deadline && (
                                    <p className="text-xs text-slate-400 mt-1">
                                      Deadline: {new Date(program.application_deadline).toLocaleDateString()}
                                    </p>
                                  )}
                                  {program.tuition_per_semester_usd && (
                                    <p className="text-xs text-slate-400">
                                      Tuition: ${Number(program.tuition_per_semester_usd).toLocaleString()}/semester
                                    </p>
                                  )}
                                  {program.credits_transferable && (
                                    <span className="mt-1 inline-block border border-emerald-500 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                                      Credits Transferable
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {alreadyApplied ? (
                                    <span className="border border-emerald-500 px-2 py-1 text-xs font-semibold text-emerald-700">
                                      {existingApp?.status?.replace(/_/g, ' ') || 'Applied'}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApplyToProgram(uni.id, program.id);
                                      }}
                                      disabled={isApplying}
                                      className="border border-slate-800 bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white rounded-none hover:bg-slate-900 disabled:opacity-50"
                                    >
                                      {isApplying ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        'Apply'
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {applyError && (
                      <div className="mt-3 flex items-center gap-2 border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 rounded-none">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {applyError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {universities.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-slate-400">
              No universities match the current filters.
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3">
        <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
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

// ── COMPLIANCE CHECKLIST VAULT ─────────────────────────────────────────────
function ComplianceVault({ onChecklistChange }) {
  const [checklist, setChecklist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadError, setBulkUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const fetchChecklist = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getDocumentChecklist();
      setChecklist(response.data);
      if (onChecklistChange) onChecklistChange(response.data);
    } catch (err) {
      setChecklist([]);
    } finally {
      setIsLoading(false);
    }
  }, [onChecklistChange]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  function toggleRow(documentId) {
    setExpandedId((prev) => (prev === documentId ? null : documentId));
    setUploadError(null);
  }

  async function handleFileSelected(documentId, event) {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingId(documentId);
    setUploadError(null);
    try {
      await uploadDocument(documentId, file);
      await fetchChecklist();
      setExpandedId(null);
    } catch (err) {
      setUploadError('Upload failed. Confirm the file is a PDF or image under 10MB and try again.');
    } finally {
      setUploadingId(null);
      event.target.value = '';
    }
  }

  async function handleBulkUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsBulkUploading(true);
    setBulkUploadError(null);

    try {
      const fileMap = {};
      Array.from(files).forEach((file) => {
        const name = file.name.toLowerCase();
        if (name.includes('passport')) fileMap.passport = file;
        else if (name.includes('transcript')) fileMap.transcript = file;
        else if (name.includes('language') || name.includes('ielts') || name.includes('toefl')) fileMap.language_test = file;
        else if (name.includes('statement')) fileMap.personal_statement = file;
        else if (name.includes('reference') || name.includes('letter')) fileMap.reference_letter = file;
        else if (name.includes('bank')) fileMap.bank_statement = file;
        else if (name.includes('visa')) fileMap.visa = file;
        else if (name.includes('medical')) fileMap.medical = file;
        else if (name.includes('insurance')) fileMap.insurance = file;
        else if (name.includes('housing') || name.includes('confirmation')) fileMap.housing = file;
      });

      if (checklist.length > 0) {
        const applicationId = checklist[0].application;
        await bulkUploadDocuments(applicationId, fileMap);
        await fetchChecklist();
      } else {
        setBulkUploadError('No active application found. Please submit an application first.');
      }
    } catch (err) {
      setBulkUploadError('Bulk upload failed. Please try uploading individual documents.');
    } finally {
      setIsBulkUploading(false);
      event.target.value = '';
    }
  }

  const total = checklist.length;
  const uploaded = checklist.filter((doc) => doc.file_attachment !== null && doc.file_attachment !== '').length;
  const hasDocuments = total > 0;
  const isInCompliancePhase = checklist.some((item) =>
    item.verification_status === 'PENDING' ||
    item.verification_status === 'AWAITING_REVIEW' ||
    item.verification_status === 'ACTION_REQUIRED'
  );

  return (
    <section className="border border-slate-200 bg-white shadow-sm rounded-none">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 p-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Compliance Checklist Vault</h2>
          <p className="mt-1 text-xs text-slate-500">Required documentation for your active application</p>
        </div>
        {hasDocuments && isInCompliancePhase && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBulkUploading}
              className="flex items-center gap-1.5 border border-slate-800 bg-slate-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white rounded-none hover:bg-slate-900 disabled:opacity-50"
            >
              {isBulkUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Upload All Documents
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              disabled={isBulkUploading}
              onChange={handleBulkUpload}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
          </div>
        )}
      </div>

      {hasDocuments && isInCompliancePhase && (
        <div className="px-6 pt-4">
          <DocumentSummary checklist={checklist} />
        </div>
      )}

      {bulkUploadError && (
        <div className="mx-6 mt-3 flex items-center gap-2 border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 rounded-none">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {bulkUploadError}
        </div>
      )}

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
              const isActionable = item.verification_status === 'PENDING' || item.verification_status === 'ACTION_REQUIRED';

              return (
                <Fragment key={item.id}>
                  <tr
                    onClick={() => isActionable && toggleRow(item.id)}
                    className={`border-b border-slate-100 ${
                      isActionable ? 'cursor-pointer hover:bg-slate-50' : ''
                    }`}
                  >
                    <td className="flex items-center gap-2 px-6 py-3 font-medium text-slate-800">
                      <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                      {documentTypeLabel(item.document_type)}
                    </td>
                    <td className="px-6 py-3">
                      <ChecklistStatusBadge status={item.verification_status} />
                    </td>
                    <td className="px-6 py-3 text-slate-500">{item.updated_at}</td>
                  </tr>

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
                  No checklist items assigned yet. Your application will generate documents once it reaches the Compliance Phase.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}

// ── TOP-LEVEL: StudentDashboard ─────────────────────────────────────────────
export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState('DRAFT');
  const [allApplications, setAllApplications] = useState([]);
  const [isHighSchoolTrack, setIsHighSchoolTrack] = useState(false);
  const [isTogglingHighSchool, setIsTogglingHighSchool] = useState(false);
  const [checklist, setChecklist] = useState([]);
  const [hasActionRequiredItems, setHasActionRequiredItems] = useState(false);

  const loadInitialData = useCallback(async () => {
    setIsProfileLoading(true);
    const [profileResult, progressResult] = await Promise.allSettled([
      getStudentProfile(),
      getApplicationProgress(),
    ]);

    if (profileResult.status === 'fulfilled') {
      setProfile(profileResult.value.data);
      setIsHighSchoolTrack(Boolean(profileResult.value.data.is_high_school_track));
    } else {
      console.error('GlobalScholar: failed to load student profile:', profileResult.reason);
    }

    if (progressResult.status === 'fulfilled') {
      setCurrentStage(progressResult.value.data.status || 'DRAFT');
      setAllApplications(progressResult.value.data.applications || []);
    } else {
      console.error('GlobalScholar: failed to load applications:', progressResult.reason);
    }

    setIsProfileLoading(false);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  async function handleToggleHighSchool() {
    const nextValue = !isHighSchoolTrack;
    setIsHighSchoolTrack(nextValue);
    setIsTogglingHighSchool(true);
    try {
      await updateHighSchoolTracking(nextValue);
    } catch (err) {
      setIsHighSchoolTrack(!nextValue);
    } finally {
      setIsTogglingHighSchool(false);
    }
  }

  const hasPendingDocuments = checklist.some(
    (doc) => doc.verification_status === 'PENDING' || doc.verification_status === 'ACTION_REQUIRED'
  );

  const unlisted = profile?.unlisted_university_request;
  const isVaultLocked = Boolean(unlisted && unlisted.requested && !unlisted.verified);

  return (
    <div className="bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Strip */}
        <header className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white shadow-sm rounded-none p-6">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Student Workspace</h1>
            <p className="text-xs text-slate-500">
              {isProfileLoading ? 'Loading profile…' : profile ? `Welcome back, ${profile.first_name}.` : 'Profile unavailable'}
            </p>
          </div>
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

        {/* Status Banner */}
        <StatusBanner
          status={currentStage}
          hasPendingDocuments={hasPendingDocuments}
          applicationCount={allApplications.length}
        />

        {/* Unlisted University Banner */}
        {isVaultLocked && (
          <div className="flex items-center gap-3 border border-amber-500 bg-amber-50 p-4 rounded-none">
            <Lock className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              Your request for <span className="font-semibold">{unlisted.name}</span> (an unlisted university) is awaiting
              Home Admin verification. Compliance tasks unlock automatically once it is approved.
            </p>
          </div>
        )}

        {/* 1. Progress Board */}
        <ProgressBoard
          currentStageKey={currentStage}
          applicationCount={allApplications.length}
        />

        {/* 2. My Applications */}
        <MyApplications
          applications={allApplications}
          onRefresh={loadInitialData}
        />

        {/* 3. Pre-Application Catalog */}
        <UniversityCatalog
          existingApplications={allApplications}
          onApplied={loadInitialData}
        />

        {/* 4. Compliance Checklist Vault */}
        <LockOverlay isLocked={isVaultLocked} reason="Locked until your unlisted university is verified">
          <ComplianceVault onChecklistChange={(items) => {
            setChecklist(items);
            setHasActionRequiredItems(items.some((i) => i.verification_status === 'ACTION_REQUIRED'));
          }} />
        </LockOverlay>

        {/* Action Required Banner */}
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