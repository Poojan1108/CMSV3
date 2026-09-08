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

  // Complaints state
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      const list = complaintService.getAll({
        studentId: user?.id,
        sortBy,
      });
      setComplaints(list);
    } catch (err) {
      console.error('Failed to load complaints', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, sortBy]);

  // Real-time live synchronization: instantly updates complaint list and status badges
  useEffect(() => {
    const unsubscribe = complaintService.subscribeToLiveUpdates(() => {
      try {
        const list = complaintService.getAll({
          studentId: user?.id,
          sortBy,
        });
        setComplaints(list);
      } catch (err) {
        console.error('Error in MyComplaintsList live sync:', err);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, sortBy]);

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

  // Tickets awaiting user confirmation
  const unconfirmedTickets = useMemo(
    () => complaints.filter((c) => c.status === STATUSES.PENDING_CONFIRMATION),
    [complaints]
  );

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

  const hasActiveFilters =
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    priorityFilter !== 'all' ||
    searchQuery.trim() !== '';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSortBy('newest');
  };

  const statusCounts = {
    [STATUSES.PENDING]: metrics.pending,
    [STATUSES.IN_PROGRESS]: metrics.inProgress,
    [STATUSES.RESOLVED]: metrics.resolved,
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="My Complaints"
        description={`Track resolution progress for every service request filed under ${user?.name || 'your account'}.`}
        actions={
          <Link to="/complaints/new" className="btn btn-primary">
            <PlusCircle size={16} />
            New Complaint
          </Link>
        }
      />

      {/* 1. Unified Status & Metric Segmented Control (Page 1 Spec) */}
      <div className="status-segment-strip" role="tablist" aria-label="Filter complaints by status">
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'all'}
          className={`status-segment-pill ${statusFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => setStatusFilter('all')}
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
          >
            Rejected
            <span className="segment-count">{metrics.rejected}</span>
          </button>
        )}
      </div>

      {/* 2. Streamlined Filter Toolbar (Content-on-Canvas) */}
      <div className="toolbar-row" style={{ marginTop: '12px', marginBottom: '8px' }}>
        <div className="search-field">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search by ticket ID, room, or issue..."
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
          {categories.map((cat) => (
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
          <button type="button" className="btn btn-ghost btn-sm" onClick={resetFilters}>
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* 3. Results Feed */}
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
              <X size={15} />
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
              >
                <div className="ticket-card-top">
                  <TicketId id={item.id} />
                  <div className="ticket-card-badges">
                    <PriorityBadge priority={item.priority} />
                    <StatusBadge status={item.status} />
                  </div>
                </div>

                <h3 className="ticket-card-title">{item.title}</h3>

                <p className="ticket-card-snippet">{item.description}</p>

                {isAwaitingReview && (
                  <div className="ticket-action-notice">
                    <CheckCircle2 size={13} />
                    <span>Staff marked resolved — review notes and confirm fix</span>
                  </div>
                )}

                <div className="ticket-card-meta">
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

                <div className="ticket-card-footer">
                  {isAwaitingReview ? (
                    <span className="handler-line" style={{ color: '#15803d', fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
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
