import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Shield,
  Clock,
  MapPin,
  AlertTriangle,
  FileText,
  Upload,
  X,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  Trash2,
  FileCheck,
  Lock,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import { PRIORITIES } from '../utils/constants';
import { getSubCategories, KB_ARTICLES, getQuickLocations, ACCESS_TIME_SLOTS, CONTACT_METHODS } from '../data/taxonomy';
import { Breadcrumb, PageHeader } from '../components/ui';

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MIN_LENGTH = 20;
const MAX_FILE_SIZE_MB = 5;

const PRIORITY_OPTIONS = [
  { key: PRIORITIES.LOW, label: 'Low', sla: '72 hrs', dot: 'var(--app-text-muted)' },
  { key: PRIORITIES.MEDIUM, label: 'Medium', sla: '48 hrs', dot: 'var(--app-info)' },
  { key: PRIORITIES.HIGH, label: 'High', sla: '24 hrs', dot: 'var(--app-warning)' },
  { key: PRIORITIES.URGENT, label: 'Urgent', sla: '4 hrs', dot: 'var(--app-danger)' },
];

export default function NewComplaintForm() {
  const navigate = useNavigate();
  const { user, currentOrg, categories, locationLabel, orgKey } = useAuth();
  const { showToast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0] || 'General');
  const [subCategory, setSubCategory] = useState(() => getSubCategories(categories[0])[0]);
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState(PRIORITIES.MEDIUM);
  const [urgencyJustification, setUrgencyJustification] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [accessDate, setAccessDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState(ACCESS_TIME_SLOTS[0]);
  const [contactMethod, setContactMethod] = useState(CONTACT_METHODS[0].id);
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deflectionDismissed, setDeflectionDismissed] = useState(false);

  const availableSubCategories = useMemo(() => getSubCategories(category), [category]);

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setSubCategory(getSubCategories(newCategory)[0]);
  };

  // Knowledge-base deflection match
  const matchedKbArticle = useMemo(() => {
    if (deflectionDismissed || !title || title.trim().length < 4) return null;
    const lowerTitle = title.toLowerCase();
    return KB_ARTICLES.find((art) => art.keywords.some((kw) => lowerTitle.includes(kw))) || null;
  }, [title, deflectionDismissed]);

  const quickPills = useMemo(() => getQuickLocations(orgKey), [orgKey]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    const accepted = [];

    files.forEach((file) => {
      if (file.size > maxSizeBytes) {
        showToast(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit`, 'warning');
        return;
      }
      accepted.push({
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      });
    });

    if (accepted.length) {
      setAttachments((prev) => [...prev, ...accepted]);
      showToast(`Attached ${accepted.length} file${accepted.length > 1 ? 's' : ''}`, 'info');
    }
    e.target.value = '';
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter a complaint summary.', 'error');
      return;
    }
    if (description.trim().length < DESCRIPTION_MIN_LENGTH) {
      showToast(`Description must be at least ${DESCRIPTION_MIN_LENGTH} characters.`, 'error');
      return;
    }
    if (!location.trim()) {
      showToast(`Please specify the ${locationLabel?.toLowerCase() || 'location'}.`, 'error');
      return;
    }
    if (priority === PRIORITIES.URGENT && !urgencyJustification.trim()) {
      showToast('Please justify why this issue is urgent.', 'error');
      return;
    }

    setIsSubmitting(true);

    // Simulated network latency for realistic submit feedback
    setTimeout(() => {
      try {
        const reporterProfile = isAnonymous
          ? {
              id: user?.id,
              name: 'Anonymous',
              email: null,
              rollNo: null,
            }
          : {
              id: user?.id,
              name: user?.name || 'User',
              email: user?.email || null,
              rollNo: user?.rollNo || null,
            };

        const created = complaintService.create({
          title: title.trim(),
          description: description.trim(),
          category,
          subCategory,
          location: location.trim(),
          priority,
          urgencyJustification:
            priority === PRIORITIES.URGENT ? urgencyJustification.trim() : null,
          isAnonymous,
          accessDate,
          timeSlot,
          contactMethod,
          attachmentsCount: attachments.length,
          attachmentNames: attachments.map((a) => a.name),
          student: { ...reporterProfile, room: location.trim() },
          currentOrg: orgKey,
        });

        showToast(`Ticket ${created.id} submitted successfully`, 'success');
        navigate('/complaints');
      } catch (err) {
        console.error(err);
        showToast('Failed to submit complaint. Please try again.', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }, 500);
  };

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumb={
          <Breadcrumb to="/complaints" onNavigate={() => navigate('/complaints')}>
            <ArrowLeft size={15} />
            Back to My Complaints
          </Breadcrumb>
        }
        eyebrow={currentOrg?.name}
        icon={<Shield size={12} />}
        title="Lodge New Complaint"
        description={`Submit a formal service ticket to ${currentOrg?.name || 'your organization'}. Requests are triaged under SLA guidelines.`}
      />

      <form onSubmit={handleSubmit} className="card card-pad" style={{ padding: 24 }}>
        {/* 1. Summary */}
        <section className="form-section">
          <h2 className="section-heading">
            <span className="step-num">1</span>
            <FileText size={16} />
            Summary
          </h2>

          <div className="form-group">
            <label htmlFor="complaint-title" className="form-label">
              Short summary<span className="required-mark">*</span>
            </label>
            <input
              id="complaint-title"
              type="text"
              className="form-input"
              placeholder="e.g. Water leakage under the sink in Block B 304"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDeflectionDismissed(false);
              }}
              maxLength={TITLE_MAX_LENGTH}
              required
            />
            <div className="form-help">
              <span>Be concise — mention the specific defect or symptom.</span>
              <span className={`char-counter ${title.length >= TITLE_MAX_LENGTH ? 'invalid' : ''}`}>
                {title.length}/{TITLE_MAX_LENGTH}
              </span>
            </div>
          </div>

          {matchedKbArticle && (
            <div className="kb-card">
              <div className="kb-head">
                <span className="kb-tag">
                  <CheckCircle2 size={14} />
                  Suggested self-help
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setDeflectionDismissed(true)}
                  aria-label="Dismiss suggestion"
                >
                  <X size={15} />
                </button>
              </div>

              <h3 className="kb-article-title">{matchedKbArticle.title}</h3>
              <p className="kb-article-body">{matchedKbArticle.solution}</p>

              <div className="kb-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    showToast('Glad this guide resolved your issue.', 'success');
                    setTitle('');
                    setDescription('');
                    setDeflectionDismissed(true);
                  }}
                >
                  This solved my issue
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setDeflectionDismissed(true)}
                >
                  Continue filing ticket
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 2. Category */}
        <section className="form-section">
          <h2 className="section-heading">
            <span className="step-num">2</span>
            <HelpCircle size={16} />
            Category
          </h2>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="category-select" className="form-label">
                Department / Category<span className="required-mark">*</span>
              </label>
              <select
                id="category-select"
                className="form-select"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="subcategory-select" className="form-label">
                Sub-category<span className="required-mark">*</span>
              </label>
              <select
                id="subcategory-select"
                className="form-select"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
              >
                {availableSubCategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 3. Location */}
        <section className="form-section">
          <h2 className="section-heading">
            <span className="step-num">3</span>
            <MapPin size={16} />
            Location
          </h2>

          <div className="form-group">
            <label htmlFor="location-input" className="form-label">
              {locationLabel || 'Location'}
              <span className="required-mark">*</span>
            </label>
            <input
              id="location-input"
              type="text"
              className="form-input"
              placeholder={`e.g. ${quickPills[0]}`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />

            <div className="quick-pills">
              <span className="pills-caption">Quick select:</span>
              {quickPills.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  className={`choice-pill ${location === pill ? 'is-active' : ''}`}
                  onClick={() => setLocation(pill)}
                >
                  <MapPin size={11} />
                  {pill}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Priority */}
        <section className="form-section">
          <h2 className="section-heading">
            <span className="step-num">4</span>
            <AlertTriangle size={16} />
            Priority
          </h2>

          <div className="priority-grid" role="radiogroup" aria-label="Priority level">
            {PRIORITY_OPTIONS.map((option) => (
              <label
                key={option.key}
                className={`priority-option ${priority === option.key ? 'is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={option.key}
                  checked={priority === option.key}
                  onChange={() => setPriority(option.key)}
                  className="sr-only"
                />
                <span className="priority-option-head">
                  <span className="priority-dot" style={{ background: option.dot }} />
                  <span className="priority-name">{option.label}</span>
                </span>
                <span className="priority-sla">Target resolution within {option.sla}</span>
              </label>
            ))}
          </div>

          {priority === PRIORITIES.URGENT && (
            <div className="callout callout-danger" style={{ flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <AlertTriangle size={16} />
                <div style={{ flex: 1 }}>
                  <span className="callout-title">Urgency justification required</span>
                  <div className="form-group" style={{ marginTop: 8 }}>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="Explain why immediate dispatch is required (safety risk, active leak, sparking…)"
                      value={urgencyJustification}
                      onChange={(e) => setUrgencyJustification(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 5. Description */}
        <section className="form-section">
          <h2 className="section-heading">
            <span className="step-num">5</span>
            <FileText size={16} />
            Description
          </h2>

          <div className="form-group">
            <label htmlFor="description-textarea" className="form-label">
              Full description<span className="required-mark">*</span>
            </label>
            <textarea
              id="description-textarea"
              className="form-textarea"
              rows={5}
              placeholder="Steps to reproduce, how long the issue has persisted, equipment IDs involved…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <div className="form-help">
              <span>Minimum {DESCRIPTION_MIN_LENGTH} characters.</span>
              <span
                className={`char-counter ${
                  description.length >= DESCRIPTION_MIN_LENGTH ? 'valid' : 'invalid'
                }`}
              >
                {description.length >= DESCRIPTION_MIN_LENGTH && <CheckCircle2 size={13} />}
                {description.length}/{DESCRIPTION_MIN_LENGTH} min
              </span>
            </div>
          </div>
        </section>

        {/* 6. Privacy */}
        <section className="form-section">
          <h2 className="section-heading">
            <span className="step-num">6</span>
            <Lock size={16} />
            Privacy
          </h2>

          <div className="toggle-card">
            <div>
              <div className="toggle-title">Submit anonymously</div>
              <div className="toggle-subtitle">
                Hide your identity from staff and department queues handling this ticket.
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span className="switch-track" />
              <span className="switch-thumb" />
              <span className="sr-only">Submit anonymously</span>
            </label>
          </div>

          {isAnonymous && (
            <div className="callout callout-warning">
              <Shield size={16} />
              <div>
                <span className="callout-title">Confidential filing active</span>
                Your name and contact details will be redacted on staff screens. Only compliance
                administrators can access identity audit logs when legally required.
              </div>
            </div>
          )}
        </section>

        {/* 7. Access slot */}
        <section className="form-section">
          <h2 className="section-heading">
            <span className="step-num">7</span>
            <Clock size={16} />
            Inspection Access
          </h2>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="access-date" className="form-label">
                Preferred date
              </label>
              <input
                id="access-date"
                type="date"
                className="form-input"
                value={accessDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setAccessDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <span className="form-label">Preferred time window</span>
              <div className="quick-pills">
                {ACCESS_TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`choice-pill ${timeSlot === slot ? 'is-active' : ''}`}
                    onClick={() => setTimeSlot(slot)}
                  >
                    <Clock size={11} />
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 8. Attachments */}
        <section className="form-section">
          <h2 className="section-heading">
            <span className="step-num">8</span>
            <Upload size={16} />
            Attachments
          </h2>

          <div className="dropzone">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              aria-label="Upload files"
            />
            <Upload size={22} className="tone-accent" />
            <div className="dropzone-title">Click to upload photos or documents</div>
            <div className="dropzone-subtitle">
              JPG, PNG, PDF, DOC — max {MAX_FILE_SIZE_MB}MB per file
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="attachments-grid">
              {attachments.map((file) => (
                <div key={file.id} className="attachment-item">
                  {file.previewUrl ? (
                    <img src={file.previewUrl} alt="" className="attachment-thumb" />
                  ) : (
                    <span className="attachment-fallback">
                      <FileCheck size={17} />
                    </span>
                  )}
                  <span className="attachment-meta">
                    <span className="attachment-name">{file.name}</span>
                    <span className="attachment-size">{file.size}</span>
                  </span>
                  <button
                    type="button"
                    className="attachment-remove"
                    onClick={() => removeAttachment(file.id)}
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 9. Contact */}
        <section className="form-section">
          <h2 className="section-heading">
            <span className="step-num">9</span>
            <MessageSquare size={16} />
            Contact Preference
          </h2>

          <div className="contact-grid" role="radiogroup" aria-label="Preferred contact method">
            {CONTACT_METHODS.map((method) => (
              <label
                key={method.id}
                className={`contact-option ${contactMethod === method.id ? 'is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="contactMethod"
                  value={method.id}
                  checked={contactMethod === method.id}
                  onChange={() => setContactMethod(method.id)}
                  className="sr-only"
                />
                <div className="contact-option-name">{method.label}</div>
                <div className="contact-option-desc">{method.desc}</div>
              </label>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="form-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/complaints')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner" />
                Submitting…
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                Submit Complaint
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
