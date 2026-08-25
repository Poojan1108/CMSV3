import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import { STATUSES, ROLES } from '../utils/constants';
import { formatDate, getSlaStatus } from '../utils/formatters';
import { DEPARTMENT_QUEUES } from '../data/taxonomy';
import {
  PageHeader,
  EmptyState,
  LoadingState,
  StatusBadge,
  SlaBadge,
  TicketId,
  Tag,
} from '../components/ui';

/**
 * Builds the reassignment target list from active staff accounts plus shared
 * department queues — no hard-coded people in the page.
 */
function buildReassignTargets(availableUsers) {
  const staffTargets = availableUsers
    .filter((u) => u.role === ROLES.STAFF || u.role === ROLES.ADMIN)
    .map((u) => ({
      id: u.id,
      name: u.name,
      department: u.department || 'Staff Resolver',
    }));

  return [...staffTargets, ...DEPARTMENT_QUEUES];
}

export default function StaffResolutions() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, availableUsers } = useAuth();
  const { showToast } = useToast();

  const urlTicketId = searchParams.get('ticketId') || '';

  const [allComplaints, setAllComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reassignment form state
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [targetHandlerId, setTargetHandlerId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Resolution log filter state
  const [resSearchQuery, setResSearchQuery] = useState('');
  const [resDeptFilter, setResDeptFilter] = useState('all');

  const reassignTargets = useMemo(() => buildReassignTargets(availableUsers), [availableUsers]);

  useEffect(() => {
    setIsLoading(true);
    try {
      const data = complaintService.getAll({ sortBy: 'newest' });
      setAllComplaints(data);

      if (urlTicketId) {
        setSelectedTicketId(urlTicketId);
      } else {
        setSelectedTicketId((prev) => {
          if (prev) return prev;
          const firstOpen = data.find(
            (c) => c.status !== STATUSES.RESOLVED && c.status !== STATUSES.REJECTED
          );
          return firstOpen?.id || '';
        });
      }
    } catch (err) {
      console.error('Failed to load complaints for resolution view', err);
      showToast('Error loading resolution data', 'error');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTicketId]);

  // Open tickets eligible for transfer
  const openComplaints = useMemo(
    () =>
      allComplaints.filter(
        (c) => c.status === STATUSES.PENDING || c.status === STATUSES.IN_PROGRESS
      ),
    [allComplaints]
  );

  const activeTicket = useMemo(
    () => allComplaints.find((c) => c.id === selectedTicketId) || null,
    [allComplaints, selectedTicketId]
  );

  const resolvedComplaints = useMemo(
    () =>
      allComplaints.filter(
        (c) => c.status === STATUSES.RESOLVED || c.status === STATUSES.REJECTED
      ),
    [allComplaints]
  );

  const filteredResolutions = useMemo(() => {
    return resolvedComplaints.filter((item) => {
      if (resDeptFilter !== 'all' && item.category !== resDeptFilter) return false;
      if (resSearchQuery.trim()) {
        const q = resSearchQuery.trim().toLowerCase();
        const haystack =
          `${item.id} ${item.title} ${item.description || ''} ${item.assignedTo?.name || ''} ${
            item.category || ''
          }`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [resolvedComplaints, resDeptFilter, resSearchQuery]);

  const handleExecuteReassignment = (e) => {
    e.preventDefault();
    if (!selectedTicketId) {
      showToast('Select a ticket to transfer', 'warning');
      return;
    }
    if (!targetHandlerId) {
      showToast('Select a target handler or department', 'warning');
      return;
    }
    if (!transferReason.trim()) {
      showToast('Provide a transfer reason', 'warning');
      return;
    }

    const target = reassignTargets.find((t) => t.id === targetHandlerId);
    if (!target) {
      showToast('Invalid target selected', 'error');
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const updated = complaintService.reassign(
        selectedTicketId,
        { id: target.id, name: target.name, department: target.department },
        user || { name: 'Staff', role: ROLES.STAFF },
        transferReason.trim()
      );

      if (updated) {
        showToast(`Ticket ${selectedTicketId} transferred to ${target.name}`, 'success');
        setTransferReason('');
        setTargetHandlerId('');
      }
    } catch (err) {
      console.error('Failed to execute reassignment', err);
      showToast('Failed to transfer ticket', 'error');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Reassignments & Log"
        icon={<History size={12} />}
        title="Resolutions & Reassignment"
        description="Transfer complaints across departments and review verified resolution history."
        actions={
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/staff/queue')}>
            <Inbox size={15} />
            Return to Queue
          </button>
        }
      />

      <div className="detail-layout" style={{ gridTemplateColumns: 'minmax(300px, 400px) minmax(0, 1fr)' }}>
        {/* Reassignment form */}
        <section className="card card-pad">
          <h2 className="card-title">Ticket Transfer</h2>
          <p className="card-subtitle" style={{ marginBottom: 14 }}>
            Move an open ticket to a specialized handler.
          </p>

          <form onSubmit={handleExecuteReassignment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label htmlFor="transfer-ticket" className="form-label">
                1. Ticket to transfer<span className="required-mark">*</span>
              </label>
              <select
                id="transfer-ticket"
                value={selectedTicketId}
                onChange={(e) => setSelectedTicketId(e.target.value)}
              >
                <option value="">
                  Select an open ticket ({openComplaints.length} available)
                </option>
                {openComplaints.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} — {t.title.slice(0, 40)}
                  </option>
                ))}
              </select>
            </div>

            {activeTicket && (
              <div className="resolution-summary" style={{ margin: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <TicketId id={activeTicket.id} />
                  <Tag>{activeTicket.category}</Tag>
                </div>
                <div className="comment-author">{activeTicket.title}</div>
                <div className="cell-sub" style={{ marginTop: 4 }}>
                  Current handler: {activeTicket.assignedTo?.name || 'Unassigned'} •{' '}
                  {activeTicket.location}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="transfer-target" className="form-label">
                2. Target staff / department<span className="required-mark">*</span>
              </label>
              <select
                id="transfer-target"
                value={targetHandlerId}
                onChange={(e) => setTargetHandlerId(e.target.value)}
              >
                <option value="">Select target…</option>
                {reassignTargets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="transfer-reason" className="form-label">
                3. Reason<span className="required-mark">*</span>
              </label>
              <textarea
                id="transfer-reason"
                className="form-textarea"
                rows={3}
                placeholder="Why is this ticket being transferred?"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmittingTransfer || !selectedTicketId || !targetHandlerId}
            >
              {isSubmittingTransfer ? (
                <>
                  <span className="spinner" />
                  Processing…
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  Execute Transfer
                </>
              )}
            </button>
          </form>
        </section>

        {/* Resolution log */}
        <section className="card card-pad">
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} className="tone-success" />
                Completed Resolutions
              </h2>
              <p className="card-subtitle">Audit record of closed complaints</p>
            </div>

            <div className="toolbar-row">
              <div className="search-field" style={{ maxWidth: 200, minWidth: 150 }}>
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Search log…"
                  value={resSearchQuery}
                  onChange={(e) => setResSearchQuery(e.target.value)}
                  aria-label="Search resolution log"
                />
              </div>

              <select
                value={resDeptFilter}
                onChange={(e) => setResDeptFilter(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="all">All Categories</option>
                {[...new Set(resolvedComplaints.map((c) => c.category))].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <LoadingState label="Loading resolution logs…" />
          ) : filteredResolutions.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No completed resolutions yet"
              description="Closed complaints appear here with resolution notes, timestamps and SLA metrics."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredResolutions.map((ticket) => {
                const sla = getSlaStatus(ticket);
                const lastHistory =
                  ticket.statusHistory?.[ticket.statusHistory.length - 1] || null;

                return (
                  <article key={ticket.id} className="ticket-card" style={{ height: 'auto' }}>
                    <div className="ticket-card-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <TicketId id={ticket.id} />
                        <Tag>{ticket.category}</Tag>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <SlaBadge sla={sla} showIcon={false} />
                    </div>

                    <h3 className="ticket-card-title">{ticket.title}</h3>

                    {lastHistory?.note && (
                      <div className="callout callout-success">
                        <CheckCircle2 size={14} />
                        <div>
                          <span className="callout-title">
                            Resolution note — {lastHistory.updatedBy}
                          </span>
                          {lastHistory.note}
                        </div>
                      </div>
                    )}

                    <div className="ticket-card-meta">
                      <span className="meta-item">
                        Resolver: <strong>{ticket.assignedTo?.name || 'Staff'}</strong>
                      </span>
                      <span className="meta-item">
                        <Clock size={12} />
                        Closed {formatDate(ticket.updatedAt)}
                      </span>
                      <span className="meta-item">{ticket.location}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
