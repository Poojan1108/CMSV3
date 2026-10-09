import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Inbox,
  Clock,
  CheckCircle2,
  Search,
  RefreshCw,
  User,
  MapPin,
  X,
  ChevronRight,
  Shield,
  UserCheck,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import { STATUSES, PRIORITIES, STATUS_LABELS, PRIORITY_LABELS, ROLES } from '../utils/constants';
import { formatRelativeTime, getSlaStatus } from '../utils/formatters';
import {
  PageHeader,
  EmptyState,
  LoadingState,
  MetricCard,
  StatusBadge,
  PriorityBadge,
  SlaBadge,
  TicketId,
  Tag,
} from '../components/ui';
import TicketDetailModal from '../components/tickets/TicketDetailModal';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  ...Object.values(STATUSES).map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

const PRIORITY_FILTER_OPTIONS = [
  { value: PRIORITIES.URGENT, label: `${PRIORITY_LABELS[PRIORITIES.URGENT]} (12h SLA)` },
  { value: PRIORITIES.HIGH, label: `${PRIORITY_LABELS[PRIORITIES.HIGH]} (24h SLA)` },
  { value: PRIORITIES.MEDIUM, label: `${PRIORITY_LABELS[PRIORITIES.MEDIUM]} (48h SLA)` },
  { value: PRIORITIES.LOW, label: `${PRIORITY_LABELS[PRIORITIES.LOW]} (72h SLA)` },
];

const PRIORITY_WEIGHTS = {
  [PRIORITIES.URGENT]: 4,
  [PRIORITIES.HIGH]: 3,
  [PRIORITIES.MEDIUM]: 2,
  [PRIORITIES.LOW]: 1,
};

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

/**
 * StaffQueue
 *
 * Operational triage queue for resolvers and staff.
 * Features:
 * - URL Query Parameters synchronization for deep-linking & persistent triage views
 * - Optimistic UI updates with rollback resilience
 * - Component-isolated inspection modal preventing re-render tax
 * - Dynamic category taxonomy & multi-field search indexing
 */
