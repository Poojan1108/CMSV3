import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  User,
  Wrench,
  MapPin,
  Send,
  Lock,
  Calendar,
  MessageSquare,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  Camera,
  Maximize2,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import { STATUSES, PRIORITIES, ROLES } from '../utils/constants';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import {
  StatusBadge,
  PriorityBadge,
  TicketId,
  EmptyState,
} from '../components/ui';
import Modal from '../components/ui/Modal';
import { ACCESS_TIME_SLOTS, CONTACT_METHODS } from '../data/taxonomy';

/** Canonical resolution timeline stages. */
const TIMELINE_STAGES = [
  { key: 'submitted', label: 'Submitted', desc: 'Ticket registered in the system.' },
  { key: 'under_review', label: 'Under Review', desc: 'Triage and verification by admin.' },
  { key: 'assigned', label: 'Assigned', desc: 'A staff handler was assigned.' },
  { key: 'in_progress', label: 'In Progress', desc: 'Active repair and resolution underway.' },
  {
    key: 'pending_confirmation',
    label: 'Pending Confirmation',
    desc: 'Staff resolved the issue; awaiting your sign-off.',
  },
  {
    key: 'resolved',
    label: 'Resolved & Closed',
    desc: 'Resolution confirmed and ticket closed.',
  },
];

