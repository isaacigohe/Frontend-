// =============================================================================
// HostCoordinatorDashboard.jsx
// -----------------------------------------------------------------------------
// Host Coordinator Dashboard - Shows only applications for their assigned university.
// =============================================================================

import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Users,
  ChevronRight,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
  ExternalLink,
  ShieldCheck,
  Plus,
  X,
  Search,
  Building2,
} from 'lucide-react';
import { CustomDropdown, Badge, EmptyState, LoadingRow, documentTypeLabel } from './shared/DashboardUI';
import {
  getHostApplications,
  getHostApplicationDetail,
  approveHostApplication,
  rejectHostApplication,
  getHostDocumentChecklist,
  reviewHostDocument,
} from '../../api/hostcoord';
import {
  getCreditTransfers,
  createCreditTransfer,
  updateCreditTransfer,
} from '../../api/client';

const STATUS_FILTER_OPTIONS = ['All Statuses', 'SUBMITTED', 'UNDER_REVIEW', 'COMPLIANCE_PHASE', 'APPROVED', 'REJECTED'];

function toneForStatus(status) {
  switch (status) {
    case 'APPROVED': return 'emerald';
    case 'REJECTED': return 'red';
    case 'UNDER_REVIEW': return 'amber';
    case 'COMPLIANCE_PHASE': return 'orange';
    case 'SUBMITTED': return 'navy';
    default: return 'slate';
  }
}

// ── ReasonGate ───────────────────────────────────────────────────────────
function ReasonGate({ label, confirmLabel, tone, onConfirm, onCancel, isSubmitting }) {
  const [comment, setComment] = useState('');
  const isValid = comment.trim().length > 0;

  return (
    <div className={`border ${tone === 'red' ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'} p-3 rounded-none`}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">{label}</label>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={3}
        placeholder="Describe exactly why this application is being rejected…"
        className="w-full resize-none border border-slate-300 bg-white p-2 text-sm text-slate-800 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
      />
      <div className="mt-2 flex items-center justify-between">
        {!isValid && <span className="text-[11px] font-medium text-slate-500">A reason is required to reject.</span>}
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
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Document Inspector ──────────────────────────────────────────────────
function DocumentInspector({ applicationId, onActionComplete }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [activeGate, setActiveGate] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!applicationId) return;
    setIsLoading(true);
    try {
      const response = await getHostDocumentChecklist(applicationId);
      setDocuments(response.data.results || response.data || []);
    } catch (err) {
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function handleVerifyDocument(documentId) {
    setActionError(null);
    try {
      await reviewHostDocument(documentId, { verification_status: 'APPROVED' });
      await fetchDocuments();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setActionError('Could not verify the document. Please retry.');
    }
  }

  async function handleFlagDocument(documentId, comment) {
    setIsSubmittingAction(true);
    setActionError(null);
    try {
      await reviewHostDocument(documentId, { verification_status: 'ACTION_REQUIRED', admin_comment: comment });
      setActiveGate(null);
      await fetchDocuments();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setActionError('Could not flag the document. Please retry.');
    } finally {
      setIsSubmittingAction(false);
    }
  }

  if (!applicationId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 border border-slate-200 bg-white p-10 text-center rounded-none">
        <FileText className="h-6 w-6 text-slate-300" />
        <p className="text-sm text-slate-400">Select an application to inspect documents.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 bg-white p-4 rounded-none">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Submitted Documents</h3>
      {isLoading ? (
        <LoadingRow label="Loading documents…" />
      ) : actionError && (
        <div className="mb-3 flex items-center gap-2 border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 rounded-none">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {actionError}
        </div>
      )}
      <div className="space-y-2">
        {documents.length === 0 ? (
          <p className="text-sm text-slate-400">No documents submitted yet.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="border border-slate-200 p-3 rounded-none">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-800">{documentTypeLabel(doc.document_type)}</span>
                  <Badge tone={toneForStatus(doc.verification_status)}>
                    {doc.verification_status ? doc.verification_status.replace(/_/g, ' ') : 'PENDING'}
                  </Badge>
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
          ))
        )}
      </div>
    </div>
  );
}

