import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Building,
  Home,
  Sliders,
  CheckCircle2,
  Clock,
  UserCheck,
  UserPlus,
  Users,
  ShieldCheck,
  Edit3,
  Save,
  Plus,
  X,
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
  Briefcase,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';

export default function AdminDepartments() {
  const {
    currentOrg,
    orgKey,
    switchOrgTemplate,
    orgTemplates,
    categories,
    availableUsers,
  } = useAuth();
  const { showToast } = useToast();

  // Load complaints for staff workload calculation
  const [complaints, setComplaints] = useState([]);
  useEffect(() => {
    try {
      const data = complaintService.getAll();
      setComplaints(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Category SLA Targets State (Keyed by category name)
  const defaultSlaTargets = useMemo(() => {
    const map = {};
    categories.forEach((cat, index) => {
      if (cat.toLowerCase().includes('urgent') || cat.toLowerCase().includes('security') || cat.toLowerCase().includes('elevator')) {
        map[cat] = 4;
      } else if (cat.toLowerCase().includes('sanitation') || cat.toLowerCase().includes('waste') || cat.toLowerCase().includes('plumbing')) {
        map[cat] = 8;
      } else if (cat.toLowerCase().includes('it') || cat.toLowerCase().includes('wifi') || cat.toLowerCase().includes('electrical')) {
        map[cat] = 12;
      } else {
        map[cat] = 24;
      }
    });
    return map;
  }, [categories]);

  const [slaTargets, setSlaTargets] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`cms_sla_targets_${orgKey}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return defaultSlaTargets;
  });

  useEffect(() => {
    setSlaTargets(defaultSlaTargets);
  }, [orgKey, defaultSlaTargets]);

  const handleUpdateSla = (cat, newHours) => {
    const updated = { ...slaTargets, [cat]: Number(newHours) };
    setSlaTargets(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`cms_sla_targets_${orgKey}`, JSON.stringify(updated));
    }
    showToast(`Updated SLA Target for '${cat}' to ${newHours} hours`, 'success');
  };

  // Staff Roster State
  const [staffList, setStaffList] = useState(() => {
    const initialStaff = availableUsers.filter((u) => u.role === 'staff' || u.role === 'admin');
    return initialStaff.map((s) => ({
      ...s,
      status: 'active',
      assignedCategories: s.assignedCategories || categories.slice(0, 2),
    }));
  });

  // Modal States
  const [editingStaff, setEditingStaff] = useState(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Operations',
    role: 'staff',
    assignedCategories: [categories[0] || 'General'],
  });

  // Roster Filter State
  const [rosterFilter, setRosterFilter] = useState('all');

  const getOrgIcon = (typeKey) => {
    switch (typeKey) {
      case 'SOCIETY': return <Home size={22} />;
      case 'CORPORATE': return <Building size={22} />;
      case 'CUSTOM': return <Sliders size={22} />;
      case 'COLLEGE':
      default: return <Building2 size={22} />;
    }
  };

  // Calculate active workload per staff member
  const getStaffWorkload = (staffId) => {
    return complaints.filter(
      (c) => c.assignedTo && c.assignedTo.id === staffId && c.status !== 'resolved' && c.status !== 'rejected'
    ).length;
  };

  const handleToggleStaffDuty = (staffId) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === staffId) {
          const nextStatus = s.status === 'active' ? 'on_leave' : 'active';
          showToast(`${s.name} status updated to ${nextStatus.replace('_', ' ').toUpperCase()}`, 'info');
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  const handleSaveStaffAssignments = (staffId, updatedCategories) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, assignedCategories: updatedCategories } : s))
    );
    setEditingStaff(null);
    showToast('Staff category assignments updated successfully', 'success');
  };

  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaffData.name || !newStaffData.email) {
      showToast('Please provide staff name and email', 'warning');
      return;
    }

    const created = {
      id: `usr_staff_${Date.now()}`,
      name: newStaffData.name,
      email: newStaffData.email,
      phone: newStaffData.phone || '+1 (555) 000-1122',
      role: 'staff',
      department: newStaffData.department,
      assignedCategories: newStaffData.assignedCategories,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    };

    setStaffList((prev) => [...prev, created]);
    setShowAddStaffModal(false);
    setNewStaffData({
      name: '',
      email: '',
      phone: '',
      department: 'Operations',
      role: 'staff',
      assignedCategories: [categories[0] || 'General'],
    });
    showToast(`Added ${created.name} to Department Staff Roster`, 'success');
  };

  return (
    <div className="admin-departments-page" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Banner */}
      <div
        className="departments-page-header"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px 28px',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '3px 10px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Building2 size={13} /> ORGANIZATION & DEPARTMENT MANAGEMENT
            </span>
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--text-white)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Organization & Department Configurator
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-gray)', marginTop: '4px' }}>
            Switch active organization templates, set category SLA target hours, and manage staff roster assignments.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAddStaffModal(true)}
          style={{ padding: '10px 18px', fontSize: '13px' }}
        >
          <UserPlus size={16} style={{ marginRight: '6px' }} />
          Add Staff Resolver
        </button>
      </div>

      {/* 1. ACTIVE ORGANIZATION TEMPLATE SWITCHER */}
      <div className="section-card table-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-white)' }}>
              Active Organization Template Switcher
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>
              Select system-wide operational domain to dynamically adapt categories, terminology, and location fields.
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-light)' }}>
            Active Mode: <strong>{currentOrg.name}</strong>
          </span>
        </div>

        {/* 4 Template Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {Object.keys(orgTemplates).map((key) => {
            const tmpl = orgTemplates[key];
            const isActive = orgKey === key;

            return (
              <div
                key={key}
                onClick={() => {
                  switchOrgTemplate(key);
                  showToast(`Organization Template switched to ${tmpl.name}`, 'success');
                }}
                style={{
                  background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'rgba(17, 24, 39, 0.6)',
                  border: `2px solid ${isActive ? 'var(--primary-light)' : 'var(--border-color)'}`,
                  borderRadius: '14px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'var(--primary)',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={14} />
                  </span>
                )}

                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#ffffff' : 'var(--text-gray)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getOrgIcon(key)}
                </div>

                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-white)' }}>
                    {tmpl.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>
                    Type: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{tmpl.type}</span>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>User Label: <strong style={{ color: 'var(--text-main)' }}>{tmpl.userTerm}</strong></div>
                  <div>Location: <strong style={{ color: 'var(--text-main)' }}>{tmpl.locationLabel}</strong></div>
                  <div>Categories: <strong style={{ color: 'var(--accent-cyan)' }}>{tmpl.categories.length} preset areas</strong></div>
                </div>

                <button
                  type="button"
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', marginTop: 'auto', padding: '7px 12px', fontSize: '12px' }}
                >
                  {isActive ? 'Current Active Template' : 'Activate Template'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. DEPARTMENT CATEGORY SLA MANAGER */}
      <div className="section-card table-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-white)' }}>
              Department Category SLA Target Manager
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>
              Configure SLA resolution deadlines (hours) and escalation policy per operational category for <strong>{currentOrg.name}</strong>.
            </p>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-amber)',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '4px 12px',
              borderRadius: '20px',
            }}
          >
            Auto-Escalation Enabled
          </span>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-gray)' }}>
                <th style={{ padding: '14px 16px', fontWeight: '700' }}>Category Name</th>
                <th style={{ padding: '14px 16px', fontWeight: '700' }}>Target SLA (Hours)</th>
                <th style={{ padding: '14px 16px', fontWeight: '700' }}>Escalation Path</th>
                <th style={{ padding: '14px 16px', fontWeight: '700' }}>Response SLA</th>
                <th style={{ padding: '14px 16px', fontWeight: '700' }}>Active Benchmark</th>
                <th style={{ padding: '14px 16px', fontWeight: '700', textAlign: 'right' }}>Save Policy</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const currentHours = slaTargets[cat] || 24;

                return (
                  <tr key={cat} style={{ borderBottom: '1px solid var(--border-color-light)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-white)' }}>
                      {cat}
                    </td>

                    {/* SLA Target Selector */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          value={currentHours}
                          onChange={(e) => handleUpdateSla(cat, e.target.value)}
                          style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '5px 10px',
                            color: 'var(--primary-light)',
                            fontWeight: 700,
                            fontSize: '13px',
                            outline: 'none',
                          }}
                        >
                          <option value={4}>4 Hours (Urgent)</option>
                          <option value={8}>8 Hours (High)</option>
                          <option value={12}>12 Hours (Standard)</option>
                          <option value={24}>24 Hours (Normal)</option>
                          <option value={48}>48 Hours (Extended)</option>
                          <option value={72}>72 Hours (Low)</option>
                        </select>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-gray)', fontSize: '12px' }}>
                      Tier 1 Resolver &rarr; Tier 2 Dept Head
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '12px' }}>
                      Immediate (&lt; 2 Hours)
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--accent-emerald)',
                          background: 'rgba(16, 185, 129, 0.12)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                        }}
                      >
                        95.4% Compliant
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleUpdateSla(cat, currentHours)}
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        <Save size={13} style={{ marginRight: '4px' }} />
                        Save Target
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. DEPARTMENT STAFF ROSTER OVERVIEW */}
      <div className="section-card table-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-white)' }}>
              Department Staff Roster Overview
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>
              Showing wardens, technicians, and department resolvers with assigned category coverage.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              value={rosterFilter}
              onChange={(e) => setRosterFilter(e.target.value)}
              style={{
                background: 'rgba(17, 24, 39, 0.8)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: 'var(--text-white)',
                fontSize: '12px',
                outline: 'none',
              }}
            >
              <option value="all">All Duty Statuses</option>
              <option value="active">Active On Duty</option>
              <option value="on_leave">On Leave / Out of Office</option>
            </select>
          </div>
        </div>

        {/* Staff Roster Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {staffList
            .filter((s) => rosterFilter === 'all' || s.status === rosterFilter)
            .map((staff) => {
              const workload = getStaffWorkload(staff.id);
              const isOnDuty = staff.status === 'active';

              return (
                <div
                  key={staff.id}
                  style={{
                    background: 'rgba(17, 24, 39, 0.6)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  {/* Staff Card Top Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={staff.avatar}
                        alt={staff.name}
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: isOnDuty ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                          border: '2px solid var(--bg-card)',
                        }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-white)' }}>
                          {staff.name}
                        </h3>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: isOnDuty ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                            background: isOnDuty ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {isOnDuty ? 'Active / On Duty' : 'On Leave'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>
                        {staff.department || 'Department Resolver'}
                      </div>
                    </div>
                  </div>

                  {/* Contact Meta */}
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={13} style={{ color: 'var(--primary-light)' }} />
                      <span>{staff.email}</span>
                    </div>
                    {staff.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={13} style={{ color: 'var(--accent-emerald)' }} />
                        <span>{staff.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Category Pills */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Assigned Categories:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {staff.assignedCategories.map((c) => (
                        <span
                          key={c}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--primary-light)',
                            background: 'rgba(99, 102, 241, 0.12)',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Workload Counter & Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-color-light)',
                      marginTop: 'auto',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>
                      Active Queue: <strong style={{ color: workload > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>{workload} tickets</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleToggleStaffDuty(staff.id)}
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        {isOnDuty ? 'Set On Leave' : 'Set Active'}
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setEditingStaff(staff)}
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        <Edit3 size={12} style={{ marginRight: '4px' }} /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* EDIT STAFF ASSIGNMENTS MODAL */}
      {editingStaff && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase' }}>
                  ROSTER ASSIGNMENTS
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-white)', marginTop: '2px' }}>
                  Edit {editingStaff.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-gray)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>
              Select categories that <strong>{editingStaff.name}</strong> will handle for <strong>{currentOrg.name}</strong>:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
              {categories.map((cat) => {
                const isSelected = editingStaff.assignedCategories.includes(cat);
                return (
                  <label
                    key={cat}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(17, 24, 39, 0.5)',
                      border: `1px solid ${isSelected ? 'var(--primary-light)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--text-white)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        let updated = [...editingStaff.assignedCategories];
                        if (e.target.checked) {
                          updated.push(cat);
                        } else {
                          updated = updated.filter((c) => c !== cat);
                        }
                        setEditingStaff({ ...editingStaff, assignedCategories: updated });
                      }}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span>{cat}</span>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingStaff(null)}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSaveStaffAssignments(editingStaff.id, editingStaff.assignedCategories)}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Save Roster Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW STAFF MODAL */}
      {showAddStaffModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase' }}>
                  NEW STAFF REGISTRATION
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-white)', marginTop: '2px' }}>
                  Add Staff Resolver to Roster
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-gray)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-white)', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspector Marcus Brody"
                  value={newStaffData.name}
                  onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-white)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-white)', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="m.brody@campus.edu"
                  value={newStaffData.email}
                  onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-white)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-white)', marginBottom: '4px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="Hostel / IT / Facilities"
                    value={newStaffData.department}
                    onChange={(e) => setNewStaffData({ ...newStaffData, department: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-white)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-white)', marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={newStaffData.phone}
                    onChange={(e) => setNewStaffData({ ...newStaffData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-white)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddStaffModal(false)}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Add Staff Resolver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
