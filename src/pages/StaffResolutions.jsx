import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  CheckCircle2,
  Search,
  Clock,
  Inbox,
  Filter,
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

export default function StaffResolutions() {
  const navigate = useNavigate();
  const { orgKey, currentOrg } = useAuth();
  const { showToast } = useToast();

  const [allComplaints, setAllComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Resolution log filter state
  const [resSearchQuery, setResSearchQuery] = useState('');
  const [resDeptFilter, setResDeptFilter] = useState('all');

  useEffect(() => {
    setIsLoading(true);
    try {
      const data = complaintService.getAll({ org: orgKey, sortBy: 'newest' });
      setAllComplaints(data || []);
    } catch (err) {
      console.error('Failed to load complaints for resolution view', err);
      showToast('Error loading resolution data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [orgKey]);

  // Real-time live synchronization: refreshes resolution log automatically
  useEffect(() => {
    const unsubscribe = complaintService.subscribeToLiveUpdates(() => {
      try {
        const data = complaintService.getAll({ org: orgKey, sortBy: 'newest' });
        setAllComplaints(data || []);
      } catch (err) {
        console.error('Error in StaffResolutions live sync:', err);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orgKey]);

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

  const availableCategories = useMemo(() => {
    return Array.from(new Set(resolvedComplaints.map((c) => c.category).filter(Boolean)));
  }, [resolvedComplaints]);

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
                onChange={(e) => setResSearchQuery(e.target.value)}
                aria-label="Search resolution log"
              />
            </div>

            <select
              className="form-select"
              value={resDeptFilter}
              onChange={(e) => setResDeptFilter(e.target.value)}
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
              return (
                <article key={ticket.id} className="ticket-card" style={{ padding: '16px 20px' }}>
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

                  <h3 className="ticket-title" style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                    {ticket.title}
                  </h3>

                  {ticket.resolutionDetails?.summary && (
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
                      <strong>Resolution Note:</strong> {ticket.resolutionDetails.summary}
                    </div>
                  )}

                  <div className="ticket-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--app-text-muted)' }}>
                    <span className="meta-item">
                      Resolver: <strong>{ticket.assignedTo?.name || 'Staff'}</strong>
                    </span>
                    <span className="meta-item">
                      <Clock size={12} />
                      Closed {formatDate(ticket.updatedAt || ticket.resolvedAt)}
                    </span>
                    {ticket.location && <span className="meta-item">{ticket.location}</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
