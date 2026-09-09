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
  Camera,
  Maximize2,
  FileText,
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

const chipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 8px',
  borderRadius: '999px',
  background: 'var(--app-card-bg-subtle, #f4f4f5)',
  border: '1px solid var(--app-border-soft, #e4e4e7)',
  color: 'var(--app-text, #18181b)',
  fontSize: '11.5px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

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

  // Dynamic taxonomy of categories across user config and existing complaint records
  const availableCategories = useMemo(() => {
    return Array.from(new Set([...(categories || []), ...complaints.map((c) => c.category)].filter(Boolean)));
  }, [categories, complaints]);

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

  // Real-time live synchronization: automatically updates queue cards and counters when tickets are created, reassigned, or status updated
  useEffect(() => {
    const unsubscribe = complaintService.subscribeToLiveUpdates(() => {
      try {
        const data = complaintService.getAll({ org: orgKey, sortBy });
        setComplaints(data);

        setSelectedTicket((prev) => {
          if (prev) {
            const refreshed = complaintService.getById(prev.id);
            return refreshed || prev;
          }
          return null;
        });
      } catch (err) {
        console.error('Error in StaffQueue live sync:', err);
      }
    });

    return () => {
      unsubscribe();
    };
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
    <div
      className="page-stack"
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <PageHeader
        eyebrow={`${currentOrg?.name || ''} Resolver`}
        icon={<UserCheck size={12} />}
        title={scopeFilter === 'assigned' ? 'My Assigned Complaints' : 'Department Queue'}
        description="Triage, resolve and log audit notes for issues across departments."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
      <div className="stat-grid" style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
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
        <div className="callout callout-danger" role="alert" style={{ width: '100%', boxSizing: 'border-box' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ minWidth: 0, wordBreak: 'break-word' }}>
            <span className="callout-title">SLA breached</span>
            {metrics.slaBreached} ticket{metrics.slaBreached > 1 ? 's' : ''} exceeded the target
            resolution window.
          </div>
        </div>
      )}

      {/* 1. Triage Command Strip (Page 4 Spec) */}
      <div
        className="status-segment-strip"
        role="tablist"
        aria-label="Triage filter strip"
        style={{
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
          display: 'flex',
          gap: 6,
          paddingBottom: 6,
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={scopeFilter === 'all' && statusFilter === 'all'}
          className={`status-segment-pill ${scopeFilter === 'all' && statusFilter === 'all' ? 'is-active' : ''}`}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          onClick={() => {
            setScopeFilter('all');
            setStatusFilter('all');
          }}
        >
          All Queue Tickets
          <span className="segment-count">{complaints.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={scopeFilter === 'assigned'}
          className={`status-segment-pill ${scopeFilter === 'assigned' ? 'is-active' : ''}`}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          onClick={() => {
            setScopeFilter('assigned');
            setStatusFilter('all');
          }}
        >
          Assigned to Me
          <span className="segment-count">{metrics.assignedToMe}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === STATUSES.PENDING}
          className={`status-segment-pill ${statusFilter === STATUSES.PENDING ? 'is-active' : ''}`}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          onClick={() => {
            setScopeFilter('all');
            setStatusFilter(STATUSES.PENDING);
          }}
        >
          Needs Triage
          <span className="segment-count">{metrics.pendingReview}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === STATUSES.IN_PROGRESS}
          className={`status-segment-pill ${statusFilter === STATUSES.IN_PROGRESS ? 'is-active' : ''}`}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          onClick={() => {
            setScopeFilter('all');
            setStatusFilter(STATUSES.IN_PROGRESS);
          }}
        >
          In Progress
          <span className="segment-count">{metrics.inProgress}</span>
        </button>

        {metrics.slaBreached > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={priorityFilter === PRIORITIES.URGENT}
            className="status-segment-pill"
            style={{
              flexShrink: 0,
              whiteSpace: 'nowrap',
              borderColor: 'var(--app-danger)',
              color: 'var(--app-danger)',
              background: priorityFilter === PRIORITIES.URGENT ? 'var(--app-danger-subtle)' : 'var(--app-surface)',
            }}
            onClick={() => {
              setPriorityFilter(priorityFilter === PRIORITIES.URGENT ? 'all' : PRIORITIES.URGENT);
            }}
          >
            <AlertTriangle size={13} style={{ color: 'var(--app-danger)' }} />
            SLA Critical
            <span className="segment-count" style={{ background: 'var(--app-danger)', color: '#fff' }}>
              {metrics.slaBreached}
            </span>
          </button>
        )}
      </div>

      {/* 2. Streamlined Toolbar (Content-on-Canvas) */}
      <div
        className="toolbar-row"
        style={{
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          marginTop: 12,
          marginBottom: 8,
          boxSizing: 'border-box',
        }}
      >
        <div className="search-field" style={{ flex: '1 1 200px', minWidth: 0 }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search ID, keyword, room, or student..."
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

        <div className="toolbar-spacer" />

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          aria-label="Filter by department"
          className="toolbar-select"
        >
          <option value="all">All Departments</option>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          aria-label="Filter by priority"
          className="toolbar-select"
        >
          <option value="all">All Priorities</option>
          {PRIORITY_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort order"
          className="toolbar-select"
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="priority">Sort: Priority</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleResetFilters}
            style={{ flexShrink: 0 }}
          >
            <RefreshCw size={13} />
            Reset
          </button>
        )}
      </div>

      {/* Active Filter Chips Row */}
      {hasActiveFilters && (
        <div
          className="active-filter-chips"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            marginBottom: '10px',
            fontSize: '12px',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
          }}
        >
          <span style={{ color: 'var(--app-text-muted, #71717a)', marginRight: 2 }}>Active:</span>

          {scopeFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              style={chipStyle}
              title="Remove scope filter"
            >
              Scope: {scopeFilter === 'assigned' ? 'Assigned to Me' : scopeFilter}
              <X size={12} style={{ marginLeft: 4 }} />
            </button>
          )}

          {statusFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              style={chipStyle}
              title="Remove status filter"
            >
              Status: {STATUS_LABELS[statusFilter] || statusFilter}
              <X size={12} style={{ marginLeft: 4 }} />
            </button>
          )}

          {priorityFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setPriorityFilter('all')}
              style={chipStyle}
              title="Remove priority filter"
            >
              Priority: {PRIORITY_LABELS[priorityFilter] || priorityFilter}
              <X size={12} style={{ marginLeft: 4 }} />
            </button>
          )}

          {departmentFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setDepartmentFilter('all')}
              style={chipStyle}
              title="Remove department filter"
            >
              Dept: {departmentFilter}
              <X size={12} style={{ marginLeft: 4 }} />
            </button>
          )}

          {searchQuery.trim() !== '' && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={chipStyle}
              title="Clear search query"
            >
              Search: "{searchQuery.slice(0, 15)}{searchQuery.length > 15 ? '…' : ''}"
              <X size={12} style={{ marginLeft: 4 }} />
            </button>
          )}

          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--app-accent, #2563eb)',
              cursor: 'pointer',
              fontSize: '11.5px',
              padding: '2px 4px',
              textDecoration: 'underline',
            }}
          >
            Clear all
          </button>
        </div>
      )}

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
        <div className="complaints-grid" style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          {filteredComplaints.map((ticket) => {
            const sla = getSlaStatus(ticket);
            const isBreach = sla.isBreached && !sla.isCompleted;
            const isAssignedToMe = ticket.assignedTo?.id === user?.id;

            return (
              <article
                key={ticket.id}
                className={`ticket-card ${isBreach ? 'has-breach' : ''}`}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  padding: 'clamp(14px, 3.5vw, 18px)',
                }}
              >
                <div
                  className="ticket-card-top"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 8,
                    flexWrap: 'wrap',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <TicketId id={ticket.id} />
                    <Tag>{ticket.category}</Tag>
                    {isAssignedToMe && <Tag>You</Tag>}
                  </div>

                  <div className="ticket-card-badges" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <SlaBadge sla={sla} />
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>

                <h3 className="ticket-card-title" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {ticket.title}
                </h3>

                <p className="ticket-card-snippet" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {ticket.description?.length > 130
                    ? `${ticket.description.slice(0, 130)}…`
                    : ticket.description}
                </p>

                <div className="ticket-card-meta" style={{ flexWrap: 'wrap', gap: 8 }}>
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
                <div
                  className="quick-status-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    flexWrap: 'wrap',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--app-text-muted)' }}>Set status:</span>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleQuickStatusChange(ticket.id, e.target.value)}
                    aria-label={`Update status for ${ticket.id}`}
                    style={{ flex: '1 1 140px', minWidth: 0, height: 36, maxWidth: '100%' }}
                  >
                    {Object.values(STATUSES).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Internal audit note */}
                <div className="inline-note-box" style={{ width: '100%', boxSizing: 'border-box' }}>
                  <span className="inline-note-head" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Lock size={11} style={{ flexShrink: 0 }} />
                    <span>Internal note (hidden from reporter)</span>
                  </span>
                  <div className="inline-note-row" style={{ display: 'flex', gap: 6, width: '100%', boxSizing: 'border-box' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Log internal action or parts required…"
                      value={cardNotes[ticket.id] || ''}
                      onChange={(e) =>
                        setCardNotes((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddInlineNote(ticket.id);
                      }}
                      aria-label={`Internal note for ${ticket.id}`}
                      style={{ flex: 1, minWidth: 0, height: 36, fontSize: 13 }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleAddInlineNote(ticket.id)}
                      disabled={submittingNoteId === ticket.id}
                      style={{ flexShrink: 0, height: 36, padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Send size={12} />
                      Post
                    </button>
                  </div>
                </div>

                <div
                  className="ticket-card-footer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    flexWrap: 'wrap',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
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
                    style={{ minHeight: 34, display: 'inline-flex', alignItems: 'center', gap: 4 }}
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
  const [selectedLightboxImage, setSelectedLightboxImage] = useState(null);
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ minHeight: 38, height: 38 }}
            onClick={() => {
              onClose();
              navigate(`/staff/resolutions?ticketId=${ticket.id}`);
            }}
          >
            Reassign Ticket
          </button>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ minHeight: 38, height: 38 }}
              onClick={() => onQuickStatus(ticket.id, STATUSES.IN_PROGRESS, 'Started working on issue.')}
            >
              Mark In Progress
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ minHeight: 38, height: 38 }}
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
      <div className="meta-grid" style={{ width: '100%', minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <span className="meta-cell-label">Reporter</span>
          <span className="meta-cell-value" style={{ wordBreak: 'break-word' }}>
            {ticket.isAnonymous || ticket.anonymous ? 'Anonymous' : ticket.student?.name || '—'}
          </span>
          {ticket.student?.rollNo && !ticket.isAnonymous && (
            <span className="cell-sub" style={{ display: 'block', wordBreak: 'break-word' }}>
              {ticket.student.rollNo}
            </span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <span className="meta-cell-label">Location</span>
          <span className="meta-cell-value" style={{ wordBreak: 'break-word' }}>{ticket.location || '—'}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <span className="meta-cell-label">Handler</span>
          <span className="meta-cell-value" style={{ wordBreak: 'break-word' }}>
            {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
          </span>
          {ticket.assignedTo?.department && (
            <span className="cell-sub" style={{ display: 'block', wordBreak: 'break-word' }}>
              {ticket.assignedTo.department}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="resolution-summary" style={{ margin: 0, wordBreak: 'break-word' }}>
        <p className="resolution-summary-text" style={{ wordBreak: 'break-word', margin: 0 }}>{ticket.description}</p>
      </div>

      {/* Attached Media & Photo Evidence */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div style={{ margin: '12px 0', width: '100%', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <h4 className="section-heading" style={{ margin: 0, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Camera size={14} className="tone-accent" />
              Photo Evidence ({ticket.attachments.length})
            </h4>
            <span style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>Click to inspect full size</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 115px), 1fr))', gap: 8, width: '100%', minWidth: 0 }}>
            {ticket.attachments.map((att, idx) => (
              <div
                key={att.id || idx}
                onClick={() => setSelectedLightboxImage(att)}
                style={{
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid var(--app-border-soft)',
                  background: 'var(--app-card-bg-subtle)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                className="photo-card-hover"
                title={`Inspect ${att.name || 'photo'}`}
              >
                {att.url ? (
                  <div style={{ width: '100%', height: 82, position: 'relative' }}>
                    <img
                      src={att.url}
                      alt={att.name || 'Evidence'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        padding: '1px 5px',
                        borderRadius: 3,
                        fontSize: 9,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Maximize2 size={9} /> View
                    </span>
                  </div>
                ) : (
                  <div style={{ height: 82, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} className="tone-muted" />
                  </div>
                )}
                <div style={{ padding: '4px 6px' }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--app-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {att.name || `Photo ${idx + 1}`}
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--app-text-muted)' }}>
                    {att.size || 'Attached'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status audit log */}
      <div style={{ width: '100%', minWidth: 0 }}>
        <h4 className="section-heading" style={{ marginBottom: 10 }}>
          Audit Log
        </h4>
        <div className="history-notes" style={{ marginTop: 0, width: '100%', minWidth: 0 }}>
          {ticket.statusHistory?.length ? (
            ticket.statusHistory.map((item, idx) => (
              <div key={idx} className="history-note" style={{ flexWrap: 'wrap', gap: 6 }}>
                <span className="history-author" style={{ flexShrink: 0 }}>{item.updatedBy}</span>
                <span style={{ minWidth: 0, flex: 1, wordBreak: 'break-word' }}>
                  <strong>{STATUS_LABELS[item.status] || item.status}</strong> — {item.note}
                </span>
                <span className="history-time" style={{ flexShrink: 0 }}>{formatRelativeTime(item.timestamp)}</span>
              </div>
            ))
          ) : (
            <p className="no-comments">No status history available.</p>
          )}
        </div>
      </div>

      {/* Comments with tabs */}
      <div style={{ width: '100%', minWidth: 0 }}>
        <div className="card-header" style={{ marginBottom: 12, paddingBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <h4 className="section-heading" style={{ margin: 0 }}>
            <MessageSquare size={15} />
            Activity ({comments.length})
          </h4>

          <div className="segmented" style={{ maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex' }}>
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

        <div className="comments-list" style={{ maxHeight: 220, width: '100%', minWidth: 0 }}>
          {displayedComments.length === 0 ? (
            <p className="no-comments">No comments in this tab.</p>
          ) : (
            displayedComments.map((c) => (
              <div key={c.id || `${c.senderName}-${c.timestamp}`} className="comment-row">
                <span className={`comment-avatar ${c.isInternal ? 'staff' : 'user'}`} style={{ flexShrink: 0 }}>
                  {c.isInternal ? <Lock size={13} /> : <MessageSquare size={13} />}
                </span>
                <div
                  className="comment-bubble"
                  style={{
                    minWidth: 0,
                    wordBreak: 'break-word',
                    ...(c.isInternal
                      ? { borderColor: 'var(--app-accent-border)', background: 'var(--app-warning-subtle)' }
                      : {}),
                  }}
                >
                  <div className="comment-meta" style={{ flexWrap: 'wrap', gap: 4 }}>
                    <span className="comment-author">{c.senderName}</span>
                    {c.isInternal && (
                      <span className="comment-role" style={{ color: 'var(--app-warning)' }}>
                        INTERNAL
                      </span>
                    )}
                    <span className="comment-time">{formatRelativeTime(c.timestamp)}</span>
                  </div>
                  <p className="comment-text" style={{ wordBreak: 'break-word', margin: 0 }}>{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Internal note form */}
        <form onSubmit={onAddInternalNote} className="comment-form" style={{ width: '100%', boxSizing: 'border-box' }}>
          <span className="inline-note-head" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Lock size={11} style={{ flexShrink: 0 }} />
            <span>Post internal audit note</span>
          </span>
          <div className="inline-note-row" style={{ display: 'flex', gap: 6, width: '100%', boxSizing: 'border-box' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Log internal action, parts required…"
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              style={{ flex: 1, minWidth: 0, height: 38 }}
            />
            <button
              type="submit"
              className="btn btn-sm btn-outline"
              disabled={!internalNote.trim()}
              style={{ flexShrink: 0, height: 38, padding: '0 12px' }}
            >
              Log Note
            </button>
          </div>
        </form>
      </div>

      {/* Optional resolution note before marking resolved */}
      <div className="form-group" style={{ width: '100%', boxSizing: 'border-box' }}>
        <label htmlFor="modal-status-note" className="field-label" style={{ display: 'block' }}>
          Resolution / status note (attached when you mark a status below)
        </label>
        <textarea
          id="modal-status-note"
          className="form-textarea"
          rows={2}
          placeholder="Optional context saved with the next status change…"
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={(e) => onStatusSubmit(e, STATUSES.RESOLVED)}
            style={{ minHeight: 38, height: 38 }}
          >
            Submit Resolution with Note
          </button>
        </div>
      </div>

      {/* Photo Evidence Lightbox Modal */}
      {selectedLightboxImage && (
        <Modal
          title={selectedLightboxImage.name || 'Inspection Photo Evidence'}
          subtitle={selectedLightboxImage.size ? `Attached file size: ${selectedLightboxImage.size}` : 'High-resolution photo evidence'}
          onClose={() => setSelectedLightboxImage(null)}
          maxWidth={760}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--app-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Staff Inspection View · {ticket.id}
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedLightboxImage.url && (
                  <a
                    href={selectedLightboxImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ minHeight: 36, height: 36, display: 'inline-flex', alignItems: 'center' }}
                  >
                    Open Full Size
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ minHeight: 36, height: 36 }}
                  onClick={() => setSelectedLightboxImage(null)}
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#090d16',
              borderRadius: 8,
              overflow: 'hidden',
              minHeight: 200,
              maxHeight: '65vh',
              padding: 8,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {selectedLightboxImage.url ? (
              <img
                src={selectedLightboxImage.url}
                alt={selectedLightboxImage.name || 'Inspection Photo'}
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 4 }}
              />
            ) : (
              <div style={{ color: '#fff', padding: 40, textAlign: 'center' }}>
                Preview image unavailable
              </div>
            )}
          </div>
        </Modal>
      )}
    </Modal>
  );
}
