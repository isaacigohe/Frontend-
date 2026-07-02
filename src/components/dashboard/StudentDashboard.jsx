// =============================================================================
// StudentDashboard.jsx
// -----------------------------------------------------------------------------
// PHASE 3 — GlobalScholar Student Workspace
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
  Globe,
  Languages,
  Loader2,
  CircleCheck,
  MapPin,
} from 'lucide-react';
import {
  getStudentProfile,
  getApplicationProgress,
  getUniversities,
  getDocumentChecklist,
  uploadDocument,
  updateHighSchoolTracking,
} from '../../api/students';

// Import our shared, polished badge components directly
import { AdvisoryBadge } from '../shared/DashboardUI';

// -----------------------------------------------------------------------------
// STATIC CONFIG
// -----------------------------------------------------------------------------
const PIPELINE_STAGES = [
  { key: 'DRAFT', label: 'Draft', icon: FileEdit },
  { key: 'SUBMITTED', label: 'Submitted', icon: Send },
  { key: 'UNDER_REVIEW', label: 'Under Review', icon: Search },
  { key: 'COMPLIANCE_PHASE', label: 'Compliance Phase', icon: ShieldCheck },
  { key: 'APPROVED', label: 'Approved', icon: CheckCircle2 },
];

const PAGE_SIZE = 10;

const COUNTRY_OPTIONS = ['All Countries', 'United States', 'United Kingdom', 'Germany', 'Japan', 'South Korea', 'Australia', 'France', 'Spain'];
const LANGUAGE_OPTIONS = ['All Languages', 'English', 'German', 'Japanese', 'Korean', 'French', 'Spanish'];

// -----------------------------------------------------------------------------
// SMALL PRESENTATIONAL SUBCOMPONENTS
// -----------------------------------------------------------------------------

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

function ChecklistStatusBadge({ status }) {
  const map = {
    ACTION_REQUIRED: { border: 'border-red-600', text: 'text-red-700', label: 'Action Required' },
    PENDING_REVIEW: { border: 'border-slate-400', text: 'text-slate-600', label: 'Pending Review' },
    VERIFIED: { border: 'border-emerald-500', text: 'text-emerald-700', label: 'Verified' },
  };
  const style = map[status] || map.PENDING_REVIEW;
  return (
    <span className={`inline-block border ${style.border} ${style.text} px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-none`}>
      {style.label}
    </span>
  );
}

// -----------------------------------------------------------------------------
// PROGRESS BOARD
// -----------------------------------------------------------------------------
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
            <div key={stage.key} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center border-2 rounded-none transition-all duration-200 ${
                    isComplete
                      ? 'border-navy-900 bg-navy-900 text-white'
                      : isActive
                      ? 'stepper-node-active'
                      : 'border-slate-300 bg-white text-slate-300'
                  }`}
                >
                  {isComplete ? <CircleCheck className="h-5 w-5" /> : <StageIcon className="h-5 w-5" />}
                </div>
                <span
                  className={`text-center text-[11px] font-semibold uppercase tracking-wide ${
                    isActive ? 'text-navy-900 font-bold' : isComplete ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              {!isLast && <div className={`mx-2 h-0.5 flex-1 ${isComplete ? 'bg-gold-500' : 'bg-slate-300'}`} />}
            </div>
          );
        })}
      </div>
    </section>
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

