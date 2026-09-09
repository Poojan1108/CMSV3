import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ROLES,
  ORG_TEMPLATES,
  resolveOrg,
  getOrgCategories,
  getOrgLocationLabel,
  getOrgUserLabel,
  getRoleTerm,
} from '../utils/constants';

import { authApi } from '../services/api';
import {
  supabase,
  isSupabaseConfigured,
  getUserProfile,
  upsertUserProfile,
  fetchOrgProfiles,
} from '../services/supabaseClient';

const AuthContext = createContext(null);

const STORAGE_USER_KEY = 'cms_active_user_v1';
const STORAGE_ORG_KEY = 'cms_active_org_v1';
const STORAGE_CUSTOM_ORGS_KEY = 'cms_custom_orgs_v1';
const STORAGE_REGISTERED_USERS_KEY = 'cms_registered_users_v1';

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

  // Persistent registry of all users created on this browser/session
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_REGISTERED_USERS_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load registered users', e);
      }
    }
    return [];
  });

  // Live organization member profiles fetched from Supabase
  const [orgProfiles, setOrgProfiles] = useState([]);

  const [orgTemplates, setOrgTemplates] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_CUSTOM_ORGS_KEY);
        if (saved) {
          return { ...ORG_TEMPLATES, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.error('Failed to load custom orgs', e);
      }
    }
    return { ...ORG_TEMPLATES };
  });

  const [currentOrgKey, setCurrentOrgKey] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedOrg = localStorage.getItem(STORAGE_ORG_KEY);
      if (savedOrg) return savedOrg.toUpperCase();
    }
    return 'COLLEGE';
  });

  const [loading, setLoading] = useState(false);
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
      localStorage.setItem(STORAGE_REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));
    } catch (e) {
      console.error('Failed to save registered users', e);
    }
  }, [registeredUsers]);

  useEffect(() => {
    try {
      const customOnly = {};
      Object.keys(orgTemplates).forEach((k) => {
        if (!ORG_TEMPLATES[k] || k.startsWith('ORG_') || k === 'CUSTOM') {
          customOnly[k] = orgTemplates[k];
        }
      });
      localStorage.setItem(STORAGE_CUSTOM_ORGS_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.error('Failed to save custom orgs', e);
    }
  }, [orgTemplates]);

  // Fetch live organization profiles from Supabase for staff assignment
  useEffect(() => {
    let isMounted = true;
    const loadProfiles = async () => {
      if (isSupabaseConfigured && supabase) {
        const profiles = await fetchOrgProfiles(currentOrgKey);
        if (isMounted && profiles && profiles.length > 0) {
          setOrgProfiles(profiles);
        }
      }
    };
    loadProfiles();
    return () => {
      isMounted = false;
    };
  }, [currentOrgKey]);

  // Synchronize Supabase Auth session on mount and live auth changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let isMounted = true;

    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted || !session?.user) return;
      const profile = await getUserProfile(session.user.id);
      const role = (profile?.role || session.user.user_metadata?.role || ROLES.STUDENT).toLowerCase();
      const org = profile?.org_key || session.user.user_metadata?.orgKey || currentOrgKey;
      const resolvedUser = {
        id: session.user.id,
        email: session.user.email,
        name: profile?.name || session.user.user_metadata?.name || session.user.email.split('@')[0],
        role,
        orgKey: org,
        department: profile?.department || '',
        avatar: profile?.avatar_url || session.user.user_metadata?.avatar || null,
      };
      setCurrentUser(resolvedUser);
      if (org) setCurrentOrgKey(org);
    });

    // Subscribe to Supabase auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const profile = await getUserProfile(session.user.id);
          const role = (profile?.role || session.user.user_metadata?.role || ROLES.STUDENT).toLowerCase();
          const org = profile?.org_key || session.user.user_metadata?.orgKey || currentOrgKey;
          const resolvedUser = {
            id: session.user.id,
            email: session.user.email,
            name: profile?.name || session.user.user_metadata?.name || session.user.email.split('@')[0],
            role,
            orgKey: org,
            department: profile?.department || '',
            avatar: profile?.avatar_url || session.user.user_metadata?.avatar || null,
          };
          setCurrentUser(resolvedUser);
          if (org) setCurrentOrgKey(org);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [currentOrgKey]);

  /**
   * Create a new Custom Organization (Admin creation)
   */
  const createCustomOrg = (newOrg) => {
    const slug = (newOrg.name || 'CUSTOM')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .substring(0, 16);
    const key = `ORG_${slug}_${Date.now().toString().slice(-4)}`;

    const baseTemplate = ORG_TEMPLATES[newOrg.baseTemplate] || ORG_TEMPLATES.CUSTOM;

    const templateConfig = {
      name: newOrg.name.trim(),
      type: newOrg.baseTemplate?.toLowerCase() || 'custom',
      userLabel: newOrg.userTerm || baseTemplate.userLabel || 'Member',
      userTerm: newOrg.userTerm || baseTemplate.userTerm || 'Member',
      staffTerm: newOrg.staffTerm || baseTemplate.staffTerm || 'Staff',
      adminTerm: 'Admin',
      categories: newOrg.categories && newOrg.categories.length > 0 ? newOrg.categories : baseTemplate.categories,
      locationLabel: newOrg.locationLabel || baseTemplate.locationLabel || 'Location / Address',
    };

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
  const updateOrgSettings = (key, updatedFields) => {
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
          throw new Error(error.message || 'Supabase authentication failed');
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
            department: profile?.department || '',
            avatar: profile?.avatar_url || data.user.user_metadata?.avatar || null,
          };

          // Synchronize profile if not yet in database
          if (!profile) {
            await upsertUserProfile(loggedInUser);
          }
        }
      }

      // 2. Fallback Transport: Local registry / API if Supabase offline
      if (!loggedInUser) {
        try {
          const res = await authApi.login(email, password);
          if (res && res.user) {
            loggedInUser = res.user;
          }
        } catch (apiErr) {
          console.info('[Auth] Server API offline, checking local registry:', apiErr.message);
        }

        const matchedRegistered = registeredUsers.find(
          (u) => (u.email || '').toLowerCase() === cleanEmail
        );

        if (!loggedInUser) {
          if (matchedRegistered) {
            loggedInUser = { ...matchedRegistered };
          } else {
            loggedInUser = {
              id: `usr_${Date.now()}`,
              name: cleanEmail.split('@')[0],
              email: cleanEmail,
              role: ROLES.STUDENT,
              orgKey: currentOrgKey,
            };
            setRegisteredUsers((prev) => [...prev, loggedInUser]);
          }
        } else if (matchedRegistered) {
          loggedInUser = {
            ...matchedRegistered,
            ...loggedInUser,
            role: matchedRegistered.role || loggedInUser.role,
            orgKey: matchedRegistered.orgKey || loggedInUser.orgKey || currentOrgKey,
          };
        }
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
   */
  const signup = async (email, password, name, role = ROLES.STUDENT, targetOrgKey = null, newOrgData = null) => {
    setAuthError(null);
    setLoading(true);
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      let effectiveOrgKey = targetOrgKey || currentOrgKey;
      let effectiveRole = String(role || ROLES.STUDENT).toLowerCase();

      // If user registers a new organization, create it and designate user as Admin
      if (newOrgData && newOrgData.name) {
        const { key } = createCustomOrg(newOrgData);
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

      // 2. Fallback Transport: Local registry / API if Supabase offline
      if (!registeredUser) {
        try {
          const res = await authApi.register({
            name,
            email: cleanEmail,
            password,
            role: effectiveRole,
            orgKey: effectiveOrgKey,
          });
          if (res && res.user) {
            registeredUser = res.user;
          }
        } catch (apiErr) {
          console.info('[Auth] Server API offline, saving to local registry:', apiErr.message);
        }

        if (!registeredUser) {
          registeredUser = {
            id: `usr_${Date.now()}`,
            name: name || cleanEmail.split('@')[0],
            email: cleanEmail,
            role: effectiveRole,
            orgKey: effectiveOrgKey,
          };
        } else {
          registeredUser = {
            ...registeredUser,
            role: effectiveRole,
            orgKey: effectiveOrgKey,
          };
        }
      }

      // Persist in local registry
      setRegisteredUsers((prev) => {
        const filtered = prev.filter((u) => (u.email || '').toLowerCase() !== cleanEmail);
        return [...filtered, registeredUser];
      });

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

    // Also update in registeredUsers registry
    setRegisteredUsers((prev) =>
      prev.map((u) =>
        (u.email || '').toLowerCase() === (currentUser.email || '').toLowerCase()
          ? { ...u, role: normalizedRole }
          : u
      )
    );
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

  const activeOrg = orgTemplates[currentOrgKey] || ORG_TEMPLATES[currentOrgKey] || resolveOrg(currentOrgKey);

  const normalizedRole = (currentUser?.role || ROLES.STUDENT).toLowerCase();

  // Unified roster: live Supabase org profiles + locally registered users (No mock data!)
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

    // 2. Locally registered users
    registeredUsers.forEach((u) => {
      if (u.email && !seen.has(u.email.toLowerCase())) {
        seen.add(u.email.toLowerCase());
        list.push(u);
      }
    });

    // 3. Current user if active
    if (currentUser?.email && !seen.has(currentUser.email.toLowerCase())) {
      seen.add(currentUser.email.toLowerCase());
      list.push(currentUser);
    }

    return list;
  }, [orgProfiles, registeredUsers, currentUser]);

  const value = {
    user: currentUser ? { ...currentUser, role: normalizedRole } : null,
    currentUser: currentUser ? { ...currentUser, role: normalizedRole } : null,
    role: normalizedRole,
    isStudent: normalizedRole === ROLES.STUDENT,
    isStaff: normalizedRole === ROLES.STAFF,
    isAdmin: normalizedRole === ROLES.ADMIN,
    loading,
    authError,
    login,
    signup,
    updateUserRole,
    resetPassword,
    logout,
    setUser,
    availableUsers: allAvailableUsers,

    // Dynamic Multi-Tenant Organization State
    currentOrg: activeOrg,
    orgKey: currentOrgKey,
    orgTemplates,
    createCustomOrg,
    updateOrgSettings,
    switchOrgTemplate,
    categories: activeOrg.categories || [],
    locationLabel: activeOrg.locationLabel || 'Location',
    userLabel: activeOrg.userLabel || activeOrg.userTerm || 'Student',
    userTerm: activeOrg.userTerm || activeOrg.userLabel || 'Student',
    getRoleTerm: (targetRole) => {
      const r = targetRole || currentUser?.role;
      if (r === ROLES.ADMIN) return activeOrg.adminTerm || 'Admin';
      if (r === ROLES.STAFF) return activeOrg.staffTerm || 'Staff';
      return activeOrg.userTerm || activeOrg.userLabel || 'Student';
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

