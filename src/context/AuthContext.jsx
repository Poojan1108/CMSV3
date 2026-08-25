import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
import {
  auth,
  isFirebaseConfigured,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  getAuthErrorMessage,
} from '../services/firebase';
import {
  syncUserProfileToSupabase,
  getProfileFromSupabase,
  isSupabaseConfigured,
} from '../services/supabaseClient';

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
    // Default to Alex Chen only if in offline dev testing
    return isFirebaseConfigured ? null : MOCK_USERS[0];
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

  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [authError, setAuthError] = useState(null);

  // Tracks pending role during sign-up to avoid race conditions with onAuthStateChanged
  const pendingSignupRef = useRef(null);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        let assignedRole = ROLES.STUDENT;
        let assignedName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';

        // Check if a pending signup role is queued
        if (pendingSignupRef.current) {
          assignedRole = pendingSignupRef.current.role || assignedRole;
          assignedName = pendingSignupRef.current.name || assignedName;
        }

        let baseUser = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: assignedName,
          role: assignedRole,
          orgKey: currentOrgKey,
        };

        // If Supabase is active, fetch stored profile or create one
        try {
          if (isSupabaseConfigured) {
            const existingDbProfile = await getProfileFromSupabase(firebaseUser.uid);
            if (existingDbProfile) {
              baseUser = {
                ...baseUser,
                ...existingDbProfile,
                role: existingDbProfile.role || assignedRole,
                name: existingDbProfile.name || assignedName,
              };
            } else {
              const synced = await syncUserProfileToSupabase(baseUser, Boolean(pendingSignupRef.current));
              if (synced) {
                baseUser = {
                  ...baseUser,
                  ...synced,
                  role: synced.role || assignedRole,
                };
              }
            }
          }
        } catch (err) {
          console.warn('Profile sync warning:', err);
        }

        setCurrentUser(baseUser);
      } else {
        // Logged out
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentOrgKey]);

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

  /**
   * Firebase Login with Email and Password
   */
  const login = async (email, password) => {
    setAuthError(null);
    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        let profile = {
          id: fbUser.uid,
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || email.split('@')[0],
          role: ROLES.STUDENT,
          orgKey: currentOrgKey,
        };

        // Fetch actual profile and role from Supabase
        if (isSupabaseConfigured) {
          const dbProfile = await getProfileFromSupabase(fbUser.uid);
          if (dbProfile) {
            profile = {
              ...profile,
              ...dbProfile,
              role: dbProfile.role || ROLES.STUDENT,
            };
          } else {
            profile = await syncUserProfileToSupabase(profile, false);
          }
        }

        setCurrentUser(profile);
        return { success: true, user: profile };
      } catch (err) {
        const readableMsg = getAuthErrorMessage(err);
        setAuthError(readableMsg);
        throw new Error(readableMsg);
      }
    } else {
      // Mock Login Fallback (matches mock user by email or creates a session)
      const matched = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase()) || {
        id: `usr_${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: ROLES.STUDENT,
        orgKey: currentOrgKey,
      };
      setCurrentUser(matched);
      return { success: true, user: matched };
    }
  };

  /**
   * Firebase Sign-Up with Email, Password, Name & Role
   */
  const signup = async (email, password, name, role = ROLES.STUDENT) => {
    setAuthError(null);
    if (isFirebaseConfigured && auth) {
      try {
        // Set pending signup role before creating user to avoid race conditions
        pendingSignupRef.current = { role, name };

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        // Update display name in Firebase Auth
        if (name) {
          await updateProfile(fbUser, { displayName: name });
        }

        let profile = {
          id: fbUser.uid,
          uid: fbUser.uid,
          email: fbUser.email,
          name: name || fbUser.email?.split('@')[0] || 'User',
          role: role || ROLES.STUDENT,
          orgKey: currentOrgKey,
        };

        // Explicitly write selected role to Supabase profiles table
        if (isSupabaseConfigured) {
          profile = await syncUserProfileToSupabase(profile, true);
        }

        pendingSignupRef.current = null;
        setCurrentUser(profile);
        return { success: true, user: profile };
      } catch (err) {
        pendingSignupRef.current = null;
        const readableMsg = getAuthErrorMessage(err);
        setAuthError(readableMsg);
        throw new Error(readableMsg);
      }
    } else {
      // Mock Signup Fallback
      const newUser = {
        id: `usr_${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        role: role || ROLES.STUDENT,
        orgKey: currentOrgKey,
      };
      setCurrentUser(newUser);
      return { success: true, user: newUser };
    }
  };

  /**
   * Update role for the current logged in user and persist to Supabase
   */
  const updateUserRole = async (newRole) => {
    if (!currentUser || !newRole) return;
    const updated = {
      ...currentUser,
      role: newRole,
    };
    setCurrentUser(updated);

    if (isSupabaseConfigured) {
      await syncUserProfileToSupabase(updated, true);
    }
  };

  /**
   * Firebase Send Password Reset Email
   */
  const resetPassword = async (email) => {
    setAuthError(null);
    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, email);
        return { success: true, message: 'Password reset email sent successfully.' };
      } catch (err) {
        const readableMsg = getAuthErrorMessage(err);
        setAuthError(readableMsg);
        throw new Error(readableMsg);
      }
    } else {
      return {
        success: true,
        message: `Password reset instructions sent to ${email} (Demo Mode).`,
      };
    }
  };

  /**
   * Logout from Firebase Auth and clear local session
   */
  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_USER_KEY);
  };

  /**
   * Switch organization template.
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
    loading,
    authError,
    login,
    signup,
    updateUserRole,
    resetPassword,
    logout,
    setUser,
    availableUsers: MOCK_USERS,
    isFirebaseActive: isFirebaseConfigured,
    isSupabaseActive: isSupabaseConfigured,

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
