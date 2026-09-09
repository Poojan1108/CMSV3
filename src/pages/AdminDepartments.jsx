import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Building,
  Home,
  Sliders,
  Check,
  Mail,
  Phone,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import {
  PageHeader,
  Modal,
  EmptyState,
} from '../components/ui';

const SLA_OPTIONS = [
  { value: 4, label: '4 hours (Critical)' },
  { value: 8, label: '8 hours (High)' },
  { value: 12, label: '12 hours (Standard)' },
  { value: 24, label: '24 hours (Normal)' },
  { value: 48, label: '48 hours (Extended)' },
];

const SLA_STORAGE_PREFIX = 'cms_sla_targets_';

export default function AdminDepartments() {
  const { currentOrg, orgKey, switchOrgTemplate, orgTemplates, categories, availableUsers, updateOrgSettings } =
    useAuth();
  const { showToast } = useToast();

  // Custom Organization Configuration State
  const [showOrgConfigModal, setShowOrgConfigModal] = useState(false);
  const [orgConfigData, setOrgConfigData] = useState({
    name: currentOrg?.name || '',
    userTerm: currentOrg?.userTerm || '',
    staffTerm: currentOrg?.staffTerm || '',
    locationLabel: currentOrg?.locationLabel || '',
  });
  const [newCategoryInput, setNewCategoryInput] = useState('');

  useEffect(() => {
    if (currentOrg) {
      setOrgConfigData({
        name: currentOrg.name || '',
        userTerm: currentOrg.userTerm || '',
        staffTerm: currentOrg.staffTerm || '',
        locationLabel: currentOrg.locationLabel || '',
      });
    }
  }, [currentOrg]);

  const handleSaveOrgConfig = (e) => {
    e.preventDefault();
    if (!orgConfigData.name.trim()) {
      showToast('Organization name cannot be empty', 'error');
      return;
    }
    updateOrgSettings(orgKey, {
      name: orgConfigData.name.trim(),
      userTerm: orgConfigData.userTerm.trim() || undefined,
      staffTerm: orgConfigData.staffTerm.trim() || undefined,
      locationLabel: orgConfigData.locationLabel.trim() || undefined,
    });
    setShowOrgConfigModal(false);
    showToast('Organization profile updated successfully!', 'success');
  };

  const handleAddCustomCategory = (e) => {
    e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      showToast('Category already exists', 'warning');
      return;
    }
    const updatedCategories = [...categories, trimmed];
    updateOrgSettings(orgKey, { categories: updatedCategories });
    setNewCategoryInput('');
    showToast(`Added category "${trimmed}"`, 'success');
  };

  const handleRemoveCategory = (catToRemove) => {
    if (categories.length <= 1) {
      showToast('At least one category is required', 'warning');
      return;
    }
    const updatedCategories = categories.filter((c) => c !== catToRemove);
    updateOrgSettings(orgKey, { categories: updatedCategories });
    showToast(`Removed category "${catToRemove}"`, 'info');
  };

  // Live complaints for workload calculation
  const [complaints, setComplaints] = useState([]);
  useEffect(() => {
    try {
      setComplaints(complaintService.getAll());
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Default SLA targets derived from category names
  const defaultSlaTargets = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      const name = cat.toLowerCase();
      if (/urgent|security|elevator/.test(name)) map[cat] = 4;
      else if (/sanitation|waste|plumbing/.test(name)) map[cat] = 8;
      else if (/\bit\b|wifi|electrical/.test(name)) map[cat] = 12;
      else map[cat] = 24;
    });
    return map;
  }, [categories]);

  const loadSavedSla = () => {
    try {
      const saved = localStorage.getItem(`${SLA_STORAGE_PREFIX}${orgKey}`);
      return saved ? JSON.parse(saved) : defaultSlaTargets;
    } catch {
      return defaultSlaTargets;
    }
  };

  const [slaTargets, setSlaTargets] = useState(loadSavedSla);

  useEffect(() => {
    setSlaTargets(loadSavedSla());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgKey]);

  const persistSlaTargets = (updated) => {
    setSlaTargets(updated);
    try {
      localStorage.setItem(`${SLA_STORAGE_PREFIX}${orgKey}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist SLA targets', e);
    }
  };

  // Staff roster state
  const [staffList, setStaffList] = useState(() =>
    availableUsers
      .filter((u) => u.role === 'staff' || u.role === 'admin')
      .map((s) => ({
        ...s,
        status: 'active',
        assignedCategories: s.assignedCategories?.length
          ? s.assignedCategories.filter((c) => categories.includes(c))
          : [],
      }))
  );

  // Modals
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editDraftCategories, setEditDraftCategories] = useState([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
  });

  const [rosterFilter, setRosterFilter] = useState('all');

  const editingStaff = staffList.find((s) => s.id === editingStaffId) || null;

  const getOrgIcon = (typeKey) => {
    switch (typeKey) {
      case 'SOCIETY':
        return <Home size={19} />;
      case 'CORPORATE':
        return <Building size={19} />;
      case 'CUSTOM':
        return <Sliders size={19} />;
      default:
        return <Building2 size={19} />;
    }
  };

  const getStaffWorkload = (staffId) =>
    complaints.filter(
      (c) =>
        c.assignedTo?.id === staffId &&
        c.status !== 'resolved' &&
        c.status !== 'rejected'
    ).length;

  const handleUpdateSla = (cat, newHours) => {
    persistSlaTargets({ ...slaTargets, [cat]: Number(newHours) });
    showToast(`SLA target for "${cat}" set to ${newHours}h`, 'success');
  };

  const handleToggleStaffDuty = (staffId) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? { ...s, status: s.status === 'active' ? 'on_leave' : 'active' }
          : s
      )
    );
    const target = staffList.find((s) => s.id === staffId);
    showToast(
      `${target?.name} is now ${target?.status === 'active' ? 'on leave' : 'back on duty'}`,
      'info'
    );
  };

  const openEditStaff = (staff) => {
    setEditingStaffId(staff.id);
    setEditDraftCategories(staff.assignedCategories);
  };

  const toggleEditCategory = (cat) => {
    setEditDraftCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSaveStaffAssignments = () => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === editingStaffId ? { ...s, assignedCategories: editDraftCategories } : s
      )
    );
    setEditingStaffId(null);
    showToast('Category assignments updated', 'success');
  };

  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaffData.name.trim() || !newStaffData.email.trim()) {
      showToast('Provide a name and email address', 'warning');
      return;
    }

    const created = {
      id: `usr_staff_${Date.now()}`,
      name: newStaffData.name.trim(),
      email: newStaffData.email.trim(),
      phone: newStaffData.phone.trim(),
      role: 'staff',
      department: newStaffData.department.trim(),
      assignedCategories: [],
      status: 'active',
      avatar: null,
    };

    setStaffList((prev) => [...prev, created]);
    setShowAddStaffModal(false);
    setNewStaffData({ name: '', email: '', phone: '', department: '' });
    showToast(`${created.name} added to the roster`, 'success');
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={currentOrg?.name}
        icon={<Building2 size={12} />}
        title="Organization & Departments"
        description="Switch organization templates, configure category SLA targets and manage the staff roster."
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddStaffModal(true)}
          >
            <UserPlus size={15} />
            Add Staff
          </button>
        }
      />

      {/* Organization Profile & Customization Card */}
      <section className="card card-pad">
        <div className="card-header">
          <div>
            <h2 className="card-title">Organization Settings & Terminology</h2>
            <p className="card-subtitle">
              Configure operational categories, labels, and role terminology for {currentOrg.name}.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowOrgConfigModal(true)}
          >
            <Sliders size={14} />
            Customize Organization
          </button>
        </div>

        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
          <div className="metric-card">
            <span className="metric-icon bg-tone-accent">
              {getOrgIcon(orgKey)}
            </span>
            <div>
              <div className="priority-name">{currentOrg.name}</div>
              <div className="cell-sub">Type: {currentOrg.type || 'Organization'}</div>
            </div>
          </div>

          <div className="metric-card">
            <div>
              <div className="priority-name">{currentOrg.userTerm || 'Member'}</div>
              <div className="cell-sub">Complainant Title</div>
            </div>
          </div>

          <div className="metric-card">
            <div>
              <div className="priority-name">{currentOrg.staffTerm || 'Staff'}</div>
              <div className="cell-sub">Resolver Title</div>
            </div>
          </div>

          <div className="metric-card">
            <div>
              <div className="priority-name">{currentOrg.locationLabel || 'Location'}</div>
              <div className="cell-sub">Location Field Prompt</div>
            </div>
          </div>
        </div>

        {/* Categories Pills & Quick Add */}
        <div style={{ marginTop: 18, borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <span className="field-label" style={{ margin: 0, fontWeight: 600 }}>
              Operational Categories ({categories.length})
            </span>
            <form onSubmit={handleAddCustomCategory} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: '1 1 auto', maxWidth: '100%', minWidth: 0 }}>
              <input
                type="text"
                className="form-input"
                placeholder="New Category..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                style={{ height: 32, fontSize: 13, padding: '0 10px', minWidth: 0, flex: '1 1 120px' }}
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                + Add
              </button>
            </form>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map((cat) => (
              <span key={cat} className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {cat}
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  title="Remove category"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SLA manager */}
      <section className="card card-pad">
        <div className="card-header">
          <div>
            <h2 className="card-title">Category SLA Targets</h2>
            <p className="card-subtitle">
              Resolution deadline in hours per operational category for {currentOrg.name}.
            </p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Target SLA</th>
                <th>Response Commitment</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat}>
                  <td>
                    <span className="cell-main" style={{ maxWidth: 'none' }}>
                      {cat}
                    </span>
                  </td>
                  <td>
                    <select
                      value={slaTargets[cat] || 24}
                      onChange={(e) => handleUpdateSla(cat, e.target.value)}
                      className="table-select"
                      aria-label={`SLA target for ${cat}`}
                    >
                      {SLA_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className="cell-sub">First response within 2 hours</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Staff roster */}
      <section className="card card-pad">
        <div className="card-header">
          <div>
            <h2 className="card-title">Staff Roster</h2>
            <p className="card-subtitle">
              Resolvers with duty status, contact details and category coverage.
            </p>
          </div>

          <select
            value={rosterFilter}
            onChange={(e) => setRosterFilter(e.target.value)}
            aria-label="Filter roster by duty status"
          >
            <option value="all">All Statuses</option>
            <option value="active">On Duty</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>

        {staffList.filter((s) => rosterFilter === 'all' || s.status === rosterFilter).length ===
        0 ? (
          <EmptyState
            icon={UserPlus}
            title="No staff match this filter"
            description="Adjust the duty status filter or add a new resolver."
          />
        ) : (
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
            {staffList
              .filter((s) => rosterFilter === 'all' || s.status === rosterFilter)
              .map((staff) => {
                const workload = getStaffWorkload(staff.id);
                const isOnDuty = staff.status === 'active';

                return (
                  <article key={staff.id} className="ticket-card" style={{ height: 'auto' }}>
                    {/* Identity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="avatar-wrapper" style={{ width: 42, height: 42 }}>
                        {staff.avatar ? (
                          <img src={staff.avatar} alt="" className="user-avatar-img" />
                        ) : (
                          <span className="user-avatar-fallback">{staff.name.charAt(0)}</span>
                        )}
                        <span
                          className={`status-indicator status-${isOnDuty ? 'admin' : 'student'}`}
                          style={{
                            background: isOnDuty ? 'var(--app-success)' : 'var(--app-danger)',
                          }}
                        />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="handler-name">{staff.name}</div>
                        <div className="handler-dept">{staff.department || 'Resolver'}</div>
                      </div>
                      <span className={`badge ${isOnDuty ? 'status-resolved' : 'status-rejected'}`}>
                        {isOnDuty ? 'On Duty' : 'On Leave'}
                      </span>
                    </div>

                    {/* Contact */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                      <span className="meta-item" style={{ fontSize: 12, wordBreak: 'break-all', overflowWrap: 'anywhere', minWidth: 0 }}>
                        <Mail size={12} style={{ flexShrink: 0 }} />
                        <span style={{ minWidth: 0, wordBreak: 'break-all', overflowWrap: 'anywhere' }}>{staff.email}</span>
                      </span>
                      {staff.phone && (
                        <span className="meta-item" style={{ fontSize: 12 }}>
                          <Phone size={12} style={{ flexShrink: 0 }} />
                          <span>{staff.phone}</span>
                        </span>
                      )}
                    </div>

                    {/* Categories */}
                    {staff.assignedCategories.length > 0 && (
                      <div style={{ minWidth: 0 }}>
                        <div className="meta-cell-label" style={{ marginBottom: 6 }}>
                          Assigned Categories
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {staff.assignedCategories.map((c) => (
                            <span key={c} className="tag tone-accent">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="ticket-card-footer" style={{ flexWrap: 'wrap', gap: 8 }}>
                      <span
                        className={`handler-line ${
                          workload > 0 ? 'tone-warning' : 'tone-success'
                        }`}
                        style={{ minWidth: 0 }}
                      >
                        {workload} active ticket{workload === 1 ? '' : 's'}
                      </span>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleToggleStaffDuty(staff.id)}
                        >
                          {isOnDuty ? 'Set Leave' : 'Set Duty'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => openEditStaff(staff)}
                        >
                          Edit Coverage
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        )}
      </section>

      {/* Edit coverage modal */}
      {editingStaff && (
        <Modal
          title={`Edit Coverage — ${editingStaff.name}`}
          subtitle={currentOrg.name}
          onClose={() => setEditingStaffId(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingStaffId(null)}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveStaffAssignments}>
                Save Changes
              </button>
            </>
          }
        >
          <p className="detail-desc" style={{ margin: 0 }}>
            Select the categories this resolver will handle.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
            {categories.map((cat) => {
              const isSelected = editDraftCategories.includes(cat);
              return (
                <label
                  key={cat}
                  className={`check-option ${isSelected ? 'is-selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleEditCategory(cat)}
                  />
                  {cat}
                </label>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Add staff modal */}
      {showAddStaffModal && (
        <Modal
          title="Add Staff Resolver"
          subtitle="Create a roster entry"
          onClose={() => setShowAddStaffModal(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddStaffModal(false)}
              >
                Cancel
              </button>
              <button type="submit" form="add-staff-form" className="btn btn-primary">
                Add to Roster
              </button>
            </>
          }
        >
          <form id="add-staff-form" onSubmit={handleAddSubmitWrapper}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="new-staff-name" className="field-label" style={{ display: 'block' }}>
                Full name<span className="required-mark">*</span>
              </label>
              <input
                id="new-staff-name"
                type="text"
                className="form-input"
                style={{ width: '100%' }}
                required
                placeholder="e.g. Marcus Brody"
                value={newStaffData.name}
                onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="new-staff-email" className="field-label" style={{ display: 'block' }}>
                Email<span className="required-mark">*</span>
              </label>
              <input
                id="new-staff-email"
                type="email"
                className="form-input"
                style={{ width: '100%' }}
                required
                placeholder="m.brody@organization.edu"
                value={newStaffData.email}
                onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="new-staff-dept" className="field-label" style={{ display: 'block' }}>
                  Department
                </label>
                <input
                  id="new-staff-dept"
                  type="text"
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="Facilities / IT / Security"
                  value={newStaffData.department}
                  onChange={(e) => setNewStaffData({ ...newStaffData, department: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-staff-phone" className="field-label" style={{ display: 'block' }}>
                  Phone
                </label>
                <input
                  id="new-staff-phone"
                  type="tel"
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="+1 555 000 0000"
                  value={newStaffData.phone}
                  onChange={(e) => setNewStaffData({ ...newStaffData, phone: e.target.value })}
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Configure Organization Modal */}
      {showOrgConfigModal && (
        <Modal
          title="Customize Organization Profile"
          subtitle={currentOrg.name}
          onClose={() => setShowOrgConfigModal(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowOrgConfigModal(false)}
              >
                Cancel
              </button>
              <button type="submit" form="org-config-form" className="btn btn-primary">
                Save Changes
              </button>
            </>
          }
        >
          <form id="org-config-form" onSubmit={handleSaveOrgConfig}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="cfg-org-name" className="field-label" style={{ display: 'block' }}>
                Organization Name<span className="required-mark">*</span>
              </label>
              <input
                id="cfg-org-name"
                type="text"
                className="form-input"
                style={{ width: '100%' }}
                required
                value={orgConfigData.name}
                onChange={(e) => setOrgConfigData({ ...orgConfigData, name: e.target.value })}
              />
            </div>

            <div className="form-grid-2" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label htmlFor="cfg-user-term" className="field-label" style={{ display: 'block' }}>
                  Member / Complainant Title
                </label>
                <input
                  id="cfg-user-term"
                  type="text"
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Student, Resident, Employee"
                  value={orgConfigData.userTerm}
                  onChange={(e) => setOrgConfigData({ ...orgConfigData, userTerm: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cfg-staff-term" className="field-label" style={{ display: 'block' }}>
                  Staff / Resolver Title
                </label>
                <input
                  id="cfg-staff-term"
                  type="text"
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Staff, Technician, Engineer"
                  value={orgConfigData.staffTerm}
                  onChange={(e) => setOrgConfigData({ ...orgConfigData, staffTerm: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cfg-loc-label" className="field-label" style={{ display: 'block' }}>
                Location Field Prompt
              </label>
              <input
                id="cfg-loc-label"
                type="text"
                className="form-input"
                style={{ width: '100%' }}
                placeholder="e.g. Hostel Block / Room, Flat No, Desk ID"
                value={orgConfigData.locationLabel}
                onChange={(e) => setOrgConfigData({ ...orgConfigData, locationLabel: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );

  /** Bridges the footer submit button to the add-staff handler. */
  function handleAddSubmitWrapper(e) {
    handleAddStaffSubmit(e);
  }
}
