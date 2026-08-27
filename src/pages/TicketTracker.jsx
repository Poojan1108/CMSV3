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
    setTimeout(() => {
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
    }, 350);
  };

  const publicComments = useMemo(
    () => (complaint?.comments || []).filter((c) => !c.isInternal),
    [complaint]
  );

  return (
    <div className="page-stack">
      {/* Top bar */}
      <div className="toolbar-row">
        <Link to="/complaints" className="breadcrumb-link">
          <ArrowLeft size={15} />
          Back to My Complaints
        </Link>

        <div className="toolbar-spacer" />

        <form onSubmit={handleLookupSubmit} className="toolbar-row">
          <div className="search-field" style={{ maxWidth: 260 }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Enter Ticket ID…"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              aria-label="Ticket ID"
            />
          </div>

          {userComplaintsList.length > 0 && (
            <select
              value={complaint?.id || ''}
              onChange={(e) => e.target.value && setSearchParams({ id: e.target.value })}
              aria-label="Select one of my tickets"
            >
              <option value="" disabled>
                My tickets…
              </option>
              {userComplaintsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} — {t.title.substring(0, 32)}
                </option>
              ))}
            </select>
          )}

          <button type="submit" className="btn btn-secondary btn-sm">
            Lookup
          </button>
        </form>
      </div>

      {!complaint ? (
        <EmptyState
          icon={AlertCircle}
          title="Ticket not found"
          description={`No complaint matched "${lookupId}". Check the ID or pick a ticket from your list.`}
        >
          <Link to="/complaints" className="btn btn-primary">
            View All My Complaints
          </Link>
        </EmptyState>
      ) : (
        <div className="detail-layout">
          {/* LEFT: details, timeline, discussion */}
          <div className="detail-main">
            {/* Header card */}
            <section className="card card-pad">
              <div className="detail-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <TicketId id={complaint.id} />
                  <button type="button" className="copy-btn" onClick={handleCopyId}>
                    {copiedId ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId ? 'Copied' : 'Copy ID'}
                  </button>
                </div>
                <div className="ticket-card-badges">
                  <PriorityBadge priority={complaint.priority} />
                  <StatusBadge status={complaint.status} />
                </div>
              </div>

              <h1 className="detail-title" style={{ margin: '12px 0 6px' }}>
                {complaint.title}
              </h1>
              <p className="detail-desc">{complaint.description}</p>

              {complaint.priority === PRIORITIES.URGENT && complaint.urgencyJustification && (
                <div className="callout callout-danger" style={{ marginTop: 14 }}>
                  <AlertTriangle size={15} />
                  <div>
                    <span className="callout-title">Urgency justification</span>
                    {complaint.urgencyJustification}
                  </div>
                </div>
              )}

              <div className="meta-grid" style={{ marginTop: 16 }}>
                <div>
                  <span className="meta-cell-label">Category</span>
                  <span className="meta-cell-value">
                    {complaint.category}
                    {complaint.subCategory ? ` • ${complaint.subCategory}` : ''}
                  </span>
                </div>
                <div>
                  <span className="meta-cell-label">Location</span>
                  <span className="meta-cell-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={13} className="tone-accent" />
                    {complaint.location}
                  </span>
                </div>
                <div>
                  <span className="meta-cell-label">Date Submitted</span>
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

            {/* Resolution confirmation panel */}
            {complaint.status === STATUSES.PENDING_CONFIRMATION && (
              <section className="resolution-panel">
                <div className="resolution-panel-head">
                  <span className="resolution-panel-icon">
                    <CheckCircle2 size={19} />
                  </span>
                  <div>
                    <h3 className="resolution-panel-title">Action required: confirm resolution</h3>
                    <p className="resolution-panel-sub">
                      Staff marked your issue as fixed. Verify the work to officially close this
                      ticket.
                    </p>
                  </div>
                </div>

                <div className="resolution-summary">
                  <div className="resolution-summary-label">
                    RESOLUTION SUMMARY —{' '}
                    {(complaint.resolutionDetails?.staffName || 'STAFF').toUpperCase()}
                  </div>
                  <p className="resolution-summary-text">
                    “{complaint.resolutionDetails?.notes || 'Staff marked this ticket as resolved.'}”
                  </p>
                  {complaint.resolutionDetails?.proposedAt && (
                    <div className="resolution-summary-date">
                      Proposed on {formatDate(complaint.resolutionDetails.proposedAt)}
                    </div>
                  )}
                </div>

                <div className="resolution-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowConfirmModal(true)}
                  >
                    <CheckCircle2 size={15} />
                    Confirm &amp; Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-outline"
                    onClick={() => setShowReopenModal(true)}
                  >
                    <AlertTriangle size={15} />
                    Issue Not Solved
                  </button>
                </div>
              </section>
            )}

            {/* Timeline stepper */}
            <section className="card card-pad">
              <h2 className="card-title" style={{ marginBottom: 18 }}>
                Resolution Timeline
              </h2>

              <div className="stepper">
                {TIMELINE_STAGES.map((stage, idx) => {
                  const isCompleted = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;

                  const matchingHistory = (complaint.statusHistory || []).filter((h) => {
                    switch (stage.key) {
                      case 'submitted':
                        return h.status === STATUSES.PENDING && idx === 0;
                      case 'under_review':
                        return (
                          h.note?.toLowerCase().includes('review') ||
                          h.note?.toLowerCase().includes('triage')
                        );
                      case 'assigned':
                        return h.note?.toLowerCase().includes('assign') || complaint.assignedTo;
                      case 'in_progress':
                        return h.status === STATUSES.IN_PROGRESS;
                      case 'resolved':
                        return h.status === STATUSES.RESOLVED;
                      default:
                        return false;
                    }
                  });

                  return (
                    <div key={stage.key} className="step-row">
                      <div className="step-rail">
                        <div className={`step-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                          {isCompleted ? (
                            <CheckCircle2 size={16} />
                          ) : isCurrent ? (
                            <span className="step-node-inner" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        {idx < TIMELINE_STAGES.length - 1 && (
                          <div className={`step-line ${isCompleted ? 'completed' : ''}`} />
                        )}
                      </div>

                      <div className="step-body">
                        <div className="step-head">
                          <h4 className={`step-title ${!isCompleted && !isCurrent ? 'is-muted' : ''}`}>
                            {stage.label}
                          </h4>
                          {isCurrent && <span className="stage-chip current">ACTIVE</span>}
                          {isCompleted && <span className="stage-chip done">DONE</span>}
                        </div>
                        <p className="step-desc">{stage.desc}</p>

                        {matchingHistory.length > 0 && (
                          <div className="history-notes">
                            {matchingHistory.map((h, hIdx) => (
                              <div key={hIdx} className="history-note">
                                <span className="history-author">{h.updatedBy}</span>
                                <span>{h.note}</span>
                                <span className="history-time">
                                  {formatRelativeTime(h.timestamp)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Discussion */}
            <section className="card card-pad">
              <h2 className="card-title" style={{ marginBottom: 14 }}>
                Discussion ({publicComments.length})
              </h2>

              <div className="comments-list">
                {publicComments.length === 0 ? (
                  <div className="no-comments">
                    No comments yet. Post updates or questions for the handler below.
                  </div>
                ) : (
                  publicComments.map((comment) => {
                    const isStaff =
                      comment.senderRole === ROLES.STAFF || comment.senderRole === ROLES.ADMIN;
                    return (
                      <div key={comment.id} className="comment-row">
                        <span className={`comment-avatar ${isStaff ? 'staff' : 'user'}`}>
                          {isStaff ? <Wrench size={14} /> : <User size={14} />}
                        </span>
                        <div className="comment-bubble">
                          <div className="comment-meta">
                            <span className="comment-author">{comment.senderName}</span>
                            <span className="comment-role">
                              {(comment.senderRole || 'user').toUpperCase()}
                            </span>
                            <span className="comment-time">
                              {formatRelativeTime(comment.timestamp)}
                            </span>
                          </div>
                          <p className="comment-text">{comment.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleAddComment} className="comment-form">
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Write an update for the assigned handler…"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  aria-label="Add a comment"
                />
                <div className="comment-form-foot">
                  <span className="comment-hint">
                    <MessageSquare size={13} />
                    Visible to assigned department handlers.
                  </span>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={isPostingComment || !newCommentText.trim()}
                  >
                    {isPostingComment ? <span className="spinner" /> : <Send size={14} />}
                    Post Comment
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* RIGHT: side cards */}
          <aside className="detail-side">
            <div className="side-card">
              <h3 className="side-card-title">
                <Wrench size={15} />
                Assigned Handler
              </h3>

              {complaint.assignedTo ? (
                <div className="handler-box">
                  <span className="handler-avatar">
                    <User size={18} />
                  </span>
                  <div>
                    <div className="handler-name">{complaint.assignedTo.name}</div>
                    <div className="handler-dept">
                      {complaint.assignedTo.department || 'Department Specialist'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="unassigned-box">
                  <Clock size={20} className="tone-warning" />
                  <div className="unassigned-title">Awaiting assignment</div>
                  <p className="unassigned-desc">
                    Your request is in the department queue. A specialist will be assigned shortly.
                  </p>
                </div>
              )}
            </div>

            <div className="side-card">
              <h3 className="side-card-title">
                <Calendar size={15} />
                Preferences
              </h3>
              <div className="kv-row">
                <span className="kv-label">Access date</span>
                <span className="kv-value">{complaint.accessDate || 'Flexible'}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Time window</span>
                <span className="kv-value">
                  {complaint.timeSlot || ACCESS_TIME_SLOTS[0]}
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Contact via</span>
                <span className="kv-value">
                  {complaint.contactMethod || CONTACT_METHODS[0].id}
                </span>
              </div>
            </div>

            <div className="side-card">
              <h3 className="side-card-title">
                <ShieldCheck size={15} />
                Actions
              </h3>
              <div className="actions-stack">
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopyId}>
                  {copiedId ? <Check size={14} /> : <Copy size={14} />}
                  Share / Copy ID
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const updated = complaintService.getById(complaint.id);
                    if (updated) {
                      setComplaint({ ...updated });
                      showToast('Ticket status refreshed', 'info');
                    }
                  }}
                >
                  <RefreshCw size={14} />
                  Refresh Status
                </button>
              </div>
            </div>
          </aside>
        </div>
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
    </div>
  );
}