// -----------------------------------------------------------------------------
// PRE-APPLICATION CATALOG
// -----------------------------------------------------------------------------
function UniversityCatalog() {
  const [universities, setUniversities] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [country, setCountry] = useState('All Countries');
  const [language, setLanguage] = useState('All Languages');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-navy-900" />
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
            <tr className="data-table-header text-white">
              <th className="px-6 py-3">University</th>
              <th className="px-6 py-3">Country</th>
              <th className="px-6 py-3">Language(s)</th>
              <th className="px-6 py-3">Travel Advisory</th>
            </tr>
          </thead>
          <tbody>
            {universities.map((uni) => (
              <tr key={uni.id} className="data-table-row">
                <td className="px-6 py-3 font-medium text-slate-800">{uni.name}</td>
                <td className="px-6 py-3 text-slate-600">{uni.country}</td>
                <td className="px-6 py-3 text-slate-600">{uni.languages_offered || 'Not Specified'}</td>
                <td className="px-6 py-3">
                  <AdvisoryBadge level={uni.travel_advisory_level} />
                </td>
              </tr>
            ))}
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
            onClick={() => setPage((prev) => prev - 1)}
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
  const [expandedId, setExpandedId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadError, setUploadError] = useState(null);

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

  return (
    <section className="border border-slate-200 bg-white shadow-sm rounded-none">
      <div className="border-b border-slate-200 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Compliance Checklist Vault</h2>
        <p className="mt-1 text-xs text-slate-500">Required documentation for your active application</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-navy-900" />
          Loading checklist…
        </div>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="data-table-header text-white">
              <th className="px-6 py-3">Document</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {checklist.map((item) => (
              <Fragment key={item.id}>
                <tr
                  onClick={() => item.status === 'ACTION_REQUIRED' && toggleRow(item.id)}
                  className={`border-b border-slate-100 ${
                    item.status === 'ACTION_REQUIRED' ? 'cursor-pointer hover:bg-red-50' : ''
                  }`}
                >
                  <td className="flex items-center gap-2 px-6 py-3 font-medium text-slate-800">
                    <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                    {item.document_name}
                  </td>
                  <td className="px-6 py-3">
                    <ChecklistStatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-3 text-slate-500">{item.updated_at}</td>
                </tr>

                {expandedId === item.id && item.status === 'ACTION_REQUIRED' && (
                  <tr className="border-b border-slate-100 bg-red-50">
                    <td colSpan={3} className="px-6 py-4">
                      <div className="flex items-start gap-3 border border-red-300 bg-white p-4 rounded-none">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Reviewer Comment</p>
                          <p className="mt-1 text-sm text-slate-700">{item.admin_comment}</p>

                          <div className="mt-3 flex items-center gap-3">
                            <label className="flex cursor-pointer items-center gap-2 border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 rounded-none hover:border-slate-500">
                              <UploadCloud className="h-3.5 w-3.5" />
                              {uploadingId === item.id ? 'Uploading…' : 'Choose Replacement File'}
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
            ))}
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
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState('DRAFT');
  const [isHighSchoolTrack, setIsHighSchoolTrack] = useState(false);
  const [isTogglingHighSchool, setIsTogglingHighSchool] = useState(false);
  const [hasActionRequiredItems, setHasActionRequiredItems] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      setIsProfileLoading(true);
      try {
        const [profileRes, progressRes] = await Promise.all([getStudentProfile(), getApplicationProgress()]);
        setProfile(profileResRes?.data || profileRes.data);
        setIsHighSchoolTrack(Boolean(profileRes.data.is_high_school_track));
        setCurrentStage(progressRes.data.status);
      } catch (err) {
        // Fallback handled via profile state check
      } finally {
        setIsProfileLoading(false);
      }
    }
    loadInitialData();
  }, []);

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

  const unlisted = profile?.unlisted_university_request;
  const isVaultLocked = Boolean(unlisted && unlisted.requested && !unlisted.verified);

  return (
    <div className="min-h-screen bg-canvas p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white shadow-sm rounded-none p-6">
          <div>
            <h1 className="text-lg font-bold text-navy-900 uppercase tracking-wide">Student Workspace</h1>
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
            className={`flex items-center gap-2 px-4 py-2 border text-xs font-semibold uppercase tracking-wide transition-colors ${
              isHighSchoolTrack 
                ? 'bg-navy-900 border-navy-900 text-white' 
                : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
            }`}
          >
            {isHighSchoolTrack ? 'High School Tracking Enabled' : 'Enable High School Tracking'}
          </button>
        </header>

        <ProgressBoard currentStageKey={currentStage} />

        <div className="grid grid-cols-1 gap-6">
          <UniversityCatalog />
          
          <LockOverlay isLocked={isVaultLocked} reason="Your document checklist is locked until your requested unlisted institution has been verified by an advisor.">
            <ComplianceVault onChecklistChange={(items) => setHasActionRequiredItems(items.some(i => i.status === 'ACTION_REQUIRED'))} />
          </LockOverlay>
        </div>
      </div>
    </div>
  );
}