import React, { useState } from 'react';
import {
  Camera,
  Maximize2,
  FileText,
  MessageSquare,
  Lock,
  ChevronRight,
  Shield,
  Clock,
  User,
  MapPin,
  X,
} from 'lucide-react';
import { STATUSES, STATUS_LABELS, ROLES } from '../../utils/constants';
import { formatRelativeTime, getSlaStatus } from '../../utils/formatters';
import {
  Modal,
  StatusBadge,
  PriorityBadge,
  SlaBadge,
  TicketId,
  Tag,
} from '../ui';

/**
 * TicketDetailModal
 *
 * Decoupled, high-performance ticket inspection modal.
 * Follows the Component Isolation Pattern (Plane / Linear standard).
 * Co-locates draft input states (internal notes, status remarks, lightbox)
 * locally within the modal to guarantee ZERO re-renders on the parent triage queue.
 */
export default React.memo(function TicketDetailModal({
  ticket,
  onClose,
  onQuickStatus,
  onAddInternalNote,
  onStatusSubmit,
  navigate,
  readOnly = false,
}) {
  const [commentTab, setCommentTab] = useState('all');
  const [selectedLightboxImage, setSelectedLightboxImage] = useState(null);
  const [internalNote, setInternalNote] = useState('');
  const [statusNote, setStatusNote] = useState('');

  if (!ticket) return null;

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

  const handleInternalNoteSubmit = (e) => {
    e.preventDefault();
    if (!internalNote.trim()) return;
    if (typeof onAddInternalNote === 'function') {
      onAddInternalNote(e, internalNote.trim());
    }
    setInternalNote('');
  };

  const handleStatusWithNoteSubmit = (e, newStatus) => {
    e.preventDefault();
    if (typeof onStatusSubmit === 'function') {
      onStatusSubmit(e, newStatus, statusNote.trim());
    }
    setStatusNote('');
  };

  return (
    <Modal
      title={ticket.title}
      subtitle={ticket.id}
      onClose={onClose}
      maxWidth={860}
      footer={
        readOnly ? null : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ minHeight: 38, height: 38 }}
                onClick={() => {
                  onQuickStatus(ticket.id, STATUSES.IN_PROGRESS, statusNote.trim() || 'Started working on issue.');
                  setStatusNote('');
                }}
              >
                Mark In Progress
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ minHeight: 38, height: 38 }}
                onClick={() => {
                  onQuickStatus(ticket.id, STATUSES.RESOLVED, statusNote.trim() || 'Resolution completed.');
                  setStatusNote('');
                }}
              >
                Mark Resolved
              </button>
            </div>
          </div>
        )
      }
    >
      {/* Badges row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <TicketId id={ticket.id} />
        <PriorityBadge priority={ticket.priority} />
        <StatusBadge status={ticket.status} />
        <SlaBadge sla={sla} showIcon={false} />
      </div>

      {/* Overview grid */}
      <div className="meta-grid" style={{ width: '100%', minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <span className="meta-cell-label">Reporter</span>
          <span className="meta-cell-value" style={{ wordBreak: 'break-word' }}>
            {ticket.isAnonymous || ticket.anonymous ? 'Anonymous' : (ticket.student?.name || ticket.reporter?.name || '—')}
          </span>
          {(ticket.student?.identifier || ticket.student?.rollNo || ticket.student?.empId || ticket.student?.unit) && !ticket.isAnonymous && (
            <span className="cell-sub" style={{ display: 'block', wordBreak: 'break-word' }}>
              {ticket.student?.identifier || ticket.student?.rollNo || ticket.student?.empId || ticket.student?.unit}
            </span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <span className="meta-cell-label">Location</span>
          <span className="meta-cell-value" style={{ wordBreak: 'break-word' }}>{ticket.location || '—'}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <span className="meta-cell-label">Handler</span>
          <span className="meta-cell-value" style={{ wordBreak: 'break-word' }}>
            {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
          </span>
          {ticket.assignedTo?.department && (
            <span className="cell-sub" style={{ display: 'block', wordBreak: 'break-word' }}>
              {ticket.assignedTo.department}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="resolution-summary" style={{ margin: 0, wordBreak: 'break-word' }}>
        <p className="resolution-summary-text" style={{ wordBreak: 'break-word', margin: 0 }}>{ticket.description}</p>
      </div>

      {/* Attached Media & Photo Evidence */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div style={{ margin: '12px 0', width: '100%', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <h4 className="section-heading" style={{ margin: 0, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Camera size={14} className="tone-accent" />
              Photo Evidence ({ticket.attachments.length})
            </h4>
            <span style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>Click to inspect full size</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 115px), 1fr))', gap: 8, width: '100%', minWidth: 0 }}>
            {ticket.attachments.map((att, idx) => (
              <div
                key={att.id || idx}
                onClick={() => setSelectedLightboxImage(att)}
                style={{
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid var(--app-border-soft)',
                  background: 'var(--app-card-bg-subtle)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                className="photo-card-hover"
                title={`Inspect ${att.name || 'photo'}`}
              >
                {att.url ? (
                  <div style={{ width: '100%', height: 82, position: 'relative' }}>
                    <img
                      src={att.url}
                      alt={att.name || 'Evidence'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        padding: '1px 5px',
                        borderRadius: 3,
                        fontSize: 9,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Maximize2 size={9} /> View
                    </span>
                  </div>
                ) : (
                  <div style={{ height: 82, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} className="tone-muted" />
                  </div>
                )}
                <div style={{ padding: '4px 6px' }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--app-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {att.name || `Photo ${idx + 1}`}
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--app-text-muted)' }}>
                    {att.size || 'Attached'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status audit log */}
      <div style={{ width: '100%', minWidth: 0 }}>
        <h4 className="section-heading" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Clock size={14} className="tone-accent" />
          Audit Log
        </h4>
        <div className="history-notes" style={{ marginTop: 0, width: '100%', minWidth: 0 }}>
          {ticket.statusHistory?.length ? (
            ticket.statusHistory.map((item, idx) => (
              <div key={idx} className="history-note" style={{ flexWrap: 'wrap', gap: 6 }}>
                <span className="history-author" style={{ flexShrink: 0 }}>{item.updatedBy}</span>
                <span style={{ minWidth: 0, flex: 1, wordBreak: 'break-word' }}>
                  <strong>{STATUS_LABELS[item.status] || item.status}</strong> — {item.note}
                </span>
                <span className="history-time" style={{ flexShrink: 0 }}>{formatRelativeTime(item.timestamp)}</span>
              </div>
            ))
          ) : (
            <p className="no-comments">No status history available.</p>
          )}
        </div>
      </div>

      {/* Comments with tabs */}
      <div style={{ width: '100%', minWidth: 0 }}>
        <div className="card-header" style={{ marginBottom: 12, paddingBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <h4 className="section-heading" style={{ margin: 0 }}>
            <MessageSquare size={15} />
            Activity ({comments.length})
          </h4>

          <div className="segmented" style={{ maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', display: 'inline-flex', alignItems: 'center', gap: 3, background: 'var(--app-inset, #f1f5f9)', padding: 3, borderRadius: 8, border: '1px solid var(--app-border-soft, #e2e8f0)' }}>
            <button
              type="button"
              className={commentTab === 'all' ? 'is-active' : ''}
              onClick={() => setCommentTab('all')}
              style={{
                background: commentTab === 'all' ? '#0f172a' : 'transparent',
                color: commentTab === 'all' ? '#ffffff' : '#64748b',
                fontWeight: commentTab === 'all' ? 600 : 500,
                border: 'none',
                borderRadius: 6,
                padding: '4px 11px',
                fontSize: 11.5,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All ({comments.length})
            </button>
            <button
              type="button"
              className={commentTab === 'public' ? 'is-active' : ''}
              onClick={() => setCommentTab('public')}
              style={{
                background: commentTab === 'public' ? '#0f172a' : 'transparent',
                color: commentTab === 'public' ? '#ffffff' : '#64748b',
                fontWeight: commentTab === 'public' ? 600 : 500,
                border: 'none',
                borderRadius: 6,
                padding: '4px 11px',
                fontSize: 11.5,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Public ({publicComments.length})
            </button>
            <button
              type="button"
              className={commentTab === 'internal' ? 'is-active' : ''}
              onClick={() => setCommentTab('internal')}
              style={{
                background: commentTab === 'internal' ? '#0f172a' : 'transparent',
                color: commentTab === 'internal' ? '#ffffff' : '#64748b',
                fontWeight: commentTab === 'internal' ? 600 : 500,
                border: 'none',
                borderRadius: 6,
                padding: '4px 11px',
                fontSize: 11.5,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Internal ({internalComments.length})
            </button>
          </div>
        </div>

        <div className="comments-list" style={{ maxHeight: 220, width: '100%', minWidth: 0 }}>
          {displayedComments.length === 0 ? (
            <p className="no-comments">No comments in this tab.</p>
          ) : (
            displayedComments.map((c) => {
              const authorName = c.senderName || c.sender?.name || 'User';
              const authorRole = (c.senderRole || c.sender?.role || 'user').toLowerCase();
              const timeVal = c.timestamp || c.createdAt;
              const isStaffOrAdmin = authorRole === ROLES.STAFF || authorRole === ROLES.ADMIN || authorRole === 'staff' || authorRole === 'admin';
              const roleDisplay = authorRole === ROLES.ADMIN || authorRole === 'admin' ? 'ADMIN' : isStaffOrAdmin ? 'STAFF' : 'REPORTER';

              return (
                <div key={c.id || `${authorName}-${timeVal}`} className="comment-row" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    className={`comment-avatar ${c.isInternal || isStaffOrAdmin ? 'staff' : 'user'}`}
                    style={{
                      flexShrink: 0,
                      marginTop: 2,
                      background: c.isInternal ? '#0f172a' : isStaffOrAdmin ? '#334155' : '#f1f5f9',
                      color: isStaffOrAdmin || c.isInternal ? '#ffffff' : '#334155',
                    }}
                  >
                    {c.isInternal ? <Lock size={13} /> : <MessageSquare size={13} />}
                  </span>
                  <div
                    className="comment-bubble"
                    style={{
                      minWidth: 0,
                      wordBreak: 'break-word',
                      ...(c.isInternal
                        ? { borderColor: '#94a3b8', background: '#f8fafc' }
                        : { borderColor: '#e2e8f0', background: '#ffffff' }),
                    }}
                  >
                    <div className="comment-meta" style={{ flexWrap: 'wrap', gap: 6 }}>
                      <span className="comment-author" style={{ fontWeight: 600, color: '#0f172a' }}>
                        {authorName}
                      </span>
                      <span
                        className="comment-role"
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: isStaffOrAdmin ? '#0f172a' : '#f1f5f9',
                          color: isStaffOrAdmin ? '#ffffff' : '#475569',
                          border: isStaffOrAdmin ? 'none' : '1px solid #cbd5e1',
                        }}
                      >
                        {roleDisplay}
                      </span>
                      {c.isInternal && (
                        <span
                          className="comment-role"
                          style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: '#334155',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Lock size={9} style={{ flexShrink: 0 }} />
                          <span>INTERNAL NOTE</span>
                        </span>
                      )}
                      <span className="comment-time" style={{ color: '#64748b' }}>
                        {formatRelativeTime(timeVal)}
                      </span>
                    </div>
                    <p className="comment-text" style={{ wordBreak: 'break-word', margin: 0, color: '#1e293b' }}>
                      {c.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Internal note form */}
        {!readOnly && (
          <form onSubmit={handleInternalNoteSubmit} className="comment-form" style={{ width: '100%', boxSizing: 'border-box' }}>
            <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, fontSize: 12.5, fontWeight: 600 }}>
              <Lock size={12} style={{ flexShrink: 0 }} className="tone-accent" />
              <span>Post internal audit note</span>
            </label>
            <div className="inline-note-row" style={{ display: 'flex', gap: 8, width: '100%', boxSizing: 'border-box' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Log internal action, parts required…"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                style={{ flex: 1, minWidth: 0, height: 38 }}
              />
              <button
                type="submit"
                className="btn btn-sm btn-secondary"
                disabled={!internalNote.trim()}
                style={{
                  flexShrink: 0,
                  height: 38,
                  padding: '0 14px',
                  border: '1px solid var(--app-border-strong, #cbd5e1)',
                  background: internalNote.trim() ? '#0f172a' : 'var(--app-raised, #ffffff)',
                  color: internalNote.trim() ? '#ffffff' : 'var(--app-text-muted, #94a3b8)',
                  fontWeight: 600,
                  cursor: internalNote.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease',
                }}
              >
                Log Note
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Optional resolution note before marking resolved */}
      {!readOnly && (
        <div className="form-group" style={{ width: '100%', boxSizing: 'border-box' }}>
          <label htmlFor="modal-status-note" className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <FileText size={13} className="tone-accent" />
            <span>Resolution / status note (attached when you mark a status below)</span>
          </label>
          <textarea
            id="modal-status-note"
            className="form-textarea"
            rows={2}
            placeholder="Optional context saved with the next status change…"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={(e) => handleStatusWithNoteSubmit(e, STATUSES.RESOLVED)}
              style={{ minHeight: 38, height: 38 }}
            >
              Submit Resolution with Note
            </button>
          </div>
        </div>
      )}

      {/* Photo Evidence Lightbox Modal */}
      {selectedLightboxImage && (
        <Modal
          title={selectedLightboxImage.name || 'Inspection Photo Evidence'}
          subtitle={selectedLightboxImage.size ? `Attached file size: ${selectedLightboxImage.size}` : 'High-resolution photo evidence'}
          onClose={() => setSelectedLightboxImage(null)}
          maxWidth={760}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--app-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Staff Inspection View · {ticket.id}
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedLightboxImage.url && (
                  <a
                    href={selectedLightboxImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ minHeight: 36, height: 36, display: 'inline-flex', alignItems: 'center' }}
                  >
                    Open Full Size
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ minHeight: 36, height: 36 }}
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
    </Modal>
  );
});
