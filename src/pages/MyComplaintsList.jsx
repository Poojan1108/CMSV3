import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Shield,
  Tag,
  SlidersHorizontal,
  RefreshCw,
  Inbox,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { complaintService } from '../services/complaintService';
import { STATUSES, PRIORITIES, STATUS_LABELS, PRIORITY_LABELS } from '../utils/constants';
import { formatRelativeTime, getStatusBadgeColor, getPriorityBadgeColor } from '../utils/formatters';

export default function MyComplaintsList() {
  const navigate = useNavigate();
  const { user, categories, currentOrg, orgKey } = useAuth();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Complaints state
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load complaints from complaintService
  const loadComplaints = () => {
    setIsLoading(true);
    try {
      const allList = complaintService.getAll({
        studentId: user?.id || 'usr_student_1',
        org: orgKey,
        currentOrg: orgKey,
        sortBy,
      });
      setComplaints(allList);
    } catch (err) {
      console.error('Failed to load complaints', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [user, orgKey, sortBy]);

  // Compute metrics overview totals
  const metrics = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === STATUSES.PENDING).length;
    const inProgress = complaints.filter((c) => c.status === STATUSES.IN_PROGRESS).length;
    const pendingConfirmation = complaints.filter((c) => c.status === STATUSES.PENDING_CONFIRMATION).length;
    const resolved = complaints.filter((c) => c.status === STATUSES.RESOLVED).length;
    const rejected = complaints.filter((c) => c.status === STATUSES.REJECTED).length;
    return { total, pending, inProgress, pendingConfirmation, resolved, rejected };
  }, [complaints]);

  // Tickets awaiting user confirmation
  const unconfirmedTickets = useMemo(() => {
    return complaints.filter((c) => c.status === STATUSES.PENDING_CONFIRMATION);
  }, [complaints]);

  // Filter complaints client-side based on search, status, category, priority
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }
      // Priority filter
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
        return false;
      }
      // Search text query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchId = item.id.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCat = item.category?.toLowerCase().includes(q);
        const matchSub = item.subCategory?.toLowerCase().includes(q);
        const matchLoc = item.location?.toLowerCase().includes(q);

        if (!matchId && !matchTitle && !matchDesc && !matchCat && !matchSub && !matchLoc) {
          return false;
        }
      }
      return true;
    });
  }, [complaints, statusFilter, categoryFilter, priorityFilter, searchQuery]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="my-complaints-page">
      {/* Page Header */}
      <div className="page-header-container">
        <div>
          <h1 className="page-title-gradient">My Complaints & Service Requests</h1>
          <p className="page-subtitle">
            Monitor, inspect, and track real-time resolution progress for all tickets registered under your persona ({user?.name || 'Alex Chen'}).
          </p>
        </div>

        <div className="page-header-actions">
          <Link to="/complaints/new" className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Lodge New Complaint</span>
          </Link>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="metrics-overview-grid">
        <div className="metric-card metric-total">
          <div className="metric-icon-box bg-indigo-500/15 text-indigo-400">
            <FileText size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.total}</span>
            <span className="metric-label">Total Filed Tickets</span>
          </div>
        </div>

        <div className="metric-card metric-pending">
          <div className="metric-icon-box bg-amber-500/15 text-amber-400">
            <Clock size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.pending}</span>
            <span className="metric-label">Pending Review</span>
          </div>
        </div>

        <div className="metric-card metric-progress">
          <div className="metric-icon-box bg-blue-500/15 text-blue-400">
            <RefreshCw size={22} className="animate-spin-slow" />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.inProgress}</span>
            <span className="metric-label">In Progress</span>
          </div>
        </div>

        <div className="metric-card metric-resolved">
          <div className="metric-icon-box bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.resolved}</span>
            <span className="metric-label">Resolved / Closed</span>
          </div>
        </div>
      </div>

      {/* Unconfirmed Resolution Alert Banner */}
      {unconfirmedTickets.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(56, 189, 248, 0.12))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f9fafb', margin: 0 }}>
                {unconfirmedTickets.length} Ticket{unconfirmedTickets.length > 1 ? 's' : ''} Awaiting Your Resolution Confirmation!
              </h4>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                Staff has resolved the issue. Please inspect and confirm to close your ticket.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/track?id=${encodeURIComponent(unconfirmedTickets[0].id)}`)}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
          >
            <span>Review Resolution ({unconfirmedTickets[0].id})</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Toolbar: Filters & Search */}
      <div className="filter-toolbar-card">
        {/* Top Search Bar & Sort */}
        <div className="toolbar-top-row">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Ticket ID (e.g. CMS-2026-1001), keywords, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="toolbar-sort-group">
            <label htmlFor="sort-select" className="sort-label">
              <SlidersHorizontal size={14} />
              Sort:
            </label>
            <select
              id="sort-select"
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="toolbar-filters-row">
          {/* Status Filter Pills */}
          <div className="status-pills-group">
            <button
              type="button"
              className={`status-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Statuses
            </button>
            <button
              type="button"
              className={`status-pill pill-pending ${statusFilter === STATUSES.PENDING ? 'active' : ''}`}
              onClick={() => setStatusFilter(STATUSES.PENDING)}
            >
              Pending ({metrics.pending})
            </button>
            <button
              type="button"
              className={`status-pill pill-progress ${statusFilter === STATUSES.IN_PROGRESS ? 'active' : ''}`}
              onClick={() => setStatusFilter(STATUSES.IN_PROGRESS)}
            >
              In Progress ({metrics.inProgress})
            </button>
            {metrics.pendingConfirmation > 0 && (
              <button
                type="button"
                className={`status-pill ${statusFilter === STATUSES.PENDING_CONFIRMATION ? 'active' : ''}`}
                onClick={() => setStatusFilter(STATUSES.PENDING_CONFIRMATION)}
                style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
              >
                Needs Confirmation ({metrics.pendingConfirmation})
              </button>
            )}
            <button
              type="button"
              className={`status-pill pill-resolved ${statusFilter === STATUSES.RESOLVED ? 'active' : ''}`}
              onClick={() => setStatusFilter(STATUSES.RESOLVED)}
            >
              Resolved ({metrics.resolved})
            </button>

            {metrics.rejected > 0 && (
              <button
                type="button"
                className={`status-pill pill-rejected ${statusFilter === STATUSES.REJECTED ? 'active' : ''}`}
                onClick={() => setStatusFilter(STATUSES.REJECTED)}
              >
                Rejected ({metrics.rejected})
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="dropdown-filters-group">
            <select
              className="toolbar-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className="toolbar-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value={PRIORITIES.LOW}>Low Priority</option>
              <option value={PRIORITIES.MEDIUM}>Medium Priority</option>
              <option value={PRIORITIES.HIGH}>High Priority</option>
              <option value={PRIORITIES.URGENT}>Urgent Priority</option>
            </select>

            {(statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-reset-filter"
                onClick={resetFilters}
                title="Reset all active filters"
              >
                <X size={14} />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Cards List or Empty State */}
      {isLoading ? (
        <div className="loading-state-card">
          <div className="spinner" />
          <p>Loading complaints...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon-box">
            <Inbox size={48} className="text-slate-400" />
          </div>
          <h3 className="empty-title">No Complaints Found</h3>
          <p className="empty-description">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all'
              ? 'No service tickets match your active search or filter criteria. Try resetting filters.'
              : 'You have not submitted any complaint tickets yet.'}
          </p>

          <div className="empty-actions">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all' ? (
              <button type="button" className="btn btn-secondary" onClick={resetFilters}>
                <X size={16} />
                Clear Active Filters
              </button>
            ) : null}

            <Link to="/complaints/new" className="btn btn-primary">
              <PlusCircle size={16} />
              Lodge New Complaint
            </Link>
          </div>
        </div>
      ) : (
        <div className="complaints-cards-grid">
          {filteredComplaints.map((item) => {
            const statusStyle = getStatusBadgeColor(item.status);
            const priorityStyle = getPriorityBadgeColor(item.priority);

            return (
              <div key={item.id} className="complaint-item-card">
                {/* Card Top Row: Ticket ID & Badges */}
                <div className="card-top-header">
                  <div className="ticket-id-badge" title="Unique Ticket ID">
                    <Tag size={13} />
                    <span>{item.id}</span>
                  </div>

                  <div className="card-header-right-badges">
                    {/* Status Badge */}
                    <span className={`status-badge-chip ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                      <span className={`status-chip-dot ${statusStyle.dot}`} />
                      {STATUS_LABELS[item.status] || item.status}
                    </span>

                    {/* Priority Badge */}
                    <span className={`priority-badge-chip ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                      {PRIORITY_LABELS[item.priority] || item.priority}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="complaint-card-title">{item.title}</h3>

                {/* Description snippet */}
                <p className="complaint-card-snippet">
                  {item.description.length > 140
                    ? item.description.substring(0, 140) + '...'
                    : item.description}
                </p>

                {/* Meta details bar */}
                <div className="card-meta-row">
                  <div className="meta-item" title="Category & Sub-Category">
                    <Tag size={14} className="meta-icon" />
                    <span>{item.category} {item.subCategory ? `• ${item.subCategory}` : ''}</span>
                  </div>

                  <div className="meta-item" title="Location">
                    <MapPin size={14} className="meta-icon" />
                    <span className="truncate">{item.location}</span>
                  </div>

                  <div className="meta-item" title="Filing timestamp">
                    <Clock size={14} className="meta-icon" />
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </div>

                  {item.isAnonymous && (
                    <div className="meta-item anonymous-badge" title="Anonymous filing">
                      <Lock size={12} />
                      <span>Anonymous</span>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="card-footer-action">
                  <div className="resolver-meta">
                    {item.assignedTo ? (
                      <span className="assigned-text text-emerald-400">
                        Assigned: {item.assignedTo.name}
                      </span>
                    ) : (
                      <span className="unassigned-text text-amber-400/80">
                        Pending Queue Triage
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm btn-track-progress"
                    onClick={() => navigate(`/track?id=${encodeURIComponent(item.id)}`)}
                  >
                    <span>View Progress</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
