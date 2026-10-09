import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Search,
  Clock,
  CheckCircle2,
  RefreshCw,
  Inbox,
  X,
  ChevronRight,
  MapPin,
  Tag as TagIcon,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { complaintService } from '../services/complaintService';
import { STATUSES, PRIORITIES, STATUS_LABELS } from '../utils/constants';
import { formatRelativeTime } from '../utils/formatters';
import {
  PageHeader,
  EmptyState,
  LoadingState,
  StatusBadge,
  PriorityBadge,
  TicketId,
} from '../components/ui';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: STATUSES.PENDING, label: STATUS_LABELS[STATUSES.PENDING] },
  { key: STATUSES.IN_PROGRESS, label: STATUS_LABELS[STATUSES.IN_PROGRESS] },
  { key: STATUSES.RESOLVED, label: STATUS_LABELS[STATUSES.RESOLVED] },
];

const PRIORITY_WEIGHTS = {
  [PRIORITIES.URGENT]: 4,
  [PRIORITIES.HIGH]: 3,
  [PRIORITIES.MEDIUM]: 2,
  [PRIORITIES.LOW]: 1,
};


/**
 * MyComplaintsList
 *
 * Self-service dashboard for students and residents.
 * Features:
 * - URL Query Parameters synchronization for deep-linking & persistent triage views
 * - Single declarative asynchronous data pipeline eliminating double-fetch waterfalls
 * - Real-time WebSockets synchronization
 * - Highlighting of 'pending_confirmation' tickets requiring user review
 * - 100% preservation of all existing styling, layout tokens, and accessibility markers
 */
