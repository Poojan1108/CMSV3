import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  ROLES,
  ORG_TEMPLATES,
  ORG_ARCHETYPES,
  SEEDED_ORGS,
  UNIVERSAL_FALLBACK_ORG,
  resolveOrg,
  getOrgCategories,
  getOrgLocationLabel,
  getOrgUserLabel,
  getRoleTerm,
} from '../utils/constants';

import {
  supabase,
  isSupabaseConfigured,
  getUserProfile,
  upsertUserProfile,
  fetchOrgProfiles,
  fetchOrganizations,
  createOrganization,
  setRealtimeAuth,
  updateMemberRole,
  clearUserProfileCache,
  clearOrgProfilesCache,
} from '../services/supabaseClient';
import { complaintService } from '../services/complaintService';


const AuthContext = createContext(null);

const STORAGE_USER_KEY = 'cms_active_user_v1';
const STORAGE_ORG_KEY = 'cms_active_org_v1';
const STORAGE_CUSTOM_ORGS_KEY = 'cms_custom_orgs_v1';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem(STORAGE_USER_KEY);
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (e) {
          console.error('Failed to parse saved auth user', e);
        }
      }
    }
    return null;
  });

  // Live organization member profiles fetched from Supabase
  const [orgProfiles, setOrgProfiles] = useState([]);

  const [orgTemplates, setOrgTemplates] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_CUSTOM_ORGS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const hasLegacyJunk = Object.keys(parsed).some(
            (k) => parsed[k]?.name?.includes('<script') || parsed[k]?.name?.includes('Apex') || parsed[k]?.name?.includes('Safe Institute')
          );
          if (hasLegacyJunk) {
            localStorage.removeItem(STORAGE_CUSTOM_ORGS_KEY);
            return { ...ORG_TEMPLATES, ...SEEDED_ORGS };
          }
          return { ...ORG_TEMPLATES, ...SEEDED_ORGS, ...parsed };
        }
      } catch (e) {
        console.error('Failed to load custom orgs', e);
      }
    }
    return { ...ORG_TEMPLATES, ...SEEDED_ORGS };
  });

  const [currentOrgKey, setCurrentOrgKey] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedOrg = localStorage.getItem(STORAGE_ORG_KEY);
      if (savedOrg) return savedOrg.toUpperCase();
      const savedUser = localStorage.getItem(STORAGE_USER_KEY);
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed?.orgKey) return parsed.orgKey.toUpperCase();
        } catch (e) {}
      }
    }
    return '';
  });

  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const currentOrgKeyRef = useRef(currentOrgKey);
  useEffect(() => {
    currentOrgKeyRef.current = currentOrgKey;
  }, [currentOrgKey]);
  const [authError, setAuthError] = useState(null);

  // Sync current user to local storage for offline resilience
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_USER_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentOrgKey) {
      localStorage.setItem(STORAGE_ORG_KEY, currentOrgKey);
    }
  }, [currentOrgKey]);


  useEffect(() => {
    try {
      const customOnly = {};
      Object.keys(orgTemplates).forEach((k) => {
        if (!ORG_TEMPLATES[k] && !SEEDED_ORGS[k] && !orgTemplates[k]?.name?.includes('<script')) {
          customOnly[k] = orgTemplates[k];
        }
      });
      localStorage.setItem(STORAGE_CUSTOM_ORGS_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.error('Failed to save custom orgs', e);
    }
  }, [orgTemplates]);

  // Initial synchronization: fetch live organizations and session in parallel without rendering uninitialized fallbacks
  useEffect(() => {
    let isMounted = true;

    const initializeAuthAndOrgs = async () => {
      try {
        const [orgListRes, sessionRes] = await Promise.allSettled([
          fetchOrganizations(),
          isSupabaseConfigured && supabase
            ? supabase.auth.getSession()
            : Promise.resolve({ data: { session: null } }),
        ]);

        if (!isMounted) return;

        // 1. Process Organizations from Supabase
        const liveOrgs = {};
        if (orgListRes.status === 'fulfilled' && Array.isArray(orgListRes.value) && orgListRes.value.length > 0) {
          orgListRes.value.forEach((o) => {
            const rawAdmin = o.admin_term || 'Admin';
            const adminTerm =
              rawAdmin === 'Operations / HR Admin' || rawAdmin === 'Admin & HR'
                ? 'Workspace Admin'
                : rawAdmin;



            liveOrgs[o.org_key] = {
              name: o.name,
              type: o.type,
              userLabel: o.user_term || 'Member',
              userTerm: o.user_term || 'Member',
              staffTerm: o.staff_term || 'Staff',
              adminTerm,
              locationLabel: o.location_label || 'Location / Address',
              categories: Array.isArray(o.categories) ? o.categories : [],
            };
          });
          setOrgTemplates({ ...ORG_TEMPLATES, ...liveOrgs });
        } else {
          setOrgTemplates({ ...ORG_TEMPLATES, ...SEEDED_ORGS });
        }

        // 2. Process Session and User Profile
        let userOrgKey = null;
        if (sessionRes.status === 'fulfilled' && sessionRes.value?.data?.session?.user) {
          const session = sessionRes.value.data.session;
          if (session.access_token) {
            setRealtimeAuth(session.access_token);
          }
          const profile = await getUserProfile(session.user.id);
          const role = (profile?.role || session.user.user_metadata?.role || ROLES.STUDENT).toLowerCase();
          const org = profile?.org_key || session.user.user_metadata?.orgKey || currentOrgKey;
          userOrgKey = org;
          const resolvedUser = {
            id: session.user.id,
            email: session.user.email,
            name: profile?.name || session.user.user_metadata?.name || session.user.email.split('@')[0],
            role,
            orgKey: org,
            department: profile?.department || '',
            avatar: profile?.avatar_url || session.user.user_metadata?.avatar || null,
          };
          setCurrentUser((prev) => {
            if (
              prev &&
              prev.id === resolvedUser.id &&
              prev.email === resolvedUser.email &&
              prev.role === resolvedUser.role &&
              prev.orgKey === resolvedUser.orgKey &&
              prev.name === resolvedUser.name &&
              prev.department === resolvedUser.department
            ) {
              return prev;
            }
            return resolvedUser;
          });
          if (org) {
            setCurrentOrgKey((prev) => (prev === org ? prev : org));
          }
        }

        // 3. Reconcile Organization Key cleanly
        setCurrentOrgKey((prev) => {
          const target = userOrgKey || prev;
          if (target && (liveOrgs[target] || ORG_TEMPLATES[target] || SEEDED_ORGS[target])) {
            return target;
          }
          return Object.keys(liveOrgs)[0] || target || Object.keys(SEEDED_ORGS)[0] || '';
        });
      } catch (err) {
        console.warn('[AuthContext] Initialization error:', err);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeAuthAndOrgs();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch live organization staff profiles from Supabase for staff assignment & admin rosters
  useEffect(() => {
    let isMounted = true;
    const userRole = (currentUser?.role || ROLES.STUDENT).toLowerCase();

    // Only staff and admin require the active member roster; students are shielded
    if (userRole !== ROLES.STAFF && userRole !== ROLES.ADMIN) {
      setOrgProfiles([]);
      return;
    }

    const loadProfiles = async () => {
      if (isSupabaseConfigured && supabase && currentOrgKey) {
        const filter = userRole === ROLES.ADMIN ? 'all' : ['staff', 'admin'];
        const profiles = await fetchOrgProfiles(currentOrgKey, filter);
        if (isMounted && profiles) {
          setOrgProfiles(profiles);
        }
      }
    };
    loadProfiles();
    return () => {
      isMounted = false;
    };
  }, [currentOrgKey, currentUser?.role]);

  // Synchronize Supabase Auth session on live auth changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let isMounted = true;

    // Subscribe to Supabase auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          if (session.access_token) {
            setRealtimeAuth(session.access_token);
          }
          const profile = await getUserProfile(session.user.id);
          const role = (profile?.role || session.user.user_metadata?.role || ROLES.STUDENT).toLowerCase();
          const org = profile?.org_key || session.user.user_metadata?.orgKey || currentOrgKeyRef.current;
          const resolvedUser = {
            id: session.user.id,
            email: session.user.email,
            name: profile?.name || session.user.user_metadata?.name || session.user.email.split('@')[0],
            role,
            orgKey: org,
            department: profile?.department || '',
            avatar: profile?.avatar_url || session.user.user_metadata?.avatar || null,
          };
          setCurrentUser((prev) => {
            if (
              prev &&
              prev.id === resolvedUser.id &&
              prev.email === resolvedUser.email &&
              prev.role === resolvedUser.role &&
              prev.orgKey === resolvedUser.orgKey &&
              prev.name === resolvedUser.name &&
              prev.department === resolvedUser.department
            ) {
              return prev;
            }
            return resolvedUser;
          });
          if (org) {
            setCurrentOrgKey((prev) => (prev === org ? prev : org));
          }
        }
      } else if (event === 'SIGNED_OUT') {
        clearUserProfileCache();
        clearOrgProfilesCache();
        complaintService.clearCache();
        setRealtimeAuth(null);
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Create a new Custom Organization (Admin creation)
   * Enforces declared name validation, uses 3 clean Archetypes, and persists to Supabase.
   */
  const createCustomOrg = async (newOrg) => {
    if (!newOrg || !newOrg.name || !newOrg.name.trim()) {
      throw new Error('Organization name is required and cannot be empty.');
    }
    const trimmedName = newOrg.name.trim();
    if (trimmedName.length < 3) {
      throw new Error('Organization name must be at least 3 characters long.');
    }

    const slug = trimmedName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 16);
    const key = `ORG_${slug}_${Date.now().toString().slice(-4)}`;

    const archetype = ORG_ARCHETYPES[newOrg.baseTemplate] || UNIVERSAL_FALLBACK_ORG;

    const templateConfig = {
      name: trimmedName,
      type: archetype.type || 'college',
      userLabel: newOrg.userTerm?.trim() || archetype.defaultUserTerm || 'Member',
      userTerm: newOrg.userTerm?.trim() || archetype.defaultUserTerm || 'Member',
      staffTerm: newOrg.staffTerm?.trim() || archetype.defaultStaffTerm || 'Staff',
      adminTerm: archetype.defaultAdminTerm || 'Admin',
      categories: newOrg.categories && newOrg.categories.length > 0 ? newOrg.categories : archetype.categories,
      locationLabel: newOrg.locationLabel?.trim() || archetype.defaultLocationLabel || 'Location / Address',
    };

    // Persist globally to Supabase public.organizations
    if (isSupabaseConfigured && supabase) {
      try {
        await createOrganization({
          org_key: key,
          name: templateConfig.name,
          type: templateConfig.type,
          user_term: templateConfig.userTerm,
          staff_term: templateConfig.staffTerm,
          admin_term: templateConfig.adminTerm,
          location_label: templateConfig.locationLabel,
          categories: templateConfig.categories,
        });
      } catch (err) {
        console.warn('[AuthContext] Failed to persist org to Supabase, continuing with local state:', err);
      }
    }

    setOrgTemplates((prev) => ({
      ...prev,
      [key]: templateConfig,
    }));

    setCurrentOrgKey(key);
    return { key, template: templateConfig };
  };


  /**
   * Update settings for an existing organization
   */
  const updateOrgSettings = async (key, updatedFields) => {
    setOrgTemplates((prev) => {
      const existing = prev[key] || ORG_TEMPLATES.CUSTOM;
      return {
        ...prev,
        [key]: {
          ...existing,
          ...updatedFields,
        },
      };
    });

    // Persist to Supabase public.organizations
    if (isSupabaseConfigured && supabase && key) {
      try {
        const payload = {};
        if (updatedFields.name) payload.name = updatedFields.name;
        if (updatedFields.userTerm) payload.user_term = updatedFields.userTerm;
        if (updatedFields.staffTerm) payload.staff_term = updatedFields.staffTerm;
        if (updatedFields.locationLabel) payload.location_label = updatedFields.locationLabel;
        if (updatedFields.categories) payload.categories = updatedFields.categories;
        payload.updated_at = new Date().toISOString();

        await supabase.from('organizations').update(payload).eq('org_key', key);
      } catch (err) {
        console.warn('[AuthContext] Failed to persist org settings to Supabase:', err);
      }
    }
  };

  /**
   * Login with Email and Password
   */
  const login = async (email, password) => {
    setAuthError(null);
    setLoading(true);
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      let loggedInUser = null;

      // 1. Primary Authentication: Supabase Auth
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          throw new Error(error.message || 'Invalid email or password.');
        }

        if (data?.user) {
          const profile = await getUserProfile(data.user.id);
          const role = (profile?.role || data.user.user_metadata?.role || ROLES.STUDENT).toLowerCase();
          const org = profile?.org_key || data.user.user_metadata?.orgKey || currentOrgKey;

          loggedInUser = {
            id: data.user.id,
            name: profile?.name || data.user.user_metadata?.name || cleanEmail.split('@')[0],
            email: data.user.email,
            role,
            orgKey: org,
            department: profile?.department_id || profile?.department || '',
            avatar: profile?.avatar_url || data.user.user_metadata?.avatar || null,
          };

          // Synchronize profile if not yet in database
          if (!profile) {
            await upsertUserProfile(loggedInUser);
          }
        }
      }

      if (!loggedInUser) {
        throw new Error('Authentication failed. Please verify your credentials.');
      }

      // Normalize role
      if (loggedInUser.role) {
        loggedInUser.role = String(loggedInUser.role).toLowerCase();
      }

      // Auto-activate user's bound organization
      if (loggedInUser.orgKey) {
        setCurrentOrgKey(loggedInUser.orgKey);
      }

      setCurrentUser(loggedInUser);
      setLoading(false);
      return { success: true, user: loggedInUser };
    } catch (err) {
      setLoading(false);
      setAuthError(err.message || 'Login failed');
      throw err;
    }
  };

  /**
   * Sign-Up with Email, Password, Name, Role & Organization
   * Enforces ROLES.STUDENT for public registration (Privilege Escalation Prevention)
   */
  const signup = async (email, password, name, role = ROLES.STUDENT, targetOrgKey = null, newOrgData = null) => {
    setAuthError(null);
    setLoading(true);
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      let effectiveOrgKey = targetOrgKey || currentOrgKey;
      let effectiveRole = ROLES.STUDENT; // Strict default: public signups are always student

      // Only tenant creators registering a brand-new organization become ADMIN
      if (newOrgData && newOrgData.name) {
        const { key } = await createCustomOrg(newOrgData);
        effectiveOrgKey = key;
        effectiveRole = ROLES.ADMIN;
      }

      let registeredUser = null;

      // 1. Primary Registration: Supabase Auth
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: name || cleanEmail.split('@')[0],
              role: effectiveRole,
              orgKey: effectiveOrgKey,
            },
          },
        });

        if (error) {
          if (error.message?.toLowerCase().includes('rate limit')) {
            throw new Error(
              "Supabase email rate limit exceeded. To fix: Open Supabase Dashboard > Authentication > Providers > Email and turn OFF 'Confirm email'."
            );
          }
          throw new Error(error.message || 'Supabase registration failed');
        }

        if (data?.user) {
          registeredUser = {
            id: data.user.id,
            name: name || cleanEmail.split('@')[0],
            email: cleanEmail,
            role: effectiveRole,
            orgKey: effectiveOrgKey,
          };

          // Save profile row in public.profiles immediately
          await upsertUserProfile(registeredUser);
        }
      }

      if (!registeredUser) {
        throw new Error('Registration failed. Please try again.');
      }

      setCurrentOrgKey(effectiveOrgKey);
      setCurrentUser(registeredUser);
      setLoading(false);
      return { success: true, user: registeredUser };
    } catch (err) {
      setLoading(false);
      setAuthError(err.message || 'Registration failed');
      throw err;
    }
  };

  /**
   * Update role for the current logged-in user
   */
  const updateUserRole = async (newRole) => {
    if (!currentUser || !newRole) return;
    const normalizedRole = String(newRole).toLowerCase();
    const updated = {
      ...currentUser,
      role: normalizedRole,
    };
    setCurrentUser(updated);

    // Update in Supabase profile
    if (isSupabaseConfigured && supabase && currentUser.id) {
      await upsertUserProfile({ id: currentUser.id, role: normalizedRole });
    }
  };

  /**
   * Admin Member Lifecycle: Promote or update a member's role and department
   */
  const updateMemberRoleAndDept = async (memberId, { role, departmentId = null, departmentName = null, assignedCategories = [] }) => {
    if (!memberId || !role) return { success: false, error: 'Missing member ID or role' };
    try {
      if (isSupabaseConfigured && supabase) {
        await updateMemberRole(memberId, {
          role,
          departmentId,
          departmentName,
          assignedCategories,
        });
      }

      // Optimistically update local orgProfiles state
      setOrgProfiles((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? {
                ...m,
                role: role.toLowerCase(),
                departmentId: departmentId || null,
                department: departmentName || '',
                assignedCategories: assignedCategories || [],
              }
            : m
        )
      );

      // If current user modified their own profile, sync active session
      if (currentUser?.id === memberId) {
        setCurrentUser((prev) => ({
          ...prev,
          role: role.toLowerCase(),
          departmentId: departmentId || null,
          department: departmentName || '',
        }));
      }

      return { success: true };
    } catch (err) {
      console.error('[AuthContext updateMemberRoleAndDept Error]:', err);
      return { success: false, error: err.message || 'Failed to update member role' };
    }
  };

  /**
   * Refetches the live member roster for the active organization
   */
  const reloadOrgProfiles = async (roleFilterOverride = null) => {
    if (isSupabaseConfigured && supabase && currentOrgKey) {
      const userRole = (currentUser?.role || ROLES.STUDENT).toLowerCase();
      const filter = roleFilterOverride || (userRole === ROLES.ADMIN ? 'all' : ['staff', 'admin']);
      const profiles = await fetchOrgProfiles(currentOrgKey, filter);
      if (profiles) {
        setOrgProfiles(profiles);
      }
      return profiles;
    }
    return [];
  };

  /**
   * Send Password Reset Email
   */
  const resetPassword = async (email) => {
    setAuthError(null);
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
      } catch (err) {
        console.warn('[Supabase resetPassword Error]:', err.message);
      }
    }
    return {
      success: true,
      message: `Password reset instructions sent to ${email}.`,
    };
  };

  /**
   * Logout and clear session
   */
  const logout = async () => {
    clearUserProfileCache();
    clearOrgProfilesCache();
    complaintService.clearCache();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('[Supabase signOut Error]:', e);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_USER_KEY);
  };

  /**
   * Switch organization template
   */
  const switchOrgTemplate = (templateKey) => {
    if (!templateKey) return;
    const key = String(templateKey).toUpperCase();
    if (orgTemplates[key] || ORG_TEMPLATES[key]) {
      setCurrentOrgKey(key);
    }
  };

  const setUser = (user) => {
    setCurrentUser(user);
  };

  const activeOrg = orgTemplates[currentOrgKey] || ORG_TEMPLATES[currentOrgKey] || resolveOrg(currentOrgKey, orgTemplates);

  const normalizedRole = (currentUser?.role || ROLES.STUDENT).toLowerCase();

  // Unified roster: live Supabase org profiles + active session user
  const allAvailableUsers = useMemo(() => {
    const seen = new Set();
    const list = [];

    // 1. Supabase live team members
    orgProfiles.forEach((u) => {
      if (u.email && !seen.has(u.email.toLowerCase())) {
        seen.add(u.email.toLowerCase());
        list.push(u);
      }
    });

    // 2. Current user if active
    if (currentUser?.email && !seen.has(currentUser.email.toLowerCase())) {
      seen.add(currentUser.email.toLowerCase());
      list.push(currentUser);
    }

    return list;
  }, [orgProfiles, currentUser]);

  const value = {
    user: currentUser ? { ...currentUser, role: normalizedRole } : null,
    currentUser: currentUser ? { ...currentUser, role: normalizedRole } : null,
    role: normalizedRole,
    isStudent: normalizedRole === ROLES.STUDENT,
    isStaff: normalizedRole === ROLES.STAFF,
    isAdmin: normalizedRole === ROLES.ADMIN,
    loading,
    isInitializing,
    authError,
    login,
    signup,
    updateUserRole,
    updateMemberRoleAndDept,
    reloadOrgProfiles,
    resetPassword,
    logout,
    setUser,
    orgProfiles,
    availableUsers: allAvailableUsers,

    // Dynamic Multi-Tenant Organization State
    currentOrg: activeOrg,
    orgKey: currentOrgKey,
    orgTemplates,
    createCustomOrg,
    updateOrgSettings,
    switchOrgTemplate,
    categories: activeOrg.categories || [],
    locationLabel: activeOrg.locationLabel || 'Location / Room / Desk',
    userLabel: activeOrg.userLabel || activeOrg.userTerm || 'Member',
    userTerm: activeOrg.userTerm || activeOrg.userLabel || 'Member',
    getRoleTerm: (targetRole) => {
      const r = targetRole || currentUser?.role;
      if (r === ROLES.ADMIN) {
        const term = activeOrg.adminTerm || 'Workspace Admin';
        return term === 'Operations / HR Admin' || term === 'Admin & HR' ? 'Workspace Admin' : term;
      }
      if (r === ROLES.STAFF) return activeOrg.staffTerm || 'Staff Resolver';
      return activeOrg.userTerm || activeOrg.userLabel || 'Member';
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

