import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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
  Tag,
  Send,
  Lock,
  Calendar,
  MessageSquare,
  Copy,
  Check,
  Building,
  ShieldCheck,
  Share2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import { STATUSES, PRIORITIES, STATUS_LABELS, PRIORITY_LABELS, ROLES } from '../utils/constants';
import { formatDate, formatRelativeTime, getStatusBadgeColor, getPriorityBadgeColor } from '../utils/formatters';

// Define the 5 canonical timeline stages
const TIMELINE_STAGES = [
  { key: 'submitted', label: 'Submitted', desc: 'Ticket registered in system' },
  { key: 'under_review', label: 'Under Review', desc: 'Triage & verification by admin' },
  { key: 'assigned', label: 'Assigned', desc: 'Staff / Department handler assigned' },
  { key: 'in_progress', label: 'In Progress', desc: 'Active repair & resolution in progress' },
  { key: 'resolved', label: 'Resolved', desc: 'Ticket completed & verified' }
];

export default function TicketTracker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, orgKey, currentOrg } = useAuth();
  const { showToast } = useToast();

  const ticketIdParam = searchParams.get('id') || '';

  // Local State
  const [lookupId, setLookupId] = useState(ticketIdParam);
  const [complaint, setComplaint] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [userComplaintsList, setUserComplaintsList] = useState([]);

  // Fetch ticket details when query param changes
  useEffect(() => {
    // Load recent user tickets for quick switcher dropdown
    try {
      const myTickets = complaintService.getAll({
        studentId: user?.id || 'usr_student_1',
      });
      setUserComplaintsList(myTickets);

      // If ID param is specified, get complaint
      if (ticketIdParam) {
        const found = complaintService.getById(ticketIdParam);
        setComplaint(found);
        setLookupId(ticketIdParam);
      } else if (myTickets.length > 0) {
        // Default to first ticket if none specified
        setComplaint(myTickets[0]);
        setLookupId(myTickets[0].id);
        setSearchParams({ id: myTickets[0].id }, { replace: true });
      } else {
        setComplaint(null);
      }
    } catch (err) {
      console.error('Error fetching ticket tracker data:', err);
    }
  }, [ticketIdParam, user]);

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    const found = complaintService.getById(lookupId.trim());
    if (found) {
      setComplaint(found);
      setSearchParams({ id: found.id });
      showToast(`Loaded ticket ${found.id}`, 'info');
    } else {
      showToast(`Ticket ID "${lookupId}" not found. Please check ticket ID.`, 'error');
    }
  };

  const handleCopyId = () => {
    if (!complaint?.id) return;
    navigator.clipboard.writeText(complaint.id);
    setCopiedId(true);
    showToast('Ticket ID copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Determine timeline stage indices based on complaint status
  const currentStageIndex = useMemo(() => {
    if (!complaint) return 0;

    switch (complaint.status) {
      case STATUSES.RESOLVED:
        return 4; // Step 5: Resolved
      case STATUSES.IN_PROGRESS:
        return 3; // Step 4: In Progress
      case STATUSES.PENDING:
      default:
        // Check if assignedTo exists
        if (complaint.assignedTo) {
          return 2; // Step 3: Assigned
        }
        // Check if status history has triage notes
        if (complaint.statusHistory && complaint.statusHistory.length > 1) {
          return 1; // Step 2: Under Review
        }
        return 0; // Step 1: Submitted
    }
  }, [complaint]);

  // Handle adding comment
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !complaint) return;

    setIsPostingComment(true);

    setTimeout(() => {
      try {
        const updatedComplaint = complaintService.addComment(
          complaint.id,
          user || { name: 'Alex Chen', role: ROLES.STUDENT, id: 'usr_student_1' },
          newCommentText.trim(),
          false
        );

        if (updatedComplaint) {
          setComplaint({ ...updatedComplaint });
          setNewCommentText('');
          showToast('Comment added successfully!', 'success');
        }
      } catch (err) {
        console.error('Failed to post comment:', err);
        showToast('Failed to post comment. Please try again.', 'error');
      } finally {
        setIsPostingComment(false);
      }
    }, 400);
  };

  // Filter public comments (hide internal staff notes for student view)
  const publicComments = useMemo(() => {
    if (!complaint?.comments) return [];
    return complaint.comments.filter((c) => !c.isInternal);
  }, [complaint]);

  return (
    <div className="ticket-tracker-page">
      {/* Page Navigation & Ticket Lookup Header */}
      <div className="tracker-top-bar">
        <div className="breadcrumb-nav">
          <Link to="/complaints" className="breadcrumb-link">
            <ArrowLeft size={16} />
            <span>Back to My Complaints</span>
          </Link>
        </div>

        {/* Ticket ID Lookup Form */}
        <form onSubmit={handleLookupSubmit} className="tracker-search-form">
          <div className="tracker-search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="tracker-search-input"
              placeholder="Enter Ticket ID (e.g. CMS-2026-1001)..."
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-secondary btn-sm">
            Lookup Ticket
          </button>

          {userComplaintsList.length > 0 && (
            <select
              className="tracker-select-ticket"
              value={complaint?.id || ''}
              onChange={(e) => {
                const selId = e.target.value;
                if (selId) {
                  setSearchParams({ id: selId });
                }
              }}
            >
              <option value="" disabled>Select from My Tickets</option>
              {userComplaintsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} - {t.title.substring(0, 30)}...
                </option>
              ))}
            </select>
          )}
        </form>
      </div>

      {!complaint ? (
        <div className="empty-state-card mt-8">
          <AlertCircle size={48} className="text-amber-400" />
          <h3 className="empty-title">Ticket Not Found</h3>
          <p className="empty-description">
            No complaint ticket matched the ID "{lookupId}". Please check your ticket ID or pick a complaint from your list.
          </p>
          <Link to="/complaints" className="btn btn-primary">
            View All My Complaints
          </Link>
        </div>
      ) : (
        <div className="tracker-main-layout">
          
          {/* LEFT COLUMN: Timeline & Ticket Details */}
          <div className="tracker-left-col">
            
            {/* Header Ticket Information Card */}
            <div className="tracker-ticket-header-card">
              <div className="ticket-header-top">
                <div className="ticket-id-copy-group">
                  <span className="tracker-ticket-id">{complaint.id}</span>
                  <button
                    type="button"
                    className="btn-copy-id"
                    onClick={handleCopyId}
                    title="Copy Ticket ID"
                  >
                    {copiedId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedId ? 'Copied!' : 'Copy ID'}</span>
                  </button>
                </div>

                <div className="ticket-badges-group">
                  {/* Status Badge */}
                  {(() => {
                    const st = getStatusBadgeColor(complaint.status);
                    return (
                      <span className={`status-badge-chip ${st.bg} ${st.text} ${st.border}`}>
                        <span className={`status-chip-dot ${st.dot}`} />
                        {STATUS_LABELS[complaint.status] || complaint.status}
                      </span>
                    );
                  })()}

                  {/* Priority Badge */}
                  {(() => {
                    const pr = getPriorityBadgeColor(complaint.priority);
                    return (
                      <span className={`priority-badge-chip ${pr.bg} ${pr.text} ${pr.border}`}>
                        {PRIORITY_LABELS[complaint.priority] || complaint.priority}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <h1 className="tracker-ticket-title">{complaint.title}</h1>

              <p className="tracker-ticket-desc">{complaint.description}</p>

              {/* Urgency Justification callout if urgent */}
              {complaint.priority === PRIORITIES.URGENT && complaint.urgencyJustification && (
                <div className="urgency-callout-box">
                  <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
                  <div>
                    <strong>Urgency Justification:</strong> {complaint.urgencyJustification}
                  </div>
                </div>
              )}

              {/* Details grid */}
              <div className="tracker-meta-grid">
                <div className="meta-card">
                  <span className="meta-card-label">Category & Sub</span>
                  <span className="meta-card-value">{complaint.category} {complaint.subCategory ? `• ${complaint.subCategory}` : ''}</span>
                </div>

                <div className="meta-card">
                  <span className="meta-card-label">Location</span>
                  <span className="meta-card-value flex-align">
                    <MapPin size={14} className="text-indigo-400 mr-1" />
                    {complaint.location}
                  </span>
                </div>

                <div className="meta-card">
                  <span className="meta-card-label">Date Submitted</span>
                  <span className="meta-card-value">{formatDate(complaint.createdAt)}</span>
                </div>

                <div className="meta-card">
                  <span className="meta-card-label">Reporter</span>
                  <span className="meta-card-value flex-align">
                    {complaint.isAnonymous ? (
                      <span className="text-amber-400 flex-align">
                        <Lock size={13} className="mr-1" /> Anonymous
                      </span>
                    ) : (
                      <span>{complaint.student?.name || 'Alex Chen'}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Progress Timeline */}
            <div className="timeline-tracker-card">
              <h2 className="card-section-title">
                <Clock size={18} className="title-icon" />
                Live Resolution Timeline
              </h2>

              <div className="timeline-stepper-container">
                {TIMELINE_STAGES.map((stage, idx) => {
                  const isCompleted = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  const isPending = idx > currentStageIndex;

                  // Find log entries matching stage
                  const matchingHistory = (complaint.statusHistory || []).filter((h) => {
                    if (stage.key === 'submitted') return h.status === STATUSES.PENDING && idx === 0;
                    if (stage.key === 'under_review') return h.note?.toLowerCase().includes('review') || h.note?.toLowerCase().includes('triage');
                    if (stage.key === 'assigned') return h.note?.toLowerCase().includes('assign') || complaint.assignedTo;
                    if (stage.key === 'in_progress') return h.status === STATUSES.IN_PROGRESS;
                    if (stage.key === 'resolved') return h.status === STATUSES.RESOLVED;
                    return false;
                  });

                  return (
                    <div
                      key={stage.key}
                      className={`timeline-step-row ${
                        isCompleted ? 'step-completed' : isCurrent ? 'step-current' : 'step-pending'
                      }`}
                    >
                      {/* Step Node Icon & Line */}
                      <div className="step-node-col">
                        <div className="step-node-circle">
                          {isCompleted ? (
                            <CheckCircle2 size={20} className="node-icon completed" />
                          ) : isCurrent ? (
                            <div className="current-pulse-ring">
                              <span className="pulse-dot" />
                            </div>
                          ) : (
                            <span className="pending-node-number">{idx + 1}</span>
                          )}
                        </div>
                        {idx < TIMELINE_STAGES.length - 1 && (
                          <div className={`step-connecting-line ${isCompleted ? 'line-completed' : ''}`} />
                        )}
                      </div>

                      {/* Step Details */}
                      <div className="step-content-col">
                        <div className="step-header">
                          <h4 className="step-title">{stage.label}</h4>
                          {isCurrent && <span className="current-stage-tag">ACTIVE STAGE</span>}
                          {isCompleted && <span className="completed-stage-tag">COMPLETED</span>}
                        </div>
                        <p className="step-desc">{stage.desc}</p>

                        {/* Audit Log entries for this step */}
                        {matchingHistory.length > 0 && (
                          <div className="step-history-notes">
                            {matchingHistory.map((h, hIdx) => (
                              <div key={hIdx} className="history-note-item">
                                <span className="history-by">{h.updatedBy}:</span>
                                <span className="history-text">{h.note}</span>
                                <span className="history-time">{formatRelativeTime(h.timestamp)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Discussion & Comment Thread */}
            <div className="comments-thread-card">
              <h2 className="card-section-title">
                <MessageSquare size={18} className="title-icon" />
                Ticket Discussion & Updates ({publicComments.length})
              </h2>

              <div className="comments-stream">
                {publicComments.length === 0 ? (
                  <div className="no-comments-prompt">
                    <p>No comments posted yet. Use the message box below to post additional information or questions for the handler.</p>
                  </div>
                ) : (
                  publicComments.map((comment) => {
                    const isStaff = comment.senderRole === ROLES.STAFF || comment.senderRole === ROLES.ADMIN;
                    return (
                      <div
                        key={comment.id}
                        className={`comment-bubble-item ${isStaff ? 'staff-comment' : 'user-comment'}`}
                      >
                        <div className="comment-avatar-box">
                          {isStaff ? (
                            <div className="avatar-staff">
                              <Wrench size={16} />
                            </div>
                          ) : (
                            <div className="avatar-user">
                              <User size={16} />
                            </div>
                          )}
                        </div>

                        <div className="comment-body-wrapper">
                          <div className="comment-meta-header">
                            <span className="comment-author">{comment.senderName}</span>
                            <span className={`role-tag-pill ${isStaff ? 'tag-staff' : 'tag-student'}`}>
                              {comment.senderRole?.toUpperCase() || 'USER'}
                            </span>
                            <span className="comment-timestamp">{formatRelativeTime(comment.timestamp)}</span>
                          </div>

                          <div className="comment-text-content">{comment.text}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Comment Input Form */}
              <form onSubmit={handleAddComment} className="add-comment-form">
                <textarea
                  className="comment-input-textarea"
                  rows={3}
                  placeholder="Type an update or comment for the technician..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                />

                <div className="comment-form-actions">
                  <span className="comment-help-text">
                    💬 Replies are visible to assigned department handlers.
                  </span>

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={isPostingComment || !newCommentText.trim()}
                  >
                    {isPostingComment ? (
                      <span className="spinner" />
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Post Comment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* RIGHT COLUMN: Handler & Metadata Panel */}
          <div className="tracker-right-col">
            
            {/* Handler Assignment Card */}
            <div className="tracker-side-card">
              <h3 className="side-card-title">
                <Wrench size={16} className="text-indigo-400" />
                Assigned Service Handler
              </h3>

              {complaint.assignedTo ? (
                <div className="handler-profile-box">
                  <div className="handler-avatar-large">
                    <User size={24} className="text-emerald-400" />
                  </div>
                  <div className="handler-details">
                    <h4 className="handler-name">{complaint.assignedTo.name}</h4>
                    <p className="handler-dept">{complaint.assignedTo.department || 'Department Specialist'}</p>
                    <span className="handler-status-tag text-emerald-400">● Active Handler</span>
                  </div>
                </div>
              ) : (
                <div className="unassigned-box">
                  <Clock size={24} className="text-amber-400 mb-2" />
                  <h4 className="unassigned-title">Pending Staff Assignment</h4>
                  <p className="unassigned-desc">
                    Your request is in the department queue. A specialist will be assigned shortly.
                  </p>
                </div>
              )}
            </div>

            {/* Access & Contact Preferences */}
            <div className="tracker-side-card">
              <h3 className="side-card-title">
                <Calendar size={16} className="text-indigo-400" />
                Preferences & Access Slot
              </h3>

              <div className="side-detail-row">
                <span className="detail-label">Access Date:</span>
                <span className="detail-value">{complaint.accessDate || 'Flexible'}</span>
              </div>

              <div className="side-detail-row">
                <span className="detail-label">Time Window:</span>
                <span className="detail-value">{complaint.timeSlot || 'Morning (8 AM - 12 PM)'}</span>
              </div>

              <div className="side-detail-row">
                <span className="detail-label">Preferred Contact:</span>
                <span className="detail-value">{complaint.contactMethod || 'In-App Notification'}</span>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="tracker-side-card">
              <h3 className="side-card-title">
                <ShieldCheck size={16} className="text-indigo-400" />
                Support & Actions
              </h3>

              <div className="quick-actions-stack">
                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  onClick={handleCopyId}
                >
                  <Share2 size={16} />
                  <span>Share / Copy Ticket ID</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  onClick={() => {
                    const updated = complaintService.getById(complaint.id);
                    if (updated) setComplaint({ ...updated });
                    showToast('Refreshed ticket status', 'info');
                  }}
                >
                  <RefreshCw size={16} />
                  <span>Refresh Ticket Status</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
