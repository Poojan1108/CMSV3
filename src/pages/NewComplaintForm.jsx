import React, { useState, useMemo, useEffect } from 'react';
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
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import { uploadComplaintAttachment } from '../services/supabaseClient';
import { PRIORITIES } from '../utils/constants';
import { getSubCategories, KB_ARTICLES, getQuickLocations, ACCESS_TIME_SLOTS, CONTACT_METHODS } from '../data/taxonomy';
import { Breadcrumb, PageHeader } from '../components/ui';

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MIN_LENGTH = 20;
const MAX_FILE_SIZE_MB = 5;
const DRAFT_STORAGE_KEY = 'cms_complaint_draft_v1';

const PRIORITY_OPTIONS = [
  { key: PRIORITIES.LOW, label: 'Low', sla: '72 hrs', dot: 'var(--app-text-muted)' },
  { key: PRIORITIES.MEDIUM, label: 'Medium', sla: '48 hrs', dot: 'var(--app-text-secondary)' },
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
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deflectionDismissed, setDeflectionDismissed] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // Restore draft on initial mount (Parkinson's Law: Prevent re-entering data)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.title) setTitle(draft.title);
        if (draft.description) setDescription(draft.description);
        if (draft.location) setLocation(draft.location);
        if (draft.category && categories.includes(draft.category)) {
          setCategory(draft.category);
          if (draft.subCategory) setSubCategory(draft.subCategory);
        }
        if (draft.priority) setPriority(draft.priority);
        if (draft.isAnonymous !== undefined) setIsAnonymous(draft.isAnonymous);
        setHasRestoredDraft(true);
        showToast('Restored your previous draft.', 'info');
      }
    } catch (err) {
      console.warn('Could not restore draft:', err);
    }
  }, []);

  // Auto-save draft on user edits
  useEffect(() => {
    try {
      if (title.trim() || description.trim() || location.trim()) {
        const draftPayload = {
          title,
          description,
          location,
          category,
          subCategory,
          priority,
          isAnonymous,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
      }
    } catch (err) {
      console.warn('Could not save draft:', err);
    }
  }, [title, description, location, category, subCategory, priority, isAnonymous]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {}
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setTitle('');
    setDescription('');
    setLocation('');
    setCategory(categories[0] || 'General');
    setSubCategory(getSubCategories(categories[0])[0]);
    setPriority(PRIORITIES.MEDIUM);
    setUrgencyJustification('');
    setIsAnonymous(false);
    setAttachments([]);
    setHasRestoredDraft(false);
    showToast('Draft discarded.', 'info');
  };

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

  // Smart category suggestion based on title/description context (Tesler's Law)
  const suggestedCategory = useMemo(() => {
    if (!title || title.trim().length < 3) return null;
    const lower = `${title} ${description}`.toLowerCase();

    if (/wifi|internet|network|portal|login|laptop|server|lan|vpn|software|email|printer|system/i.test(lower)) {
      return categories.find((c) => /it|wifi|network|software|tech/i.test(c)) || null;
    }
    if (/water|leak|pipe|tap|flush|drain|restroom|toilet|sink|washroom|plumber/i.test(lower)) {
      return categories.find((c) => /hostel|sanitation|maintenance|plumbing/i.test(c)) || null;
    }
    if (/ac|cooling|fan|light|power|switch|fuse|electricity|wiring|generator|heater/i.test(lower)) {
      return categories.find((c) => /electrical|maintenance|facility/i.test(c)) || null;
    }
    if (/food|mess|canteen|meal|snack|cook|kitchen|hygiene|taste|samosa|cater/i.test(lower)) {
      return categories.find((c) => /canteen|mess|food|dining/i.test(c)) || null;
    }
    if (/garbage|trash|clean|dust|pest|insect|smell|bin|dirty/i.test(lower)) {
      return categories.find((c) => /sanitation|clean|housekeeping/i.test(c)) || null;
    }
    if (/desk|chair|table|bed|door|lock|window|cupboard|furniture|wardrobe/i.test(lower)) {
      return categories.find((c) => /hostel|maintenance|furniture/i.test(c)) || null;
    }
    if (/grade|exam|course|professor|faculty|lecture|attendance|marks|scholarship/i.test(lower)) {
      return categories.find((c) => /academic|course|faculty/i.test(c)) || null;
    }
    return null;
  }, [title, description, categories]);

  const quickPills = useMemo(() => getQuickLocations(orgKey), [orgKey]);

  const processFiles = (fileList) => {
    const files = Array.from(fileList || []);
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
        rawSize: file.size,
        type: file.type,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      });
    });

    if (accepted.length) {
      setAttachments((prev) => [...prev, ...accepted]);
      showToast(`Attached ${accepted.length} file${accepted.length > 1 ? 's' : ''}`, 'info');
    }
  };

  const handleFileUpload = (e) => {
    processFiles(e.target.files);
    e.target.value = '';
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e) => {
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

    try {
      // 1. Upload files to Supabase Storage (or high-speed Data URL fallback)
      const uploadedAttachments = await Promise.all(
        attachments.map(async (item) => {
          if (item.file) {
            const uploadRes = await uploadComplaintAttachment(item.file, 'draft');
            return {
              id: uploadRes.id,
              name: uploadRes.name,
              size: item.size,
              type: uploadRes.type,
              url: uploadRes.url,
            };
          }
          return {
            id: item.id,
            name: item.name,
            size: item.size,
            type: item.type,
            url: item.previewUrl || '',
          };
        })
      );

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
        attachmentsCount: uploadedAttachments.length,
        attachmentNames: uploadedAttachments.map((a) => a.name),
        attachments: uploadedAttachments,
        student: { ...reporterProfile, room: location.trim() },
        currentOrg: orgKey,
      });

      if (created?._syncPromise) {
        await created._syncPromise;
      }

      clearDraft();
      showToast(`Ticket ${created.id} submitted successfully`, 'success');
      navigate('/complaints');
    } catch (err) {
      console.error(err);
      showToast('Failed to submit complaint. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keep selected category valid if organization template updates
  useEffect(() => {
    if (categories && categories.length > 0 && !categories.includes(category)) {
      setCategory(categories[0]);
      setSubCategory(getSubCategories(categories[0])[0]);
    }
  }, [categories]);

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

      <form onSubmit={handleSubmit} className="form-stack" style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
        {/* Cluster 1: The Issue & Location (Core Identification) */}
        <div
          className="card card-pad"
          style={{
            padding: 'clamp(14px, 4vw, 22px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--app-border-soft)', paddingBottom: 12 }}>
            <span className="step-num" style={{ background: 'var(--app-accent)', color: '#fff', width: 22, height: 22, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>1</span>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)', margin: 0 }}>The Issue & Location</h2>
          </div>

          <div className="form-group" style={{ width: '100%', minWidth: 0 }}>
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
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <div className="form-help" style={{ flexWrap: 'wrap', gap: 4 }}>
              <span>Be concise — mention the specific defect or room.</span>
              <span className={`char-counter ${title.length >= TITLE_MAX_LENGTH ? 'invalid' : ''}`}>
                {title.length}/{TITLE_MAX_LENGTH}
              </span>
            </div>
          </div>

          {suggestedCategory && suggestedCategory !== category && (
            <button
              type="button"
              className="smart-suggestion-pill"
              onClick={() => {
                handleCategoryChange(suggestedCategory);
                showToast(`Auto-selected department: ${suggestedCategory}`, 'info');
              }}
              title={`Click to auto-switch category to ${suggestedCategory}`}
              style={{ maxWidth: '100%', textAlign: 'left', boxSizing: 'border-box' }}
            >
              <Sparkles size={14} className="sparkle-icon" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Detected department: <strong>{suggestedCategory}</strong> — Tap to apply
              </span>
            </button>
          )}

          {matchedKbArticle && (
            <div className="kb-card" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
              <div className="kb-head">
                <span className="kb-tag">
                  <CheckCircle2 size={14} />
                  Suggested self-help guide
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

              <div className="kb-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    showToast('Glad this guide resolved your issue.', 'success');
                    setTitle('');
                    setDescription('');
                    setDeflectionDismissed(true);
                  }}
                  style={{ flex: '1 1 auto' }}
                >
                  This solved my issue
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setDeflectionDismissed(true)}
                  style={{ flex: '1 1 auto' }}
                >
                  Continue filing ticket
                </button>
              </div>
            </div>
          )}

          <div className="form-grid-2" style={{ width: '100%', minWidth: 0 }}>
            <div className="form-group" style={{ minWidth: 0 }}>
              <label htmlFor="category-select" className="form-label">
                Department / Category<span className="required-mark">*</span>
              </label>
              <select
                id="category-select"
                className="form-select"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ minWidth: 0 }}>
              <label htmlFor="subcategory-select" className="form-label">
                Sub-category<span className="required-mark">*</span>
              </label>
              <select
                id="subcategory-select"
                className="form-select"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                {availableSubCategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ width: '100%', minWidth: 0 }}>
            <label htmlFor="location-input" className="form-label">
              {locationLabel || 'Location / Room'}<span className="required-mark">*</span>
            </label>
            <input
              id="location-input"
              type="text"
              className="form-input"
              placeholder={`e.g. ${quickPills[0] || 'Room 304'}`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
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
        </div>

        {/* Cluster 2: Details & Evidence */}
        <div
          className="card card-pad"
          style={{
            padding: 'clamp(14px, 4vw, 22px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--app-border-soft)', paddingBottom: 12 }}>
            <span className="step-num" style={{ background: 'var(--app-accent)', color: '#fff', width: 22, height: 22, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>2</span>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)', margin: 0 }}>Details & Evidence</h2>
          </div>

          <div className="form-group" style={{ width: '100%', minWidth: 0 }}>
            <label htmlFor="description-textarea" className="form-label">
              Full description<span className="required-mark">*</span>
            </label>
            <textarea
              id="description-textarea"
              className="form-textarea"
              rows={4}
              placeholder="Steps to reproduce, how long the issue has persisted, equipment IDs involved…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <div className="form-help" style={{ flexWrap: 'wrap', gap: 4 }}>
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

          <div className="form-group" style={{ width: '100%', minWidth: 0 }}>
            <label className="form-label">Priority Level & SLA Target</label>
            <div className="priority-grid" role="radiogroup" aria-label="Priority level" style={{ width: '100%', minWidth: 0 }}>
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
                  <span className="priority-sla">Target: {option.sla}</span>
                </label>
              ))}
            </div>

            {priority === PRIORITIES.URGENT && (
              <div
                className="callout callout-danger"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  marginTop: 12,
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, color: 'var(--app-danger)' }} />
                  <span className="callout-title" style={{ margin: 0, fontWeight: 600 }}>
                    Urgency justification required
                  </span>
                </div>
                <div className="form-group" style={{ marginTop: 8, width: '100%', minWidth: 0 }}>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Explain why immediate dispatch is required (active leak, safety hazard, power failure…)"
                    value={urgencyJustification}
                    onChange={(e) => setUrgencyJustification(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      minWidth: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      display: 'block',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="form-group" style={{ width: '100%', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Supporting Media & Photos (Optional)</label>
              <span style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>Up to {MAX_FILE_SIZE_MB}MB</span>
            </div>
            <div
              className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer?.files?.length) {
                  processFiles(e.dataTransfer.files);
                }
              }}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                ...(isDragging
                  ? { borderColor: 'var(--app-accent)', background: 'var(--app-card-bg-subtle)' }
                  : {}),
              }}
            >
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                aria-label="Upload files"
              />
              <Upload size={22} className="tone-accent" />
              <div className="dropzone-title">
                {isDragging ? 'Drop images here to attach' : 'Tap to attach photos or click to browse'}
              </div>
              <div className="dropzone-subtitle">
                Clear photos of physical damage, water leaks, or hardware faults
              </div>
            </div>

            {attachments.length > 0 && (
              <div
                className="attachments-grid"
                style={{
                  marginTop: 12,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
                  gap: 10,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="attachment-item"
                    style={{
                      border: '1px solid var(--app-border-soft)',
                      borderRadius: 10,
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'var(--app-card-bg)',
                      minWidth: 0,
                      boxSizing: 'border-box',
                    }}
                  >
                    {file.previewUrl ? (
                      <img
                        src={file.previewUrl}
                        alt=""
                        className="attachment-thumb"
                        style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--app-border-soft)', flexShrink: 0 }}
                      />
                    ) : (
                      <span className="attachment-fallback" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--app-card-bg-subtle)', borderRadius: 8, flexShrink: 0 }}>
                        <FileCheck size={18} />
                      </span>
                    )}
                    <span className="attachment-meta" style={{ flex: 1, minWidth: 0 }}>
                      <span className="attachment-name" style={{ fontWeight: 600, fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </span>
                      <span className="attachment-size" style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>
                        {file.size} {file.previewUrl ? '• Photo' : ''}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => removeAttachment(file.id)}
                      aria-label={`Remove ${file.name}`}
                      style={{ color: 'var(--app-danger)', padding: 6, flexShrink: 0 }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cluster 3: Access Window & Privacy Preferences */}
        <div
          className="card card-pad"
          style={{
            padding: 'clamp(14px, 4vw, 22px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--app-border-soft)', paddingBottom: 12 }}>
            <span className="step-num" style={{ background: 'var(--app-accent)', color: '#fff', width: 22, height: 22, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>3</span>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)', margin: 0 }}>Access Window & Privacy</h2>
          </div>

          <div className="form-grid-2" style={{ width: '100%', minWidth: 0 }}>
            <div className="form-group" style={{ minWidth: 0 }}>
              <label htmlFor="access-date" className="form-label">
                Preferred inspection date
              </label>
              <input
                id="access-date"
                type="date"
                className="form-input"
                value={accessDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setAccessDate(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-group" style={{ minWidth: 0 }}>
              <span className="form-label">Preferred inspection window</span>
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

          <div className="toggle-card" style={{ marginTop: 4, width: '100%', boxSizing: 'border-box' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="toggle-title">Submit anonymously</div>
              <div className="toggle-subtitle">
                Hide your identity from department technicians handling this ticket.
              </div>
            </div>
            <label className="switch" style={{ flexShrink: 0 }}>
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
        </div>

        {/* Action Footer */}
        <div
          className="form-footer"
          style={{
            marginTop: 16,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isSubmitting}
            style={{ width: '100%', minHeight: '44px', height: '44px' }}
          >
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
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/complaints')}
            disabled={isSubmitting}
            style={{ width: '100%', minHeight: '42px', height: '42px' }}
          >
            Cancel
          </button>
          {(title.trim() || description.trim() || location.trim() || hasRestoredDraft) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleDiscardDraft}
              disabled={isSubmitting}
              title="Clear all saved draft fields"
              style={{ width: '100%', padding: '8px 0' }}
            >
              <RotateCcw size={14} />
              Discard Draft
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
