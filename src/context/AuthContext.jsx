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

const AuthContext = createContext(null);

const STORAGE_USER_KEY = 'cms_active_user_v1';
const STORAGE_ORG_KEY = 'cms_active_org_v1';

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
    // Default to Alex Chen (Student)
    return MOCK_USERS[0];
  });

  const [currentOrgKey, setCurrentOrgKey] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedOrg = localStorage.getItem(STORAGE_ORG_KEY);
      if (savedOrg && ORG_TEMPLATES[savedOrg.toUpperCase()]) {
        return savedOrg.toUpperCase();
      }
    }
    return 'COLLEGE';
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentOrgKey) {
      localStorage.setItem(STORAGE_ORG_KEY, currentOrgKey);
    }
  }, [currentOrgKey]);

  /**
   * Switch organization template.
   * Accepts template key e.g. 'COLLEGE' | 'SOCIETY' | 'CORPORATE' | 'CUSTOM'.
   */
  const switchOrgTemplate = (templateKey) => {
    if (!templateKey) return;
    const key = String(templateKey).toUpperCase();
    if (ORG_TEMPLATES[key]) {
      setCurrentOrgKey(key);
    } else {
      console.warn(`Organization template '${templateKey}' not found in ORG_TEMPLATES.`);
    }
  };

  /**
   * Seamlessly switch active role / persona for testing.
   * Accepts role string ('student' | 'staff' | 'admin') or user ID ('usr_student_1' | ...).
   */
  const switchRole = (roleOrUserId) => {
    let matchedUser = MOCK_USERS.find((u) => u.id === roleOrUserId);

    if (!matchedUser) {
      // Find first user matching the target role
      matchedUser = MOCK_USERS.find((u) => u.role === roleOrUserId);
    }

    if (matchedUser) {
      setCurrentUser(matchedUser);
    } else {
      console.warn(`User or role '${roleOrUserId}' not found in mock users.`);
    }
  };

  /**
   * Set specific user profile directly
   */
  const setUser = (user) => {
    setCurrentUser(user);
  };

  const activeOrg = resolveOrg(currentOrgKey);

  const value = {
    user: currentUser,
    currentUser,
    role: currentUser?.role || ROLES.STUDENT,
    isStudent: currentUser?.role === ROLES.STUDENT,
    isStaff: currentUser?.role === ROLES.STAFF,
    isAdmin: currentUser?.role === ROLES.ADMIN,
    switchRole,
    setUser,
    availableUsers: MOCK_USERS,

    // Organization Template State & Dynamic Resolvers
    currentOrg: activeOrg,
    orgKey: currentOrgKey,
    switchOrgTemplate,
    orgTemplates: ORG_TEMPLATES,
    categories: getOrgCategories(activeOrg),
    locationLabel: getOrgLocationLabel(activeOrg),
    userLabel: getOrgUserLabel(activeOrg),
    userTerm: getOrgUserLabel(activeOrg),
    getRoleTerm: (targetRole) => getRoleTerm(targetRole || currentUser?.role, activeOrg),
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
