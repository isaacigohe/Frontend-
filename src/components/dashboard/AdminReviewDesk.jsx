// =============================================================================
// AdminReviewDesk.jsx
// -----------------------------------------------------------------------------
// PHASE 4a — GlobalScholar Admin (HOME_ADMIN) Review Split-Panel Desk
// WITH PROGRAM MANAGEMENT - Admins can add/edit/delete programs for any university
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
  Users,
  Clock,
  Check,
  X,
  GraduationCap,
  CalendarClock,
  Edit,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { CustomDropdown, Badge, PaginationFooter, LoadingRow, EmptyState, documentTypeLabel, LANGUAGE_CHOICES, degreeLevelLabel } from './shared/DashboardUI';
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
import {
  getUniversities,
  getUniversityPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
} from '../../api/client';

const PAGE_SIZE = 10;
const STATUS_FILTER_OPTIONS = ['All Statuses', 'SUBMITTED', 'UNDER_REVIEW', 'COMPLIANCE_PHASE', 'APPROVED', 'REJECTED'];

// ── Status Summary Cards ─────────────────────────────────────────────────────
function StatusSummary({ applications }) {
  const counts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const total = applications.length;
  const submitted = counts.SUBMITTED || 0;
  const underReview = counts.UNDER_REVIEW || 0;
  const compliance = counts.COMPLIANCE_PHASE || 0;
  const approved = counts.APPROVED || 0;
  const rejected = counts.REJECTED || 0;

  return (
    <div className="grid grid-cols-5 gap-2 mb-4">
      <div className="border border-slate-200 bg-white p-3 text-center shadow-sm rounded-none">
        <p className="text-lg font-bold text-slate-700">{total}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total</p>
      </div>
      <div className="border border-slate-200 bg-white p-3 text-center shadow-sm rounded-none">
        <p className="text-lg font-bold text-amber-600">{submitted}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Submitted</p>
      </div>
      <div className="border border-slate-200 bg-white p-3 text-center shadow-sm rounded-none">
        <p className="text-lg font-bold text-orange-600">{underReview}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Under Review</p>
      </div>
      <div className="border border-slate-200 bg-white p-3 text-center shadow-sm rounded-none">
        <p className="text-lg font-bold text-gold-600">{compliance}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Compliance</p>
      </div>
      <div className="border border-slate-200 bg-white p-3 text-center shadow-sm rounded-none">
        <p className="text-lg font-bold text-emerald-600">{approved}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Approved</p>
      </div>
    </div>
  );
}

// ── Tone mapping for status badges ──────────────────────────────────────────
function toneForStatus(status) {
  switch (status) {
    case 'APPROVED': return 'emerald';
    case 'REJECTED':
    case 'ACTION_REQUIRED': return 'red';
    case 'UNDER_REVIEW':
    case 'AWAITING_REVIEW': return 'amber';
    case 'COMPLIANCE_PHASE': return 'orange';
    default: return 'slate';
  }
}

