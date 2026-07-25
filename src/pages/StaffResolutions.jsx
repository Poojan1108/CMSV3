import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  History,
  UserPlus,
  CheckCircle2,
  Search,
  Clock,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import { STATUSES, STATUS_LABELS } from '../utils/constants';
import {
  formatDate,
  getStatusBadgeColor,
  getSlaStatus,
} from '../utils/formatters';

// Available Target Handlers / Departments for Ticket Transfer
const REASSIGN_TARGETS = [
  {
    id: 'usr_staff_warden',
    name: 'Dr. Robert Vance',
    department: 'Hostel Administration',
    role: 'Chief Warden',
  },
  {
    id: 'usr_staff_it',
    name: 'Sarah Jenkins',
    department: 'IT Infrastructure & Networking',
    role: 'Lead Network Tech',
  },
  {
    id: 'usr_admin_1',
    name: 'Dean Eleanor Vance',
    department: 'Campus Executive Office',
    role: 'Campus Administrator',
  },
  {
    id: 'dept_estate',
    name: 'Estate & Facilities Team',
    department: 'Estate Management',
    role: 'Maintenance Ops',
  },
  {
    id: 'dept_sanitation',
    name: 'Sanitation & Hygiene Unit',
    department: 'Campus Sanitation',
    role: 'Sanitation Supervisor',
  },
  {
    id: 'dept_security',
    name: 'Campus Security Desk',
    department: 'Security & Safety',
    role: 'Chief Security Officer',
  },
];

