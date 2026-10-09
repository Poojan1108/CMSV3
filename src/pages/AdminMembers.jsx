import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Search,
  UserCheck,
  Shield,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  RefreshCw,
  Check,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../utils/constants';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import {
  PageHeader,
  Modal,
  EmptyState,
  LoadingState,
} from '../components/ui';

export default function AdminMembers() {
  const {
    currentUser,
    currentOrg,
    orgKey,
    orgProfiles,
    updateMemberRoleAndDept,
    reloadOrgProfiles,
    categories,
  } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'staff' | 'student' | 'admin'
  const [departments, setDepartments] = useState([]);

  // Selected member for Role Promotion / Edit Modal
  const [activeModalMember, setActiveModalMember] = useState(null);
  const [targetRole, setTargetRole] = useState(ROLES.STAFF);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDeptName, setSelectedDeptName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic Archetype Terminology
  const userTerm = currentOrg?.userTerm || 'Student';
  const staffTerm = currentOrg?.staffTerm || 'Staff Resolver';
  const adminTerm = currentOrg?.adminTerm || 'Admin';

  const categoriesKey = (categories || []).join(',');

  // Load available departments for the active organization
  useEffect(() => {
    let isMounted = true;
    const fetchDepartments = async () => {
      if (isSupabaseConfigured && supabase && orgKey) {
        try {
          let { data, error } = await supabase
            .from('departments')
            .select('id, name, description')
            .eq('org_key', orgKey);

          // Proactively seed missing departments based on categories to guarantee UUID availability
          const existingNames = new Set((data || []).map(d => d.name));
          const missingCategories = (categories || []).filter(cat => !existingNames.has(cat));
          
          if (missingCategories.length > 0) {
            const inserts = missingCategories.map(cat => ({
              org_key: orgKey,
              name: cat,
              sla_resolve_hours: 24,
              sla_response_hours: 8
            }));
            
            await supabase.from('departments').insert(inserts);
            
            // Re-fetch to capture the newly generated Postgres UUIDs
            const refresh = await supabase
              .from('departments')
              .select('id, name, description')
              .eq('org_key', orgKey);
              
            if (!refresh.error && refresh.data) {
              data = refresh.data;
            }
          }

          if (!error && Array.isArray(data) && data.length > 0 && isMounted) {
            setDepartments(data);
            return;
          }
        } catch (err) {
          console.warn('[AdminMembers] Department fetch warning:', err);
        }
      }
      // Fallback: derive virtual departments only if Supabase is offline/unconfigured
      if (isMounted) {
        setDepartments(
          (categories || []).map((cat, idx) => ({
            id: `dept_${idx + 1}`,
            name: `${cat} Department`,
            description: `Handles ${cat} service requests and inquiries`,
          }))
        );
      }
    };

    fetchDepartments();
    return () => {
      isMounted = false;
    };
  }, [orgKey, categoriesKey]);

  // Initial roster refresh on mount
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        await reloadOrgProfiles('all');
      } catch (err) {
        console.error('[AdminMembers] Failed to load member roster:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [orgKey]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await reloadOrgProfiles('all');
      showToast('Member roster refreshed', 'info');
    } catch (err) {
      console.error('[AdminMembers] Refresh failed:', err);
      showToast('Failed to refresh roster', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Open the role & department assignment modal
  const handleOpenEditModal = useCallback((member) => {
    setActiveModalMember(member);
    const initialRole =
      member.role === ROLES.ADMIN
        ? ROLES.ADMIN
        : member.role === ROLES.STAFF
        ? ROLES.STAFF
        : ROLES.STAFF;
    setTargetRole(initialRole);
    setSelectedDeptId(member.departmentId || '');
    setSelectedDeptName(member.department || '');
    setSelectedCategories(member.assignedCategories || []);
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveModalMember(null);
    setIsSaving(false);
  }, []);

  const handleToggleCategory = useCallback((category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }, []);

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    setSelectedDeptId(deptId);
    const found = departments.find((d) => d.id === deptId);
    setSelectedDeptName(found ? found.name : '');
  };

  // Save the role & department changes
  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!activeModalMember) return;

    if (activeModalMember.id === currentUser?.id && targetRole !== ROLES.ADMIN) {
      showToast('You cannot demote yourself from the Administrator role', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateMemberRoleAndDept(activeModalMember.id, {
        role: targetRole,
        departmentId: targetRole === ROLES.STAFF ? selectedDeptId : null,
        departmentName: targetRole === ROLES.STAFF ? selectedDeptName : null,
        assignedCategories: targetRole === ROLES.STAFF ? selectedCategories : [],
      });

      if (result.success) {
        const roleLabel =
          targetRole === ROLES.STAFF
            ? staffTerm
            : targetRole === ROLES.ADMIN
            ? adminTerm
            : userTerm;
        showToast(`Updated role for ${activeModalMember.name} to ${roleLabel}`, 'success');
        handleCloseModal();
        await reloadOrgProfiles('all');
      } else {
        showToast(result.error || 'Failed to update member role', 'error');
      }
    } catch (err) {
      console.error('[AdminMembers] Update error:', err);
      showToast('Failed to update member role', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Fast direct demotion to standard user
  const handleQuickDemote = async (member) => {
    if (member.id === currentUser?.id) {
      showToast('You cannot demote yourself from the Administrator role', 'warning');
      return;
    }

    const confirmed = window.confirm(
      `Revoke ${staffTerm} privileges for ${member.name} and return them to ${userTerm}?`
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await updateMemberRoleAndDept(member.id, {
        role: ROLES.STUDENT,
        departmentId: null,
        departmentName: null,
        assignedCategories: [],
      });

      if (result.success) {
        showToast(`${member.name} has been returned to ${userTerm}`, 'info');
        await reloadOrgProfiles('all');
      } else {
        showToast(result.error || 'Failed to demote member', 'error');
      }
    } catch (err) {
      console.error('[AdminMembers] Quick demote error:', err);
      showToast('Failed to update member role', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return (orgProfiles || []).filter((m) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (m.name || '').toLowerCase().includes(query) ||
        (m.email || '').toLowerCase().includes(query) ||
        (m.rollNo || '').toLowerCase().includes(query) ||
        (m.department || '').toLowerCase().includes(query);

      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'staff' && m.role === ROLES.STAFF) ||
        (roleFilter === 'student' && (m.role === ROLES.STUDENT || !m.role || m.role === 'student')) ||
        (roleFilter === 'admin' && m.role === ROLES.ADMIN);

      return matchesSearch && matchesRole;
    });
  }, [orgProfiles, searchQuery, roleFilter]);

  const counts = useMemo(() => {
    const list = orgProfiles || [];
    return {
      all: list.length,
      staff: list.filter((m) => m.role === ROLES.STAFF).length,
      students: list.filter(
        (m) => m.role === ROLES.STUDENT || !m.role || m.role === 'student'
      ).length,
      admins: list.filter((m) => m.role === ROLES.ADMIN).length,
    };
  }, [orgProfiles]);

  return (
    <div
      className="page-container app-shell"
      style={{ maxWidth: 'var(--max-width, 1200px)', margin: '0 auto', paddingBottom: 60 }}
    >
      {/* Header */}
      <PageHeader
        title="Staff & Member Management"
        subtitle={`Govern roles, elevate members to ${staffTerm}, and manage department rosters for ${currentOrg?.name || 'your workspace'}.`}
        action={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={isLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
            Refresh Roster
          </button>
        }
      />

      {/* Roster Controls: Search & Role Filters */}
      <div
        className="card card-pad"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 'min(100%, 240px)' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--app-text-muted, #71717a)',
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 38, width: '100%' }}
            aria-label="Search members roster"
          />
        </div>

        {/* Role Filter Tabs (Scrollable Rail on mobile) */}
        <div className="segmented-filter-rail" style={{ maxWidth: '100%' }}>
          <button
            type="button"
            className={`btn-secondary ${roleFilter === 'all' ? 'btn-secondary-active' : ''}`}
            onClick={() => setRoleFilter('all')}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              borderRadius: 20,
              flexShrink: 0,
              fontWeight: roleFilter === 'all' ? 600 : 400,
              background: roleFilter === 'all' ? 'var(--app-card-bg-subtle, #f4f4f5)' : undefined,
              borderColor: roleFilter === 'all' ? 'var(--app-border-strong, #d4d4d8)' : undefined,
            }}
          >
            All Members ({counts.all})
          </button>
          <button
            type="button"
            className={`btn-secondary ${roleFilter === 'staff' ? 'btn-secondary-active' : ''}`}
            onClick={() => setRoleFilter('staff')}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              borderRadius: 20,
              flexShrink: 0,
              fontWeight: roleFilter === 'staff' ? 600 : 400,
              background: roleFilter === 'staff' ? 'var(--app-card-bg-subtle, #f4f4f5)' : undefined,
              borderColor: roleFilter === 'staff' ? 'var(--app-border-strong, #d4d4d8)' : undefined,
            }}
          >
            {staffTerm} ({counts.staff})
          </button>
          <button
            type="button"
            className={`btn-secondary ${roleFilter === 'student' ? 'btn-secondary-active' : ''}`}
            onClick={() => setRoleFilter('student')}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              borderRadius: 20,
              flexShrink: 0,
              fontWeight: roleFilter === 'student' ? 600 : 400,
              background: roleFilter === 'student' ? 'var(--app-card-bg-subtle, #f4f4f5)' : undefined,
              borderColor: roleFilter === 'student' ? 'var(--app-border-strong, #d4d4d8)' : undefined,
            }}
          >
            {userTerm}s ({counts.students})
          </button>
          <button
            type="button"
            className={`btn-secondary ${roleFilter === 'admin' ? 'btn-secondary-active' : ''}`}
            onClick={() => setRoleFilter('admin')}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              borderRadius: 20,
              flexShrink: 0,
              fontWeight: roleFilter === 'admin' ? 600 : 400,
              background: roleFilter === 'admin' ? 'var(--app-card-bg-subtle, #f4f4f5)' : undefined,
              borderColor: roleFilter === 'admin' ? 'var(--app-border-strong, #d4d4d8)' : undefined,
            }}
          >
            {adminTerm}s ({counts.admins})
          </button>
        </div>
      </div>

      {/* Member Roster Content */}
      {isLoading && orgProfiles.length === 0 ? (
        <LoadingState message="Loading organization roster..." />
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description={
            searchQuery
              ? `No members match "${searchQuery}". Try a different search.`
              : 'No members found matching the selected filter.'
          }
          action={
            searchQuery ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            ) : null
          }
        />
      ) : (
        <>
          {/* Desktop High-Density Table */}
          <div
            className="members-desktop-table table-card"
            style={{ overflowX: 'auto', background: 'var(--app-card-bg, #ffffff)' }}
          >
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--app-border-soft, #e4e4e7)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--app-text-muted)' }}>MEMBER</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--app-text-muted)' }}>CURRENT ROLE</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--app-text-muted)' }}>DEPARTMENT / SCOPE</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--app-text-muted)' }}>CONTACT</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--app-text-muted)', textAlign: 'right' }}>
                    ADMIN ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const isMemberAdmin = member.role === ROLES.ADMIN;
                  const isMemberStaff = member.role === ROLES.STAFF;
                  const isSelf = member.id === currentUser?.id;

                  return (
                    <tr
                      key={member.id}
                      style={{
                        borderBottom: '1px solid var(--app-border-soft, #e4e4e7)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Identity */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className="avatar-wrapper" style={{ width: 38, height: 38, flexShrink: 0 }}>
                            {member.avatar ? (
                              <img src={member.avatar} alt="" className="user-avatar-img" />
                            ) : (
                              <span className="user-avatar-fallback">
                                {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: 'var(--app-text)', fontSize: 14 }}>
                              {member.name || 'Member'}
                              {isSelf && (
                                <span
                                  style={{
                                    marginLeft: 6,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: 'var(--app-card-bg-subtle, #f4f4f5)',
                                    color: 'var(--app-text-secondary)',
                                  }}
                                >
                                  You
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: 'var(--app-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <span>{member.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        {isMemberAdmin ? (
                          <span className="badge status-resolved" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <ShieldCheck size={12} />
                            {adminTerm}
                          </span>
                        ) : isMemberStaff ? (
                          <span className="badge status-in_progress" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <UserCheck size={12} />
                            {staffTerm}
                          </span>
                        ) : (
                          <span className="badge status-default" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {userTerm}
                          </span>
                        )}
                      </td>

                      {/* Department / Scope */}
                      <td style={{ padding: '14px 16px' }}>
                        {isMemberStaff ? (
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--app-text)' }}>
                              {member.department || 'General Resolver'}
                            </div>
                            {member.assignedCategories && member.assignedCategories.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                {member.assignedCategories.slice(0, 2).map((c) => (
                                  <span key={c} className="tag tone-accent" style={{ fontSize: 11 }}>
                                    {c}
                                  </span>
                                ))}
                                {member.assignedCategories.length > 2 && (
                                  <span className="tag" style={{ fontSize: 11 }}>
                                    +{member.assignedCategories.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>
                            {isMemberAdmin ? 'Full Workspace Governance' : 'Standard Member Access'}
                          </span>
                        )}
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 12, color: 'var(--app-text-secondary)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {member.phone && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Phone size={11} /> {member.phone}
                            </span>
                          )}
                          {member.rollNo && (
                            <span>ID: {member.rollNo}</span>
                          )}
                          {!member.phone && !member.rollNo && (
                            <span style={{ color: 'var(--app-text-muted)' }}>&mdash;</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {isMemberAdmin && !isSelf ? (
                          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 12 }}>
                            <ShieldCheck size={13} />
                            Co-Admin
                          </span>
                        ) : isMemberAdmin && isSelf ? (
                          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 12 }}>
                            <Shield size={13} />
                            Active Admin
                          </span>
                        ) : isMemberStaff ? (
                          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEditModal(member)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                            >
                              <Sliders size={13} />
                              Edit Role &amp; Dept
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger-outline btn-sm"
                              onClick={() => handleQuickDemote(member)}
                              title={`Revert to ${userTerm}`}
                            >
                              Demote
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenEditModal(member)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <UserCheck size={13} />
                            Make {staffTerm}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Touch Cards View */}
          <div className="members-mobile-cards">
            {filteredMembers.map((member) => {
              const isMemberAdmin = member.role === ROLES.ADMIN;
              const isMemberStaff = member.role === ROLES.STAFF;
              const isSelf = member.id === currentUser?.id;

              return (
                <div
                  key={member.id}
                  className="card card-pad"
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  {/* Header: Avatar, Name, Email, Role */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <span className="avatar-wrapper" style={{ width: 40, height: 40, flexShrink: 0 }}>
                        {member.avatar ? (
                          <img src={member.avatar} alt="" className="user-avatar-img" />
                        ) : (
                          <span className="user-avatar-fallback">
                            {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--app-text)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {member.name || 'Member'}
                          </span>
                          {isSelf && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: 'var(--app-card-bg-subtle, #f4f4f5)',
                                color: 'var(--app-text-secondary)',
                              }}
                            >
                              You
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--app-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.email}
                        </div>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      {isMemberAdmin ? (
                        <span className="badge status-resolved" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <ShieldCheck size={12} />
                          {adminTerm}
                        </span>
                      ) : isMemberStaff ? (
                        <span className="badge status-in_progress" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <UserCheck size={12} />
                          {staffTerm}
                        </span>
                      ) : (
                        <span className="badge status-default" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {userTerm}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scope & Contact Details */}
                  <div
                    style={{
                      background: 'var(--app-card-bg-subtle, #f8fafc)',
                      padding: '10px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      border: '1px solid var(--app-border-soft, #e4e4e7)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--app-text-muted)' }}>Department:</span>
                      <span style={{ fontWeight: 500, color: 'var(--app-text)' }}>
                        {isMemberStaff ? (member.department || 'General Resolver') : isMemberAdmin ? 'Full Workspace' : 'Standard Member'}
                      </span>
                    </div>

                    {isMemberStaff && member.assignedCategories && member.assignedCategories.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                        {member.assignedCategories.map((c) => (
                          <span key={c} className="tag tone-accent" style={{ fontSize: 11 }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    {(member.phone || member.rollNo) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--app-border-soft, #e4e4e7)', paddingTop: 6 }}>
                        {member.phone ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--app-text-secondary)' }}>
                            <Phone size={11} /> {member.phone}
                          </span>
                        ) : <span />}
                        {member.rollNo && (
                          <span style={{ color: 'var(--app-text-muted)' }}>ID: {member.rollNo}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {isMemberAdmin && !isSelf ? (
                      <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 12px', fontSize: 12, width: '100%', justifyContent: 'center' }}>
                        <ShieldCheck size={13} />
                        Co-Admin
                      </span>
                    ) : isMemberAdmin && isSelf ? (
                      <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 12px', fontSize: 12, width: '100%', justifyContent: 'center' }}>
                        <Shield size={13} />
                        Active Admin
                      </span>
                    ) : isMemberStaff ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditModal(member)}
                          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                        >
                          <Sliders size={13} />
                          Edit Role &amp; Dept
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => handleQuickDemote(member)}
                          title={`Revert to ${userTerm}`}
                          style={{ flex: '0 0 auto', justifyContent: 'center' }}
                        >
                          Demote
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenEditModal(member)}
                        style={{
                          width: '100%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <UserCheck size={13} />
                        Make {staffTerm}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Role & Department Modal */}
      {activeModalMember && (
        <Modal
          title="Assign Role & Department"
          subtitle={`Configure access and dispatch responsibilities for ${activeModalMember.name} (${activeModalMember.email}).`}
          onClose={handleCloseModal}
          maxWidth={540}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseModal}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="role-dept-assignment-form"
                className="btn btn-primary"
                disabled={isSaving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {isSaving ? <RefreshCw size={14} className="spin-animation" /> : <Check size={14} />}
                Confirm &amp; Update Role
              </button>
            </>
          }
        >
          <form id="role-dept-assignment-form" onSubmit={handleSaveRole}>
            {/* Role Selection */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="field-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                Target System Role
              </label>
              <select
                className="form-select"
                style={{ width: '100%', height: 40 }}
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                disabled={activeModalMember.id === currentUser?.id}
              >
                <option value={ROLES.STAFF}>{staffTerm} (Ticket Resolver &amp; Queue Access)</option>
                <option value={ROLES.STUDENT}>{userTerm} (Standard Submitter Access)</option>
                <option value={ROLES.ADMIN}>{adminTerm} (Full Workspace Administrator)</option>
              </select>
              {activeModalMember.id === currentUser?.id && (
                <small style={{ color: 'var(--app-text-muted)', display: 'block', marginTop: 4 }}>
                  You cannot change your own Administrator role.
                </small>
              )}
            </div>

            {/* Department Selection (if Staff) */}
            {targetRole === ROLES.STAFF && (
              <>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="field-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    Assigned Resolver Department
                  </label>
                  <select
                    className="form-select"
                    style={{ width: '100%', height: 40 }}
                    value={selectedDeptId}
                    onChange={handleDepartmentChange}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Handled Categories */}
                <div className="form-group" style={{ marginBottom: 6 }}>
                  <label className="field-label" style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
                    Specialized Categories (Optional)
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      maxHeight: 140,
                      overflowY: 'auto',
                      padding: '10px 12px',
                      background: 'var(--app-card-bg-subtle, #f4f0ea)',
                      borderRadius: 'var(--app-radius, 8px)',
                      border: '1px solid var(--app-border-soft, #e7e5e4)',
                    }}
                  >
                    {(categories || []).map((cat) => {
                      const isChecked = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleToggleCategory(cat)}
                          className={`btn btn-sm ${isChecked ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            borderRadius: 20,
                            height: 28,
                            minHeight: 28,
                            padding: '0 12px',
                            fontSize: 12,
                            fontWeight: 500,
                            gap: 5,
                          }}
                        >
                          {isChecked && <Check size={12} />}
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  <small style={{ color: 'var(--app-text-muted)', display: 'block', marginTop: 6, fontSize: 12 }}>
                    Tickets under these categories will be prioritized for this resolver in dispatch queues.
                  </small>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
