import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  SlidersHorizontal,
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
  MetricCard,
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

export default function MyComplaintsList() {
  const navigate = useNavigate();
  const { user, categories } = useAuth();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Complaints state
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadUserComplaints = async () => {
    try {
      let list = complaintService.getAll({
        studentId: user?.id,
        sortBy,
      });

      // Match by student ID or student email for clean privacy
      if ((!list || list.length === 0) && user?.email) {
        const all = complaintService.getAll({ sortBy });
        const byEmail = all.filter(
          (c) =>
            c.student?.email?.toLowerCase() === user.email?.toLowerCase() ||
            c.studentEmail?.toLowerCase() === user.email?.toLowerCase() ||
            c.student_email?.toLowerCase() === user.email?.toLowerCase()
        );
        list = byEmail;
      }
      setComplaints(list || []);
    } catch (err) {
      console.error('Failed to load complaints', err);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadUserComplaints();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  useEffect(() => {
    setIsLoading(true);
    loadUserComplaints();
    setIsLoading(false);
  }, [user, sortBy]);

  // Real-time live synchronization: instantly updates complaint list and status badges
  useEffect(() => {
    const unsubscribe = complaintService.subscribeToLiveUpdates(() => {
      loadUserComplaints();
    });

    return () => {
      unsubscribe();
    };
  }, [user, sortBy]);

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

  const availableCategories = useMemo(() => {
    const set = new Set(categories || []);
    complaints.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [categories, complaints]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
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
  }, [complaints, statusFilter, categoryFilter, priorityFilter, searchQuery]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categoryFilter !== 'all') count++;
    if (priorityFilter !== 'all') count++;
    if (sortBy !== 'newest') count++;
    if (searchQuery.trim() !== '') count++;
    return count;
  }, [categoryFilter, priorityFilter, sortBy, searchQuery]);

  const hasActiveFilters = activeFilterCount > 0 || statusFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSortBy('newest');
  };

  const chipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '16px',
    background: 'var(--app-raised, #ffffff)',
    border: '1px solid var(--app-border, #cbd5e1)',
    color: 'var(--app-text, #0f172a)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
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
        title="My Complaints"
        description={`Track resolution progress for every service request filed under ${user?.name || 'your account'}.`}
        actions={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              aria-label="Refresh complaints feed"
              title="Refresh complaints"
              style={{
                width: '38px',
                height: '38px',
                minWidth: '38px',
                padding: 0,
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={15} className={isRefreshing ? 'spin-animation' : ''} />
            </button>
            <Link
              to="/complaints/new"
              className="btn btn-primary"
              style={{
                flex: '1 1 auto',
                minWidth: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
          paddingBottom: '6px',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'all'}
          className={`status-segment-pill ${statusFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => setStatusFilter('all')}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          All Complaints
          <span className="segment-count">{metrics.total}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === STATUSES.PENDING}
          className={`status-segment-pill ${statusFilter === STATUSES.PENDING ? 'is-active' : ''}`}
          onClick={() => setStatusFilter(STATUSES.PENDING)}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          {STATUS_LABELS[STATUSES.PENDING]}
          <span className="segment-count">{metrics.pending}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === STATUSES.IN_PROGRESS}
          className={`status-segment-pill ${statusFilter === STATUSES.IN_PROGRESS ? 'is-active' : ''}`}
          onClick={() => setStatusFilter(STATUSES.IN_PROGRESS)}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          {STATUS_LABELS[STATUSES.IN_PROGRESS]}
          <span className="segment-count">{metrics.inProgress}</span>
        </button>

        {metrics.pendingConfirmation > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === STATUSES.PENDING_CONFIRMATION}
            className={`status-segment-pill is-review-pill ${
              statusFilter === STATUSES.PENDING_CONFIRMATION ? 'is-active' : ''
            }`}
            onClick={() => setStatusFilter(STATUSES.PENDING_CONFIRMATION)}
            style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            Needs Review
            <span className="segment-count">{metrics.pendingConfirmation}</span>
          </button>
        )}

        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === STATUSES.RESOLVED}
          className={`status-segment-pill ${statusFilter === STATUSES.RESOLVED ? 'is-active' : ''}`}
          onClick={() => setStatusFilter(STATUSES.RESOLVED)}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          {STATUS_LABELS[STATUSES.RESOLVED]}
          <span className="segment-count">{metrics.resolved}</span>
        </button>

        {metrics.rejected > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === STATUSES.REJECTED}
            className={`status-segment-pill ${statusFilter === STATUSES.REJECTED ? 'is-active' : ''}`}
            onClick={() => setStatusFilter(STATUSES.REJECTED)}
            style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            Rejected
            <span className="segment-count">{metrics.rejected}</span>
          </button>
        )}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search complaints"
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
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
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
          {Object.values(PRIORITIES).map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>

        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
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
            style={{ flexShrink: 0 }}
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>

      {/* 3. Active Filter Chips Row (Allows quick one-tap removal on mobile) */}
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

          {statusFilter !== 'all' && (
            <span
              className="badge-chip"
              onClick={() => setStatusFilter('all')}
              style={chipStyle}
            >
              Status: {STATUS_LABELS[statusFilter] || statusFilter}
              <X size={12} style={{ marginLeft: 3, opacity: 0.7 }} />
            </span>
          )}

          {categoryFilter !== 'all' && (
            <span
              className="badge-chip"
              onClick={() => setCategoryFilter('all')}
              style={chipStyle}
            >
              Dept: {categoryFilter}
              <X size={12} style={{ marginLeft: 3, opacity: 0.7 }} />
            </span>
          )}

          {priorityFilter !== 'all' && (
            <span
              className="badge-chip"
              onClick={() => setPriorityFilter('all')}
              style={chipStyle}
            >
              Priority: {priorityFilter}
              <X size={12} style={{ marginLeft: 3, opacity: 0.7 }} />
            </span>
          )}

          {searchQuery.trim() && (
            <span
              className="badge-chip"
              onClick={() => setSearchQuery('')}
              style={chipStyle}
            >
              "{searchQuery}"
              <X size={12} style={{ marginLeft: 3, opacity: 0.7 }} />
            </span>
          )}

          <button
            type="button"
            onClick={resetFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--app-accent, #6366f1)',
              cursor: 'pointer',
              fontSize: '11.5px',
              padding: '2px 6px',
              textDecoration: 'underline',
              fontWeight: 500,
            }}
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
        <div className="complaints-grid" style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
          {filteredComplaints.map((item) => {
            const isAwaitingReview = item.status === STATUSES.PENDING_CONFIRMATION;

            return (
              <article
                key={item.id}
                className={`ticket-card ${isAwaitingReview ? 'is-needs-review' : ''}`}
                onClick={() => navigate(`/track?id=${encodeURIComponent(item.id)}`)}
                style={{
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}
              >
                <div className="ticket-card-top" style={{ minWidth: 0 }}>
                  <TicketId id={item.id} />
                  <div className="ticket-card-badges" style={{ flexWrap: 'wrap', gap: '4px' }}>
                    <PriorityBadge priority={item.priority} />
                    <StatusBadge status={item.status} />
                  </div>
                </div>

                <h3 className="ticket-card-title">{item.title}</h3>

                <p className="ticket-card-snippet">{item.description}</p>

                {isAwaitingReview && (
                  <div className="ticket-action-notice" style={{ maxWidth: '100%' }}>
                    <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
                    <span>Staff marked resolved — review notes and confirm fix</span>
                  </div>
                )}

                <div className="ticket-card-meta" style={{ flexWrap: 'wrap', gap: '8px' }}>
                  <span className="meta-item" title="Category / Department">
                    <TagIcon size={13} />
                    {item.category}
                    {item.subCategory ? ` · ${item.subCategory}` : ''}
                  </span>
                  <span className="meta-item" title="Location">
                    <MapPin size={13} />
                    {item.location}
                  </span>
                  <span className="meta-item" title="Date filed">
                    <Clock size={13} />
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                <div
                  className="ticket-card-footer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  {isAwaitingReview ? (
                    <span className="handler-line" style={{ color: '#15803d', fontWeight: 600 }}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#16a34a',
                          display: 'inline-block',
                        }}
                      />
                      Action required
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
                      Review & Confirm
                      <ChevronRight size={13} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/track?id=${encodeURIComponent(item.id)}`)}
                    >
                      View Progress
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
