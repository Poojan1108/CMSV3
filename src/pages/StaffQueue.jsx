import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Inbox,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  User,
  MapPin,
  MessageSquare,
  Lock,
  Send,
  X,
  ChevronRight,
  Shield,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import { STATUSES, PRIORITIES, STATUS_LABELS, PRIORITY_LABELS, ROLES } from '../utils/constants';
import {
  formatRelativeTime,
  getSlaStatus,
} from '../utils/formatters';
import {
  PageHeader,
  EmptyState,
  LoadingState,
  MetricCard,
  Modal,
  StatusBadge,
  PriorityBadge,
  SlaBadge,
  TicketId,
  Tag,
} from '../components/ui';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  ...Object.values(STATUSES).map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

const PRIORITY_FILTER_OPTIONS = [
  { value: PRIORITIES.URGENT, label: `${PRIORITY_LABELS[PRIORITIES.URGENT]} (4h SLA)` },
  { value: PRIORITIES.HIGH, label: `${PRIORITY_LABELS[PRIORITIES.HIGH]} (24h SLA)` },
  { value: PRIORITIES.MEDIUM, label: `${PRIORITY_LABELS[PRIORITIES.MEDIUM]} (48h SLA)` },
  { value: PRIORITIES.LOW, label: `${PRIORITY_LABELS[PRIORITIES.LOW]} (48h SLA)` },
];

