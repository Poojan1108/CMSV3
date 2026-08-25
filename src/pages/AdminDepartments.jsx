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
  const { currentOrg, orgKey, switchOrgTemplate, orgTemplates, categories, availableUsers } =
    useAuth();
  const { showToast } = useToast();

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

      {/* Org template cards */}
      <section className="card card-pad">
        <div className="card-header">
          <div>
            <h2 className="card-title">Organization Template</h2>
            <p className="card-subtitle">
              Adapts categories, terminology and location fields across the workspace.
            </p>
          </div>
          <span className="context-chip">
            Active: <strong>{currentOrg.name}</strong>
          </span>
        </div>

        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))' }}>
          {Object.keys(orgTemplates).map((key) => {
            const tmpl = orgTemplates[key];
            const isActive = orgKey === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (!isActive) {
                    switchOrgTemplate(key);
                    showToast(`Switched to ${tmpl.name}`, 'success');
                  }
                }}
                className={`metric-card is-clickable ${isActive ? 'is-active' : ''}`}
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}
                aria-pressed={isActive}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={`metric-icon ${isActive ? 'bg-tone-accent' : 'bg-tone-neutral'}`}>
                    {getOrgIcon(key)}
                  </span>
                  {isActive && (
                    <span className="metric-icon bg-tone-accent" style={{ width: 24, height: 24 }}>
                      <Check size={13} />
                    </span>
                  )}
                </div>
                <div>
                  <div className="priority-name">{tmpl.name}</div>
                  <div className="cell-sub">
                    {tmpl.userTerm} • {tmpl.locationLabel}
                  </div>
                </div>
                <div className="cell-sub">{tmpl.categories.length} preset categories</div>
              </button>
            );
          })}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <span className="meta-item" style={{ fontSize: 12 }}>
                        <Mail size={12} />
                        {staff.email}
                      </span>
                      {staff.phone && (
                        <span className="meta-item" style={{ fontSize: 12 }}>
                          <Phone size={12} />
                          {staff.phone}
                        </span>
                      )}
                    </div>

                    {/* Categories */}
                    {staff.assignedCategories.length > 0 && (
                      <div>
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
                    <div className="ticket-card-footer">
                      <span
                        className={`handler-line ${
                          workload > 0 ? 'tone-warning' : 'tone-success'
                        }`}
                      >
                        {workload} active ticket{workload === 1 ? '' : 's'}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
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
                  placeholder="+1 555 000 0000"
                  value={newStaffData.phone}
                  onChange={(e) => setNewStaffData({ ...newStaffData, phone: e.target.value })}
                />
              </div>
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