export default function StaffQueue() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, categories, currentOrg, orgKey } = useAuth();
  const { showToast } = useToast();

  const isAssignedRoute = location.pathname.includes('/staff/assigned');

  // URL-driven filter parameters (Plane / Linear standard)
  const scopeParam = searchParams.get('scope');
  const scopeFilter = scopeParam || (isAssignedRoute ? 'assigned' : 'all');
  const statusFilter = searchParams.get('status') || 'all';
  const priorityFilter = searchParams.get('priority') || 'all';
  const departmentFilter = searchParams.get('dept') || 'all';
  const sortBy = searchParams.get('sort') || 'newest';
  const slaFilter = searchParams.get('sla') || 'all';

  // Search input state (local for responsive typing, synced on change)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Sync search input if URL changes externally
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    if (urlQ !== searchQuery) {
      setSearchQuery(urlQ);
    }
  }, [searchParams]);

  // Helper to update URL query params with seamless route switching
  const updateFilters = useCallback((updates) => {
    // If user explicitly asks for scope: 'all' while on /staff/assigned, navigate to /staff/queue
    if (updates.scope === 'all' && isAssignedRoute) {
      const next = new URLSearchParams(searchParams);
      next.delete('scope');
      Object.entries(updates).forEach(([key, val]) => {
        if (key === 'scope') return;
        if (!val || val === 'all' || val === 'newest') {
          next.delete(key);
        } else {
          next.set(key, val);
        }
      });
      const qs = next.toString();
      navigate(`/staff/queue${qs ? `?${qs}` : ''}`, { replace: true });
      return;
    }

    // If user explicitly asks for scope: 'assigned' while on /staff/queue, navigate to /staff/assigned
    if (updates.scope === 'assigned' && !isAssignedRoute) {
      const next = new URLSearchParams(searchParams);
      next.delete('scope');
      Object.entries(updates).forEach(([key, val]) => {
        if (key === 'scope') return;
        if (!val || val === 'all' || val === 'newest') {
          next.delete(key);
        } else {
          next.set(key, val);
        }
      });
      const qs = next.toString();
      navigate(`/staff/assigned${qs ? `?${qs}` : ''}`, { replace: true });
      return;
    }

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (!val || val === 'all' || val === 'newest') {
          next.delete(key);
        } else {
          next.set(key, val);
        }
      });
      return next;
    }, { replace: true });
  }, [isAssignedRoute, navigate, searchParams, setSearchParams]);

  // Dynamic taxonomy of categories across user config and records
  const availableCategories = useMemo(() => {
    return Array.from(new Set([...(categories || []), ...complaints.map((c) => c.category)].filter(Boolean)));
  }, [categories, complaints]);

  // Load complaints from Tier 1 service
  const loadComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await complaintService.fetchComplaints({ org: orgKey, sortBy });
      setComplaints(data || []);

      if (selectedTicket) {
        const refreshed = complaintService.getById(selectedTicket.id);
        if (refreshed) setSelectedTicket(refreshed);
      }
    } catch (err) {
      console.error('[StaffQueue] Failed to fetch complaints queue:', err);
      showToast('Error loading queue items', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [orgKey, sortBy, selectedTicket, showToast]);

  useEffect(() => {
    loadComplaints();
  }, [orgKey, sortBy]);

  // Real-time synchronization subscription
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
        console.error('[StaffQueue] Error in live sync:', err);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orgKey, sortBy]);

  // KPI Metrics calculation
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

  // Multi-facet filtering and sorting pipeline
  const filteredComplaints = useMemo(() => {
    let result = complaints.filter((item) => {
      if (scopeFilter === 'assigned') {
        const isMine = item.assignedTo && item.assignedTo.id === user?.id;
        if (!isMine) return false;
      }
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      if (departmentFilter !== 'all' && item.category !== departmentFilter) return false;

      if (slaFilter === 'breached') {
        const sla = getSlaStatus(item);
        if (!sla.isBreached || sla.isCompleted) return false;
      }

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

    // Client-side sort stability
    result.sort((a, b) => {
      if (sortBy === 'priority') {
        const weightA = PRIORITY_WEIGHTS[a.priority] || 0;
        const weightB = PRIORITY_WEIGHTS[b.priority] || 0;
        return weightB - weightA;
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      // default: newest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return result;
  }, [complaints, scopeFilter, statusFilter, priorityFilter, departmentFilter, slaFilter, searchQuery, sortBy, user]);

  const hasActiveFilters =
    scopeFilter !== 'all' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    departmentFilter !== 'all' ||
    slaFilter !== 'all' ||
    searchQuery.trim() !== '';

  const actor = useCallback(() => {
    return user || { name: 'Staff Resolver', role: ROLES.STAFF };
  }, [user]);

  // Optimistic Quick Status Update with instant rollback on failure
  const handleQuickStatusChange = useCallback(async (ticketId, newStatus, note = '') => {
    const previousComplaints = [...complaints];
    const previousSelected = selectedTicket;

    // Optimistic UI mutation
    setComplaints((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      let updated;
      if (newStatus === STATUSES.RESOLVED) {
        updated = await complaintService.proposeResolution(
          ticketId,
          actor(),
          note || 'Staff marked ticket as resolved. Awaiting confirmation.'
        );
        if (updated) showToast(`Resolution request sent for ${ticketId}`, 'success');
      } else {
        updated = await complaintService.updateStatus(
          ticketId,
          newStatus,
          actor(),
          note || `Status updated to ${STATUS_LABELS[newStatus] || newStatus}`
        );
        if (updated) showToast(`${ticketId} → ${STATUS_LABELS[newStatus] || newStatus}`, 'success');
      }

      if (updated) {
        setComplaints((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
        if (selectedTicket?.id === ticketId) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error('[StaffQueue] Failed to update status:', err);
      setComplaints(previousComplaints);
      setSelectedTicket(previousSelected);
      showToast('Failed to update ticket status', 'error');
    }
  }, [complaints, selectedTicket, actor, showToast]);

  const handleClaimTicket = useCallback(async (ticketId) => {
    const currentActor = actor();
    try {
      const updated = await complaintService.reassign(
        ticketId,
        {
          id: currentActor.id || user?.id,
          name: currentActor.name || user?.name || 'Staff Resolver',
          department: currentActor.department || user?.department || 'Staff Department',
          departmentId: currentActor.departmentId || user?.departmentId || null,
        },
        currentActor,
        'Claimed ticket from queue'
      );
      if (updated) {
        setComplaints((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
        if (selectedTicket?.id === ticketId) setSelectedTicket(updated);
        showToast('Ticket claimed successfully', 'success');
      }
    } catch (err) {
      console.error('[StaffQueue] Failed to claim ticket:', err);
      showToast('Failed to claim ticket', 'error');
    }
  }, [actor, user, selectedTicket, showToast]);

  const handleOpenTicketDetails = useCallback(async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const detailed = await complaintService.syncTicketDetails(ticket.id);
      if (detailed) {
        setSelectedTicket(detailed);
      }
    } catch (err) {
      console.warn('[StaffQueue] Failed to load ticket details:', err);
    }
  }, []);

  const handleModalAddInternalNote = useCallback((e, noteText) => {
    if (!selectedTicket || !noteText?.trim()) return;

    try {
      const updated = complaintService.addComment(
        selectedTicket.id,
        actor(),
        noteText.trim(),
        true
      );
      if (updated) {
        showToast('Internal note added to ticket', 'success');
        setSelectedTicket(updated);
      }
    } catch (err) {
      console.error('[StaffQueue] Failed to post internal note:', err);
      showToast('Error adding internal note', 'error');
    }
  }, [selectedTicket, actor, showToast]);

  const handleModalStatusSubmit = useCallback((e, newStatus, noteText) => {
    if (!selectedTicket) return;
    handleQuickStatusChange(selectedTicket.id, newStatus, noteText);
  }, [selectedTicket, handleQuickStatusChange]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    if (isAssignedRoute) {
      navigate('/staff/queue', { replace: true });
    } else {
      setSearchParams(new URLSearchParams(), { replace: true });
    }
  }, [isAssignedRoute, navigate, setSearchParams]);

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

      {/* KPI Metrics Summary Cards */}
      <div className="stat-grid" style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <MetricCard
          icon={UserCheck}
          label="Assigned to Me"
          value={metrics.assignedToMe}
          tone="accent"
          onClick={() => {
            updateFilters({ scope: scopeFilter === 'assigned' ? 'all' : 'assigned' });
          }}
          isActive={scopeFilter === 'assigned'}
        />
        <MetricCard
          icon={Clock}
          label={STATUS_LABELS[STATUSES.PENDING]}
          value={metrics.pendingReview}
          tone="warning"
          onClick={() =>
            updateFilters({ status: statusFilter === STATUSES.PENDING ? 'all' : STATUSES.PENDING })
          }
          isActive={statusFilter === STATUSES.PENDING}
        />
        <MetricCard
          icon={RefreshCw}
          label={STATUS_LABELS[STATUSES.IN_PROGRESS]}
          value={metrics.inProgress}
          tone="info"
          onClick={() =>
            updateFilters({ status: statusFilter === STATUSES.IN_PROGRESS ? 'all' : STATUSES.IN_PROGRESS })
          }
          isActive={statusFilter === STATUSES.IN_PROGRESS}
        />
        <MetricCard
          icon={CheckCircle2}
          label={STATUS_LABELS[STATUSES.RESOLVED]}
          value={metrics.resolvedToday}
          tone="success"
          onClick={() =>
            updateFilters({ status: statusFilter === STATUSES.RESOLVED ? 'all' : STATUSES.RESOLVED })
          }
          isActive={statusFilter === STATUSES.RESOLVED}
        />
      </div>

      {/* SLA Breach Banner */}
      {metrics.slaBreached > 0 && (
        <div className="callout callout-danger" role="alert" style={{ width: '100%', boxSizing: 'border-box' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ minWidth: 0, wordBreak: 'break-word' }}>
            <span className="callout-title">SLA breached</span>
            {metrics.slaBreached} ticket{metrics.slaBreached > 1 ? 's' : ''} exceeded the target resolution window.
          </div>
        </div>
      )}

      {/* Triage Command Strip */}
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
          onClick={() => updateFilters({ scope: 'all', status: 'all' })}
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
          onClick={() => updateFilters({ scope: 'assigned', status: 'all' })}
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
          onClick={() => updateFilters({ scope: 'all', status: STATUSES.PENDING })}
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
          onClick={() => updateFilters({ scope: 'all', status: STATUSES.IN_PROGRESS })}
        >
          In Progress
          <span className="segment-count">{metrics.inProgress}</span>
        </button>

        {metrics.slaBreached > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={slaFilter === 'breached'}
            className="status-segment-pill"
            style={{
              flexShrink: 0,
              whiteSpace: 'nowrap',
              borderColor: 'var(--app-danger)',
              color: 'var(--app-danger)',
              background: slaFilter === 'breached' ? 'var(--app-danger-subtle)' : 'var(--app-surface)',
            }}
            onClick={() =>
              updateFilters({ sla: slaFilter === 'breached' ? 'all' : 'breached' })
            }
          >
            <AlertTriangle size={13} style={{ color: 'var(--app-danger)' }} />
            SLA Critical
            <span className="segment-count" style={{ background: 'var(--app-danger)', color: '#fff' }}>
              {metrics.slaBreached}
            </span>
          </button>
        )}
      </div>

      {/* Toolbar & Filter Controls */}
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
            placeholder={`Search ID, keyword, ${currentOrg?.locationLabel?.split('/')[0]?.trim().toLowerCase() || 'unit'}, or ${currentOrg?.userTerm?.toLowerCase() || 'resident'}...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              updateFilters({ q: e.target.value });
            }}
            aria-label="Search tickets"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear"
              onClick={() => {
                setSearchQuery('');
                updateFilters({ q: '' });
              }}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="toolbar-spacer" />

        <select
          value={departmentFilter}
          onChange={(e) => updateFilters({ dept: e.target.value })}
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
          onChange={(e) => updateFilters({ priority: e.target.value })}
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
          onChange={(e) => updateFilters({ sort: e.target.value })}
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
              onClick={() => updateFilters({ scope: 'all' })}
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
              onClick={() => updateFilters({ status: 'all' })}
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
              onClick={() => updateFilters({ priority: 'all' })}
              style={chipStyle}
              title="Remove priority filter"
            >
              Priority: {PRIORITY_LABELS[priorityFilter] || priorityFilter}
              <X size={12} style={{ marginLeft: 4 }} />
            </button>
          )}

          {slaFilter !== 'all' && (
            <button
              type="button"
              onClick={() => updateFilters({ sla: 'all' })}
              style={chipStyle}
              title="Remove SLA filter"
            >
              SLA: Breached
              <X size={12} style={{ marginLeft: 4 }} />
            </button>
          )}

          {departmentFilter !== 'all' && (
            <button
              type="button"
              onClick={() => updateFilters({ dept: 'all' })}
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
              onClick={() => {
                setSearchQuery('');
                updateFilters({ q: '' });
              }}
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

      {/* Ticket Cards Grid */}
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
                onClick={() => handleOpenTicketDetails(ticket)}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  padding: 'clamp(14px, 3.5vw, 18px)',
                  cursor: 'pointer',
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

                <h3
                  className="ticket-card-title"
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                >
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

                {/* Quick Status Action Row */}
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
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleQuickStatusChange(ticket.id, e.target.value);
                    }}
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
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className="handler-line">Unassigned</span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaimTicket(ticket.id);
                        }}
                        style={{ height: 26, fontSize: 11, padding: '0 8px', borderRadius: 4 }}
                        title="Claim this ticket"
                      >
                        + Claim
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenTicketDetails(ticket);
                    }}
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

      {/* Decoupled Detail Modal with Isolated Internal Note Draft State */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onQuickStatus={handleQuickStatusChange}
          onClaimTicket={handleClaimTicket}
          onAddInternalNote={handleModalAddInternalNote}
          onStatusSubmit={handleModalStatusSubmit}
          navigate={navigate}
        />
      )}
    </div>
  );
}
