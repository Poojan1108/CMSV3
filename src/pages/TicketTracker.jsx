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
      const myTickets = complaintService.getAll({ studentId: user?.id });
      setUserComplaintsList(myTickets);

      if (ticketIdParam) {
        const found = complaintService.getById(ticketIdParam);
        setComplaint(found);
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
    <div className="page-stack">
      {/* Master Ticket Bar */}
      <div className="card card-pad master-ticket-bar" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/complaints" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
            <ArrowLeft size={15} />
            Back to Complaints
          </Link>
          <span style={{ color: 'var(--app-border-strong)' }}>|</span>
          {complaint && (
            <>
              <TicketId id={complaint.id} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopyId} title="Copy ticket ID">
                {copiedId ? <Check size={13} style={{ color: 'var(--app-success)' }} /> : <Copy size={13} />}
                {copiedId ? 'Copied' : 'Copy'}
              </button>
            </>
          )}
        </div>

        <form onSubmit={handleLookupSubmit} className="search-field tracker-jump-search" style={{ margin: 0 }}>
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
          <Link to="/complaints" className="btn btn-primary">
            View All Complaints
          </Link>
        </EmptyState>
      ) : (
        <>
          {/* Linear / Stripe-grade Milestone Stepper Rail */}
          <div className="tracker-milestones-card">
            <div className="tracker-milestones-header">
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--app-text-muted)' }}>
                  Resolution Journey
                </span>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--app-text)', marginTop: 2 }}>
                  Stage {currentStageIndex + 1} of 6: <span style={{ color: 'var(--app-accent)' }}>{TIMELINE_STAGES[currentStageIndex]?.label}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--app-text-secondary)' }}>
                  {Math.min(100, Math.round(((currentStageIndex + (currentStageIndex === 5 ? 1 : 0.5)) / 6) * 100))}% Complete
                </span>
                <div style={{ width: 110 }} className="milestone-progress-bar-track">
                  <div
                    className="milestone-progress-bar-fill"
                    style={{
                      width: `${Math.min(100, Math.round(((currentStageIndex + (currentStageIndex === 5 ? 1 : 0.5)) / 6) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="milestone-stages-grid">
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
                  >
                    <div className="milestone-node-badge">
                      {isCompleted ? <Check size={14} /> : isCurrent ? <span style={{ width: 8, height: 8, borderRadius: 999, background: '#ffffff' }} /> : idx + 1}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0, width: '100%' }}>
                      <span className="milestone-title">{stage.label}</span>
                      <span className="milestone-time-desc">{stageDesc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2-Column Split Workspace */}
          <div className="detail-layout tracker-detail-layout">
            {/* LEFT COLUMN: Specifications & Evidence */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <section className="card card-pad" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--app-text-muted)' }}>
                    Ticket Specifications
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <PriorityBadge priority={complaint.priority} />
                    <StatusBadge status={complaint.status} />
                  </div>
                </div>

                <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--app-text)', margin: 0 }}>
                  {complaint.title}
                </h1>
                <p style={{ fontSize: 13.5, color: 'var(--app-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {complaint.description}
                </p>

                {complaint.priority === PRIORITIES.URGENT && complaint.urgencyJustification && (
                  <div className="callout callout-danger" style={{ marginTop: 6 }}>
                    <AlertTriangle size={15} />
                    <div>
                      <span className="callout-title">Urgency Justification</span>
                      {complaint.urgencyJustification}
                    </div>
                  </div>
                )}

                <div className="meta-grid" style={{ marginTop: 8, borderTop: '1px solid var(--app-border-soft)', paddingTop: 12 }}>
                  <div>
                    <span className="meta-cell-label">Department</span>
                    <span className="meta-cell-value">
                      {complaint.category}
                      {complaint.subCategory ? ` · ${complaint.subCategory}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="meta-cell-label">Location</span>
                    <span className="meta-cell-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} className="tone-accent" />
                      {complaint.location}
                    </span>
                  </div>
                  <div>
                    <span className="meta-cell-label">Filed Date</span>
                    <span className="meta-cell-value">{formatDate(complaint.createdAt)}</span>
                  </div>
                  <div>
                    <span className="meta-cell-label">Reporter</span>
                    <span className="meta-cell-value">
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
                <section className="card card-pad" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--app-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Camera size={14} className="tone-accent" />
                      Attached Photos & Evidence ({complaint.attachments.length})
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>Click photo to inspect</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: 10 }}>
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
              <section className="card card-pad" style={{ padding: '16px 20px' }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--app-text-muted)' }}>
                  Assigned Staff & SLA
                </span>
                {complaint.assignedTo ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--app-accent-subtle)', color: 'var(--app-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                      {complaint.assignedTo.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--app-text)' }}>
                        {complaint.assignedTo.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>
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
                <section className="card card-pad" style={{ padding: '20px', border: '1px solid #86efac', background: '#ffffff', boxShadow: '0 1px 4px 0 rgba(22, 163, 74, 0.08)' }}>
                  <div className="ticket-action-notice" style={{ marginBottom: 12 }}>
                    <CheckCircle2 size={15} />
                    <span>Staff marked this resolved — awaiting your confirmation</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)', margin: '0 0 6px' }}>
                    Work Completed — Verify Fix
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--app-text-secondary)', margin: '0 0 14px', lineHeight: 1.5, background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <strong>Staff resolution note:</strong> {complaint.resolutionDetails?.notes || 'Repairs completed.'}
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => setShowConfirmModal(true)}
                    >
                      <CheckCircle2 size={15} />
                      Confirm Fix & Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowReopenModal(true)}
                    >
                      Dispute / Reopen
                    </button>
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT COLUMN: Live Discussion & Audit Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <section className="card card-pad" style={{ padding: '20px', display: 'flex', flexDirection: 'column', minHeight: 480 }}>
                <div style={{ borderBottom: '1px solid var(--app-border-soft)', paddingBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquare size={16} className="tone-accent" />
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)', margin: 0 }}>
                      Discussion & Updates
                    </h2>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>
                    {complaint.comments?.length || 0} messages
                  </span>
                </div>

                <div className="discussion-thread" style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                            padding: '12px 16px',
                            borderRadius: 10,
                            background: isStaff ? '#f5f5f4' : '#ffffff',
                            border: `1px solid ${isStaff ? '#e7e5e4' : '#e7e5e4'}`,
                            boxShadow: isStaff ? 'none' : '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
                            maxWidth: '85%',
                            alignSelf: isStaff ? 'flex-start' : 'flex-end',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 5 }}>
                            <strong style={{ fontSize: 12.5, fontWeight: 600, color: '#18181b' }}>
                              {senderName}
                            </strong>
                            <span style={{ fontSize: 11, color: '#78716c' }}>
                              {formatRelativeTime(c.createdAt)}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: '#27272a', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {c.text}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--app-border-soft)', paddingTop: 12 }}>
                  <input
                    type="text"
                    placeholder="Type a message or inquiry..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    style={{ flex: 1 }}
                    disabled={isPostingComment}
                  />
                  <button type="submit" className="btn btn-primary" disabled={isPostingComment || !newCommentText.trim()}>
                    <Send size={14} />
                    Send
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
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmResolution}>
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
          <div className="form-group">
            <label htmlFor="confirm-feedback" className="field-label">
              Feedback (optional)
            </label>
            <textarea
              id="confirm-feedback"
              rows={3}
              placeholder="e.g. Work was completed quickly and everything works."
              value={confirmFeedbackText}
              onChange={(e) => setConfirmFeedbackText(e.target.value)}
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
                onClick={() => setShowReopenModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
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
          <div className="form-group">
            <label htmlFor="reopen-reason" className="field-label">
              Reason<span className="required-mark">*</span>
            </label>
            <textarea
              id="reopen-reason"
              rows={3}
              placeholder="e.g. The leak started again after ten minutes…"
              value={reopenReasonText}
              onChange={(e) => setReopenReasonText(e.target.value)}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>
                {complaint?.id} · {complaint?.category}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedLightboxImage.url && (
                  <a
                    href={selectedLightboxImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    Open Full Resolution
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
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
              minHeight: 280,
              maxHeight: 520,
              padding: 8,
            }}
          >
            {selectedLightboxImage.url ? (
              <img
                src={selectedLightboxImage.url}
                alt={selectedLightboxImage.name || 'Inspection Photo'}
                style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 4 }}
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
