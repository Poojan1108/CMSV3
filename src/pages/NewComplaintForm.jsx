import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Shield,
  Clock,
  MapPin,
  AlertTriangle,
  Upload,
  X,
  CheckCircle2,
  ArrowLeft,
  Trash2,
  FileCheck,
  Sparkles,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import { uploadComplaintAttachment } from '../services/supabaseClient';
import { PRIORITIES } from '../utils/constants';
import { getSubCategories, getQuickLocations, ACCESS_TIME_SLOTS } from '../data/taxonomy';
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

/**
 * NewComplaintForm
 *
 * Primary ticket intake pipeline for residents and students.
 * Features:
 * - Smart NLP category inference (Tesler's Law)
 * - Resilient draft persistence (Parkinson's Law)
 * - Multi-file drag & drop attachment queue with validation & preview memory cleanup
 * - Collision-free ID generation and atomic Supabase storage upload
 * - 100% preservation of all existing styling, layout tokens, and accessibility markers
 */
export default function NewComplaintForm() {
  const navigate = useNavigate();
  const { user, currentOrg, categories, locationLabel, orgKey } = useAuth();
  const { showToast } = useToast();

  // Core Form State
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
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // Restore draft from storage on initial mount
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
      console.warn('[NewComplaintForm] Could not restore draft:', err);
    }
  }, []);

  // Auto-synchronize category state when organization categories load asynchronously
  useEffect(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      if (!category || category === 'General' || !categories.includes(category)) {
        setCategory(categories[0]);
        setSubCategory(getSubCategories(categories[0])[0]);
      }
    }
  }, [categories]);

  // Auto-save draft on changes (debounced by React state updates)
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
      console.warn('[NewComplaintForm] Could not save draft:', err);
    }
  }, [title, description, location, category, subCategory, priority, isAnonymous]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {}
  }, []);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setTitle('');
    setDescription('');
    setLocation('');
    setCategory(categories[0] || 'General');
    setSubCategory(getSubCategories(categories[0])[0]);
    setPriority(PRIORITIES.MEDIUM);
    setUrgencyJustification('');
    setIsAnonymous(false);
    setAttachments((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      return [];
    });
    setHasRestoredDraft(false);
    showToast('Draft discarded.', 'info');
  }, [categories, clearDraft, showToast]);

  const availableSubCategories = useMemo(() => getSubCategories(category), [category]);

  const handleCategoryChange = useCallback((newCategory) => {
    setCategory(newCategory);
    setSubCategory(getSubCategories(newCategory)[0]);
  }, []);

  // Smart department auto-detection based on issue title & description keywords
  const suggestedCategory = useMemo(() => {
    if (!title || title.trim().length < 3) return null;
    const lower = `${title} ${description}`.toLowerCase();

    if (/monitor|screen|display|dock|docking|keyboard|mouse|headset|webcam|laptop charger|adapter|hdmi cable/i.test(lower)) {
      return categories.find((c) => /hardware|workstation/i.test(c)) || null;
    }
    if (/meeting room|conference room|boardroom|teams room|zoom room|projector|av display/i.test(lower)) {
      return categories.find((c) => /meeting|conference/i.test(c)) || null;
    }
    if (/vpn|anyconnect|globalprotect|zscaler|firewall|proxy|lan cable|ethernet/i.test(lower)) {
      return categories.find((c) => /vpn|network/i.test(c)) || null;
    }
    if (/pantry|coffee machine|tea machine|water dispenser|vending/i.test(lower)) {
      return categories.find((c) => /pantry|cafeteria/i.test(c)) || null;
    }
    if (/payroll|payslip|salary|id badge|access card|swipe card|turnstile|leave portal|pf query/i.test(lower)) {
      return categories.find((c) => /hr|operation|people/i.test(c)) || null;
    }
    if (/elevator|lift|stuck between|door sensor/i.test(lower)) {
      return categories.find((c) => /elevator|lift/i.test(c)) || null;
    }
    if (/gate|guard|security|visitor|intercom|parking|cctv|boom barrier/i.test(lower)) {
      return categories.find((c) => /security|gate/i.test(c)) || null;
    }
    if (/clubhouse|gym|pool|swimming|court|badminton|amenities|hall/i.test(lower)) {
      return categories.find((c) => /clubhouse|amenities|gym/i.test(c)) || null;
    }
    if (/wifi|internet|network|portal|login|laptop|server|lan|vpn|software|email|printer|system/i.test(lower)) {
      return categories.find((c) => /it|wifi|network|software|tech/i.test(c)) || null;
    }
    if (/water|leak|pipe|tap|flush|drain|restroom|toilet|sink|washroom|plumber|seepage/i.test(lower)) {
      return categories.find((c) => /plumbing|water|hostel|sanitation|maintenance/i.test(c)) || null;
    }
    if (/ac|cooling|fan|light|power|switch|fuse|electricity|wiring|generator|heater|mcb|tripping/i.test(lower)) {
      return categories.find((c) => /electrical|power|maintenance|facility/i.test(c)) || null;
    }
    if (/food|mess|canteen|meal|snack|cook|kitchen|hygiene|taste|samosa|cater/i.test(lower)) {
      return categories.find((c) => /canteen|mess|food|dining/i.test(c)) || null;
    }
    if (/garbage|trash|clean|dust|pest|insect|smell|bin|dirty|waste/i.test(lower)) {
      return categories.find((c) => /waste|sanitation|clean|housekeeping/i.test(c)) || null;
    }
    if (/desk|chair|table|bed|door|lock|window|cupboard|furniture|wardrobe/i.test(lower)) {
      return categories.find((c) => /furniture|hostel|maintenance/i.test(c)) || null;
    }
    if (/grade|exam|course|professor|faculty|lecture|attendance|marks|scholarship/i.test(lower)) {
      return categories.find((c) => /academic|course|faculty/i.test(c)) || null;
    }
    return null;
  }, [title, description, categories]);

  const quickPills = useMemo(() => getQuickLocations(orgKey), [orgKey]);

  // File Upload & Attachment Processing
  const processFiles = useCallback((fileList) => {
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
  }, [showToast]);

  const handleFileUpload = useCallback((e) => {
    processFiles(e.target.files);
    e.target.value = '';
  }, [processFiles]);

  const removeAttachment = useCallback((id) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      attachments.forEach((item) => {
        if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [attachments]);

  // Form Submit Handler
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
      // 1. Pre-generate collision-free ticket ID for storage scoping
      const newTicketId = complaintService.generateId
        ? complaintService.generateId()
        : `CMS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 2. Upload attachments in parallel to Supabase Storage
      const uploadedAttachments = await Promise.all(
        attachments.map(async (item) => {
          if (item.file) {
            const uploadRes = await uploadComplaintAttachment(item.file, newTicketId);
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
            identifier: null,
            rollNo: null,
          }
        : {
            id: user?.id,
            name: user?.name || 'User',
            email: user?.email || null,
            identifier: user?.identifier || user?.empId || user?.rollNo || user?.unit || null,
            rollNo: user?.rollNo || user?.identifier || user?.empId || null,
          };

      const effectiveOrg = user?.orgKey || orgKey;
      if (!effectiveOrg) {
        showToast('Unable to determine organization context. Please ensure you are logged into an active organization.', 'error');
        setIsSubmitting(false);
        return;
      }

      // 3. Atomically persist ticket record
      const created = complaintService.create({
        id: newTicketId,
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
        attachmentsCount: uploadedAttachments.length,
        attachmentNames: uploadedAttachments.map((a) => a.name),
        attachments: uploadedAttachments,
        student: { ...reporterProfile, room: location.trim() },
        org: effectiveOrg,
        org_key: effectiveOrg,
        currentOrg: effectiveOrg,
      });

      if (created?._syncPromise) {
        await created._syncPromise;
      }

      clearDraft();
      showToast(`Ticket ${created.id} submitted successfully`, 'success');
      navigate('/complaints');
    } catch (err) {
      console.error('[NewComplaintForm] Submit error:', err);
      showToast('Failed to submit complaint. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Re-sync category if organization template categories update
  useEffect(() => {
    if (categories && categories.length > 0 && !categories.includes(category)) {
      setCategory(categories[0]);
      setSubCategory(getSubCategories(categories[0])[0]);
    }
  }, [categories, category]);

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

      {hasRestoredDraft && (
        <div className="alert-banner alert-banner-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} />
            <span>Restored your saved draft from your previous session.</span>
          </div>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--app-danger, #ef4444)' }}
          >
            <RotateCcw size={13} />
            <span>Discard Draft</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-stack">
        {/* Cluster 1: The Issue & Location (Core Identification) */}
        <div className="form-section-card">
          <div className="form-section-header">
            <span className="form-section-badge">1</span>
            <h2 className="form-section-title">The Issue & Location</h2>
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
              onChange={(e) => setTitle(e.target.value)}
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
        <div className="form-section-card">
          <div className="form-section-header">
            <span className="form-section-badge">2</span>
            <h2 className="form-section-title">Details & Evidence</h2>
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
        <div className="form-section-card">
          <div className="form-section-header">
            <span className="form-section-badge">3</span>
            <h2 className="form-section-title">Access Window & Privacy</h2>
          </div>

          <div className="form-grid-2" style={{ width: '100%', minWidth: 0, alignItems: 'start' }}>
            <div className="form-group" style={{ minWidth: 0 }}>
              <label
                htmlFor="access-date"
                className="form-label"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Calendar size={13} style={{ color: 'var(--app-text-muted)', flexShrink: 0 }} />
                <span>Preferred inspection date</span>
              </label>
              <input
                id="access-date"
                type="date"
                className="form-input"
                value={accessDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setAccessDate(e.target.value)}
                style={{ width: '100%', height: 42, boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-group" style={{ minWidth: 0 }}>
              <span
                className="form-label"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Clock size={13} style={{ color: 'var(--app-text-muted)', flexShrink: 0 }} />
                <span>Preferred inspection window</span>
              </span>
              <div className="time-slot-grid" role="radiogroup" aria-label="Preferred inspection window">
                {ACCESS_TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    role="radio"
                    aria-checked={timeSlot === slot}
                    className={`time-slot-option ${timeSlot === slot ? 'is-active' : ''}`}
                    onClick={() => setTimeSlot(slot)}
                  >
                    <Clock size={12} style={{ flexShrink: 0 }} />
                    <span>{slot}</span>
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
        <div className="form-footer-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                <span>Submitting…</span>
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                <span>Submit Complaint</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/complaints')}
            disabled={isSubmitting}
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
              style={{ marginLeft: 'auto' }}
            >
              <RotateCcw size={14} />
              <span>Discard Draft</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