export default function StaffResolutions() {
  const [searchParams] = useSearchParams();
  const { user, orgKey } = useAuth();
  const { showToast } = useToast();

  const urlTicketId = searchParams.get('ticketId') || '';

  // Data states
  const [allComplaints, setAllComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reassignment Form States
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [targetHandlerId, setTargetHandlerId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Completed Resolutions Filter States
  const [resSearchQuery, setResSearchQuery] = useState('');
  const [resDeptFilter, setResDeptFilter] = useState('all');

  // Load all complaints
  const loadData = () => {
    setIsLoading(true);
    try {
      const data = complaintService.getAll({ org: orgKey, sortBy: 'newest' });
      setAllComplaints(data);

      // Pre-select ticket from URL search param if present, or default to first open ticket
      if (urlTicketId) {
        setSelectedTicketId(urlTicketId);
      } else if (!selectedTicketId && data.length > 0) {
        const firstOpen = data.find((c) => c.status !== STATUSES.RESOLVED && c.status !== STATUSES.REJECTED);
        if (firstOpen) setSelectedTicketId(firstOpen.id);
      }
    } catch (err) {
      console.error('Failed to load complaints for resolution view', err);
      showToast('Error loading resolution data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgKey]);

  // Sync ticket ID if URL param changes
  useEffect(() => {
    if (urlTicketId) {
      setSelectedTicketId(urlTicketId);
    }
  }, [urlTicketId]);

  // Open/Active Complaints eligible for transfer
  const openComplaints = useMemo(() => {
    return allComplaints.filter(
      (c) => c.status === STATUSES.PENDING || c.status === STATUSES.IN_PROGRESS
    );
  }, [allComplaints]);

  // Currently selected ticket object
  const activeTicket = useMemo(() => {
    return allComplaints.find((c) => c.id === selectedTicketId) || null;
  }, [allComplaints, selectedTicketId]);

  // Resolved complaints for Resolution Log
  const resolvedComplaints = useMemo(() => {
    return allComplaints.filter(
      (c) => c.status === STATUSES.RESOLVED || c.status === STATUSES.REJECTED
    );
  }, [allComplaints]);

  // Filtered Resolution Log List
  const filteredResolutions = useMemo(() => {
    return resolvedComplaints.filter((item) => {
      if (resDeptFilter !== 'all' && item.category !== resDeptFilter) {
        return false;
      }
      if (resSearchQuery.trim()) {
        const q = resSearchQuery.trim().toLowerCase();
        const matchId = item.id.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchResolver = item.assignedTo?.name?.toLowerCase().includes(q);
        const matchCat = item.category?.toLowerCase().includes(q);

        if (!matchId && !matchTitle && !matchDesc && !matchResolver && !matchCat) {
          return false;
        }
      }
      return true;
    });
  }, [resolvedComplaints, resDeptFilter, resSearchQuery]);

  // Handler: Submit Reassignment
  const handleExecuteReassignment = (e) => {
    e.preventDefault();
    if (!selectedTicketId) {
      showToast('Please select a ticket to transfer', 'warning');
      return;
    }
    if (!targetHandlerId) {
      showToast('Please select a target department or staff member', 'warning');
      return;
    }
    if (!transferReason.trim()) {
      showToast('Please specify a transfer reason', 'warning');
      return;
    }

    const targetObj = REASSIGN_TARGETS.find((t) => t.id === targetHandlerId);
    if (!targetObj) {
      showToast('Invalid target selected', 'error');
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const updated = complaintService.reassign(
        selectedTicketId,
        { id: targetObj.id, name: targetObj.name, department: targetObj.department },
        user || { name: 'Staff Resolver', role: 'staff' },
        transferReason.trim()
      );

      if (updated) {
        showToast(
          `Ticket ${selectedTicketId} successfully transferred to ${targetObj.name} (${targetObj.department})`,
          'success'
        );
        setTransferReason('');
        setTargetHandlerId('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to execute reassignment', err);
      showToast('Failed to transfer ticket', 'error');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  return (
    <div className="staff-resolutions-page" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Banner */}
      <div
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
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--primary-light)',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              padding: '3px 10px',
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            STAFF WORKSPACE • REASSIGNMENTS & RESOLUTION LOG
          </span>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--text-white)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginTop: '6px',
            }}
          >
            Staff Resolutions & Ticket Reassignment
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-gray)', marginTop: '4px' }}>
            Transfer complaints across campus departments & review verified resolution history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/staff/queue" className="btn btn-outline" style={{ fontSize: '13px', padding: '10px 18px' }}>
            <Inbox size={15} style={{ marginRight: '6px' }} /> Return to Queue
          </Link>
        </div>
      </div>

      {/* Main Grid: Reassignment Tool (Left) & Completed Resolutions Log (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 420px) 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
        className="resolutions-layout-grid"
      >
        {/* Reassignment Tool Box */}
        <div className="table-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.2)',
                color: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-white)' }}>
                Ticket Reassignment Tool
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>
                Transfer active tickets to specialized handlers
              </span>
            </div>
          </div>

          <form onSubmit={handleExecuteReassignment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Step 1: Select Active Ticket */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', display: 'block' }}>
                1. Select Ticket to Transfer:
              </label>
              <select
                value={selectedTicketId}
                onChange={(e) => setSelectedTicketId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(17, 24, 39, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'var(--text-white)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="">-- Choose active ticket ({openComplaints.length} available) --</option>
                {allComplaints.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} - {t.title.slice(0, 32)}... ({STATUS_LABELS[t.status]})
                  </option>
                ))}
              </select>
            </div>

            {/* Ticket Preview Card */}
            {activeTicket && (
              <div
                style={{
                  background: 'rgba(17, 24, 39, 0.7)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '14px',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="ticket-id-badge" style={{ fontSize: '11px' }}>
                    {activeTicket.id}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--primary-light)',
                      background: 'rgba(99, 102, 241, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    {activeTicket.category}
                  </span>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-white)' }}>{activeTicket.title}</div>
                <div style={{ color: 'var(--text-gray)', fontSize: '12px' }}>
                  Current Handler: <strong>{activeTicket.assignedTo?.name || 'Unassigned'}</strong>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  Location: {activeTicket.location}
                </div>
              </div>
            )}

            {/* Step 2: Target Handler / Department */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', display: 'block' }}>
                2. Target Staff Member / Department:
              </label>
              <select
                value={targetHandlerId}
                onChange={(e) => setTargetHandlerId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(17, 24, 39, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'var(--text-white)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="">-- Select Target Handler --</option>
                {REASSIGN_TARGETS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.department}) - {t.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Transfer Reason */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', display: 'block' }}>
                3. Reason for Transfer / Reassignment:
              </label>
              <textarea
                rows={3}
                placeholder="Explain why this ticket is being transferred to another resolver or department..."
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(17, 24, 39, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'var(--text-white)',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmittingTransfer || !selectedTicketId || !targetHandlerId}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isSubmittingTransfer ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px' }} />
                  Processing Transfer...
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Execute Ticket Transfer
                </>
              )}
            </button>
          </form>
        </div>

        {/* Completed Resolutions Log */}
        <div className="table-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section Header & Filters */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              borderBottom: '1px solid var(--border-color-light)',
              paddingBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <History size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-white)' }}>
                  Completed Resolutions Log
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>
                  Audit record of resolved & closed complaints ({filteredResolutions.length})
                </span>
              </div>
            </div>

            {/* Filter Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-gray)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search log..."
                  value={resSearchQuery}
                  onChange={(e) => setResSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px 7px 32px',
                    background: 'rgba(17, 24, 39, 0.7)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-white)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              <select
                value={resDeptFilter}
                onChange={(e) => setResDeptFilter(e.target.value)}
                style={{
                  background: 'rgba(17, 24, 39, 0.7)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: 'var(--text-white)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              >
                <option value="all">All Categories</option>
                {Array.from(new Set(resolvedComplaints.map((c) => c.category))).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resolutions Log Cards List */}
          {isLoading ? (
            <div className="loading-state-card">
              <div className="spinner" />
              <span>Loading completed resolution logs...</span>
            </div>
          ) : filteredResolutions.length === 0 ? (
            <div className="empty-state-card" style={{ padding: '40px 20px' }}>
              <div className="empty-icon-box">
                <CheckCircle2 size={32} color="var(--accent-emerald)" />
              </div>
              <h3 className="empty-title" style={{ fontSize: '18px' }}>
                No completed resolutions logged yet
              </h3>
              <p className="empty-description" style={{ fontSize: '13px' }}>
                Resolved complaints will appear in this verified log along with resolution notes, completion timestamps, and SLA metrics.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredResolutions.map((ticket) => {
                const statusColors = getStatusBadgeColor(ticket.status);
                const sla = getSlaStatus(ticket);

                // Find final status history note
                const lastHistory = ticket.statusHistory && ticket.statusHistory.length > 0
                  ? ticket.statusHistory[ticket.statusHistory.length - 1]
                  : null;

                return (
                  <div
                    key={ticket.id}
                    style={{
                      background: 'rgba(17, 24, 39, 0.6)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* Log Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="ticket-id-badge">{ticket.id}</span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--primary-light)',
                            background: 'rgba(99, 102, 241, 0.15)',
                            padding: '2px 8px',
                            borderRadius: '10px',
                          }}
                        >
                          {ticket.category}
                        </span>
                        <span className={`status-badge-chip ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                          <span className={`status-chip-dot ${statusColors.dot}`} />
                          {STATUS_LABELS[ticket.status] || ticket.status}
                        </span>
                      </div>

                      {/* SLA Performance Pill */}
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

                    {/* Title */}
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-white)' }}>
                      {ticket.title}
                    </h3>

                    {/* Final Resolution Notes Box */}
                    {lastHistory && lastHistory.note && (
                      <div
                        style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '13px',
                          color: 'var(--text-main)',
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '2px' }}>
                          RESOLUTION NOTE ({lastHistory.updatedBy})
                        </div>
                        {lastHistory.note}
                      </div>
                    )}

                    {/* Metadata Footer */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: 'var(--text-gray)',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-color-light)',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>
                          Resolver: <strong style={{ color: 'var(--text-white)' }}>{ticket.assignedTo?.name || 'Staff'}</strong>
                        </span>
                        <span>•</span>
                        <span>Location: {ticket.location}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                        <Clock size={12} /> Closed: {formatDate(ticket.updatedAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
