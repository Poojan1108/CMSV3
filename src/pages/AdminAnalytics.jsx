import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  FileJson,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  UserCheck,
  ShieldAlert,
  Layers,
  X,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import { STATUSES, PRIORITIES, STATUS_LABELS, PRIORITY_LABELS, ROLES } from '../utils/constants';
import { generateComplaintsCSV } from '../utils/formatters';
import {
  PageHeader,
  LoadingState,
  Modal,
  PriorityBadge,
  TicketId,
} from '../components/ui';

/** Category series palette (classes defined once in app.css). */
const SERIES_CLASSES = [
  'app-chart-c1',
  'app-chart-c2',
  'app-chart-c3',
  'app-chart-c4',
  'app-chart-c5',
  'app-chart-c6',
  'app-chart-c7',
];

const seriesClass = (index) => SERIES_CLASSES[index % SERIES_CLASSES.length];

export default function AdminAnalytics() {
  const { user, currentOrg, orgKey, availableUsers } = useAuth();
  const { showToast } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Table filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Assignment modal
  const [assignmentModalTicket, setAssignmentModalTicket] = useState(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  // Seed reset confirmation
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    try {
      setComplaints(complaintService.getAll({ org: orgKey, sortBy: 'newest' }));
    } catch (err) {
      console.error('Failed to load analytics complaints:', err);
      showToast('Failed to load system analytics', 'error');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgKey]);

  // Real-time live synchronization: refreshes analytics metrics when tickets or statuses change
  useEffect(() => {
    const unsubscribe = complaintService.subscribeToLiveUpdates(() => {
      try {
        setComplaints(complaintService.getAll({ org: orgKey, sortBy: 'newest' }));
      } catch (err) {
        console.error('Error in AdminAnalytics live sync:', err);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orgKey]);

  // Core metrics — computed strictly from live data
  const metrics = useMemo(() => {
    const total = complaints.length;
    const countBy = (status) => complaints.filter((c) => c.status === status).length;

    const resolved = countBy(STATUSES.RESOLVED);
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    let avgResolutionHours = null;
    const closedWithTimes = complaints.filter(
      (c) =>
        (c.status === STATUSES.RESOLVED || c.status === STATUSES.PENDING_CONFIRMATION) &&
        c.createdAt &&
        c.updatedAt
    );
    if (closedWithTimes.length > 0) {
      const totalHours = closedWithTimes.reduce((acc, curr) => {
        return acc + (new Date(curr.updatedAt) - new Date(curr.createdAt)) / 3_600_000;
      }, 0);
      avgResolutionHours = Math.round((totalHours / closedWithTimes.length) * 10) / 10;
    }

    // Category volume distribution
    const catMap = {};
    complaints.forEach((c) => {
      catMap[c.category] = (catMap[c.category] || 0) + 1;
    });
    const sortedCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const mostActiveCategory = sortedCategories[0]?.[0] || '—';

    return {
      total,
      resolved,
      pending: countBy(STATUSES.PENDING),
      inProgress: countBy(STATUSES.IN_PROGRESS),
      pendingConfirmation: countBy(STATUSES.PENDING_CONFIRMATION),
      rejected: countBy(STATUSES.REJECTED),
      resolutionRate,
      avgResolutionHours,
      mostActiveCategory,
      sortedCategories,
    };
  }, [complaints]);

  const priorityDistribution = useMemo(() => {
    const counts = {};
    complaints.forEach((c) => {
      counts[c.priority] = (counts[c.priority] || 0) + 1;
    });
    return counts;
  }, [complaints]);

  const categoriesList = useMemo(() => {
    if (!currentOrg?.categories?.length) return [];
    // Preserve org-defined order but include any categories seen in data
    const seen = new Set(currentOrg.categories);
    const extra = [...new Set(complaints.map((c) => c.category).filter((c) => !seen.has(c)))];
    return [...currentOrg.categories, ...extra];
  }, [currentOrg, complaints]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const haystack =
          `${c.id} ${c.title} ${c.description || ''} ${c.category || ''} ${
            c.student?.name || ''
          } ${c.location || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [complaints, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  // Handlers ---------------------------------------------------------------

  const handleStatusOverride = (ticketId, newStatus) => {
    try {
      complaintService.updateStatus(
        ticketId,
        newStatus,
        user || { name: 'Admin', role: ROLES.ADMIN },
        `Admin status override → ${STATUS_LABELS[newStatus] || newStatus}`
      );
      showToast(`${ticketId} is now ${STATUS_LABELS[newStatus]}`, 'success');
      setComplaints(complaintService.getAll({ org: orgKey, sortBy: 'newest' }));
    } catch (err) {
      console.error('Failed to override ticket status', err);
      showToast('Error updating ticket status', 'error');
    }
  };

  const handleOpenAssignModal = (ticket) => {
    setAssignmentModalTicket(ticket);
    setSelectedAssigneeId(
      ticket.assignedTo?.id ||
        availableUsers.find((u) => u.role === ROLES.STAFF)?.id ||
        ''
    );
    setReassignReason('');
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!assignmentModalTicket || !selectedAssigneeId) return;

    const targetUser = availableUsers.find((u) => u.id === selectedAssigneeId);
    if (!targetUser) {
      showToast('Invalid staff assignee selected', 'error');
      return;
    }

    try {
      complaintService.reassign(
        assignmentModalTicket.id,
        {
          id: targetUser.id,
          name: targetUser.name,
          department: targetUser.department || 'Staff Department',
        },
        user || { name: 'Admin', role: ROLES.ADMIN },
        reassignReason || 'Reassigned via admin console'
      );
      showToast(`Ticket reassigned to ${targetUser.name}`, 'success');
      setAssignmentModalTicket(null);
      setComplaints(complaintService.getAll({ org: orgKey, sortBy: 'newest' }));
    } catch (err) {
      console.error('Failed to reassign ticket:', err);
      showToast('Failed to assign ticket', 'error');
    }
  };

  const handleConfirmResetSeedData = () => {
    try {
      complaintService.resetToSeedData();
      setComplaints(complaintService.getAll({ org: orgKey, sortBy: 'newest' }));
      setShowResetConfirmModal(false);
      showToast('System reset to initial seed state', 'success');
    } catch (err) {
      console.error('Failed to reset seed data', err);
      showToast('Error resetting seed data', 'error');
    }
  };

  const downloadFile = (content, filename, mimeType) => {
    if (!complaints.length) {
      showToast('No complaints available to export', 'warning');
      return;
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`, 'success');
  };

  const handleExportCSV = () => {
    const dateStamp = new Date().toISOString().split('T')[0];
    downloadFile(
      generateComplaintsCSV(complaints),
      `complaints_report_${dateStamp}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  const handleExportJSON = () => {
    const dateStamp = new Date().toISOString().split('T')[0];
    downloadFile(
      JSON.stringify(complaints, null, 2),
      `complaints_data_${dateStamp}.json`,
      'application/json'
    );
  };

  const statusBreakdown = [
    { label: STATUS_LABELS[STATUSES.PENDING], count: metrics.pending, icon: Clock, tone: 'bg-tone-warning' },
    { label: STATUS_LABELS[STATUSES.IN_PROGRESS], count: metrics.inProgress, icon: RefreshCw, tone: 'bg-tone-info' },
    { label: STATUS_LABELS[STATUSES.PENDING_CONFIRMATION], count: metrics.pendingConfirmation, icon: Clock, tone: 'bg-tone-accent' },
    { label: STATUS_LABELS[STATUSES.RESOLVED], count: metrics.resolved, icon: CheckCircle2, tone: 'bg-tone-success' },
    { label: STATUS_LABELS[STATUSES.REJECTED], count: metrics.rejected, icon: XCircle, tone: 'bg-tone-danger' },
  ].filter((row) => row.count > 0);

  const priorityTiles = [
    { key: PRIORITIES.URGENT, label: PRIORITY_LABELS[PRIORITIES.URGENT], cls: 'tone-danger', icon: AlertTriangle },
    { key: PRIORITIES.HIGH, label: PRIORITY_LABELS[PRIORITIES.HIGH], cls: 'tone-warning', icon: Clock },
    { key: PRIORITIES.MEDIUM, label: PRIORITY_LABELS[PRIORITIES.MEDIUM], cls: 'tone-info', icon: Layers },
    { key: PRIORITIES.LOW, label: PRIORITY_LABELS[PRIORITIES.LOW], cls: 'tone-neutral', icon: CheckCircle2 },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`${currentOrg?.name || ''} Executive Admin`}
        icon={<ShieldAlert size={12} />}
        title="Telemetry & Institutional Governance"
        description="Comprehensive grievance metrics, resolution performance, and live staff reassignment controls."
        actions={
          <div className="export-toolbar no-print" style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
              <FileSpreadsheet size={14} />
              Export CSV
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportJSON}>
              <FileJson size={14} />
              Export JSON
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <Printer size={14} />
              Print Summary
            </button>
          </div>
        }
      />

      {/* 4-Tile Telemetry Rail */}
      <div className="stat-grid">
        <div className="card card-pad" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--app-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Incidents</span>
            <BarChart3 size={18} style={{ color: 'var(--app-accent)' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--app-text)' }}>{metrics.total}</div>
          <div style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>All-time grievance intake</div>
        </div>

        <div className="card card-pad" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--app-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Resolution Rate</span>
            <TrendingUp size={18} style={{ color: metrics.resolutionRate > 0 ? 'var(--app-success)' : 'var(--app-text-muted)' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: metrics.resolutionRate > 0 ? 'var(--app-success)' : 'var(--app-text)' }}>{metrics.resolutionRate}%</div>
          <div style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>{metrics.resolved} of {metrics.total} closed</div>
        </div>

        <div className="card card-pad" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--app-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg Repair Time</span>
            <Clock size={18} style={{ color: 'var(--app-info)' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--app-text)' }}>
            {metrics.avgResolutionHours != null ? `${metrics.avgResolutionHours} hrs` : '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>Across confirmed closures</div>
        </div>

        <div className="card card-pad" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--app-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Top Volume Dept</span>
            <Layers size={18} style={{ color: 'var(--app-warning)' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--app-text)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {metrics.mostActiveCategory}
          </div>
          <div style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>Highest incident frequency</div>
        </div>
      </div>

      {/* Charts */}
      <div className="two-col-grid">
        {/* Category distribution */}
        <section className="chart-block">
          <div className="chart-head">
            <div>
              <h3 className="chart-title">Volume by Category</h3>
              <p className="chart-sub">Share of tickets per department category</p>
            </div>
            <span className="tag">{metrics.total} tickets</span>
          </div>

          {metrics.sortedCategories.length === 0 ? (
            <p className="no-comments">No data yet.</p>
          ) : (
            <>
              <div className="dist-bar">
                {metrics.sortedCategories.map(([cat, count], idx) => {
                  const pct = metrics.total > 0 ? (count / metrics.total) * 100 : 0;
                  return (
                    <div
                      key={cat}
                      className={`dist-segment ${seriesClass(idx)}`}
                      style={{ width: `${pct}%` }}
                      title={`${cat}: ${count} (${Math.round(pct)}%)`}
                    />
                  );
                })}
              </div>

              <div style={{ marginTop: 18 }}>
                {metrics.sortedCategories.map(([cat, count], idx) => {
                  const pct =
                    metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                  return (
                    <div key={cat} className="bar-row">
                      <div className="bar-row-top">
                        <span className="bar-row-label">
                          <span className={`swatch ${seriesClass(idx)}`} />
                          {cat}
                        </span>
                        <span className="bar-row-value">
                          {count} · {pct}%
                        </span>
                      </div>
                      <div className="bar-track">
                        <div className={`bar-fill ${seriesClass(idx)}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Priority breakdown */}
        <section className="chart-block">
          <div className="chart-head">
            <div>
              <h3 className="chart-title">Priority Breakdown</h3>
              <p className="chart-sub">Tickets by assigned severity</p>
            </div>
          </div>

          <div className="priority-tiles">
            {priorityTiles.map((tile) => {
              const count = priorityDistribution[tile.key] || 0;
              const share =
                metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
              const Icon = tile.icon;
              return (
                <div key={tile.key} className="priority-tile">
                  <span className={`priority-tile-label ${tile.cls}`}>
                    {tile.label}
                    <Icon size={14} />
                  </span>
                  <span className="priority-tile-count">{count}</span>
                  <span className="priority-tile-share">{share}% of volume</span>
                </div>
              );
            })}
          </div>

          <h3 className="chart-title" style={{ margin: '22px 0 12px' }}>
            Status Lifecycle
          </h3>
          {statusBreakdown.length === 0 ? (
            <p className="no-comments">No data yet.</p>
          ) : (
            <div className="status-list">
              {statusBreakdown.map((st) => {
                const Icon = st.icon;
                const pct =
                  metrics.total > 0 ? Math.round((st.count / metrics.total) * 100) : 0;
                return (
                  <div key={st.label} className="status-list-row">
                    <div className="status-list-info">
                      <span className={`status-list-icon ${st.tone}`}>
                        <Icon size={16} />
                      </span>
                      <div>
                        <div className="status-list-name">{st.label}</div>
                        <div className="status-list-share">{pct}% of total</div>
                      </div>
                    </div>
                    <span className="status-list-count">{st.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Global management table */}
      <section className="card card-pad no-print">
        <div className="card-header">
          <div>
            <h2
              className="card-title"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <ShieldAlert size={17} className="tone-accent" />
              Global Ticket Management
            </h2>
            <p className="card-subtitle">
              Status override, staff assignment dispatch and system reset controls.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-danger-outline btn-sm"
            onClick={() => setShowResetConfirmModal(true)}
          >
            Reset Seed Data
          </button>
        </div>

        {/* Filters */}
        <div className="toolbar-row" style={{ marginBottom: 16 }}>
          <div className="search-field">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by ID, title, reporter or category…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search global tickets"
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            {Object.values(STATUSES).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
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
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {categoriesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Title &amp; Category</th>
                <th>Reporter</th>
                <th>Priority</th>
                <th>Status Override</th>
                <th>Assigned Staff</th>
                <th className="table-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty-cell">
                    No complaints match current filters.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <TicketId id={item.id} />
                    </td>
                    <td>
                      <div className="cell-main">{item.title}</div>
                      <div className="cell-sub">
                        {item.category} • {item.location || '—'}
                      </div>
                    </td>
                    <td>
                      <div>{item.student?.name || 'Anonymous'}</div>
                      <div className="cell-sub">
                        {item.isAnonymous ? 'Identity protected' : item.student?.rollNo || '—'}
                      </div>
                    </td>
                    <td>
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusOverride(item.id, e.target.value)}
                        className="table-select"
                        aria-label={`Override status for ${item.id}`}
                      >
                        {Object.values(STATUSES).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {item.assignedTo ? (
                        <>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <UserCheck size={13} className="tone-success" />
                            <span className="cell-main" style={{ maxWidth: 140 }}>
                              {item.assignedTo.name}
                            </span>
                          </div>
                          <div className="cell-sub">{item.assignedTo.department}</div>
                        </>
                      ) : (
                        <span className="tone-warning" style={{ fontStyle: 'italic', fontSize: 12 }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenAssignModal(item)}
                      >
                        <UserPlus size={13} />
                        {item.assignedTo ? 'Reassign' : 'Assign'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Assignment modal */}
      {assignmentModalTicket && (
        <Modal
          title={`Assign Ticket ${assignmentModalTicket.id}`}
          subtitle="Dispatch to a staff resolver"
          onClose={() => setAssignmentModalTicket(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAssignmentModalTicket(null)}
              >
                Cancel
              </button>
              <button type="submit" form="assign-ticket-form" className="btn btn-primary">
                Confirm Assignment
              </button>
            </>
          }
        >
          <form id="assign-ticket-form" onSubmit={handleAssignSubmit}>
            <div className="resolution-summary" style={{ margin: '0 0 16px' }}>
              <div className="comment-author">{assignmentModalTicket.title}</div>
              <div className="cell-sub" style={{ marginTop: 4 }}>
                {assignmentModalTicket.category} • Priority:{' '}
                {PRIORITY_LABELS[assignmentModalTicket.priority]}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="assignee-select" className="field-label" style={{ display: 'block' }}>
                Staff resolver<span className="required-mark">*</span>
              </label>
              <select
                id="assignee-select"
                value={selectedAssigneeId}
                onChange={(e) => setSelectedAssigneeId(e.target.value)}
              >
                {availableUsers
                  .filter((u) => u.role === ROLES.STAFF || u.role === ROLES.ADMIN)
                  .map((su) => (
                    <option key={su.id} value={su.id}>
                      {su.name} — {su.department || 'Staff'}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="assign-note" className="field-label" style={{ display: 'block' }}>
                Dispatch note (optional)
              </label>
              <textarea
                id="assign-note"
                rows={3}
                placeholder="Instructions or reason for assignment…"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Reset confirmation modal */}
      {showResetConfirmModal && (
        <Modal
          title="Reset System Data?"
          subtitle="Irreversible admin action"
          onClose={() => setShowResetConfirmModal(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowResetConfirmModal(false)}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmResetSeedData}>
                Yes, Reset Data
              </button>
            </>
          }
        >
          <p className="detail-desc" style={{ margin: 0 }}>
            This restores the original seed complaints and clears every ticket created during this
            session. Consider exporting a CSV/JSON backup first.
          </p>
        </Modal>
      )}

      {isLoading && <LoadingState label="Loading analytics…" />}
    </div>
  );
}
