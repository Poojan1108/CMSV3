import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Sparkles,
  ArrowRight,
  UserCheck,
  Lock,
  Calendar,
  MessageSquare,
  ArrowLeft,
  Trash2,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import { PRIORITIES, PRIORITY_LABELS } from '../utils/constants';

// Comprehensive Sub-Categories dictionary mapped to category names across templates
const SUB_CATEGORIES_MAP = {
  'Hostel & Mess': ['Plumbing & Restroom', 'Electrical & Lighting', 'Room Furniture & Lock', 'Mess Food Quality', 'Cleanliness & Pest Control'],
  'Academics': ['Lab Equipment Repair', 'Classroom Projector / Board', 'Course Material Access', 'Schedule & Timetable'],
  'IT & Wifi': ['Wi-Fi Disconnection', 'Slow Speed', 'Portal Login Issue', 'IP Configuration', 'Lab Hardware Failure'],
  'Sanitation': ['Trash Accumulation', 'Washroom Hygiene', 'Corridor Sweeping', 'Pest Control Disinfection'],
  'Library': ['Quiet Zone Noise', 'E-Resource Access', 'Book Return System', 'Study Desk Sockets'],
  'Campus Security': ['CCTV Footage Request', 'Visitor Pass Issue', 'Lost & Found', 'Gate Clearance'],
  'Plumbing': ['Pipe Leakage', 'Tap Repair', 'Drainage Clog', 'Water Pressure', 'Flush Tank Fault'],
  'Electrical': ['Power Outage', 'Switchboard Repair', 'Light/Fan Fitting', 'Short Circuit Hazard'],
  'Elevator': ['Elevator Stuck', 'Button Unresponsive', 'Noisy Operation', 'Door Sensor Defect'],
  'Security': ['CCTV Access', 'Visitor Access', 'Parking Violation', 'Noise Nuisance'],
  'Waste Management': ['Garbage Overflow', 'Recycling Bin Full', 'Organic Waste Disposal'],
  'Clubhouse & Gym': ['Equipment Maintenance', 'Pool Hygiene', 'Booking Conflict', 'Air Conditioning'],
  'IT Infrastructure': ['Network Outage', 'VPN Access', 'Server Connection', 'VoIP Phone Line'],
  'HR Services': ['Payroll / Payslip Query', 'Leave Portal Error', 'ID Card / Badge', 'Policy Clarification'],
  'Facilities & AC': ['AC Cooling Failure', 'Room Temperature', 'Door / Window Lock', 'Wall / Paint Repair'],
  'Workstation Hardware': ['Monitor Display Fault', 'Keyboard & Mouse', 'Docking Hub / Cables', 'Laptop Power Adapter'],
  'Cafeteria': ['Food Quality / Taste', 'Hygiene & Cleanliness', 'Billing / POS Issue', 'Vending Machine'],
  'General Maintenance': ['Furniture Repair', 'Structural Repair', 'Lighting Issue', 'Odour / Cleaning'],
  'IT Support': ['Software Installation', 'Password Reset', 'Peripheral Setup', 'Network Speed'],
  'Administrative': ['Document Verification', 'Fee Receipt Issue', 'Official Letter Request'],
  'Facility Management': ['HVAC & Cooling', 'Janitorial Services', 'Key & Locksmith', 'Parking Access'],
  'General': ['General Query', 'Feedback & Suggestion', 'Policy Inquiry', 'Other Issue'],
  'Other': ['Miscellaneous Requirement', 'Unlisted Complaint']
};

// Knowledge base articles for solution deflection
const KB_ARTICLES = [
  {
    keywords: ['wifi', 'wi-fi', 'internet', 'network', 'connect', 'latency', 'disconnect'],
    title: 'Self-Help: Resolving Campus Wi-Fi & SSID Disconnections',
    solution: 'Try forgetting "Campus_Student_5G" on your device, clearing saved credentials, and re-authenticating. If in a lab, verify if neighbor desks are connected.',
  },
  {
    keywords: ['water', 'pipe', 'leak', 'sink', 'plumb', 'tap', 'restroom', 'drain'],
    title: 'Emergency Checklist: Pipe Leakage & Stopcock Location',
    solution: 'In case of active pipe leakage, shut off the main brass stopcock located directly under the sink counter to prevent floor damage while maintenance arrives.',
  },
  {
    keywords: ['ac', 'cooling', 'air condition', 'hvac', 'warm air', 'temperature', 'fan'],
    title: 'Quick Check: HVAC Controller & Thermostat Mode',
    solution: 'Ensure the AC remote control mode is set to "Cool" (snowflake icon) with fan speed set to "Auto" or "High" and setpoint set between 20°C - 22°C.',
  },
  {
    keywords: ['food', 'canteen', 'mess', 'lunch', 'snack', 'meal', 'catering'],
    title: 'Food Committee Feedback Protocol',
    solution: 'For urgent meal quality issues, notify the shift mess manager on-duty immediately so raw batch samples can be impounded for testing.',
  },
  {
    keywords: ['password', 'login', 'portal', 'account', 'auth'],
    title: 'Account & Credentials Self-Service Reset',
    solution: 'You can reset your single sign-on password using the Self-Service IAM Portal without waiting for manual IT queue processing.',
  }
];

