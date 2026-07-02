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
} from 'lucide-react';
import { CustomDropdown, Badge, PaginationFooter, LoadingRow, EmptyState } from '../shared/DashboardUI';
import {
  getApplicationQueue,
  getApplicationDetail,
  verifyDocument,
  flagDocument,
  approveApplication,
  rejectApplication,
} from '../../api/admin';

const PAGE_SIZE = 10;
const STATUS_FILTER_OPTIONS = ['All Statuses', 'SUBMITTED', 'UNDER_REVIEW', 'COMPLIANCE_PHASE', 'APPROVED', 'REJECTED'];

function toneForStatus(status) {
  switch (status) {
    case 'APPROVED':
    case 'VERIFIED':
      return 'emerald';
    case 'REJECTED':
    case 'ACTION_REQUIRED':
      return 'red';
    case 'UNDER_REVIEW':
      return 'amber';
    case 'COMPLIANCE_PHASE':
      return 'orange';
    default:
      return 'slate';
  }
}

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
        placeholder="Describe exactly what the student must correct…"
        className="w-full resize-none border border-slate-300 bg-white p-2 text-sm text-slate-800 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-400"
      />
      <div className="mt-2 flex items-center justify-between">
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
      await approveApplication(applicationId, 'COMPLIANCE_PHASE');
      await fetchDetail();
      if (onApplicationMutated) onApplicationMutated();
    } catch (err) {
      setActionError('Could not approve the application. Please retry.');
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
            <h2 className="text-sm font-bold text-slate-900">{detail.student_name}</h2>
            <p className="text-xs text-slate-500">{detail.university_name}</p>
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
                  <span className="text-sm font-medium text-slate-800">{doc.document_name}</span>
                  <Badge tone={toneForStatus(doc.status)}>{doc.status.replace(/_/g, ' ')}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-900"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </a>
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

              {doc.status === 'ACTION_REQUIRED' && doc.admin_comment && activeGate?.documentId !== doc.id && (
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
        {activeGate?.type === 'REJECT_APPLICATION' ? (
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
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function AdminReviewDesk() {
  const [selectedId, setSelectedId] = useState(null);
  const [queueRefreshToken, setQueueRefreshToken] = useState(0);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <h1 className="text-lg font-bold text-slate-900">Admin Review Desk</h1>
          <p className="text-xs text-slate-500">Inspect submitted documents and progress or reject applications.</p>
        </header>

        <div className="grid h-[75vh] grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <ApplicantQueue key={queueRefreshToken} selectedId={selectedId} onSelect={setSelectedId} />
          <DocumentInspector applicationId={selectedId} onApplicationMutated={() => setQueueRefreshToken((n) => n + 1)} />
        </div>
      </div>
    </div>
  );
}