// ── ReasonGate ──────────────────────────────────────────────────────────────
function ReasonGate({ label, confirmLabel, tone, onConfirm, onCancel, isSubmitting }) {
  const [comment, setComment] = useState('');
  const isValid = comment.trim().length > 0;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter' && e.ctrlKey && isValid && !isSubmitting) {
      onConfirm(comment.trim());
    }
  };

  return (
    <div className={`border ${tone === 'red' ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'} p-3 rounded-none`}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">{label}</label>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder="Describe exactly what the student must correct…"
        className="w-full resize-none border border-slate-300 bg-white p-2 text-sm text-slate-800 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
      />
      <div className="mt-2 flex items-center justify-between">
        {!isValid && <span className="text-[11px] font-medium text-slate-500">A description is required to submit.</span>}
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onCancel} className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 rounded-none hover:border-slate-400">Cancel</button>
          <button
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={() => onConfirm(comment.trim())}
            className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-none disabled:cursor-not-allowed disabled:opacity-40 ${
              tone === 'red' ? 'border-red-600 bg-red-600 text-white hover:bg-red-700' : 'border-amber-600 bg-amber-600 text-white hover:bg-amber-700'
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

// ── LEFT PANEL — Applicant Review Queue ────────────────────────────────────
function ApplicantQueue({ selectedId, onSelect }) {
  const [applications, setApplications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => setSearchQuery(searchInput), 400);
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

        {!isLoading && applications.length > 0 && <StatusSummary applications={applications} />}

        <div className="flex gap-2">
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
                  className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${selectedId === app.id ? 'bg-slate-100' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{app.student_name}</td>
                  <td className="px-4 py-3 text-slate-600">{app.university_name}</td>
                  <td className="px-4 py-3"><Badge tone={toneForStatus(app.status)}>{app.status.replace(/_/g, ' ')}</Badge></td>
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

// ── RIGHT PANEL — Document Inspection Viewer ──────────────────────────────
function DocumentInspector({ applicationId, onApplicationMutated }) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeGate, setActiveGate] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!applicationId) return;
    setIsLoading(true);
    setActiveGate(null);
    try {
      const response = await getApplicationDetail(applicationId);
      setDetail(response.data);
    } catch (err) {
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  async function handleVerifyDocument(documentId) {
    setActionError(null);
    try {
      await verifyDocument(documentId);
      await fetchDetail();
    } catch (err) {
      setActionError('Could not verify the document. Please retry.');
    }
  }

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

  async function handleApprove() {
    setActionError(null);
    try {
      await approveApplication(applicationId, detail.status);
      await fetchDetail();
      if (onApplicationMutated) onApplicationMutated();
    } catch (err) {
      setActionError(err?.response?.data?.status?.[0] || err?.response?.data?.detail || 'Could not advance the application.');
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
      setActionError('Could not reject the application.');
    } finally {
      setIsSubmittingAction(false);
    }
  }

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

  const isFinalized = detail.status === 'APPROVED' || detail.status === 'REJECTED';

  return (
    <section className="flex h-full flex-col border border-slate-200 bg-white shadow-sm rounded-none">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {detail.student_detail?.full_name ?? detail.student_name ?? 'Student'}
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
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {actionError}
          </div>
        )}

        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Submitted Documents</h3>
        <div className="space-y-2">
          {detail.documents.map((doc) => (
            <div key={doc.id} className="border border-slate-200 p-3 rounded-none">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-800">{documentTypeLabel(doc.document_type)}</span>
                  <Badge tone={toneForStatus(doc.verification_status)}>{doc.verification_status.replace(/_/g, ' ')}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {doc.file_attachment && (
                    <a href={doc.file_attachment} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-900">
                      <ExternalLink className="h-3.5 w-3.5" /> View
                    </a>
                  )}
                  <button type="button" onClick={() => handleVerifyDocument(doc.id)} className="flex items-center gap-1 border border-emerald-600 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 rounded-none hover:bg-emerald-50">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verify
                  </button>
                  <button type="button" onClick={() => setActiveGate({ type: 'FLAG_DOCUMENT', documentId: doc.id })} className="flex items-center gap-1 border border-red-600 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 rounded-none hover:bg-red-50">
                    <AlertTriangle className="h-3.5 w-3.5" /> Flag
                  </button>
                </div>
              </div>
              {doc.verification_status === 'ACTION_REQUIRED' && doc.admin_comment && activeGate?.documentId !== doc.id && (
                <p className="mt-2 border-l-2 border-red-400 pl-2 text-xs text-slate-600">{doc.admin_comment}</p>
              )}
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

      <div className="border-t border-slate-200 p-4">
        {isFinalized ? (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Lock className="h-3.5 w-3.5" />
            This application is finalized ({detail.status.replace(/_/g, ' ')}) — no further action possible.
          </div>
        ) : activeGate?.type === 'REJECT_APPLICATION' ? (
          <ReasonGate label="Reason for rejecting this application" confirmLabel="Confirm Rejection" tone="red" isSubmitting={isSubmittingAction} onCancel={() => setActiveGate(null)} onConfirm={handleReject} />
        ) : (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setActiveGate({ type: 'REJECT_APPLICATION' })} className="flex items-center gap-1.5 border border-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-700 rounded-none hover:bg-red-50">
              <XCircle className="h-4 w-4" /> Reject
            </button>
            <button type="button" onClick={handleApprove} className="flex items-center gap-1.5 border border-slate-800 bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white rounded-none hover:bg-slate-900">
              <ArrowRight className="h-4 w-4" />
              Advance to {(FORWARD_TRANSITIONS[detail.status] || 'Next Stage').replace(/_/g, ' ')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ── PROGRAM MANAGEMENT ──────────────────────────────────────────────────────

// ── Add/Edit Program Form ──────────────────────────────────────────────────
function ProgramForm({ universityId, program, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: program?.name || '',
    degree_level: program?.degree_level || 'BACHELOR',
    duration_semesters: program?.duration_semesters || 8,
    tuition_per_semester_usd: program?.tuition_per_semester_usd || '',
    credits_transferable: program?.credits_transferable !== undefined ? program.credits_transferable : true,
    application_deadline: program?.application_deadline || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const DEGREE_LEVELS = [
    { value: 'BACHELOR', label: "Bachelor's" },
    { value: 'MASTER', label: "Master's" },
    { value: 'PHD', label: 'PhD' },
    { value: 'EXCHANGE', label: 'Exchange / Non-degree' },
    { value: 'DIPLOMA', label: 'Diploma' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        degree_level: formData.degree_level,
        duration_semesters: parseInt(formData.duration_semesters),
        tuition_per_semester_usd: formData.tuition_per_semester_usd ? parseFloat(formData.tuition_per_semester_usd) : null,
        credits_transferable: formData.credits_transferable,
        application_deadline: formData.application_deadline || null,
      };

      if (program) {
        await updateProgram(program.id, payload);
      } else {
        await createProgram(universityId, payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      const responseData = err?.response?.data;
      if (typeof responseData === 'object') {
        const firstKey = Object.keys(responseData)[0];
        setError(responseData[firstKey]?.[0] || 'Could not save program.');
      } else {
        setError('Could not save program. Please check the form.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-slate-300 bg-white p-4 shadow-sm rounded-none mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
          {program ? 'Edit Program' : 'Add New Program'}
        </h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 rounded-none">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Program Name <span className="text-red-600">*</span></label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Computer Science"
            className="w-full border border-slate-300 px-3 py-2 text-sm rounded-none focus:border-gold-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Degree Level <span className="text-red-600">*</span></label>
          <select
            name="degree_level"
            value={formData.degree_level}
            onChange={handleChange}
            className="w-full border border-slate-300 bg-white px-3 py-2 text-sm rounded-none focus:border-gold-500 focus:outline-none"
          >
            {DEGREE_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Duration (Semesters) <span className="text-red-600">*</span></label>
          <input
            type="number"
            name="duration_semesters"
            value={formData.duration_semesters}
            onChange={handleChange}
            required
            min="1"
            max="20"
            className="w-full border border-slate-300 px-3 py-2 text-sm rounded-none focus:border-gold-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Tuition (USD/Semester)</label>
          <input
            type="number"
            name="tuition_per_semester_usd"
            value={formData.tuition_per_semester_usd}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="15000"
            className="w-full border border-slate-300 px-3 py-2 text-sm rounded-none focus:border-gold-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Application Deadline</label>
          <input
            type="date"
            name="application_deadline"
            value={formData.application_deadline}
            onChange={handleChange}
            className="w-full border border-slate-300 px-3 py-2 text-sm rounded-none focus:border-gold-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <input
              type="checkbox"
              name="credits_transferable"
              checked={formData.credits_transferable}
              onChange={handleChange}
            />
            Credits Transferable
          </label>
        </div>

        <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
          <button type="button" onClick={onClose} className="border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 rounded-none hover:border-slate-400">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5 border border-slate-800 bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white rounded-none hover:bg-slate-900 disabled:opacity-50">
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {program ? 'Update Program' : 'Add Program'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Program List for a University ──────────────────────────────────────────
function ProgramList({ universityId, onRefresh }) {
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPrograms = useCallback(async () => {
    if (!universityId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getUniversityPrograms(universityId);
      setPrograms(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (err) {
      setError('Could not load programs.');
      setPrograms([]);
    } finally {
      setIsLoading(false);
    }
  }, [universityId]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleDelete = async (programId) => {
    if (!confirm('Are you sure you want to delete this program?')) return;
    setIsDeleting(true);
    try {
      await deleteProgram(programId);
      await fetchPrograms();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Could not delete program.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!universityId) {
    return <p className="text-sm text-slate-400 py-4">Select a university to manage its programs.</p>;
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Programs ({programs.length})
        </h4>
        <button
          type="button"
          onClick={() => {
            setEditingProgram(null);
            setShowForm(true);
          }}
          className="flex items-center gap-1 border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 rounded-none hover:border-slate-400"
        >
          <Plus className="h-3.5 w-3.5" /> Add Program
        </button>
      </div>

      {showForm && (
        <ProgramForm
          universityId={universityId}
          program={editingProgram}
          onClose={() => {
            setShowForm(false);
            setEditingProgram(null);
          }}
          onSuccess={() => {
            fetchPrograms();
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {isLoading ? (
        <LoadingRow label="Loading programs…" />
      ) : error ? (
        <p className="py-2 text-sm text-red-600">{error}</p>
      ) : programs.length === 0 ? (
        <p className="py-2 text-xs text-slate-400">No programs added yet. Click "Add Program" to create one.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 font-semibold text-slate-500">Name</th>
                <th className="px-3 py-2 font-semibold text-slate-500">Degree</th>
                <th className="px-3 py-2 font-semibold text-slate-500">Duration</th>
                <th className="px-3 py-2 font-semibold text-slate-500">Tuition</th>
                <th className="px-3 py-2 font-semibold text-slate-500">Deadline</th>
                <th className="px-3 py-2 font-semibold text-slate-500">Credits</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((program) => (
                <tr key={program.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-700">{program.name}</td>
                  <td className="px-3 py-2 text-slate-600">{program.degree_level?.replace(/_/g, ' ') || '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{program.duration_semesters}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {program.tuition_per_semester_usd ? `$${Number(program.tuition_per_semester_usd).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {program.application_deadline ? new Date(program.application_deadline).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {program.credits_transferable ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProgram(program);
                        setShowForm(true);
                      }}
                      className="text-slate-400 hover:text-navy-600 mr-2"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(program.id)}
                      disabled={isDeleting}
                      className="text-slate-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── RegisterUniversityPanel (UPDATED with Program Management) ──────────────
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
  const [registeredUniversityId, setRegisteredUniversityId] = useState(null);

  function handleChange(field, value) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }

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
      const response = await registerUniversity(payload);
      const universityId = response.data.id;
      setRegisteredUniversityId(universityId);
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
      // Don't close the panel - show the program management section instead
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

      {/* Registration Form */}
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
        <select
          value={formValues.primary_language}
          onChange={(e) => handleChange('primary_language', e.target.value)}
          className="border border-slate-300 bg-white px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
        >
          {LANGUAGE_CHOICES.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
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
          onClick={() => {
            setRegisteredUniversityId(null);
            onClose();
          }}
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

      {/* Show Program Management after registration */}
      {registeredUniversityId && (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">University Registered! Add Programs:</span>
          </div>
          <ProgramList universityId={registeredUniversityId} onRefresh={() => {}} />
          <button
            type="button"
            onClick={() => {
              setRegisteredUniversityId(null);
              onClose();
            }}
            className="mt-3 border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 rounded-none hover:border-slate-400"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

// ── University Manager ──────────────────────────────────────────────────────
function UniversityManager() {
  const [universities, setUniversities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUniversityId, setSelectedUniversityId] = useState(null);
  const [isRegisterPanelOpen, setIsRegisterPanelOpen] = useState(false);

  const fetchUniversities = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getUniversities({ page: 1, page_size: 100 });
      const data = response.data.results || response.data || [];
      setUniversities(data);
    } catch (err) {
      setUniversities([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  return (
    <div className="bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">University & Program Management</h1>
            <p className="text-xs text-slate-500">Register new universities and manage their academic programs.</p>
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
          onRegistered={fetchUniversities}
        />

        <section className="border border-slate-200 bg-white shadow-sm rounded-none">
          {isLoading ? (
            <LoadingRow label="Loading universities…" />
          ) : universities.length === 0 ? (
            <EmptyState label="No universities registered yet. Click 'Register University' to add one." />
          ) : (
            <div className="divide-y divide-slate-100">
              {universities.map((uni) => {
                const isSelected = selectedUniversityId === uni.id;
                return (
                  <div key={uni.id}>
                    <div
                      onClick={() => setSelectedUniversityId(isSelected ? null : uni.id)}
                      className={`flex cursor-pointer items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-slate-50' : ''}`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{uni.name}</p>
                        <p className="text-xs text-slate-500">{uni.country} · {uni.city || 'City not set'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">GPA: {uni.minimum_gpa}</span>
                        <span className="text-xs text-slate-400">{uni.primary_language}</span>
                        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {isSelected && (
                      <div className="bg-slate-50 px-6 py-4">
                        <ProgramList universityId={uni.id} onRefresh={fetchUniversities} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── TOP-LEVEL: AdminReviewDesk ─────────────────────────────────────────────
export default function AdminReviewDesk() {
  const [selectedId, setSelectedId] = useState(null);
  const [queueRefreshToken, setQueueRefreshToken] = useState(0);
  const [isRegisterPanelOpen, setIsRegisterPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState('review'); // 'review' | 'programs'

  return (
    <div className="bg-slate-100 p-6 pb-6">
      <div className="mx-auto max-w-7xl">
        {/* Toggle between Review Desk and Program Management */}
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode('review')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide border rounded-none transition-colors ${
              viewMode === 'review'
                ? 'border-slate-800 bg-slate-800 text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            Review Desk
          </button>
          <button
            type="button"
            onClick={() => setViewMode('programs')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide border rounded-none transition-colors ${
              viewMode === 'programs'
                ? 'border-slate-800 bg-slate-800 text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            Program Management
          </button>
        </div>

        {viewMode === 'review' ? (
          <>
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

            <div className="grid min-h-[600px] grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <ApplicantQueue key={queueRefreshToken} selectedId={selectedId} onSelect={setSelectedId} />
              <DocumentInspector applicationId={selectedId} onApplicationMutated={() => setQueueRefreshToken((n) => n + 1)} />
            </div>
          </>
        ) : (
          <UniversityManager />
        )}
      </div>
    </div>
  );
}