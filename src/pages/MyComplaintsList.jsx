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

      {/* Overview metrics */}
      <div className="stat-grid">
        <MetricCard icon={FileText} label="Total Filed" value={metrics.total} tone="accent" />
        <MetricCard
          icon={Clock}
          label={STATUS_LABELS[STATUSES.PENDING]}
          value={metrics.pending}
          tone="warning"
          onClick={() => setStatusFilter(statusFilter === STATUSES.PENDING ? 'all' : STATUSES.PENDING)}
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
          value={metrics.resolved}
          tone="success"
          onClick={() => setStatusFilter(statusFilter === STATUSES.RESOLVED ? 'all' : STATUSES.RESOLVED)}
          isActive={statusFilter === STATUSES.RESOLVED}
        />
      </div>

      {/* Awaiting confirmation banner */}
      {unconfirmedTickets.length > 0 && (
        <div className="callout callout-success" role="status">
          <CheckCircle2 size={18} />
          <div style={{ flex: 1 }}>
            <span className="callout-title">
              {unconfirmedTickets.length} ticket{unconfirmedTickets.length > 1 ? 's' : ''} awaiting
              your confirmation
            </span>
            Staff marked the issue as fixed. Review and confirm to close{' '}
            {unconfirmedTickets.length > 1 ? 'them' : 'it'}.
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() =>
              navigate(`/track?id=${encodeURIComponent(unconfirmedTickets[0].id)}`)
            }
          >
            Review {unconfirmedTickets[0].id}
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="card card-pad toolbar">
        <div className="toolbar-row">
          <div className="search-field">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by ticket ID, keywords or location…"
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

          <label className="filter-label" htmlFor="sort-select">
            Sort
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort complaints"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">Highest priority</option>
          </select>
        </div>

        <div className="toolbar-row">
          <div className="pill-group" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`filter-pill ${statusFilter === f.key ? 'is-active' : ''}`}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label}
                {f.key !== 'all' && ` (${statusCounts[f.key] ?? 0})`}
              </button>
            ))}
            {metrics.pendingConfirmation > 0 && (
              <button
                type="button"
                className={`filter-pill ${
                  statusFilter === STATUSES.PENDING_CONFIRMATION ? 'is-active' : ''
                }`}
                onClick={() =>
                  setStatusFilter(
                    statusFilter === STATUSES.PENDING_CONFIRMATION
                      ? 'all'
                      : STATUSES.PENDING_CONFIRMATION
                  )
                }
              >
                Needs Confirmation ({metrics.pendingConfirmation})
              </button>
            )}
            {metrics.rejected > 0 && (
              <button
                type="button"
                className={`filter-pill ${statusFilter === STATUSES.REJECTED ? 'is-active' : ''}`}
                onClick={() =>
                  setStatusFilter(statusFilter === STATUSES.REJECTED ? 'all' : STATUSES.REJECTED)
                }
              >
                Rejected ({metrics.rejected})
              </button>
            )}
          </div>

          <div className="toolbar-spacer" />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
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
          >
            <option value="all">All Priorities</option>
            {Object.values(PRIORITIES).map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetFilters}>
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <LoadingState label="Loading complaints…" />
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={hasActiveFilters ? 'No tickets match your filters' : 'No complaints yet'}
          description={
            hasActiveFilters
              ? 'Try adjusting your search or clearing the active filters.'
              : 'When you submit a complaint it will appear here with live status tracking.'
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
          {filteredComplaints.map((item) => (
            <article key={item.id} className="ticket-card">
              <div className="ticket-card-top">
                <TicketId id={item.id} />
                <div className="ticket-card-badges">
                  <PriorityBadge priority={item.priority} />
                  <StatusBadge status={item.status} />
                </div>
              </div>

              <h3 className="ticket-card-title">{item.title}</h3>

              <p className="ticket-card-snippet">
                {item.description.length > 140
                  ? `${item.description.substring(0, 140)}…`
                  : item.description}
              </p>

              <div className="ticket-card-meta">
                <span className="meta-item" title="Category">
                  <TagIcon size={13} />
                  {item.category}
                  {item.subCategory ? ` • ${item.subCategory}` : ''}
                </span>
                <span className="meta-item" title="Location">
                  <MapPin size={13} />
                  {item.location}
                </span>
                <span className="meta-item" title="Filed">
                  <Clock size={13} />
                  {formatRelativeTime(item.createdAt)}
                </span>
              </div>

              <div className="ticket-card-footer">
                {item.assignedTo ? (
                  <span className="handler-line is-assigned">
                    Assigned to {item.assignedTo.name}
                  </span>
                ) : (
                  <span className="handler-line">Awaiting triage</span>
                )}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/track?id=${encodeURIComponent(item.id)}`)}
                >
                  View Progress
                  <ChevronRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