export default function StaffQueue() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, categories, currentOrg, orgKey, availableUsers, setUser } = useAuth();
  const { showToast } = useToast();

  // Scope derived from route (/staff/assigned -> assigned)
  const isAssignedPage = location.pathname.includes('/staff/assigned');
  const [scopeFilter, setScopeFilter] = useState(isAssignedPage ? 'assigned' : 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detail modal state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalInternalNote, setModalInternalNote] = useState('');
  const [modalStatusNote, setModalStatusNote] = useState('');

  // Inline note state per ticket card
  const [cardNotes, setCardNotes] = useState({});
  const [submittingNoteId, setSubmittingNoteId] = useState(null);

  useEffect(() => {
    if (location.pathname.includes('/staff/assigned')) {
      setScopeFilter('assigned');
    }
  }, [location.pathname]);

  const loadComplaints = () => {
    setIsLoading(true);
    try {
      const data = complaintService.getAll({ org: orgKey, sortBy });
      setComplaints(data);

      if (selectedTicket) {
        const refreshed = complaintService.getById(selectedTicket.id);
        if (refreshed) setSelectedTicket(refreshed);
      }
    } catch (err) {
      console.error('Failed to fetch complaints queue', err);
      showToast('Error loading queue items', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgKey, sortBy]);

  // Header metrics
  const metrics = useMemo(() => {
    const assignedToMe = complaints.filter(
      (c) => c.assignedTo && c.assignedTo.id === user?.id
    ).length;
    const pendingReview = complaints.filter((c) => c.status === STATUSES.PENDING).length;
    const inProgress = complaints.filter((c) => c.status === STATUSES.IN_PROGRESS).length;
    const resolvedToday = complaints.filter((c) => c.status === STATUSES.RESOLVED).length;
    const slaBreached = complaints.filter((c) => {
      const sla = getSlaStatus(c);
      return sla.isBreached && !sla.isCompleted;
    }).length;

    return { assignedToMe, pendingReview, inProgress, resolvedToday, slaBreached };
  }, [complaints, user]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      if (scopeFilter === 'assigned') {
        const isMine = item.assignedTo && item.assignedTo.id === user?.id;
        if (!isMine) return false;
      }
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      if (departmentFilter !== 'all' && item.category !== departmentFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const haystack = [
          item.id,
          item.title,
          item.description,
          item.location,
          item.student?.name,
          item.category,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [complaints, scopeFilter, statusFilter, priorityFilter, departmentFilter, searchQuery, user]);

  const hasActiveFilters =
    scopeFilter !== 'all' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    departmentFilter !== 'all' ||
    searchQuery.trim() !== '';

  const handleQuickStatusChange = (ticketId, newStatus, note = '') => {
    try {
      let updated;
      if (newStatus === STATUSES.RESOLVED) {
        updated = complaintService.proposeResolution(
          ticketId,
          actor(),
          note || 'Staff marked ticket as resolved. Awaiting confirmation.'
        );
        if (updated) showToast(`Resolution request sent for ${ticketId}`, 'success');
      } else {
        updated = complaintService.updateStatus(
          ticketId,
          newStatus,
          actor(),
          note || `Status updated to ${STATUS_LABELS[newStatus] || newStatus}`
        );
        if (updated)
          showToast(`${ticketId} → ${STATUS_LABELS[newStatus] || newStatus}`, 'success');
      }
      if (updated) loadComplaints();
    } catch (err) {
      console.error('Failed to update status', err);
      showToast('Failed to update ticket status', 'error');
    }
  };

  function actor() {
    return user || { name: 'Staff Resolver', role: ROLES.STAFF };
  }

  const handleAddInlineNote = (ticketId) => {
    const noteText = cardNotes[ticketId];
    if (!noteText?.trim()) {
      showToast('Enter an internal note first', 'warning');
      return;
    }

    setSubmittingNoteId(ticketId);
    try {
      const updated = complaintService.addComment(ticketId, actor(), noteText.trim(), true);
      if (updated) {
        showToast(`Internal note added to ${ticketId}`, 'success');
        setCardNotes((prev) => ({ ...prev, [ticketId]: '' }));
        loadComplaints();
      }
    } catch (err) {
      console.error('Failed to add internal note', err);
      showToast('Failed to post internal note', 'error');
    } finally {
      setSubmittingNoteId(null);
    }
  };

  const handleModalAddInternalNote = (e) => {
    e.preventDefault();
    if (!selectedTicket || !modalInternalNote.trim()) return;

    try {
      const updated = complaintService.addComment(
        selectedTicket.id,
        actor(),
        modalInternalNote.trim(),
        true
      );
      if (updated) {
        showToast('Internal note added to ticket', 'success');
        setModalInternalNote('');
        setSelectedTicket(updated);
        loadComplaints();
      }
    } catch (err) {
      console.error('Failed to post internal note in modal', err);
      showToast('Error adding internal note', 'error');
    }
  };

  const handleModalStatusSubmit = (e, newStatus) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      handleQuickStatusChange(selectedTicket.id, newStatus, modalStatusNote);
      setModalStatusNote('');
    } catch (err) {
      console.error('Failed modal status update', err);
      showToast('Error updating status', 'error');
    }
  };

  const handleResetFilters = () => {
    setScopeFilter(isAssignedPage ? 'assigned' : 'all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setDepartmentFilter('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`${currentOrg?.name || ''} Resolver`}
        icon={<UserCheck size={12} />}
        title={scopeFilter === 'assigned' ? 'My Assigned Complaints' : 'Department Queue'}
        description="Triage, resolve and log audit notes for issues across departments."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="role-pill role-pill-staff" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}>
              <UserCheck size={13} /> {user?.name || 'Staff Officer'}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadComplaints}
              title="Refresh queue"
            >
              <RefreshCw size={13} style={{ marginRight: '6px' }} /> Refresh
            </button>
          </div>
        }
      />

      {/* Metrics */}
      <div className="stat-grid">
        <MetricCard
          icon={UserCheck}
          label="Assigned to Me"
          value={metrics.assignedToMe}
          tone="accent"
          onClick={() => {
            setScopeFilter(scopeFilter === 'assigned' ? 'all' : 'assigned');
          }}
          isActive={scopeFilter === 'assigned'}
        />
        <MetricCard
          icon={Clock}
          label={STATUS_LABELS[STATUSES.PENDING]}
          value={metrics.pendingReview}
          tone="warning"
          onClick={() =>
            setStatusFilter(statusFilter === STATUSES.PENDING ? 'all' : STATUSES.PENDING)
          }
          isActive={statusFilter === STATUSES.PENDING}
        />
        <MetricCard
          icon={RefreshCw}
          label={STATUS_LABELS[STATUSES.IN_PROGRESS]}
          value={metrics.inProgress}
          tone="info"
          onClick={() =>
            setStatusFilter(statusFilter === STATUSES.IN_PROGRESS ? 'all' : STATUSES.IN_PROGRESS)
          }
          isActive={statusFilter === STATUSES.IN_PROGRESS}
        />
        <MetricCard
          icon={CheckCircle2}
          label={STATUS_LABELS[STATUSES.RESOLVED]}
          value={metrics.resolvedToday}
          tone="success"
          onClick={() =>
            setStatusFilter(statusFilter === STATUSES.RESOLVED ? 'all' : STATUSES.RESOLVED)
          }
          isActive={statusFilter === STATUSES.RESOLVED}
        />
      </div>

      {metrics.slaBreached > 0 && (
        <div className="callout callout-danger" role="alert">
          <AlertTriangle size={16} />
          <div>
            <span className="callout-title">SLA breached</span>
            {metrics.slaBreached} ticket{metrics.slaBreached > 1 ? 's' : ''} exceeded the target
            resolution window.
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="card card-pad toolbar no-print">
        <div className="toolbar-row">
          <div className="segmented" role="tablist" aria-label="Ticket scope">
            <button
              type="button"
              role="tab"
              aria-selected={scopeFilter === 'all'}
              className={scopeFilter === 'all' ? 'is-active' : ''}
              onClick={() => setScopeFilter('all')}
            >
              <Inbox size={14} />
              All Tickets ({complaints.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scopeFilter === 'assigned'}
              className={scopeFilter === 'assigned' ? 'is-active' : ''}
              onClick={() => setScopeFilter('assigned')}
            >
              <UserCheck size={14} />
              Assigned to Me ({metrics.assignedToMe})
            </button>
          </div>

          <div className="toolbar-spacer" />

          <div className="search-field">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search ID, title, reporter or location…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tickets"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="toolbar-row">
          <span className="filter-label">
            <Filter size={14} />
            Filters
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">All Priorities</option>
            {PRIORITY_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            aria-label="Filter by department"
          >
            <option value="all">All Departments</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort order">
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="priority">Sort: Priority</option>
          </select>

          {hasActiveFilters && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleResetFilters}>
              <RefreshCw size={13} />
              Reset
            </button>
          )}

          <span className="result-count">
            Showing <strong>{filteredComplaints.length}</strong> of {complaints.length}
          </span>
        </div>
      </div>

      {/* Ticket cards */}
      {isLoading ? (
        <LoadingState label="Loading department queue…" />
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No tickets match current filters"
          description="Adjust the department, status or search parameters to find tickets."
        >
          <button type="button" className="btn btn-secondary" onClick={handleResetFilters}>
            Reset Filters
          </button>
        </EmptyState>
      ) : (
        <div className="complaints-grid">
          {filteredComplaints.map((ticket) => {
            const sla = getSlaStatus(ticket);
            const isBreach = sla.isBreached && !sla.isCompleted;
            const isAssignedToMe = ticket.assignedTo?.id === user?.id;

            return (
              <article
                key={ticket.id}
                className={`ticket-card ${isBreach ? 'has-breach' : ''}`}
              >
                <div className="ticket-card-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <TicketId id={ticket.id} />
                    {isAssignedToMe && <Tag>You</Tag>}
                  </div>

                  <div className="ticket-card-badges">
                    <SlaBadge sla={sla} />
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>

                <Tag>{ticket.category}</Tag>

                <h3 className="ticket-card-title">{ticket.title}</h3>

                <p className="ticket-card-snippet">
                  {ticket.description?.length > 130
                    ? `${ticket.description.slice(0, 130)}…`
                    : ticket.description}
                </p>

                <div className="ticket-card-meta">
                  <span className="meta-item">
                    <User size={13} />
                    {ticket.isAnonymous || ticket.anonymous ? (
                      <span className="anon-chip">
                        <Lock size={11} /> Anonymous
                      </span>
                    ) : (
                      ticket.student?.name || 'Reporter'
                    )}
                  </span>
                  <span className="meta-item">
                    <MapPin size={13} />
                    {ticket.location || '—'}
                  </span>
                  <span className="meta-item">
                    <Clock size={13} />
                    {formatRelativeTime(ticket.createdAt)}
                  </span>
                </div>

                {/* Quick status update */}
                <div className="quick-status-row">
                  <span>Set status:</span>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleQuickStatusChange(ticket.id, e.target.value)}
                    aria-label={`Update status for ${ticket.id}`}
                  >
                    {Object.values(STATUSES).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Internal audit note */}
                <div className="inline-note-box">
                  <span className="inline-note-head">
                    <Lock size={11} />
                    Internal note (hidden from reporter)
                  </span>
                  <div className="inline-note-row">
                    <input
                      type="text"
                      placeholder="Log internal action or parts required…"
                      value={cardNotes[ticket.id] || ''}
                      onChange={(e) =>
                        setCardNotes((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddInlineNote(ticket.id);
                      }}
                      aria-label={`Internal note for ${ticket.id}`}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleAddInlineNote(ticket.id)}
                      disabled={submittingNoteId === ticket.id}
                    >
                      <Send size={12} />
                      Post
                    </button>
                  </div>
                </div>

                <div className="ticket-card-footer">
                  {ticket.assignedTo ? (
                    <span className="handler-line is-assigned">
                      <Shield size={12} />
                      {ticket.assignedTo.name}
                    </span>
                  ) : (
                    <span className="handler-line">Unassigned</span>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    Details
                    <ChevronRight size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onQuickStatus={handleQuickStatusChange}
          onAddInternalNote={handleModalAddInternalNote}
          internalNote={modalInternalNote}
          setInternalNote={setModalInternalNote}
          onStatusSubmit={handleModalStatusSubmit}
          statusNote={modalStatusNote}
          setStatusNote={setModalStatusNote}
          navigate={navigate}
        />
      )}
    </div>
  );
}

/** Full detail dialog for resolver inspection. */
function TicketDetailModal({
  ticket,
  onClose,
  onQuickStatus,
  onAddInternalNote,
  internalNote,
  setInternalNote,
  onStatusSubmit,
  statusNote,
  setStatusNote,
  navigate,
}) {
  const [commentTab, setCommentTab] = useState('all');
  const sla = getSlaStatus(ticket);

  const comments = ticket.comments || [];
  const internalComments = comments.filter((c) => c.isInternal);
  const publicComments = comments.filter((c) => !c.isInternal);

  const displayedComments =
    commentTab === 'internal'
      ? internalComments
      : commentTab === 'public'
      ? publicComments
      : comments;

  return (
    <Modal
      title={ticket.title}
      subtitle={ticket.id}
      onClose={onClose}
      maxWidth={860}
      footer={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              onClose();
              navigate(`/staff/resolutions?ticketId=${ticket.id}`);
            }}
          >
            Reassign Ticket
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onQuickStatus(ticket.id, STATUSES.IN_PROGRESS, 'Started working on issue.')}
            >
              Mark In Progress
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onQuickStatus(ticket.id, STATUSES.RESOLVED, 'Resolution completed.')}
            >
              Mark Resolved
            </button>
          </div>
        </div>
      }
    >
      {/* Badges row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <TicketId id={ticket.id} />
        <PriorityBadge priority={ticket.priority} />
        <StatusBadge status={ticket.status} />
        <SlaBadge sla={sla} showIcon={false} />
      </div>

      {/* Overview grid */}
      <div className="meta-grid">
        <div>
          <span className="meta-cell-label">Reporter</span>
          <span className="meta-cell-value">
            {ticket.isAnonymous || ticket.anonymous ? 'Anonymous' : ticket.student?.name || '—'}
          </span>
          {ticket.student?.rollNo && !ticket.isAnonymous && (
            <span className="cell-sub" style={{ display: 'block' }}>
              {ticket.student.rollNo}
            </span>
          )}
        </div>
        <div>
          <span className="meta-cell-label">Location</span>
          <span className="meta-cell-value">{ticket.location || '—'}</span>
        </div>
        <div>
          <span className="meta-cell-label">Handler</span>
          <span className="meta-cell-value">
            {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
          </span>
          {ticket.assignedTo?.department && (
            <span className="cell-sub" style={{ display: 'block' }}>
              {ticket.assignedTo.department}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="resolution-summary" style={{ margin: 0 }}>
        <p className="resolution-summary-text">{ticket.description}</p>
      </div>

      {/* Status audit log */}
      <div>
        <h4 className="section-heading" style={{ marginBottom: 10 }}>
          Audit Log
        </h4>
        <div className="history-notes" style={{ marginTop: 0 }}>
          {ticket.statusHistory?.length ? (
            ticket.statusHistory.map((item, idx) => (
              <div key={idx} className="history-note">
                <span className="history-author">{item.updatedBy}</span>
                <span>
                  <strong>{STATUS_LABELS[item.status] || item.status}</strong> — {item.note}
                </span>
                <span className="history-time">{formatRelativeTime(item.timestamp)}</span>
              </div>
            ))
          ) : (
            <p className="no-comments">No status history available.</p>
          )}
        </div>
      </div>

      {/* Comments with tabs */}
      <div>
        <div className="card-header" style={{ marginBottom: 12, paddingBottom: 10 }}>
          <h4 className="section-heading" style={{ margin: 0 }}>
            <MessageSquare size={15} />
            Activity ({comments.length})
          </h4>

          <div className="segmented">
            <button
              type="button"
              className={commentTab === 'all' ? 'is-active' : ''}
              onClick={() => setCommentTab('all')}
            >
              All ({comments.length})
            </button>
            <button
              type="button"
              className={commentTab === 'public' ? 'is-active' : ''}
              onClick={() => setCommentTab('public')}
            >
              Public ({publicComments.length})
            </button>
            <button
              type="button"
              className={commentTab === 'internal' ? 'is-active' : ''}
              onClick={() => setCommentTab('internal')}
            >
              Internal ({internalComments.length})
            </button>
          </div>
        </div>

        <div className="comments-list" style={{ maxHeight: 220 }}>
          {displayedComments.length === 0 ? (
            <p className="no-comments">No comments in this tab.</p>
          ) : (
            displayedComments.map((c) => (
              <div key={c.id || `${c.senderName}-${c.timestamp}`} className="comment-row">
                <span className={`comment-avatar ${c.isInternal ? 'staff' : 'user'}`}>
                  {c.isInternal ? <Lock size={13} /> : <MessageSquare size={13} />}
                </span>
                <div
                  className="comment-bubble"
                  style={
                    c.isInternal
                      ? { borderColor: 'rgba(217, 154, 43, 0.35)', background: 'var(--app-warning-subtle)' }
                      : undefined
                  }
                >
                  <div className="comment-meta">
                    <span className="comment-author">{c.senderName}</span>
                    {c.isInternal && (
                      <span className="comment-role" style={{ color: 'var(--app-warning)' }}>
                        INTERNAL
                      </span>
                    )}
                    <span className="comment-time">{formatRelativeTime(c.timestamp)}</span>
                  </div>
                  <p className="comment-text">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Internal note form */}
        <form onSubmit={onAddInternalNote} className="comment-form">
          <span className="inline-note-head">
            <Lock size={11} />
            Post internal audit note
          </span>
          <div className="inline-note-row">
            <input
              type="text"
              placeholder="Log internal action, parts required…"
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
            />
            <button type="submit" className="btn btn-sm btn-outline" disabled={!internalNote.trim()}>
              Log Note
            </button>
          </div>
        </form>
      </div>

      {/* Optional resolution note before marking resolved */}
      <div className="form-group">
        <label htmlFor="modal-status-note" className="field-label" style={{ display: 'block' }}>
          Resolution / status note (attached when you mark a status below)
        </label>
        <textarea
          id="modal-status-note"
          rows={2}
          placeholder="Optional context saved with the next status change…"
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={(e) => onStatusSubmit(e, STATUSES.RESOLVED)}
          >
            Submit Resolution with Note
          </button>
        </div>
      </div>
    </Modal>
  );
}
