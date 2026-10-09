import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Building,
  Home,
  Sliders,
  Check,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintService } from '../services/complaintService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import {
  PageHeader,
  Modal,
} from '../components/ui';

const SLA_OPTIONS = [
  { value: 4, label: '4 hours (Critical)' },
  { value: 8, label: '8 hours (High)' },
  { value: 12, label: '12 hours (Standard)' },
  { value: 24, label: '24 hours (Normal)' },
  { value: 48, label: '48 hours (Extended)' },
];

export default function AdminDepartments() {
  const { currentOrg, orgKey, categories, updateOrgSettings } = useAuth();
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

  const handleAddCustomCategory = async (e) => {
    e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if ((categories || []).includes(trimmed)) {
      showToast('Category already exists', 'warning');
      return;
    }
    const updatedCategories = [...(categories || []), trimmed];
    
    // Proactively create the department row in PostgreSQL
    if (isSupabaseConfigured && supabase && orgKey) {
      try {
        await supabase
          .from('departments')
          .insert({
            org_key: orgKey,
            name: trimmed,
            sla_resolve_hours: 24,
            sla_response_hours: 8,
          });
      } catch (err) {
        console.warn('[AdminDepartments] Failed to proactive insert new department:', err);
      }
    }

    updateOrgSettings(orgKey, { categories: updatedCategories });
    setNewCategoryInput('');
    showToast(`Added category "${trimmed}"`, 'success');
  };

  const handleRemoveCategory = (catToRemove) => {
    if ((categories || []).length <= 1) {
      showToast('At least one category is required', 'warning');
      return;
    }
    const updatedCategories = (categories || []).filter((c) => c !== catToRemove);
    updateOrgSettings(orgKey, { categories: updatedCategories });
    showToast(`Removed category "${catToRemove}"`, 'info');
  };

  const categoriesKey = (categories || []).join(',');

  // Derive default SLA targets from category names
  const defaultSlaTargets = useMemo(() => {
    const map = {};
    (categories || []).forEach((cat) => {
      const name = cat.toLowerCase();
      if (/urgent|security|elevator|meeting/.test(name)) map[cat] = 4;
      else if (/sanitation|waste|plumbing/.test(name)) map[cat] = 8;
      else if (/\bit\b|wifi|electrical|network|vpn|hardware/.test(name)) map[cat] = 12;
      else map[cat] = 24;
    });
    return map;
  }, [categoriesKey]);

  const [slaTargets, setSlaTargets] = useState(defaultSlaTargets);

  // Sync SLA targets from Supabase PostgREST on mount
  useEffect(() => {
    let isMounted = true;
    setSlaTargets(defaultSlaTargets);

    if (isSupabaseConfigured && supabase && orgKey) {
      supabase
        .from('departments')
        .select('name, sla_resolve_hours')
        .eq('org_key', orgKey)
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0 && isMounted) {
            const remoteMap = {};
            data.forEach((d) => {
              if (d.name && d.sla_resolve_hours) {
                remoteMap[d.name] = d.sla_resolve_hours;
              }
            });
            if (Object.keys(remoteMap).length > 0) {
              setSlaTargets((prev) => ({ ...defaultSlaTargets, ...prev, ...remoteMap }));
            }
          }
        })
        .catch((err) => {
          console.warn('[AdminDepartments] SLA fetch warning:', err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [orgKey, categoriesKey]);

  // Atomic single-category SLA mutation (eliminates serial N+1 loop)
  const handleUpdateSla = async (cat, newHours) => {
    const numericHours = Number(newHours);
    setSlaTargets((prev) => ({ ...prev, [cat]: numericHours }));
    showToast(`SLA target for "${cat}" set to ${numericHours}h`, 'success');

    if (isSupabaseConfigured && supabase && orgKey) {
      try {
        const { data: existing } = await supabase
          .from('departments')
          .select('id')
          .eq('org_key', orgKey)
          .ilike('name', cat)
          .maybeSingle();

        if (existing?.id) {
          await supabase
            .from('departments')
            .update({
              sla_resolve_hours: numericHours,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('departments')
            .insert({
              org_key: orgKey,
              name: cat,
              sla_resolve_hours: numericHours,
              sla_response_hours: Math.max(2, Math.round(numericHours / 3)),
            });
        }
      } catch (err) {
        console.warn('[AdminDepartments] Failed to persist single SLA update:', err);
      }
    }
  };

  const getOrgIcon = (typeKey) => {
    const t = (currentOrg?.type || typeKey || '').toUpperCase();
    if (t.includes('SOCIETY') || t.includes('RESIDENCY') || t.includes('RWA')) return <Home size={19} />;
    if (t.includes('CORPORATE') || t.includes('OFFICE') || t.includes('CORP')) return <Building size={19} />;
    if (t.includes('CUSTOM')) return <Sliders size={19} />;
    return <Building2 size={19} />;
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={currentOrg?.name}
        icon={<Building2 size={12} />}
        title="Organization & Departments"
        description="Switch organization templates, configure category SLA targets and manage the staff roster."
        actions={
          <Link
            to="/admin/members"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Users size={15} />
            Manage Members &amp; Staff
          </Link>
        }
      />

      {/* Organization Profile & Customization Card */}
      <section className="card card-pad">
        <div className="card-header">
          <div>
            <h2 className="card-title">Organization Settings & Terminology</h2>
            <p className="card-subtitle">
              Configure operational categories, labels, and role terminology for {currentOrg?.name || 'Workspace'}.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowOrgConfigModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Sliders size={14} />
            Customize Organization
          </button>
        </div>

        <div className="stat-grid">
          <div className="metric-card">
            <span className="metric-icon bg-tone-accent">
              {getOrgIcon(orgKey)}
            </span>
            <div>
              <div className="priority-name">{currentOrg?.name || 'Organization'}</div>
              <div className="cell-sub">Type: {currentOrg?.type || 'Organization'}</div>
            </div>
          </div>

          <div className="metric-card">
            <div>
              <div className="priority-name">{currentOrg?.userTerm || 'Member'}</div>
              <div className="cell-sub">Complainant Title</div>
            </div>
          </div>

          <div className="metric-card">
            <div>
              <div className="priority-name">{currentOrg?.staffTerm || 'Staff'}</div>
              <div className="cell-sub">Resolver Title</div>
            </div>
          </div>

          <div className="metric-card">
            <div>
              <div className="priority-name">{currentOrg?.locationLabel || 'Location'}</div>
              <div className="cell-sub">Location Field Prompt</div>
            </div>
          </div>
        </div>

        {/* Categories Pills & Quick Add */}
        <div style={{ marginTop: 18, borderTop: '1px solid var(--app-border-soft, #e4e4e7)', paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <span className="field-label" style={{ margin: 0, fontWeight: 600 }}>
              Operational Categories ({(categories || []).length})
            </span>
            <form onSubmit={handleAddCustomCategory} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: '1 1 auto', maxWidth: '100%', minWidth: 0 }}>
              <input
                type="text"
                className="form-input"
                placeholder="New Category..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                style={{ height: 32, fontSize: 13, padding: '0 10px', minWidth: 0, flex: '1 1 120px' }}
                aria-label="New category name"
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                + Add
              </button>
            </form>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(categories || []).map((cat) => (
              <span key={cat} className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {cat}
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat)}
                  style={{ background: 'none', border: 'none', color: 'var(--app-text-muted, #71717a)', cursor: 'pointer', padding: 0 }}
                  title={`Remove ${cat}`}
                  aria-label={`Remove category ${cat}`}
                >
                  &times;
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
              Resolution deadline in hours per operational category for {currentOrg?.name || 'Workspace'}.
            </p>
          </div>
        </div>

        {/* Desktop SLA Table */}
        <div className="sla-desktop-table table-scroll">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Target SLA</th>
                <th>Response Commitment</th>
              </tr>
            </thead>
            <tbody>
              {(categories || []).map((cat) => (
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

        {/* Mobile SLA Touch Cards */}
        <div className="sla-mobile-cards">
          {(categories || []).map((cat) => (
            <div
              key={cat}
              className="card card-pad"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                background: 'var(--app-card-bg, #ffffff)',
                border: '1px solid var(--app-border-soft, #e4e4e7)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--app-text, #18181b)' }}>
                  {cat}
                </span>
                <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                  Response &le; 2h
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ fontSize: 12, color: 'var(--app-text-muted, #71717a)', flexShrink: 0 }}>
                  Target SLA:
                </label>
                <select
                  value={slaTargets[cat] || 24}
                  onChange={(e) => handleUpdateSla(cat, e.target.value)}
                  className="table-select form-select"
                  aria-label={`SLA target for ${cat}`}
                  style={{ width: '100%', height: 36, fontSize: 13 }}
                >
                  {SLA_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Staff & Members Governance Link */}
      <section
        className="card card-pad"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginTop: 20,
        }}
      >
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} className="tone-accent" />
            Staff &amp; Member Governance
          </h2>
          <p className="card-subtitle">
            Manage organization members, elevate normal users to {currentOrg?.staffTerm || 'Staff'}, and assign resolvers to departments.
          </p>
        </div>
        <Link
          to="/admin/members"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Users size={15} />
          Open Staff &amp; Members Console
        </Link>
      </section>

      {/* Configure Organization Modal */}
      {showOrgConfigModal && (
        <Modal
          title="Customize Organization Profile"
          subtitle={currentOrg?.name || 'Workspace Profile'}
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
}
