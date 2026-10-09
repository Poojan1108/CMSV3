import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  History,
  CheckCircle2,
  Search,
  Clock,
  Inbox,
  X,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import { STATUSES } from '../utils/constants';
import { formatDate, getSlaStatus } from '../utils/formatters';
import {
  PageHeader,
  EmptyState,
  LoadingState,
  StatusBadge,
  SlaBadge,
  TicketId,
  Tag,
} from '../components/ui';
import TicketDetailModal from '../components/tickets/TicketDetailModal';

/**
 * StaffResolutions
 *
 * Audit and resolution log for resolvers and staff.
 * Features:
 * - Direct asynchronous fetching and live Realtime synchronization
 * - URL Query Parameters synchronization for deep-linking & persistent search filters
 * - Decoupled TicketDetailModal integration for viewing full audit trails & evidence
 * - 100% preservation of all existing styling, layout hierarchy, and design tokens
 */
export default function StaffResolutions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { orgKey, currentOrg } = useAuth();
  const { showToast } = useToast();

  const [allComplaints, setAllComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // URL-driven filter state
  const resSearchQuery = searchParams.get('q') || '';
  const resDeptFilter = searchParams.get('cat') || 'all';

  const updateFilters = useCallback((updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (!val || val === 'all') {
          next.delete(key);
        } else {
          next.set(key, val);
        }
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Load complaints asynchronously from the core service
  const loadResolutions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await complaintService.fetchComplaints({ org: orgKey, sortBy: 'newest' });
      setAllComplaints(data || []);

      if (selectedTicket) {
        const refreshed = complaintService.getById(selectedTicket.id);
        if (refreshed) setSelectedTicket(refreshed);
      }
    } catch (err) {
      console.error('[StaffResolutions] Failed to load resolution data:', err);
      showToast('Error loading resolution data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [orgKey, selectedTicket, showToast]);

  useEffect(() => {
    loadResolutions();
  }, [orgKey]);

  // Real-time live synchronization: refreshes resolution log automatically
  useEffect(() => {
    const unsubscribe = complaintService.subscribeToLiveUpdates(() => {
      try {
        const data = complaintService.getAll({ org: orgKey, sortBy: 'newest' });
        setAllComplaints(data || []);

        setSelectedTicket((prev) => {
          if (prev) {
            const refreshed = complaintService.getById(prev.id);
            return refreshed || prev;
          }
          return null;
        });
      } catch (err) {
        console.error('[StaffResolutions] Error in live sync:', err);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orgKey]);

  // Scoped strictly to closed/resolved records
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
        const haystack = [
          item.id,
          item.title,
          item.description,
          item.assignedTo?.name,
          item.category,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [resolvedComplaints, resDeptFilter, resSearchQuery]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set(resolvedComplaints.map((c) => c.category).filter(Boolean)));
  }, [resolvedComplaints]);

  const handleOpenTicketDetails = useCallback(async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const detailed = await complaintService.syncTicketDetails(ticket.id);
      if (detailed) {
        setSelectedTicket(detailed);
      }
    } catch (err) {
      console.warn('[StaffResolutions] Failed to sync ticket details:', err);
    }
  }, []);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Audit & History"
        icon={<History size={12} />}
        title="Resolution Log"
        description="Review verified resolution history, SLA turnaround metrics, and closed complaint records."
        actions={
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/staff/queue')}>
            <Inbox size={15} />
            Return to Queue
          </button>
        }
      />

      <section className="card card-pad">
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} className="tone-success" />
              Completed Resolutions ({resolvedComplaints.length})
            </h2>
            <p className="card-subtitle">Official log of resolved and closed department requests</p>
          </div>

          <div className="toolbar-row" style={{ width: '100%', marginTop: 12 }}>
            <div className="search-field" style={{ flex: '1 1 240px' }}>
              <Search size={14} />
              <input
                type="text"
                placeholder="Search by ticket ID, title, or resolver…"
                value={resSearchQuery}
                onChange={(e) => updateFilters({ q: e.target.value })}
                aria-label="Search resolution log"
              />
              {resSearchQuery && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => updateFilters({ q: '' })}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              className="form-select"
              value={resDeptFilter}
              onChange={(e) => updateFilters({ cat: e.target.value })}
              aria-label="Filter by category"
              style={{ minWidth: 160 }}
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Loading resolution history…" />
        ) : filteredResolutions.length === 0 ? (
          <EmptyState
            icon={History}
            title="No resolution records found"
            description={
              resSearchQuery || resDeptFilter !== 'all'
                ? 'Try adjusting your search query or category filter.'
                : 'Resolved complaints and technician notes will be logged here.'
            }
          />
        ) : (
          <div className="resolution-feed" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredResolutions.map((ticket) => {
              const sla = getSlaStatus(ticket);
              const noteText =
                ticket.resolutionDetails?.summary ||
                ticket.resolutionDetails?.notes ||
                ticket.resolutionDetails?.userFeedback;

              return (
                <article
                  key={ticket.id}
                  className="ticket-card"
                  onClick={() => handleOpenTicketDetails(ticket)}
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TicketId id={ticket.id} />
                      <Tag>{ticket.category}</Tag>
                      <StatusBadge status={ticket.status} />
                    </div>
                    {sla && <SlaBadge sla={sla} />}
                  </div>

                  <h3
                    className="ticket-title"
                    style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}
                  >
                    {ticket.title}
                  </h3>

                  {noteText && (
                    <div
                      className="resolution-summary"
                      style={{
                        padding: '10px 14px',
                        background: 'var(--app-card-bg-subtle, #f8fafc)',
                        borderLeft: '3px solid var(--app-success, #16a34a)',
                        borderRadius: 6,
                        margin: '10px 0',
                        fontSize: 13,
                        color: 'var(--app-text)',
                      }}
                    >
                      <strong>Resolution Note:</strong> {noteText}
                    </div>
                  )}

                  <div
                    className="ticket-meta"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      marginTop: 8,
                      fontSize: 12,
                      color: 'var(--app-text-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <span className="meta-item">
                        <Shield size={12} style={{ marginRight: 4 }} />
                        Resolver: <strong>{ticket.assignedTo?.name || 'Staff'}</strong>
                      </span>
                      <span className="meta-item">
                        <Clock size={12} style={{ marginRight: 4 }} />
                        Closed {formatDate(ticket.updatedAt || ticket.resolvedAt)}
                      </span>
                      {ticket.location && <span className="meta-item">{ticket.location}</span>}
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTicketDetails(ticket);
                      }}
                      style={{ minHeight: 30, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      Audit Details
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Ticket Detail Modal for inspecting complete audit trail */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onQuickStatus={() => {}}
          onAddInternalNote={() => {}}
          onStatusSubmit={() => {}}
          navigate={navigate}
          readOnly={true}
        />
      )}
    </div>
  );
}
