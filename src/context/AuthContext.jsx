import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USERS } from '../data/mockData';
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
    return MOCK_USERS[0];
  });

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
        if (!ORG_TEMPLATES[k] || k.startsWith('ORG_') || k === 'CUSTOM') {
          customOnly[k] = orgTemplates[k];
        }
      });
      localStorage.setItem(STORAGE_CUSTOM_ORGS_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.error('Failed to save custom orgs', e);
    }
  }, [orgTemplates]);

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
      let loggedInUser = null;
      try {
        const res = await authApi.login(email, password);
        if (res && res.user) {
          loggedInUser = res.user;
        }
      } catch (apiErr) {
        console.info('[Auth] Server API offline or unreachable, using local session:', apiErr.message);
      }

      if (!loggedInUser) {
        loggedInUser = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase()) || {
          id: `usr_${Date.now()}`,
          name: email.split('@')[0],
          email,
          role: ROLES.STUDENT,
          orgKey: currentOrgKey,
        };
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
      let effectiveOrgKey = targetOrgKey || currentOrgKey;
      let effectiveRole = role;

      // If user registers a new organization, create it and designate user as Admin
      if (newOrgData && newOrgData.name) {
        const { key } = createCustomOrg(newOrgData);
        effectiveOrgKey = key;
        effectiveRole = ROLES.ADMIN;
      }

      let registeredUser = null;
      try {
        const res = await authApi.register({ name, email, password, role: effectiveRole, orgKey: effectiveOrgKey });
        if (res && res.user) {
          registeredUser = res.user;
        }
      } catch (apiErr) {
        console.info('[Auth] Server API offline or unreachable, using local session:', apiErr.message);
      }

      if (!registeredUser) {
        registeredUser = {
          id: `usr_${Date.now()}`,
          name: name || email.split('@')[0],
          email,
          role: effectiveRole,
          orgKey: effectiveOrgKey,
        };
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
    const updated = {
      ...currentUser,
      role: newRole,
    };
    setCurrentUser(updated);
  };

  /**
   * Send Password Reset Email (Mock / REST)
   */
  const resetPassword = async (email) => {
    setAuthError(null);
    return {
      success: true,
      message: `Password reset instructions sent to ${email}.`,
    };
  };

  /**
   * Logout and clear session
   */
  const logout = async () => {
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

  const value = {
    user: currentUser,
    currentUser,
    role: currentUser?.role || ROLES.STUDENT,
    isStudent: currentUser?.role === ROLES.STUDENT,
    isStaff: currentUser?.role === ROLES.STAFF,
    isAdmin: currentUser?.role === ROLES.ADMIN,
    loading,
    authError,
    login,
    signup,
    updateUserRole,
    resetPassword,
    logout,
    setUser,
    availableUsers: MOCK_USERS,

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

