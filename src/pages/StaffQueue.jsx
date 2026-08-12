import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
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
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import { STATUSES, PRIORITIES, STATUS_LABELS, PRIORITY_LABELS } from '../utils/constants';
import {
  formatDate,
  formatRelativeTime,
  getStatusBadgeColor,
  getPriorityBadgeColor,
  getSlaStatus,
} from '../utils/formatters';

export default function StaffQueue() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, categories, currentOrg, orgKey, availableUsers, setUser } = useAuth();
  const { showToast } = useToast();

  // Determine initial scope from path (e.g. /staff/assigned -> scope = 'assigned')
  const isAssignedPage = location.pathname.includes('/staff/assigned');

  // Filter States
  const [scopeFilter, setScopeFilter] = useState(isAssignedPage ? 'assigned' : 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Data state
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Ticket for Modal View
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalInternalNote, setModalInternalNote] = useState('');
  const [modalStatusNote, setModalStatusNote] = useState('');

  // Inline Note States for card list (map of ticketId -> note text)
  const [cardNotes, setCardNotes] = useState({});
  const [submittingNoteId, setSubmittingNoteId] = useState(null);

  // Sync scope with path if user navigates between /staff/queue and /staff/assigned
  useEffect(() => {
    if (location.pathname.includes('/staff/assigned')) {
      setScopeFilter('assigned');
    }
  }, [location.pathname]);

  // Load complaints from service
  const loadComplaints = () => {
    setIsLoading(true);
    try {
      const data = complaintService.getAll({
        org: orgKey,
        currentOrg: orgKey,
        sortBy,
      });
      setComplaints(data);

      // Keep selectedTicket updated if modal is open
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
  }, [orgKey, sortBy]);

  // Compute Header Metric Counters
  const metrics = useMemo(() => {
    const assignedToMeCount = complaints.filter(
      (c) => c.assignedTo && c.assignedTo.id === user?.id
    ).length;

    const pendingReviewCount = complaints.filter(
      (c) => c.status === STATUSES.PENDING
    ).length;

    const inProgressCount = complaints.filter(
      (c) => c.status === STATUSES.IN_PROGRESS
    ).length;

    const todayStr = new Date().toISOString().split('T')[0];
    const resolvedTodayCount = complaints.filter((c) => {
      if (c.status !== STATUSES.RESOLVED) return false;
      if (!c.updatedAt) return false;
      return c.updatedAt.startsWith(todayStr);
    }).length;

    const totalResolvedCount = complaints.filter(
      (c) => c.status === STATUSES.RESOLVED
    ).length;

    const slaBreachedCount = complaints.filter((c) => {
      const sla = getSlaStatus(c);
      return sla.isBreached && !sla.isCompleted;
    }).length;

    return {
      assignedToMe: assignedToMeCount,
      pendingReview: pendingReviewCount,
      inProgress: inProgressCount,
      resolvedToday: resolvedTodayCount || totalResolvedCount,
      slaBreached: slaBreachedCount,
    };
  }, [complaints, user]);

  // Client-side Filtered Complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      // Scope filter (Assigned to Me vs All Department Tickets)
      if (scopeFilter === 'assigned') {
        const isMine = item.assignedTo && item.assignedTo.id === user?.id;
        if (!isMine) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
        return false;
      }

      // Department / Category filter
      if (departmentFilter !== 'all' && item.category !== departmentFilter) {
        return false;
      }

      // Search Query text matching
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchId = item.id?.toLowerCase().includes(q);
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchLoc = item.location?.toLowerCase().includes(q);
        const matchStudent = item.student?.name?.toLowerCase().includes(q);
        const matchCat = item.category?.toLowerCase().includes(q);

        if (!matchId && !matchTitle && !matchDesc && !matchLoc && !matchStudent && !matchCat) {
          return false;
        }
      }

      return true;
    });
  }, [complaints, scopeFilter, statusFilter, priorityFilter, departmentFilter, searchQuery, user]);

  // Handler: Quick Status Update
  const handleQuickStatusChange = (ticketId, newStatus, note = '') => {
    try {
      let updated;
      if (newStatus === STATUSES.RESOLVED) {
        updated = complaintService.proposeResolution(
          ticketId,
          user || { name: 'Staff Resolver', role: 'staff' },
          note || 'Staff marked ticket as resolved. Awaiting user confirmation.'
        );
        if (updated) {
          showToast(
            `Resolution request sent to complainant for ticket ${ticketId}`,
            'success'
          );
        }
      } else {
        updated = complaintService.updateStatus(
          ticketId,
          newStatus,
          user || { name: 'Staff Resolver', role: 'staff' },
          note || `Quick status updated to ${STATUS_LABELS[newStatus] || newStatus}`
        );
        if (updated) {
          showToast(
            `Ticket ${ticketId} status updated to ${STATUS_LABELS[newStatus] || newStatus}`,
            'success'
          );
        }
      }
      if (updated) {
        loadComplaints();
      }
    } catch (err) {
      console.error('Failed to update status', err);
      showToast('Failed to update ticket status', 'error');
    }
  };

  // Handler: Inline Card Internal Staff Note Submission
  const handleAddInlineNote = (ticketId) => {
    const noteText = cardNotes[ticketId];
    if (!noteText || !noteText.trim()) {
      showToast('Please enter an internal note first', 'warning');
      return;
    }

    setSubmittingNoteId(ticketId);
    try {
      const updated = complaintService.addComment(
        ticketId,
        user || { name: 'Staff Resolver', role: 'staff' },
        noteText.trim(),
        true // isInternal = true (Audit Log Only)
      );

      if (updated) {
        showToast(`Internal audit note added to ${ticketId}`, 'success');
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

  // Handler: Modal Internal Staff Note Submission
  const handleModalAddInternalNote = (e) => {
    e.preventDefault();
    if (!selectedTicket || !modalInternalNote.trim()) return;

    try {
      const updated = complaintService.addComment(
        selectedTicket.id,
        user || { name: 'Staff Resolver', role: 'staff' },
        modalInternalNote.trim(),
        true // isInternal = true
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

  // Handler: Modal Quick Status Change with Note
  const handleModalStatusSubmit = (e, newStatus) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      let updated;
      if (newStatus === STATUSES.RESOLVED) {
        updated = complaintService.proposeResolution(
          selectedTicket.id,
          user || { name: 'Staff Resolver', role: 'staff' },
          modalStatusNote || 'Resolution details provided by staff. Pending user confirmation.'
        );
        if (updated) {
          showToast(`Resolution request sent to complainant for ${selectedTicket.id}`, 'success');
        }
      } else {
        updated = complaintService.updateStatus(
          selectedTicket.id,
          newStatus,
          user || { name: 'Staff Resolver', role: 'staff' },
          modalStatusNote || `Status updated to ${STATUS_LABELS[newStatus]}`
        );
        if (updated) {
          showToast(`Ticket ${selectedTicket.id} updated to ${STATUS_LABELS[newStatus]}`, 'success');
        }
      }

      if (updated) {
        setModalStatusNote('');
        setSelectedTicket(updated);
        loadComplaints();
      }
    } catch (err) {
      console.error('Failed modal status update', err);
      showToast('Error updating status', 'error');
    }
  };

  const handleResetFilters = () => {
    setScopeFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setDepartmentFilter('all');
    setSearchQuery('');
    setSortBy('newest');
    showToast('Queue filters reset', 'info');
  };

  // Staff User Persona Switcher Helper
  const staffUsers = availableUsers.filter((u) => u.role === 'staff' || u.role === 'admin');

  return (
    <div className="staff-queue-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Header */}
      <div
        className="queue-page-header"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px 28px',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '3px 10px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              RESOLVER PORTAL • {currentOrg.name}
            </span>
            {metrics.slaBreached > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--accent-rose)',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <AlertTriangle size={12} /> {metrics.slaBreached} SLA Breached
              </span>
            )}
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--text-white)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {scopeFilter === 'assigned' ? 'My Assigned Complaints' : 'Department Complaint Queue'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-gray)', marginTop: '4px' }}>
            Triage, resolve, and log audit notes for issues across campus departments.
          </p>
        </div>

        {/* Current Resolver Persona Quick Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(17, 24, 39, 0.7)',
            padding: '8px 14px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: 'var(--text-white)',
              fontSize: '14px',
            }}
          >
            {user?.name ? user.name.charAt(0) : 'S'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-white)' }}>
              {user?.name || 'Dr. Robert Vance'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>
              {user?.department || 'Hostel Administration'}
            </span>
          </div>

          <select
            value={user?.id || ''}
            onChange={(e) => {
              const selected = availableUsers.find((u) => u.id === e.target.value);
              if (selected) {
                setUser(selected);
                showToast(`Switched persona to ${selected.name} (${selected.role})`, 'info');
              }
            }}
            title="Switch Active Resolver Persona"
            style={{
              background: 'rgba(31, 41, 55, 0.9)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              marginLeft: '6px',
            }}
          >
            {staffUsers.map((su) => (
              <option key={su.id} value={su.id}>
                {su.name} ({su.department || su.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Counter Headers (4 Cards) */}
      <div
        className="metrics-overview-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Card 1: Assigned to Me */}
        <div
          className="metric-card"
          onClick={() => setScopeFilter('assigned')}
          style={{
            background: scopeFilter === 'assigned' ? 'rgba(99, 102, 241, 0.15)' : undefined,
            borderColor: scopeFilter === 'assigned' ? 'var(--primary-light)' : undefined,
            cursor: 'pointer',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>
              Assigned to Me
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary-light)', marginTop: '4px' }}>
              {metrics.assignedToMe}
            </div>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.2)',
              color: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserCheck size={22} />
          </div>
        </div>

        {/* Card 2: Pending Review */}
        <div
          className="metric-card"
          onClick={() => {
            setScopeFilter('all');
            setStatusFilter(STATUSES.PENDING);
          }}
          style={{
            background: statusFilter === STATUSES.PENDING ? 'rgba(245, 158, 11, 0.15)' : undefined,
            borderColor: statusFilter === STATUSES.PENDING ? 'rgba(245, 158, 11, 0.5)' : undefined,
            cursor: 'pointer',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>
              Pending Review
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>
              {metrics.pendingReview}
            </div>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.2)',
              color: 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={22} />
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div
          className="metric-card"
          onClick={() => {
            setScopeFilter('all');
            setStatusFilter(STATUSES.IN_PROGRESS);
          }}
          style={{
            background: statusFilter === STATUSES.IN_PROGRESS ? 'rgba(56, 189, 248, 0.15)' : undefined,
            borderColor: statusFilter === STATUSES.IN_PROGRESS ? 'rgba(56, 189, 248, 0.5)' : undefined,
            cursor: 'pointer',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>
              In Progress
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
              {metrics.inProgress}
            </div>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.2)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={22} />
          </div>
        </div>

        {/* Card 4: Resolved Today */}
        <div
          className="metric-card"
          onClick={() => {
            setScopeFilter('all');
            setStatusFilter(STATUSES.RESOLVED);
          }}
          style={{
            background: statusFilter === STATUSES.RESOLVED ? 'rgba(16, 185, 129, 0.15)' : undefined,
            borderColor: statusFilter === STATUSES.RESOLVED ? 'rgba(16, 185, 129, 0.5)' : undefined,
            cursor: 'pointer',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>
              Resolved Today
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
              {metrics.resolvedToday}
            </div>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.2)',
              color: 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="queue-toolbar-card"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Scope Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={`btn ${scopeFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <Inbox size={15} style={{ marginRight: '6px' }} />
              All Department Tickets ({complaints.length})
            </button>

            <button
              type="button"
              onClick={() => setScopeFilter('assigned')}
              className={`btn ${scopeFilter === 'assigned' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <UserCheck size={15} style={{ marginRight: '6px' }} />
              Assigned to Me ({metrics.assignedToMe})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-gray)',
              }}
            />
            <input
              type="text"
              placeholder="Search ID, title, student, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                background: 'rgba(17, 24, 39, 0.7)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-white)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-gray)',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color-light)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-gray)' }}>
            <Filter size={15} />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: 'rgba(17, 24, 39, 0.8)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '7px 12px',
              color: 'var(--text-white)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="all">All Statuses</option>
            <option value={STATUSES.PENDING}>Pending</option>
            <option value={STATUSES.IN_PROGRESS}>In Progress</option>
            <option value={STATUSES.RESOLVED}>Resolved</option>
            <option value={STATUSES.REJECTED}>Rejected</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              background: 'rgba(17, 24, 39, 0.8)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '7px 12px',
              color: 'var(--text-white)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="all">All Priorities</option>
            <option value={PRIORITIES.URGENT}>Urgent (4h SLA)</option>
            <option value={PRIORITIES.HIGH}>High (24h SLA)</option>
            <option value={PRIORITIES.MEDIUM}>Medium (48h SLA)</option>
            <option value={PRIORITIES.LOW}>Low (48h SLA)</option>
          </select>

          {/* Department / Category Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              background: 'rgba(17, 24, 39, 0.8)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '7px 12px',
              color: 'var(--text-white)',
              fontSize: '13px',
              outline: 'none',
              maxWidth: '200px',
            }}
          >
            <option value="all">All Departments & Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: 'rgba(17, 24, 39, 0.8)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '7px 12px',
              color: 'var(--text-white)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="priority">Sort: Highest Priority</option>
          </select>

          {/* Reset Filters */}
          {(scopeFilter !== 'all' ||
            statusFilter !== 'all' ||
            priorityFilter !== 'all' ||
            departmentFilter !== 'all' ||
            searchQuery !== '') && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-gray)',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={12} /> Reset
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-gray)' }}>
            Showing <strong style={{ color: 'var(--text-white)' }}>{filteredComplaints.length}</strong> tickets
          </div>
        </div>
      </div>

      {/* Complaint Cards Grid / List */}
      {isLoading ? (
        <div className="loading-state-card">
          <div className="spinner" />
          <span>Loading department ticket queue...</span>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon-box">
            <Inbox size={36} color="var(--text-gray)" />
          </div>
          <h3 className="empty-title">No tickets match current filters</h3>
          <p className="empty-description">
            There are no complaints matching your selected department, status, or search parameters. Try adjusting filters or clearing search.
          </p>
          <div className="empty-actions">
            <button type="button" className="btn btn-outline" onClick={handleResetFilters}>
              Reset Queue Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="complaints-cards-grid">
          {filteredComplaints.map((ticket) => {
            const statusColors = getStatusBadgeColor(ticket.status);
            const priorityColors = getPriorityBadgeColor(ticket.priority);
            const sla = getSlaStatus(ticket);

            const isAssignedToMe = ticket.assignedTo && ticket.assignedTo.id === user?.id;

            return (
              <div
                key={ticket.id}
                className="complaint-item-card"
                style={{
                  borderLeft: sla.isBreached && !sla.isCompleted ? '4px solid var(--accent-rose)' : undefined,
                  boxShadow: sla.isBreached && !sla.isCompleted ? '0 0 15px rgba(244, 63, 94, 0.15)' : undefined,
                }}
              >
                {/* Header row: Ticket ID, SLA badge, Priority, Status */}
                <div className="card-top-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="ticket-id-badge">{ticket.id}</span>
                    {isAssignedToMe && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          background: 'rgba(99, 102, 241, 0.2)',
                          color: 'var(--primary-light)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                        }}
                      >
                        ASSIGNED TO YOU
                      </span>
                    )}
                  </div>

                  <div className="card-header-right-badges">
                    {/* SLA Badge */}
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: sla.isBreached
                          ? 'rgba(244, 63, 94, 0.15)'
                          : sla.isWarning
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(16, 185, 129, 0.12)',
                        color: sla.isBreached
                          ? 'var(--accent-rose)'
                          : sla.isWarning
                          ? 'var(--accent-amber)'
                          : 'var(--accent-emerald)',
                        border: `1px solid ${
                          sla.isBreached
                            ? 'rgba(244, 63, 94, 0.3)'
                            : sla.isWarning
                            ? 'rgba(245, 158, 11, 0.3)'
                            : 'rgba(16, 185, 129, 0.25)'
                        }`,
                      }}
                      title={`SLA Target: ${sla.limitHours}h max turnaround`}
                    >
                      {sla.isBreached ? <AlertTriangle size={12} /> : <Clock size={12} />}
                      {sla.badgeText}
                    </span>

                    {/* Priority Chip */}
                    <span className={`priority-badge-chip ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border}`}>
                      {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                    </span>

                    {/* Status Chip */}
                    <span className={`status-badge-chip ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                      <span className={`status-chip-dot ${statusColors.dot}`} />
                      {STATUS_LABELS[ticket.status] || ticket.status}
                    </span>
                  </div>
                </div>

                {/* Title & Category */}
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--primary-light)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {ticket.category}
                  </div>
                  <h3 className="complaint-card-title">{ticket.title}</h3>
                </div>

                {/* Description Excerpt */}
                <p className="complaint-card-snippet">
                  {ticket.description && ticket.description.length > 130
                    ? `${ticket.description.slice(0, 130)}...`
                    : ticket.description}
                </p>

                {/* Metadata row: Reporter info, Location, Date */}
                <div className="card-meta-row">
                  <div className="meta-item">
                    <User size={13} className="meta-icon" />
                    <span>
                      {ticket.isAnonymous || ticket.anonymous ? (
                        <span className="anonymous-badge">Anonymous Reporter</span>
                      ) : (
                        ticket.student?.name || 'Reporter'
                      )}
                    </span>
                  </div>

                  <div className="meta-item">
                    <MapPin size={13} className="meta-icon" />
                    <span>{ticket.location || 'Campus Location'}</span>
                  </div>

                  <div className="meta-item">
                    <Clock size={13} className="meta-icon" />
                    <span>{formatRelativeTime(ticket.createdAt)}</span>
                  </div>
                </div>

                {/* Quick Status Update Selector Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'rgba(17, 24, 39, 0.6)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)' }}>
                    Quick Status Update:
                  </span>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleQuickStatusChange(ticket.id, e.target.value)}
                    style={{
                      background: 'rgba(31, 41, 55, 0.9)',
                      border: '1px solid var(--border-color-active)',
                      color: 'var(--text-white)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value={STATUSES.PENDING}>Pending</option>
                    <option value={STATUSES.IN_PROGRESS}>In Progress</option>
                    <option value={STATUSES.RESOLVED}>Resolved</option>
                    <option value={STATUSES.REJECTED}>Rejected</option>
                  </select>
                </div>

                {/* Internal Staff Note Input Box */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    paddingTop: '8px',
                    borderTop: '1px dashed var(--border-color-light)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={11} /> Internal Staff Note (Hidden from Public)
                    </span>
                    {ticket.comments && ticket.comments.filter((c) => c.isInternal).length > 0 && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {ticket.comments.filter((c) => c.isInternal).length} logged notes
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Add internal audit log note..."
                      value={cardNotes[ticket.id] || ''}
                      onChange={(e) =>
                        setCardNotes((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddInlineNote(ticket.id);
                      }}
                      style={{
                        flex: 1,
                        background: 'rgba(17, 24, 39, 0.7)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: 'var(--text-white)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddInlineNote(ticket.id)}
                      disabled={submittingNoteId === ticket.id}
                      style={{
                        background: 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        color: 'var(--accent-amber)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Send size={12} /> Post Note
                    </button>
                  </div>
                </div>

                {/* Footer Action Card Button */}
                <div className="card-footer-action">
                  <div className="resolver-meta" style={{ color: 'var(--text-gray)' }}>
                    {ticket.assignedTo ? (
                      <span style={{ color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Shield size={12} /> Handler: {ticket.assignedTo.name}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Unassigned in Queue</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline btn-track-progress"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    View Details & History <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onQuickStatus={handleQuickStatusChange}
          onModalAddInternalNote={handleModalAddInternalNote}
          modalInternalNote={modalInternalNote}
          setModalInternalNote={setModalInternalNote}
          onModalStatusSubmit={handleModalStatusSubmit}
          modalStatusNote={modalStatusNote}
          setModalStatusNote={setModalStatusNote}
          user={user}
          navigate={navigate}
        />
      )}
    </div>
  );
}

/**
 * Full Detail Modal Component for Resolver Inspection
 */
function TicketDetailModal({
  ticket,
  onClose,
  onQuickStatus,
  onModalAddInternalNote,
  modalInternalNote,
  setModalInternalNote,
  onModalStatusSubmit,
  modalStatusNote,
  setModalStatusNote,
  user,
  navigate,
}) {
  const [commentTab, setCommentTab] = useState('all'); // 'all', 'internal', 'public'
  const statusColors = getStatusBadgeColor(ticket.status);
  const priorityColors = getPriorityBadgeColor(ticket.priority);
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
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: '24px', padding: '28px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="ticket-id-badge" style={{ fontSize: '14px', padding: '4px 12px' }}>
                {ticket.id}
              </span>
              <span className={`priority-badge-chip ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border}`}>
                {PRIORITY_LABELS[ticket.priority] || ticket.priority}
              </span>
              <span className={`status-badge-chip ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                <span className={`status-chip-dot ${statusColors.dot}`} />
                {STATUS_LABELS[ticket.status] || ticket.status}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: sla.isBreached ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: sla.isBreached ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                  border: `1px solid ${sla.isBreached ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                }}
              >
                {sla.badgeText}
              </span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-white)' }}>{ticket.title}</h2>
            <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '4px' }}>
              Category: <strong style={{ color: 'var(--primary-light)' }}>{ticket.category}</strong> • Created: {formatDate(ticket.createdAt)}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-white)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Overview Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            background: 'var(--bg-card)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: 700 }}>
              Reporter
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-white)', fontWeight: 600, marginTop: '2px' }}>
              {ticket.isAnonymous || ticket.anonymous ? (
                <span className="anonymous-badge">Anonymous Reporter</span>
              ) : (
                ticket.student?.name || 'Alex Chen'
              )}
            </div>
            {ticket.student?.rollNo && (
              <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{ticket.student.rollNo}</div>
            )}
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: 700 }}>
              Location
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-white)', fontWeight: 600, marginTop: '2px' }}>
              {ticket.location || 'Hostel Block B'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: 700 }}>
              Assigned Resolver
            </div>
            <div style={{ fontSize: '14px', color: 'var(--accent-emerald)', fontWeight: 600, marginTop: '2px' }}>
              {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
            </div>
            {ticket.assignedTo?.department && (
              <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{ticket.assignedTo.department}</div>
            )}
          </div>
        </div>

        {/* Description Box */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-white)', marginBottom: '6px' }}>
            Complaint Details & Description
          </h4>
          <div
            style={{
              background: 'rgba(17, 24, 39, 0.7)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '14px 16px',
              fontSize: '14px',
              color: 'var(--text-main)',
              lineHeight: 1.6,
            }}
          >
            {ticket.description}
          </div>
        </div>

        {/* Status History Timeline */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-white)', marginBottom: '10px' }}>
            Status Audit Log & History
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ticket.statusHistory && ticket.statusHistory.length > 0 ? (
              ticket.statusHistory.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 14px',
                    background: 'rgba(31, 41, 55, 0.5)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color-light)',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--primary-light)',
                      marginTop: '6px',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-white)' }}>
                        Status: {item.status?.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>
                      Updated by <strong>{item.updatedBy}</strong>: {item.note}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No status history available.</div>
            )}
          </div>
        </div>

        {/* Comments & Internal Staff Notes Section */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              borderBottom: '1px solid var(--border-color-light)',
              paddingBottom: '8px',
            }}
          >
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} /> Activity & Internal Notes ({comments.length})
            </h4>

            {/* Comment Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setCommentTab('all')}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: commentTab === 'all' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-white)',
                  cursor: 'pointer',
                }}
              >
                All ({comments.length})
              </button>

              <button
                type="button"
                onClick={() => setCommentTab('internal')}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  background: commentTab === 'internal' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.1)',
                  color: 'var(--accent-amber)',
                  cursor: 'pointer',
                }}
              >
                Internal Notes Only ({internalComments.length})
              </button>

              <button
                type="button"
                onClick={() => setCommentTab('public')}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: commentTab === 'public' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-white)',
                  cursor: 'pointer',
                }}
              >
                Public Updates ({publicComments.length})
              </button>
            </div>
          </div>

          {/* Comment List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
            {displayedComments.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                No comments found for this tab.
              </div>
            ) : (
              displayedComments.map((c) => (
                <div
                  key={c.id || Math.random()}
                  style={{
                    background: c.isInternal ? 'rgba(245, 158, 11, 0.1)' : 'rgba(17, 24, 39, 0.7)',
                    border: `1px solid ${c.isInternal ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-white)' }}>
                        {c.senderName}
                      </span>
                      {c.isInternal && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: 'var(--accent-amber)',
                            background: 'rgba(245, 158, 11, 0.2)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Lock size={10} /> INTERNAL STAFF AUDIT NOTE (HIDDEN FROM STUDENT)
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{formatRelativeTime(c.timestamp)}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>{c.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Modal Internal Note Form */}
          <form onSubmit={onModalAddInternalNote} style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} /> Post Internal Staff Note (Audit Trail)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Log internal action, parts required, or staff notes..."
                value={modalInternalNote}
                onChange={(e) => setModalInternalNote(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(17, 24, 39, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'var(--text-white)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'rgba(245, 158, 11, 0.25)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  color: 'var(--accent-amber)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Log Internal Note
              </button>
            </div>
          </form>
        </div>

        {/* Modal Action Controls Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(`/staff/resolutions?ticketId=${ticket.id}`);
            }}
            className="btn btn-outline"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            Reassign Ticket <ArrowRight size={14} style={{ marginLeft: '6px' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onQuickStatus(ticket.id, STATUSES.IN_PROGRESS, 'Started working on issue.')}
            >
              Mark In Progress
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onQuickStatus(ticket.id, STATUSES.RESOLVED, 'Resolution completed.')}
            >
              Mark Resolved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