export default function NewComplaintForm() {
  const navigate = useNavigate();
  const { user, currentOrg, categories, locationLabel, orgKey } = useAuth();
  const { showToast } = useToast();

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0] || 'General');
  const [subCategory, setSubCategory] = useState(() => {
    const list = SUB_CATEGORIES_MAP[categories[0]] || ['General Issue'];
    return list[0];
  });
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState(PRIORITIES.MEDIUM);
  const [urgencyJustification, setUrgencyJustification] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [accessDate, setAccessDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('Morning (8 AM - 12 PM)');
  const [contactMethod, setContactMethod] = useState('In-App Notification');
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deflectionDismissed, setDeflectionDismissed] = useState(false);

  // Dynamic sub-category list when category changes
  const availableSubCategories = useMemo(() => {
    return SUB_CATEGORIES_MAP[category] || ['General Issue', 'Equipment Repair', 'Operational Delay', 'Other'];
  }, [category]);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const subList = SUB_CATEGORIES_MAP[newCat] || ['General Issue', 'Equipment Repair', 'Operational Delay', 'Other'];
    setSubCategory(subList[0]);
  };

  // Knowledge base solution deflection match
  const matchedKbArticle = useMemo(() => {
    if (deflectionDismissed || !title || title.trim().length < 4) return null;
    const lowerTitle = title.toLowerCase();
    return KB_ARTICLES.find((art) => art.keywords.some((kw) => lowerTitle.includes(kw))) || null;
  }, [title, deflectionDismissed]);

  // Handle simulated file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newAttachments = [];
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`File "${file.name}" exceeds maximum allowed size of 5MB`, 'warning');
        return;
      }
      newAttachments.push({
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      });
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (newAttachments.length > 0) {
      showToast(`Attached ${newAttachments.length} file(s)`, 'info');
    }
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
    showToast('Attachment removed', 'info');
  };

  // Quick location pill selection presets
  const getQuickLocationPills = () => {
    if (orgKey === 'COLLEGE') {
      return ['Block B - Room 304', 'CS Dept Lab 3', 'Central Library Reading Room', 'Main Canteen Foyer'];
    }
    if (orgKey === 'SOCIETY') {
      return ['Tower A - Flat 402', 'Clubhouse Gym', 'Main Entrance Gate', 'Underground Parking B2'];
    }
    if (orgKey === 'CORPORATE') {
      return ['Floor 4 - Desk 412', 'Conference Room B', 'Main Executive Cafeteria', 'IT Server Hub'];
    }
    return ['Building A - Floor 1', 'Main Reception', 'Outer Courtyard', 'Facility Store'];
  };

  const quickPills = getQuickLocationPills();

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter a complaint title / summary.', 'error');
      return;
    }

    if (description.trim().length < 20) {
      showToast('Detailed description must be at least 20 characters long.', 'error');
      return;
    }

    if (!location.trim()) {
      showToast(`Please specify the ${locationLabel}.`, 'error');
      return;
    }

    if (priority === PRIORITIES.URGENT && !urgencyJustification.trim()) {
      showToast('Please provide a justification for selecting Urgent priority.', 'error');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const createdComplaint = complaintService.create({
          title: title.trim(),
          description: description.trim(),
          category,
          subCategory,
          location: location.trim(),
          priority,
          urgencyJustification: priority === PRIORITIES.URGENT ? urgencyJustification.trim() : null,
          isAnonymous,
          accessDate,
          timeSlot,
          contactMethod,
          attachmentsCount: attachments.length,
          attachmentNames: attachments.map((a) => a.name),
          student: isAnonymous
            ? {
                id: user?.id || 'usr_student_1',
                name: 'Anonymous Student',
                email: 'confidential@campus.edu',
                rollNo: 'CONFIDENTIAL',
                room: location.trim(),
              }
            : {
                id: user?.id || 'usr_student_1',
                name: user?.name || 'Alex Chen',
                email: user?.email || 'alex.chen@campus.edu',
                rollNo: user?.rollNo || 'CS-2024-042',
                room: location.trim(),
              },
          currentOrg: orgKey,
        });

        showToast(`Complaint ticket ${createdComplaint.id} submitted successfully!`, 'success');
        navigate('/complaints');
      } catch (err) {
        console.error(err);
        showToast('Failed to submit complaint. Please try again.', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }, 600);
  };

  return (
    <div className="new-complaint-page">
      {/* Page Header */}
      <div className="page-header-container">
        <div>
          <div className="page-breadcrumb">
            <Link to="/complaints" className="breadcrumb-link">
              <ArrowLeft size={16} />
              <span>Back to My Complaints</span>
            </Link>
          </div>
          <h1 className="page-title-gradient">Lodge New Complaint</h1>
          <p className="page-subtitle">
            Submit a formal service ticket for {currentOrg?.name || 'your organization'}. All requests are triaged under SLA guidelines.
          </p>
        </div>

        <div className="org-context-badge">
          <Shield size={16} className="text-indigo-400" />
          <span>Org: <strong>{currentOrg?.name}</strong></span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="complaint-form-card">
        
        {/* SECTION 1: Title & Deflection */}
        <div className="form-section">
          <h2 className="section-heading">
            <FileText size={18} className="heading-icon" />
            1. Title & Short Summary
          </h2>

          <div className="form-group">
            <label htmlFor="complaint-title" className="form-label">
              Short Summary / Problem Title <span className="text-red-400">*</span>
            </label>
            <input
              id="complaint-title"
              type="text"
              className="form-input"
              placeholder="e.g., Water leakage in Block B Room 304 restroom pipe"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDeflectionDismissed(false);
              }}
              maxLength={120}
              required
            />
            <div className="form-help-text flex-between">
              <span>Be concise and clear. Mention specific defect or symptom.</span>
              <span>{title.length} / 120</span>
            </div>
          </div>

          {/* Knowledge Base Solution Deflection Card */}
          {matchedKbArticle && (
            <div className="kb-deflection-card">
              <div className="kb-deflection-header">
                <div className="kb-title-group">
                  <Sparkles size={18} className="kb-sparkle-icon" />
                  <h4>Suggested Self-Help Solution</h4>
                </div>
                <button
                  type="button"
                  className="kb-dismiss-btn"
                  onClick={() => setDeflectionDismissed(true)}
                  title="Dismiss suggestion"
                >
                  <X size={16} />
                </button>
              </div>

              <h5 className="kb-article-title">{matchedKbArticle.title}</h5>
              <p className="kb-article-solution">{matchedKbArticle.solution}</p>

              <div className="kb-actions">
                <button
                  type="button"
                  className="btn btn-emerald btn-sm"
                  onClick={() => {
                    showToast('Glad this self-help guide resolved your issue!', 'success');
                    setTitle('');
                    setDescription('');
                    setDeflectionDismissed(true);
                  }}
                >
                  <CheckCircle2 size={16} />
                  This Solved My Issue (Cancel Ticket)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDeflectionDismissed(true)}
                >
                  No, Continue Filing Ticket
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Category & Sub-Category */}
        <div className="form-section">
          <h2 className="section-heading">
            <HelpCircle size={18} className="heading-icon" />
            2. Category & Sub-Category
          </h2>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="category-select" className="form-label">
                Department / Category <span className="text-red-400">*</span>
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
                Specific Sub-Category <span className="text-red-400">*</span>
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
        </div>

        {/* SECTION 3: Location Field & Quick Pills */}
        <div className="form-section">
          <h2 className="section-heading">
            <MapPin size={18} className="heading-icon" />
            3. Specific Location
          </h2>

          <div className="form-group">
            <label htmlFor="location-input" className="form-label">
              {locationLabel} <span className="text-red-400">*</span>
            </label>
            <input
              id="location-input"
              type="text"
              className="form-input"
              placeholder={`e.g., ${quickPills[0] || 'Block B - Room 304'}`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />

            {/* Quick Pills */}
            <div className="quick-pills-container">
              <span className="pills-label">Quick Select:</span>
              {quickPills.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  className={`location-pill ${location === pill ? 'active' : ''}`}
                  onClick={() => setLocation(pill)}
                >
                  <MapPin size={12} />
                  {pill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4: Priority Level Selector */}
        <div className="form-section">
          <h2 className="section-heading">
            <AlertTriangle size={18} className="heading-icon" />
            4. Priority Level
          </h2>

          <div className="priority-cards-grid">
            <label className={`priority-card priority-low ${priority === PRIORITIES.LOW ? 'selected' : ''}`}>
              <input
                type="radio"
                name="priority"
                value={PRIORITIES.LOW}
                checked={priority === PRIORITIES.LOW}
                onChange={() => setPriority(PRIORITIES.LOW)}
                className="sr-only"
              />
              <div className="priority-card-header">
                <span className="priority-badge-dot bg-slate-400" />
                <span className="priority-name">Low</span>
              </div>
              <p className="priority-desc">Minor inconvenience; routine resolution (SLA: 72 hrs)</p>
            </label>

            <label className={`priority-card priority-medium ${priority === PRIORITIES.MEDIUM ? 'selected' : ''}`}>
              <input
                type="radio"
                name="priority"
                value={PRIORITIES.MEDIUM}
                checked={priority === PRIORITIES.MEDIUM}
                onChange={() => setPriority(PRIORITIES.MEDIUM)}
                className="sr-only"
              />
              <div className="priority-card-header">
                <span className="priority-badge-dot bg-sky-400" />
                <span className="priority-name">Medium</span>
              </div>
              <p className="priority-desc">Standard issue; normal triage queue (SLA: 48 hrs)</p>
            </label>

            <label className={`priority-card priority-high ${priority === PRIORITIES.HIGH ? 'selected' : ''}`}>
              <input
                type="radio"
                name="priority"
                value={PRIORITIES.HIGH}
                checked={priority === PRIORITIES.HIGH}
                onChange={() => setPriority(PRIORITIES.HIGH)}
                className="sr-only"
              />
              <div className="priority-card-header">
                <span className="priority-badge-dot bg-orange-400" />
                <span className="priority-name">High</span>
              </div>
              <p className="priority-desc">Significant impact on daily routine (SLA: 24 hrs)</p>
            </label>

            <label className={`priority-card priority-urgent ${priority === PRIORITIES.URGENT ? 'selected' : ''}`}>
              <input
                type="radio"
                name="priority"
                value={PRIORITIES.URGENT}
                checked={priority === PRIORITIES.URGENT}
                onChange={() => setPriority(PRIORITIES.URGENT)}
                className="sr-only"
              />
              <div className="priority-card-header">
                <span className="priority-badge-dot bg-rose-500 animate-pulse" />
                <span className="priority-name">Urgent</span>
              </div>
              <p className="priority-desc">Immediate safety or water hazard (SLA: 4 hrs)</p>
            </label>
          </div>

          {/* Conditional Urgency Justification Textarea */}
          {priority === PRIORITIES.URGENT && (
            <div className="urgency-justification-box">
              <label htmlFor="urgency-justification" className="form-label text-rose-400 font-semibold">
                Urgency Justification <span className="text-red-400">*</span>
              </label>
              <p className="form-help-text">
                Explain why immediate emergency dispatch is required (e.g. electrical sparking, active pipe burst, safety risk).
              </p>
              <textarea
                id="urgency-justification"
                className="form-textarea border-rose-500/40"
                rows={3}
                placeholder="Describe why this issue requires 4-hour immediate escalation..."
                value={urgencyJustification}
                onChange={(e) => setUrgencyJustification(e.target.value)}
                required
              />
            </div>
          )}
        </div>

        {/* SECTION 5: Detailed Description Textarea */}
        <div className="form-section">
          <h2 className="section-heading">
            <FileText size={18} className="heading-icon" />
            5. Detailed Description
          </h2>

          <div className="form-group">
            <label htmlFor="description-textarea" className="form-label">
              Full Description & Context <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description-textarea"
              className="form-textarea"
              rows={5}
              placeholder="Provide complete steps to reproduce, duration of issue, or specific equipment IDs involved..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <div className="form-help-text flex-between">
              <span>Minimum 20 characters required.</span>
              <span className={`char-counter ${description.length >= 20 ? 'valid' : 'invalid'}`}>
                {description.length >= 20 ? <CheckCircle2 size={14} className="inline-icon" /> : null}
                {description.length} / 20 min characters
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 6: Anonymity & Privacy Toggle */}
        <div className="form-section">
          <h2 className="section-heading">
            <Lock size={18} className="heading-icon" />
            6. Privacy & Confidentiality
          </h2>

          <div className="anonymity-toggle-card">
            <div className="toggle-info">
              <div className="toggle-title">Submit Complaint Anonymously</div>
              <div className="toggle-subtitle">
                Hide your personal identity from staff and department handling queues.
              </div>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span className="slider round" />
            </label>
          </div>

          {isAnonymous && (
            <div className="privacy-disclosure-badge">
              <Shield size={18} className="privacy-badge-icon" />
              <div>
                <strong>🔒 Confidential Filing Active:</strong> Your name ({user?.name || 'Alex Chen'}) and personal contact details will be redacted on staff dispatch screens. Only system compliance administrators can access identity audit logs if mandatory.
              </div>
            </div>
          )}
        </div>

        {/* SECTION 7: Preferred Access Time Slot */}
        <div className="form-section">
          <h2 className="section-heading">
            <Clock size={18} className="heading-icon" />
            7. Preferred Inspection Access Time Slot
          </h2>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="access-date" className="form-label">
                Preferred Inspection Date
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
              <label className="form-label">Time Window Slot</label>
              <div className="slot-pills-grid">
                {['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)', 'Evening (4 PM - 8 PM)'].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`slot-pill ${timeSlot === slot ? 'active' : ''}`}
                    onClick={() => setTimeSlot(slot)}
                  >
                    <Clock size={14} />
                    <span>{slot}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 8: File Upload Dropzone */}
        <div className="form-section">
          <h2 className="section-heading">
            <Upload size={18} className="heading-icon" />
            8. File & Evidence Attachments
          </h2>

          <div className="upload-dropzone">
            <input
              type="file"
              id="file-upload-input"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              className="dropzone-file-input"
              onChange={handleFileUpload}
            />
            <label htmlFor="file-upload-input" className="dropzone-label">
              <Upload size={32} className="dropzone-icon" />
              <div className="dropzone-title">Click or Drag & Drop Photos / Documents</div>
              <div className="dropzone-subtitle">Supports JPG, PNG, PDF, DOC (Max 5MB per file)</div>
            </label>
          </div>

          {/* Attachment Previews */}
          {attachments.length > 0 && (
            <div className="attachments-list">
              <h5 className="attachments-title">Attached Evidence ({attachments.length}):</h5>
              <div className="attachments-grid">
                {attachments.map((file) => (
                  <div key={file.id} className="attachment-item-card">
                    {file.previewUrl ? (
                      <img src={file.previewUrl} alt={file.name} className="attachment-thumb" />
                    ) : (
                      <div className="attachment-icon-fallback">
                        <FileCheck size={20} />
                      </div>
                    )}
                    <div className="attachment-meta">
                      <span className="attachment-filename">{file.name}</span>
                      <span className="attachment-size">{file.size}</span>
                    </div>
                    <button
                      type="button"
                      className="attachment-delete-btn"
                      onClick={() => removeAttachment(file.id)}
                      title="Remove file"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 9: Preferred Contact Method */}
        <div className="form-section">
          <h2 className="section-heading">
            <MessageSquare size={18} className="heading-icon" />
            9. Preferred Contact Method
          </h2>

          <div className="contact-methods-grid">
            {[
              { id: 'In-App Notification', label: 'In-App Notification', desc: 'Real-time portal updates & live tracker pushes' },
              { id: 'Email Notification', label: 'Email Digest', desc: 'Status milestones sent to registered email' },
              { id: 'Phone Call / SMS', label: 'Phone Call / SMS', desc: 'Direct call from assigned technician before arrival' }
            ].map((method) => (
              <label
                key={method.id}
                className={`contact-method-card ${contactMethod === method.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="contactMethod"
                  value={method.id}
                  checked={contactMethod === method.id}
                  onChange={() => setContactMethod(method.id)}
                  className="sr-only"
                />
                <div className="method-name">{method.label}</div>
                <div className="method-desc">{method.desc}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="form-footer-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/complaints')}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary btn-submit-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" /> Submitting Ticket...
              </>
            ) : (
              <>
                <PlusCircle size={18} />
                Submit Complaint Ticket
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