export default function TicketTracker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const ticketIdParam = searchParams.get('id') || '';

  // Local state
  const [lookupId, setLookupId] = useState(ticketIdParam);
  const [complaint, setComplaint] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [userComplaintsList, setUserComplaintsList] = useState([]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmFeedbackText, setConfirmFeedbackText] = useState('');
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReasonText, setReopenReasonText] = useState('');
  const [selectedLightboxImage, setSelectedLightboxImage] = useState(null);

  useEffect(() => {
    try {
      let myTickets = complaintService.getAll({ studentId: user?.id });
      if (!myTickets || myTickets.length === 0) {
        myTickets = complaintService.getAll();
      }
      setUserComplaintsList(myTickets);

      if (ticketIdParam) {
        const found = complaintService.getById(ticketIdParam);
        setComplaint(found || myTickets[0] || null);
        setLookupId(found ? found.id : ticketIdParam);
      } else if (myTickets.length > 0) {
        setComplaint(myTickets[0]);
        setLookupId(myTickets[0].id);
        setSearchParams({ id: myTickets[0].id }, { replace: true });
      } else {
        setComplaint(null);
      }
    } catch (err) {
      console.error('Error fetching ticket tracker data:', err);
    }
  }, [ticketIdParam, user, setSearchParams]);

  // Real-time live synchronization: reacts to new comments, status transitions, and Supabase WebSocket events
  useEffect(() => {
    const unsubscribe = complaintService.subscribeToLiveUpdates(() => {
      try {
        const myTickets = complaintService.getAll({ studentId: user?.id });
        setUserComplaintsList(myTickets);

        const currentTargetId = complaint?.id || ticketIdParam;
        if (currentTargetId) {
          const refreshed = complaintService.getById(currentTargetId);
          if (refreshed) {
            setComplaint(refreshed);
          }
        }
      } catch (err) {
        console.error('Error in TicketTracker live update listener:', err);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [complaint?.id, ticketIdParam, user?.id]);

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    const found = complaintService.getById(lookupId.trim());
    if (found) {
      setComplaint(found);
      setLookupId(found.id);
      setSearchParams({ id: found.id });
      showToast(`Loaded ticket ${found.id}`, 'info');
    } else {
      showToast(`Ticket "${lookupId}" not found. Please check the ID.`, 'error');
    }
  };

  const handleCopyId = () => {
    if (!complaint?.id) return;
    navigator.clipboard.writeText(complaint.id);
    setCopiedId(true);
    showToast('Ticket ID copied to clipboard', 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const actorProfile =
    user || { name: 'Guest', role: ROLES.STUDENT, id: null };

  const handleConfirmResolution = () => {
    if (!complaint) return;
    try {
      const updated = complaintService.confirmResolution(
        complaint.id,
        actorProfile,
        confirmFeedbackText.trim()
      );
      if (updated) {
        setComplaint(updated);
        setShowConfirmModal(false);
        setConfirmFeedbackText('');
        showToast('Ticket confirmed and closed as Resolved', 'success');
      }
    } catch (err) {
      console.error('Error confirming resolution:', err);
      showToast('Failed to confirm resolution', 'error');
    }
  };

  const handleRejectResolution = () => {
    if (!complaint) return;
    try {
      const updated = complaintService.rejectResolution(
        complaint.id,
        actorProfile,
        reopenReasonText.trim()
      );
      if (updated) {
        setComplaint(updated);
        setShowReopenModal(false);
        setReopenReasonText('');
        showToast('Ticket reopened and returned to staff', 'info');
      }
    } catch (err) {
      console.error('Error reopening ticket:', err);
      showToast('Failed to reopen ticket', 'error');
    }
  };

  // Map complaint status to timeline stage index
  const currentStageIndex = useMemo(() => {
    if (!complaint) return 0;
    switch (complaint.status) {
      case STATUSES.RESOLVED:
        return 5;
      case STATUSES.PENDING_CONFIRMATION:
        return 4;
      case STATUSES.IN_PROGRESS:
        return 3;
      case STATUSES.PENDING:
      default:
        if (complaint.assignedTo) return 2;
        if (complaint.statusHistory?.length > 1) return 1;
        return 0;
    }
  }, [complaint]);

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !complaint) return;

    setIsPostingComment(true);
    try {
      const updated = complaintService.addComment(
        complaint.id,
        actorProfile,
        newCommentText.trim(),
        false
      );
      if (updated) {
        setComplaint({ ...updated });
        setNewCommentText('');
        showToast('Comment posted', 'success');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      showToast('Failed to post comment. Please try again.', 'error');
    } finally {
      setIsPostingComment(false);
    }
  };

  const publicComments = useMemo(
    () => (complaint?.comments || []).filter((c) => !c.isInternal),
    [complaint]
  );

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
      {/* Master Ticket Bar */}
      <div
        className="card card-pad master-ticket-bar"
        style={{
          padding: 'clamp(12px, 3vw, 16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
          <Link to="/complaints" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, flexShrink: 0 }}>
            <ArrowLeft size={15} />
            Back to Complaints
          </Link>
          <span style={{ color: 'var(--app-border-strong)', flexShrink: 0 }}>|</span>
          {complaint && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <TicketId id={complaint.id} />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleCopyId}
                title="Copy ticket ID"
                style={{ height: 32, padding: '0 8px' }}
              >
                {copiedId ? <Check size={13} style={{ color: 'var(--app-success)' }} /> : <Copy size={13} />}
                {copiedId ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleLookupSubmit} className="search-field tracker-jump-search" style={{ margin: 0, minWidth: 0 }}>
          <Search size={14} />
          <input
            type="text"
            placeholder="Jump to ID (e.g. #CMS-1001)…"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            aria-label="Quick lookup ticket ID"
          />
        </form>
      </div>

      {!complaint ? (
        <EmptyState
          icon={AlertCircle}
          title="Ticket not found"
          description={`No complaint matched "${lookupId}". Check the ID or select one from your list.`}
        >
          <Link to="/complaints" className="btn btn-primary" style={{ minHeight: 42, display: 'inline-flex', alignItems: 'center' }}>
            View All Complaints
          </Link>
        </EmptyState>
      ) : (
        <>
          {/* Linear / Stripe-grade Milestone Stepper Rail */}
          <div
            className="tracker-milestones-card"
            style={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
            <div
              className="tracker-milestones-header"
              style={{
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--app-text-muted)' }}>
                  Resolution Journey
                </span>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--app-text)', marginTop: 2 }}>
                  Stage {currentStageIndex + 1} of 6: <span style={{ color: 'var(--app-accent)' }}>{TIMELINE_STAGES[currentStageIndex]?.label}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--app-text-secondary)', flexShrink: 0 }}>
                  {Math.min(100, Math.round(((currentStageIndex + (currentStageIndex === 5 ? 1 : 0.5)) / 6) * 100))}% Complete
                </span>
                <div style={{ width: 110, maxWidth: '100%' }} className="milestone-progress-bar-track">
                  <div
                    className="milestone-progress-bar-fill"
                    style={{
                      width: `${Math.min(100, Math.round(((currentStageIndex + (currentStageIndex === 5 ? 1 : 0.5)) / 6) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="milestone-stages-grid" style={{ width: '100%', minWidth: 0 }}>
              {TIMELINE_STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const isUpcoming = idx > currentStageIndex;

                let stageDesc = stage.desc;
                if (isCompleted) stageDesc = 'Completed';
                if (isCurrent) stageDesc = 'Active Now';
                if (isUpcoming) stageDesc = 'Upcoming';

                return (
                  <div
                    key={stage.key}
                    className={`milestone-stage-cell ${isCompleted ? 'is-completed' : ''} ${isCurrent ? 'is-current' : ''} ${isUpcoming ? 'is-upcoming' : ''}`}
                    style={{ minWidth: 0 }}
                  >
                    <div className="milestone-node-badge">
                      {isCompleted ? <Check size={14} /> : isCurrent ? <span style={{ width: 8, height: 8, borderRadius: 999, background: '#ffffff' }} /> : idx + 1}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0,
                        flex: 1,
                        textAlign: 'inherit',
                      }}
                    >
                      <span className="milestone-title" style={{ textAlign: 'inherit' }}>{stage.label}</span>
                      <span className="milestone-time-desc" style={{ textAlign: 'inherit' }}>{stageDesc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2-Column Split Workspace */}
          <div
            className="detail-layout tracker-detail-layout"
            style={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
            {/* LEFT COLUMN: Specifications & Evidence */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0, width: '100%', maxWidth: '100%' }}>
              <section
                className="card card-pad"
                style={{
                  padding: 'clamp(14px, 4vw, 20px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--app-text-muted)' }}>
                    Ticket Specifications
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <PriorityBadge priority={complaint.priority} />
                    <StatusBadge status={complaint.status} />
                  </div>
                </div>

                <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--app-text)', margin: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {complaint.title}
                </h1>
                <p style={{ fontSize: 13.5, color: 'var(--app-text-secondary)', lineHeight: 1.5, margin: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {complaint.description}
                </p>

                {complaint.priority === PRIORITIES.URGENT && complaint.urgencyJustification && (
                  <div
                    className="callout callout-danger"
                    style={{
                      marginTop: 8,
                      width: '100%',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2, color: 'var(--app-danger)' }} />
                    <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                      <span className="callout-title" style={{ fontWeight: 600, marginBottom: 2 }}>Urgency Justification</span>
                      <span>{complaint.urgencyJustification}</span>
                    </div>
                  </div>
                )}

                <div className="meta-grid" style={{ marginTop: 8, borderTop: '1px solid var(--app-border-soft)', paddingTop: 12, width: '100%', minWidth: 0 }}>
                  <div style={{ minWidth: 0 }}>
                    <span className="meta-cell-label">Department</span>
                    <span className="meta-cell-value" style={{ wordBreak: 'break-word' }}>
                      {complaint.category}
                      {complaint.subCategory ? ` · ${complaint.subCategory}` : ''}
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span className="meta-cell-label">Location</span>
                    <span className="meta-cell-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, wordBreak: 'break-word' }}>
                      <MapPin size={13} className="tone-accent" style={{ flexShrink: 0 }} />
                      <span>{complaint.location}</span>
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span className="meta-cell-label">Filed Date</span>
                    <span className="meta-cell-value">{formatDate(complaint.createdAt)}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span className="meta-cell-label">Reporter</span>
                    <span className="meta-cell-value" style={{ wordBreak: 'break-word' }}>
                      {complaint.isAnonymous ? (
                        <span className="anon-chip">
                          <Lock size={12} /> Anonymous
                        </span>
                      ) : (
                        complaint.student?.name || user?.name || 'You'
                      )}
                    </span>
                  </div>
                </div>
              </section>

              {/* Attached Media & Photos Evidence */}
              {complaint.attachments && complaint.attachments.length > 0 && (
                <section
                  className="card card-pad"
                  style={{
                    padding: 'clamp(14px, 4vw, 20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--app-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Camera size={14} className="tone-accent" />
                      Attached Photos & Evidence ({complaint.attachments.length})
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>Click photo to inspect</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 130px), 1fr))', gap: 10, width: '100%', minWidth: 0 }}>
                    {complaint.attachments.map((att, idx) => (
                      <div
                        key={att.id || idx}
                        onClick={() => setSelectedLightboxImage(att)}
                        style={{
                          borderRadius: 10,
                          overflow: 'hidden',
                          border: '1px solid var(--app-border-soft)',
                          background: 'var(--app-card-bg-subtle)',
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                        className="photo-card-hover"
                        title={`Click to view ${att.name || 'photo'}`}
                      >
                        {att.url ? (
                          <div style={{ width: '100%', height: 100, position: 'relative', overflow: 'hidden' }}>
                            <img
                              src={att.url}
                              alt={att.name || 'Attachment'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)',
                              }}
                            />
                            <span
                              style={{
                                position: 'absolute',
                                bottom: 6,
                                right: 6,
                                background: 'rgba(0,0,0,0.7)',
                                color: '#ffffff',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Maximize2 size={10} /> Zoom
                            </span>
                          </div>
                        ) : (
                          <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={26} className="tone-muted" />
                          </div>
                        )}
                        <div style={{ padding: '6px 8px' }}>
                          <div
                            style={{
                              fontSize: 11.5,
                              fontWeight: 600,
                              color: 'var(--app-text)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {att.name || `Photo ${idx + 1}`}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--app-text-muted)' }}>
                            {att.size || 'Photo Attachment'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Assigned Technician Card */}
              <section
                className="card card-pad"
                style={{
                  padding: 'clamp(14px, 4vw, 18px)',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--app-text-muted)' }}>
                  Assigned Staff & SLA
                </span>
                {complaint.assignedTo ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--app-accent-subtle)', color: 'var(--app-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {complaint.assignedTo.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--app-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {complaint.assignedTo.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--app-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {complaint.assignedTo.email || 'Campus Facilities Team'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--app-text-secondary)', marginTop: 8 }}>
                    Awaiting staff triage assignment.
                  </div>
                )}
              </section>

              {/* Resolution Action Card if awaiting confirmation */}
              {complaint.status === STATUSES.PENDING_CONFIRMATION && (
                <section
                  className="card card-pad"
                  style={{
                    padding: 'clamp(14px, 4vw, 20px)',
                    border: '1px solid #86efac',
                    background: '#ffffff',
                    boxShadow: '0 1px 4px 0 rgba(22, 163, 74, 0.08)',
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <div className="ticket-action-notice" style={{ marginBottom: 12 }}>
                    <CheckCircle2 size={15} />
                    <span>Staff marked this resolved — awaiting your confirmation</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)', margin: '0 0 6px', wordBreak: 'break-word' }}>
                    Work Completed — Verify Fix
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--app-text-secondary)', margin: '0 0 14px', lineHeight: 1.5, background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                    <strong>Staff resolution note:</strong> {complaint.resolutionDetails?.notes || 'Repairs completed.'}
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: '1 1 180px', minHeight: 42, justifyContent: 'center' }}
                      onClick={() => setShowConfirmModal(true)}
                    >
                      <CheckCircle2 size={15} />
                      Confirm Fix & Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: '1 1 140px', minHeight: 42, justifyContent: 'center' }}
                      onClick={() => setShowReopenModal(true)}
                    >
                      Dispute / Reopen
                    </button>
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT COLUMN: Live Discussion & Audit Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0, width: '100%', maxWidth: '100%' }}>
              <section
                className="card card-pad"
                style={{
                  padding: 'clamp(14px, 4vw, 20px)',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 380,
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ borderBottom: '1px solid var(--app-border-soft)', paddingBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <MessageSquare size={16} className="tone-accent" style={{ flexShrink: 0 }} />
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Discussion & Updates
                    </h2>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--app-text-muted)', flexShrink: 0 }}>
                    {complaint.comments?.length || 0} messages
                  </span>
                </div>

                <div className="discussion-thread" style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12, width: '100%', boxSizing: 'border-box' }}>
                  {(!complaint.comments || complaint.comments.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--app-text-muted)', fontSize: 13 }}>
                      No messages yet. Post an update or question below.
                    </div>
                  ) : (
                    complaint.comments.map((c) => {
                      const isStaff = c.sender?.role === ROLES.STAFF || c.sender?.role === ROLES.ADMIN;
                      const isMe = user?.id && c.sender?.id === user.id;
                      const senderName = isMe
                        ? `${user?.name || 'You'} (You)`
                        : isStaff
                        ? `${c.sender?.name || 'Staff Resolver'} (Staff)`
                        : `${c.sender?.name || complaint.student?.name || 'Reporter'}`;

                      return (
                        <div
                          key={c.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            background: isStaff ? '#f5f5f4' : '#ffffff',
                            border: `1px solid ${isStaff ? '#e7e5e4' : '#e7e5e4'}`,
                            boxShadow: isStaff ? 'none' : '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
                            maxWidth: '90%',
                            minWidth: 0,
                            alignSelf: isStaff ? 'flex-start' : 'flex-end',
                            boxSizing: 'border-box',
                            wordBreak: 'break-word',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: 12.5, fontWeight: 600, color: '#18181b', minWidth: 0, wordBreak: 'break-word' }}>
                              {senderName}
                            </strong>
                            <span style={{ fontSize: 11, color: '#78716c', flexShrink: 0 }}>
                              {formatRelativeTime(c.createdAt)}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: '#27272a', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {c.text}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={handleAddComment}
                  style={{
                    display: 'flex',
                    gap: 8,
                    borderTop: '1px solid var(--app-border-soft)',
                    paddingTop: 12,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type a message or inquiry..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    style={{ flex: 1, minWidth: 0, height: 42 }}
                    disabled={isPostingComment}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flexShrink: 0, height: 42, padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    disabled={isPostingComment || !newCommentText.trim()}
                  >
                    <Send size={14} />
                    <span>Send</span>
                  </button>
                </form>
              </section>
            </div>
          </div>
        </>
      )}

      {/* Confirm-resolution modal */}
      {showConfirmModal && complaint && (
        <Modal
          title="Confirm Ticket Resolution"
          subtitle={complaint.id}
          onClose={() => setShowConfirmModal(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ height: 42, minHeight: 42 }}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ height: 42, minHeight: 42 }}
                onClick={handleConfirmResolution}
              >
                <CheckCircle2 size={15} />
                Confirm &amp; Close
              </button>
            </>
          }
        >
          <p className="detail-desc" style={{ margin: 0 }}>
            By confirming you verify that the completed work has resolved your complaint. The
            ticket will move to <strong>Resolved</strong> and can no longer be updated.
          </p>
          <div className="form-group" style={{ marginTop: 12, width: '100%' }}>
            <label htmlFor="confirm-feedback" className="field-label">
              Feedback (optional)
            </label>
            <textarea
              id="confirm-feedback"
              className="form-textarea"
              rows={3}
              placeholder="e.g. Work was completed quickly and everything works."
              value={confirmFeedbackText}
              onChange={(e) => setConfirmFeedbackText(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </Modal>
      )}

      {/* Reopen modal */}
      {showReopenModal && complaint && (
        <Modal
          title="Reopen Complaint"
          subtitle={complaint.id}
          onClose={() => setShowReopenModal(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ height: 42, minHeight: 42 }}
                onClick={() => setShowReopenModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ height: 42, minHeight: 42 }}
                onClick={handleRejectResolution}
                disabled={!reopenReasonText.trim()}
              >
                Reopen Ticket
              </button>
            </>
          }
        >
          <p className="detail-desc" style={{ margin: 0 }}>
            Explain what still needs attention so staff can inspect it again.
          </p>
          <div className="form-group" style={{ marginTop: 12, width: '100%' }}>
            <label htmlFor="reopen-reason" className="field-label">
              Reason<span className="required-mark">*</span>
            </label>
            <textarea
              id="reopen-reason"
              className="form-textarea"
              rows={3}
              placeholder="e.g. The leak started again after ten minutes…"
              value={reopenReasonText}
              onChange={(e) => setReopenReasonText(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </Modal>
      )}

      {/* High-Resolution Photo Evidence Lightbox Modal */}
      {selectedLightboxImage && (
        <Modal
          title={selectedLightboxImage.name || 'Inspection Photo Evidence'}
          subtitle={selectedLightboxImage.size ? `Attached file size: ${selectedLightboxImage.size}` : 'Uploaded photo evidence'}
          onClose={() => setSelectedLightboxImage(null)}
          maxWidth={760}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--app-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                {complaint?.id} · {complaint?.category}
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedLightboxImage.url && (
                  <a
                    href={selectedLightboxImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ minHeight: 36, display: 'inline-flex', alignItems: 'center' }}
                  >
                    Open Full Resolution
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ minHeight: 36 }}
                  onClick={() => setSelectedLightboxImage(null)}
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#090d16',
              borderRadius: 8,
              overflow: 'hidden',
              minHeight: 200,
              maxHeight: '65vh',
              padding: 8,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {selectedLightboxImage.url ? (
              <img
                src={selectedLightboxImage.url}
                alt={selectedLightboxImage.name || 'Inspection Photo'}
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 4 }}
              />
            ) : (
              <div style={{ color: '#fff', padding: 40, textAlign: 'center' }}>
                Preview image unavailable
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