export default function MyComplaintsList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, categories } = useAuth();

  // URL-driven filter state (Linear / Plane standard)
  const statusFilter = searchParams.get('status') || 'all';
  const categoryFilter = searchParams.get('cat') || 'all';
  const priorityFilter = searchParams.get('priority') || 'all';
  const sortBy = searchParams.get('sort') || 'newest';

  // Search input state (local for responsive typing, synced on change)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync search input if URL changes externally
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    if (urlQ !== searchQuery) {
      setSearchQuery(urlQ);
    }
  }, [searchParams]);

  // Update URL search parameters
  const updateFilters = useCallback((updates) => {
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
  }, [setSearchParams]);

  // Single declarative asynchronous fetch
  const loadUserComplaints = useCallback(async () => {
    if (!user) return;
    try {
      const list = await complaintService.fetchComplaints({
        studentId: user?.id,
        sortBy,
      });

      // Forgiving matching: match by student ID or student email for clean privacy
      let userList = list || [];
      if (userList.length === 0 && user?.email) {
        const all = await complaintService.fetchComplaints({ sortBy });
        userList = (all || []).filter(
          (c) =>
            c.student?.id === user.id ||
            c.student?.email?.toLowerCase() === user.email?.toLowerCase() ||
            c.studentEmail?.toLowerCase() === user.email?.toLowerCase() ||
            c.student_email?.toLowerCase() === user.email?.toLowerCase()
        );
      }
      setComplaints(userList);
    } catch (err) {
      console.error('[MyComplaintsList] Failed to load complaints:', err);
    }
  }, [user?.id, user?.email, sortBy]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    loadUserComplaints().finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [loadUserComplaints]);

  // Real-time live synchronization: instantly updates complaint list on background events
  useEffect(() => {
    const unsubscribe = complaintService.subscribeToLiveUpdates(() => {
      loadUserComplaints();
    });

    return () => {
      unsubscribe();
    };
  }, [loadUserComplaints]);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadUserComplaints();
    setTimeout(() => setIsRefreshing(false), 400);
  }, [loadUserComplaints]);

  // Overview metrics
  const metrics = useMemo(() => {
    const count = (status) => complaints.filter((c) => c.status === status).length;
    return {
      total: complaints.length,
      pending: count(STATUSES.PENDING),
      inProgress: count(STATUSES.IN_PROGRESS),
      pendingConfirmation: count(STATUSES.PENDING_CONFIRMATION),
      resolved: count(STATUSES.RESOLVED),
      rejected: count(STATUSES.REJECTED),
    };
  }, [complaints]);

  const statusTabs = useMemo(() => [
    { key: 'all', label: 'All Complaints', count: metrics.total },
    { key: STATUSES.PENDING, label: STATUS_LABELS[STATUSES.PENDING] || 'Pending', count: metrics.pending },
    { key: STATUSES.IN_PROGRESS, label: STATUS_LABELS[STATUSES.IN_PROGRESS] || 'In Progress', count: metrics.inProgress },
    ...(metrics.pendingConfirmation > 0
      ? [{ key: STATUSES.PENDING_CONFIRMATION, label: 'Needs Review', count: metrics.pendingConfirmation, isReview: true }]
      : []),
    { key: STATUSES.RESOLVED, label: STATUS_LABELS[STATUSES.RESOLVED] || 'Resolved', count: metrics.resolved },
    ...(metrics.rejected > 0
      ? [{ key: STATUSES.REJECTED, label: 'Rejected', count: metrics.rejected }]
      : []),
  ], [metrics]);

  const availableCategories = useMemo(() => {
    const set = new Set(categories || []);
    complaints.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [categories, complaints]);

  // Multi-facet filtering and client-side sorting stability
  const filteredComplaints = useMemo(() => {
    let result = complaints.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const haystack = [
          item.id,
          item.title,
          item.description,
          item.category,
          item.subCategory,
          item.location,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'priority') {
        const weightA = PRIORITY_WEIGHTS[a.priority] || 0;
        const weightB = PRIORITY_WEIGHTS[b.priority] || 0;
        return weightB - weightA;
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return result;
  }, [complaints, statusFilter, categoryFilter, priorityFilter, searchQuery, sortBy]);

  const hasActiveFilters =
    categoryFilter !== 'all' ||
    priorityFilter !== 'all' ||
    statusFilter !== 'all' ||
    searchQuery.trim() !== '';

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return (
    <div className="page-stack">
      <PageHeader
        title="My Complaints"
        description={`Track resolution progress for every service request filed under ${user?.name || 'your account'}.`}
        actions={
          <div className="page-actions">
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              aria-label="Refresh complaints feed"
              title="Refresh complaints"
            >
              <RefreshCw size={15} className={isRefreshing ? 'spin-animation' : ''} />
            </button>
            <Link
              to="/complaints/new"
              className="btn btn-primary"
            >
              <PlusCircle size={16} />
              <span>New Complaint</span>
            </Link>
          </div>
        }
      />

      {/* 1. Unified Status & Metric Segmented Control */}
      <div
        className="status-segment-strip"
        role="tablist"
        aria-label="Filter complaints by status"
      >
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`status-segment-pill ${isActive ? 'is-active' : ''} ${
                tab.isReview ? 'is-review-pill' : ''
              }`}
              onClick={() => updateFilters({ status: tab.key })}
            >
              <span>{tab.label}</span>
              <span className="segment-count">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Mobile Responsive Search & Filter Toolbar */}
      <div
        className="toolbar-row"
        style={{
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          marginTop: '12px',
          marginBottom: '8px',
          boxSizing: 'border-box',
        }}
      >
        <div className="search-field" style={{ flex: '1 1 200px', minWidth: 0 }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search tickets, rooms, or issues..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              updateFilters({ q: e.target.value });
            }}
            aria-label="Search complaints"
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

        <div className="toolbar-group">
          <select
            value={categoryFilter}
            onChange={(e) => updateFilters({ cat: e.target.value })}
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
            {Object.values(PRIORITIES).map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>

          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            aria-label="Sort complaints"
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
              onClick={resetFilters}
              title="Reset all filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Active Filter Chips Row */}
      {hasActiveFilters && (
        <div className="active-filter-chips">
          <span style={{ color: 'var(--app-text-muted, #71717a)', marginRight: 2 }}>Active:</span>

          {statusFilter !== 'all' && (
            <button
              type="button"
              className="filter-chip"
              onClick={() => updateFilters({ status: 'all' })}
            >
              <span>Status: {STATUS_LABELS[statusFilter] || statusFilter}</span>
              <X size={12} className="chip-remove" />
            </button>
          )}

          {categoryFilter !== 'all' && (
            <button
              type="button"
              className="filter-chip"
              onClick={() => updateFilters({ cat: 'all' })}
            >
              <span>Dept: {categoryFilter}</span>
              <X size={12} className="chip-remove" />
            </button>
          )}

          {priorityFilter !== 'all' && (
            <button
              type="button"
              className="filter-chip"
              onClick={() => updateFilters({ priority: 'all' })}
            >
              <span>Priority: {priorityFilter}</span>
              <X size={12} className="chip-remove" />
            </button>
          )}

          {searchQuery.trim() && (
            <button
              type="button"
              className="filter-chip"
              onClick={() => {
                setSearchQuery('');
                updateFilters({ q: '' });
              }}
            >
              <span>"{searchQuery}"</span>
              <X size={12} className="chip-remove" />
            </button>
          )}

          <button
            type="button"
            onClick={resetFilters}
            className="filter-chip-clear"
          >
            Clear all
          </button>
        </div>
      )}

      {/* 4. Results Feed */}
      {isLoading ? (
        <LoadingState label="Loading complaints…" />
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={hasActiveFilters ? 'No tickets match your filters' : 'No complaints yet'}
          description={
            hasActiveFilters
              ? 'Try adjusting your search query or clearing active filters.'
              : 'When you submit a service request it will appear here with live tracking.'
          }
        >
          {hasActiveFilters && (
            <button type="button" className="btn btn-secondary" onClick={resetFilters}>
              <RotateCcw size={15} />
              Clear filters
            </button>
          )}
          <Link to="/complaints/new" className="btn btn-primary">
            <PlusCircle size={15} />
            Lodge New Complaint
          </Link>
        </EmptyState>
      ) : (
        <div className="complaints-grid">
          {filteredComplaints.map((item) => {
            const isAwaitingReview = item.status === STATUSES.PENDING_CONFIRMATION;

            return (
              <article
                key={item.id}
                className={`ticket-card ${isAwaitingReview ? 'is-needs-review' : ''}`}
                onClick={() => navigate(`/track?id=${encodeURIComponent(item.id)}`)}
              >
                <div className="ticket-card-top">
                  <TicketId id={item.id} />
                  <div className="ticket-card-badges">
                    <PriorityBadge priority={item.priority} />
                    <StatusBadge status={item.status} />
                  </div>
                </div>

                <div className="ticket-card-body">
                  <h3 className="ticket-card-title">{item.title}</h3>
                  <p className="ticket-card-snippet">{item.description}</p>
                </div>

                {isAwaitingReview && (
                  <div className="ticket-action-notice">
                    <CheckCircle2 size={13} />
                    <span>Staff marked resolved — review notes and confirm fix</span>
                  </div>
                )}

                <div className="ticket-card-meta">
                  <span className="meta-item" title="Category / Department">
                    <TagIcon size={13} />
                    <span>{item.category}{item.subCategory ? ` · ${item.subCategory}` : ''}</span>
                  </span>
                  <span className="meta-item" title="Location">
                    <MapPin size={13} />
                    <span>{item.location}</span>
                  </span>
                  <span className="meta-item" title="Date filed">
                    <Clock size={13} />
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </span>
                </div>

                <div
                  className="ticket-card-footer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isAwaitingReview ? (
                    <span className="handler-line is-review-needed">
                      <span className="handler-dot-pulse" />
                      <span>Action required</span>
                    </span>
                  ) : item.assignedTo ? (
                    <span className="handler-line">
                      Assigned to <strong>{item.assignedTo.name}</strong>
                    </span>
                  ) : (
                    <span className="handler-line">Awaiting triage</span>
                  )}

                  {isAwaitingReview ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/track?id=${encodeURIComponent(item.id)}`)}
                    >
                      <CheckCircle2 size={13} />
                      <span>Review & Confirm</span>
                      <ChevronRight size={13} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/track?id=${encodeURIComponent(item.id)}`)}
                    >
                      <span>View Progress</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