// ── Credit Transfer Form ─────────────────────────────────────────────────
function CreditTransferForm({ applicationId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    host_course_code: '', host_course_name: '', host_credits: '', host_grade: '',
    home_equivalent_course_code: '', home_equivalent_course_name: '', home_credits_awarded: '',
    transfer_status: 'PENDING', denial_reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        host_course_code: formData.host_course_code.trim(),
        host_course_name: formData.host_course_name.trim(),
        host_credits: parseFloat(formData.host_credits),
        host_grade: formData.host_grade.trim(),
        home_equivalent_course_code: formData.home_equivalent_course_code.trim(),
        home_equivalent_course_name: formData.home_equivalent_course_name.trim(),
        home_credits_awarded: formData.home_credits_awarded ? parseFloat(formData.home_credits_awarded) : null,
        transfer_status: formData.transfer_status,
        denial_reason: formData.denial_reason.trim(),
      };
      await createCreditTransfer(applicationId, payload);
      onSuccess();
      onClose();
    } catch (err) {
      const responseData = err?.response?.data;
      let errorMessage = 'Could not create credit transfer.';
      if (typeof responseData === 'object') {
        const firstKey = Object.keys(responseData)[0];
        errorMessage = responseData[firstKey]?.[0] || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiresDenialReason = formData.transfer_status === 'DENIED' || formData.transfer_status === 'PARTIAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl border border-slate-200 bg-white shadow-lg rounded-none">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Add Credit Transfer</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 rounded-none">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Host Course Code <span className="text-red-600">*</span></label>
              <input type="text" name="host_course_code" value={formData.host_course_code} onChange={handleChange} required placeholder="CS401" className="w-full border border-slate-300 px-3 py-2 text-sm rounded-none focus:border-gold-500 focus:outline-none" /></div>
            <div><label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Host Course Name <span className="text-red-600">*</span></label>
              <input type="text" name="host_course_name" value={formData.host_course_name} onChange={handleChange} required placeholder="Advanced Programming" className="w-full border border-slate-300 px-3 py-2 text-sm rounded-none focus:border-gold-500 focus:outline-none" /></div>
            <div><label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Host Credits <span className="text-red-600">*</span></label>
              <input type="number" name="host_credits" value={formData.host_credits} onChange={handleChange} required step="0.01" min="0" placeholder="3.0" className="w-full border border-slate-300 px-3 py-2 text-sm rounded-none focus:border-gold-500 focus:outline-none" /></div>
            <div><label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Host Grade</label>
              <input type="text" name="host_grade" value={formData.host_grade} onChange={handleChange} placeholder="A" className="w-full border border-slate-300 px-3 py-2 text-sm rounded-none focus:border-gold-500 focus:outline-none" /></div>
            <div><label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Home Equivalent Course Code</label>
              <input type="text" name="home_equivalent_course_code" value={formData.home_equivalent_course_code} onChange={handleChange} placeholder="CS-400" className="w-full border border-slate-300 px-3 py-2 text-sm rounded-none focus:border-gold-500 focus:outline-none" /></div>
            <div><label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Home Equivalent Course Name</label>
              <input type="text" name="home_equivalent_course_name" value={formData.home_equivalent_course_name} onChange={handleChange} placeholder="Programming III" className="w-full border border-slate-300 px-3 py-2 text-sm rounded-none focus:border-gold-500 focus:outline-none" /></div>
            <div><label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Home Credits Awarded</label>
              <input type="number" name="home_credits_awarded" value={formData.home_credits_awarded} onChange={handleChange} step="0.01" min="0" placeholder="3.0" className="w-full border border-slate-300 px-3 py-2 text-sm rounded-none focus:border-gold-500 focus:outline-none" /></div>
            <div><label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Transfer Status <span className="text-red-600">*</span></label>
              <select name="transfer_status" value={formData.transfer_status} onChange={handleChange} className="w-full border border-slate-300 bg-white px-3 py-2 text-sm rounded-none focus:border-gold-500 focus:outline-none">
                <option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="DENIED">Denied</option><option value="PARTIAL">Partial</option>
              </select></div>
          </div>
          {requiresDenialReason && (
            <div className="mt-4"><label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Denial Reason <span className="text-red-600">*</span></label>
              <textarea name="denial_reason" value={formData.denial_reason} onChange={handleChange} required rows="3" placeholder="Explain why this credit transfer is being denied or only partially approved…" className="w-full resize-none border border-slate-300 px-3 py-2 text-sm rounded-none focus:border-gold-500 focus:outline-none" /></div>
          )}
          <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 rounded-none hover:border-slate-400">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5 border border-slate-800 bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white rounded-none hover:bg-slate-900 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Save Credit Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Credit Transfers List ──────────────────────────────────────────────
function CreditTransfersList({ applicationId }) {
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchTransfers = useCallback(async () => {
    if (!applicationId) return;
    setIsLoading(true);
    try {
      const response = await getCreditTransfers(applicationId);
      setTransfers(response.data.results || response.data || []);
    } catch (err) {
      setTransfers([]);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  if (!applicationId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-slate-400">
        <ClipboardList className="h-6 w-6" /> Select an application to manage credit transfers.
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Credit Transfers</h4>
        <button type="button" onClick={() => setShowForm(true)} className="flex items-center gap-1 border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 rounded-none hover:border-slate-400">
          <Plus className="h-3.5 w-3.5" /> Add Transfer
        </button>
      </div>
      {isLoading ? (
        <LoadingRow label="Loading credit transfers…" />
      ) : transfers.length === 0 ? (
        <p className="py-4 text-xs text-slate-400">No credit transfers added yet.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead><tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 font-semibold text-slate-500">Course Code</th>
              <th className="px-3 py-2 font-semibold text-slate-500">Course Name</th>
              <th className="px-3 py-2 font-semibold text-slate-500">Credits</th>
              <th className="px-3 py-2 font-semibold text-slate-500">Grade</th>
              <th className="px-3 py-2 font-semibold text-slate-500">Status</th>
            </tr></thead>
            <tbody>
              {transfers.map((transfer) => (
                <tr key={transfer.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-700">{transfer.host_course_code}</td>
                  <td className="px-3 py-2 text-slate-600">{transfer.host_course_name}</td>
                  <td className="px-3 py-2 text-slate-600">{transfer.host_credits}</td>
                  <td className="px-3 py-2 text-slate-600">{transfer.host_grade || '—'}</td>
                  <td className="px-3 py-2"><Badge tone={toneForStatus(transfer.transfer_status)}>{transfer.transfer_status.replace(/_/g, ' ')}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && <CreditTransferForm applicationId={applicationId} onClose={() => setShowForm(false)} onSuccess={() => fetchTransfers()} />}
    </div>
  );
}

// ── TOP-LEVEL: HostCoordinatorDashboard ─────────────────────────────────
export default function HostCoordinatorDashboard() {
  const [applications, setApplications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [activeRejectGate, setActiveRejectGate] = useState(null);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [hostUniversity, setHostUniversity] = useState(null);

  // ── Get the host university from stored user ──────────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem('gs_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setHostUniversity(user.host_university_name || 'your university');
      } catch (e) {
        setHostUniversity('your university');
      }
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'All Statuses') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const response = await getHostApplications(params);
      const data = response.data.results || response.data || [];
      setApplications(data);
      setTotalCount(data.length);
    } catch (err) {
      setError('Could not load applications. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  async function handleToggleRow(applicationId) {
    if (expandedId === applicationId) {
      setExpandedId(null);
      setSelectedApplication(null);
      return;
    }
    setExpandedId(applicationId);
    setIsDetailLoading(true);
    setActionError(null);
    try {
      const response = await getHostApplicationDetail(applicationId);
      setSelectedApplication(response.data);
    } catch (err) {
      setActionError('Could not load application details.');
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function handleApprove() {
    if (!selectedApplication) return;
    setActionError(null);
    try {
      await approveHostApplication(selectedApplication.id);
      await fetchApplications();
      const response = await getHostApplicationDetail(selectedApplication.id);
      setSelectedApplication(response.data);
    } catch (err) {
      setActionError(err?.response?.data?.detail || 'Could not approve the application.');
    }
  }

  async function handleReject(reason) {
    if (!selectedApplication) return;
    setIsSubmittingReject(true);
    setActionError(null);
    try {
      await rejectHostApplication(selectedApplication.id, reason);
      setActiveRejectGate(null);
      await fetchApplications();
      const response = await getHostApplicationDetail(selectedApplication.id);
      setSelectedApplication(response.data);
    } catch (err) {
      setActionError('Could not reject the application. Please retry.');
    } finally {
      setIsSubmittingReject(false);
    }
  }

  const submittedCount = applications.filter((a) => a.status === 'SUBMITTED').length;
  const underReviewCount = applications.filter((a) => a.status === 'UNDER_REVIEW').length;
  const complianceCount = applications.filter((a) => a.status === 'COMPLIANCE_PHASE').length;
  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;

  const getProgramName = (app) => {
    if (app.program_detail?.name) return app.program_detail.name;
    if (app.program_name) return app.program_name;
    if (app.program) return `Program #${app.program}`;
    return 'No Program';
  };

  const getStudentName = (app) => {
    if (app.student_detail?.full_name) return app.student_detail.full_name;
    if (app.student_name) return app.student_name;
    return 'Student';
  };

  return (
    <div className="bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white shadow-sm rounded-none p-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-500" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Host Coordinator Dashboard</h1>
              <p className="text-xs text-slate-500">
                Manage applications for <span className="font-semibold text-gold-600">{hostUniversity || 'your university'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search student or program…" className="w-48 border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400" />
            </div>
            <CustomDropdown label="Status" value={statusFilter} options={STATUS_FILTER_OPTIONS} onChange={setStatusFilter} />
          </div>
        </header>

        <div className="grid grid-cols-4 gap-4">
          <div className="border border-slate-200 bg-white p-4 shadow-sm rounded-none"><p className="text-2xl font-bold text-amber-600">{submittedCount}</p><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</p></div>
          <div className="border border-slate-200 bg-white p-4 shadow-sm rounded-none"><p className="text-2xl font-bold text-orange-600">{underReviewCount}</p><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Under Review</p></div>
          <div className="border border-slate-200 bg-white p-4 shadow-sm rounded-none"><p className="text-2xl font-bold text-gold-600">{complianceCount}</p><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compliance Phase</p></div>
          <div className="border border-slate-200 bg-white p-4 shadow-sm rounded-none"><p className="text-2xl font-bold text-emerald-600">{approvedCount}</p><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approved</p></div>
        </div>

        {error && (
          <div className="flex items-center gap-2 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 rounded-none">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <section className="border border-slate-200 bg-white shadow-sm rounded-none">
          {isLoading ? (
            <LoadingRow label="Loading applications…" />
          ) : applications.length === 0 ? (
            <EmptyState label="No applications available for your university." />
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="w-8 px-4 py-2" /><th className="px-4 py-2">Student</th><th className="px-4 py-2">Program</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <Fragment key={app.id}>
                    <tr onClick={() => handleToggleRow(app.id)} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400"><ChevronRight className={`h-4 w-4 transition-transform ${expandedId === app.id ? 'rotate-90' : ''}`} /></td>
                      <td className="px-4 py-3 font-medium text-slate-800">{getStudentName(app)}</td>
                      <td className="px-4 py-3 text-slate-600">{getProgramName(app)}</td>
                      <td className="px-4 py-3"><Badge tone={toneForStatus(app.status)}>{app.status ? app.status.replace(/_/g, ' ') : 'DRAFT'}</Badge></td>
                      <td className="px-4 py-3 text-slate-500">{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '—'}</td>
                    </tr>
                    {expandedId === app.id && (
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <td colSpan={5} className="px-4 py-4">
                          {isDetailLoading ? (
                            <LoadingRow label="Loading details…" />
                          ) : selectedApplication ? (
                            <div className="space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Application #{selectedApplication.id}</p>
                                  <p className="text-sm text-slate-600">Student: {getStudentName(selectedApplication)}</p>
                                  <p className="text-sm text-slate-600">Program: {getProgramName(selectedApplication)}</p>
                                  <p className="text-sm text-slate-600">GPA at submission: {selectedApplication.gpa_at_submission || 'N/A'}</p>
                                  {selectedApplication.rejection_reason && <p className="text-sm text-red-600">Rejection reason: {selectedApplication.rejection_reason}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                  {selectedApplication.status === 'APPROVED' && (<span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Approved</span>)}
                                  {selectedApplication.status === 'REJECTED' && (<span className="flex items-center gap-1 text-xs font-semibold text-red-600"><XCircle className="h-4 w-4" /> Rejected</span>)}
                                  {selectedApplication.status !== 'APPROVED' && selectedApplication.status !== 'REJECTED' && (
                                    <div className="flex gap-2">
                                      {activeRejectGate === selectedApplication.id ? (
                                        <ReasonGate label="Reason for rejecting this application" confirmLabel="Confirm Rejection" tone="red" isSubmitting={isSubmittingReject} onCancel={() => setActiveRejectGate(null)} onConfirm={handleReject} />
                                      ) : (
                                        <>
                                          <button type="button" onClick={() => setActiveRejectGate(selectedApplication.id)} className="flex items-center gap-1.5 border border-red-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 rounded-none hover:bg-red-50"><XCircle className="h-3.5 w-3.5" /> Reject</button>
                                          <button type="button" onClick={handleApprove} className="flex items-center gap-1.5 border border-slate-800 bg-slate-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white rounded-none hover:bg-slate-900"><CheckCircle2 className="h-3.5 w-3.5" /> Approve</button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {actionError && (
                                <div className="flex items-center gap-2 border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 rounded-none">
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {actionError}
                                </div>
                              )}
                              <DocumentInspector applicationId={selectedApplication.id} onActionComplete={() => { getHostApplicationDetail(selectedApplication.id).then((res) => setSelectedApplication(res.data)); fetchApplications(); }} />
                              <CreditTransfersList applicationId={selectedApplication.id} />
                            </div>
                          ) : (<p className="text-sm text-slate-400">Could not load details.</p>)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}