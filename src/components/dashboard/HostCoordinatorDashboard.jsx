// =============================================================================
// HostCoordinatorDashboard.jsx
// -----------------------------------------------------------------------------
// PHASE 4b — GlobalScholar Host Coordinator (HOST_COORD) Dashboard
// CONNECTED TO REAL BACKEND!
// =============================================================================

import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Users,
  Plane,
  Home,
  ClipboardCheck,
  CheckSquare,
  Square,
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
} from 'lucide-react';
import { CustomDropdown, Badge, EmptyState, LoadingRow, documentTypeLabel } from './shared/DashboardUI';
import {
  getHostApplications,
  getHostApplicationDetail,
  approveHostApplication,
  rejectHostApplication,
  getHostDocumentChecklist,
  reviewHostDocument,
  getHostNotifications,
  getHostUnreadCount,
  getHostUniversity,
} from '../../api/hostcoord';

const STATUS_FILTER_OPTIONS = ['All Statuses', 'SUBMITTED', 'UNDER_REVIEW', 'COMPLIANCE_PHASE', 'APPROVED', 'REJECTED'];

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
    default:
      return 'slate';
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
          <button
            type="button"
            onClick={onCancel}
            className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 rounded-none hover:border-slate-400"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={() => onConfirm(comment.trim())}
            className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-none disabled:cursor-not-allowed disabled:opacity-40 ${
              tone === 'red'
                ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
                : 'border-amber-600 bg-amber-600 text-white hover:bg-amber-700'
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
                    onClick={() => setActiveGate({ type: 'FLAG_DOCUMENT', documentId: doc.id })}
                    className="flex items-center gap-1 border border-red-600 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 rounded-none hover:bg-red-50"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Flag
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

// ── TOP-LEVEL: HostCoordinatorDashboard ─────────────────────────────────
export default function HostCoordinatorDashboard() {
  const [applications, setApplications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [activeRejectGate, setActiveRejectGate] = useState(null);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // ── Fetch applications ─────────────────────────────────────────────────
  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'All Statuses') params.status = statusFilter;
      const response = await getHostApplications(params);
      const data = response.data.results || response.data || [];
      setApplications(data);
      setTotalCount(data.length);
    } catch (err) {
      setError('Could not load applications. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ── Handle row click ───────────────────────────────────────────────────
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

  // ── Approve application ────────────────────────────────────────────────
  async function handleApprove() {
    if (!selectedApplication) return;
    setActionError(null);
    try {
      await approveHostApplication(selectedApplication.id);
      await fetchApplications();
      // Refresh the detail
      const response = await getHostApplicationDetail(selectedApplication.id);
      setSelectedApplication(response.data);
    } catch (err) {
      const backendMessage = err?.response?.data?.detail || 'Could not approve the application.';
      setActionError(backendMessage);
    }
  }

  // ── Reject application ─────────────────────────────────────────────────
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

  // ── Stats ──────────────────────────────────────────────────────────────
  const submittedCount = applications.filter((a) => a.status === 'SUBMITTED').length;
  const underReviewCount = applications.filter((a) => a.status === 'UNDER_REVIEW').length;
  const complianceCount = applications.filter((a) => a.status === 'COMPLIANCE_PHASE').length;

  return (
    <div className="bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white shadow-sm rounded-none p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-500" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Host Coordinator Dashboard</h1>
              <p className="text-xs text-slate-500">Manage applications for your assigned university</p>
            </div>
          </div>
          <CustomDropdown label="Status Filter" value={statusFilter} options={STATUS_FILTER_OPTIONS} onChange={setStatusFilter} />
        </header>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-slate-200 bg-white p-4 shadow-sm rounded-none">
            <p className="text-2xl font-bold text-amber-600">{submittedCount}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</p>
          </div>
          <div className="border border-slate-200 bg-white p-4 shadow-sm rounded-none">
            <p className="text-2xl font-bold text-orange-600">{underReviewCount}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Under Review</p>
          </div>
          <div className="border border-slate-200 bg-white p-4 shadow-sm rounded-none">
            <p className="text-2xl font-bold text-emerald-600">{complianceCount}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compliance Phase</p>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 rounded-none">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Applications Table */}
        <section className="border border-slate-200 bg-white shadow-sm rounded-none">
          {isLoading ? (
            <LoadingRow label="Loading applications…" />
          ) : applications.length === 0 ? (
            <EmptyState label="No applications for your assigned university." />
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="w-8 px-4 py-2" />
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">University</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <Fragment key={app.id}>
                    <tr onClick={() => handleToggleRow(app.id)} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400">
                        <ChevronRight className={`h-4 w-4 transition-transform ${expandedId === app.id ? 'rotate-90' : ''}`} />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{app.student_name || app.student_detail?.full_name || 'Student'}</td>
                      <td className="px-4 py-3 text-slate-600">{app.university_name || app.destination_university?.name || 'University'}</td>
                      <td className="px-4 py-3">
                        <Badge tone={toneForStatus(app.status)}>{app.status ? app.status.replace(/_/g, ' ') : 'DRAFT'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '—'}</td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {expandedId === app.id && (
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <td colSpan={5} className="px-4 py-4">
                          {isDetailLoading ? (
                            <LoadingRow label="Loading details…" />
                          ) : selectedApplication ? (
                            <div className="space-y-4">
                              {/* Application Info */}
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Application #{selectedApplication.id}</p>
                                  <p className="text-sm text-slate-600">
                                    GPA at submission: {selectedApplication.gpa_at_submission || 'N/A'}
                                  </p>
                                  {selectedApplication.rejection_reason && (
                                    <p className="text-sm text-red-600">Rejection reason: {selectedApplication.rejection_reason}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {selectedApplication.status === 'APPROVED' && (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                      <CheckCircle2 className="h-4 w-4" />
                                      Approved
                                    </span>
                                  )}
                                  {selectedApplication.status === 'REJECTED' && (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                                      <XCircle className="h-4 w-4" />
                                      Rejected
                                    </span>
                                  )}
                                  {selectedApplication.status !== 'APPROVED' && selectedApplication.status !== 'REJECTED' && (
                                    <div className="flex gap-2">
                                      {activeRejectGate === selectedApplication.id ? (
                                        <ReasonGate
                                          label="Reason for rejecting this application"
                                          confirmLabel="Confirm Rejection"
                                          tone="red"
                                          isSubmitting={isSubmittingReject}
                                          onCancel={() => setActiveRejectGate(null)}
                                          onConfirm={handleReject}
                                        />
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => setActiveRejectGate(selectedApplication.id)}
                                            className="flex items-center gap-1.5 border border-red-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 rounded-none hover:bg-red-50"
                                          >
                                            <XCircle className="h-3.5 w-3.5" />
                                            Reject
                                          </button>
                                          <button
                                            type="button"
                                            onClick={handleApprove}
                                            className="flex items-center gap-1.5 border border-slate-800 bg-slate-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white rounded-none hover:bg-slate-900"
                                          >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Approve
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {actionError && (
                                <div className="flex items-center gap-2 border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 rounded-none">
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                  {actionError}
                                </div>
                              )}

                              {/* Document Inspector */}
                              <DocumentInspector
                                applicationId={selectedApplication.id}
                                onActionComplete={() => {
                                  // Refresh after document action
                                  getHostApplicationDetail(selectedApplication.id).then((res) => setSelectedApplication(res.data));
                                  fetchApplications();
                                }}
                              />
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400">Could not load details.</p>
                          )}
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