export const ROLES = {
  STUDENT: 'student',
  STAFF: 'staff',
  ADMIN: 'admin',
};

export const ORG_TEMPLATES = {
  COLLEGE: {
    name: 'Springfield University',
    type: 'college',
    userLabel: 'Student',
    userTerm: 'Student',
    staffTerm: 'Staff',
    adminTerm: 'Admin',
    categories: [
      'Hostel & Mess',
      'Academics',
      'IT & Wifi',
      'Sanitation',
      'Library',
      'Campus Security',
      'General',
    ],
    locationLabel: 'Hostel Block / Room No',
  },
  SOCIETY: {
    name: 'Green Valley Society',
    type: 'society',
    userLabel: 'Resident',
    userTerm: 'Resident',
    staffTerm: 'Staff',
    adminTerm: 'Admin',
    categories: [
      'Plumbing',
      'Electrical',
      'Elevator',
      'Security',
      'Waste Management',
      'Clubhouse & Gym',
      'General',
    ],
    locationLabel: 'Block & Flat / Unit No',
  },
  CORPORATE: {
    name: 'Apex Tech Solutions',
    type: 'corporate',
    userLabel: 'Employee',
    userTerm: 'Employee',
    staffTerm: 'Staff',
    adminTerm: 'Admin',
    categories: [
      'IT Infrastructure',
      'HR Services',
      'Facilities & AC',
      'Workstation Hardware',
      'Cafeteria',
      'Security',
      'General',
    ],
    locationLabel: 'Floor / Workstation Desk No',
  },
  CUSTOM: {
    name: 'Custom Organization',
    type: 'custom',
    userLabel: 'User',
    userTerm: 'User',
    staffTerm: 'Staff',
    adminTerm: 'Admin',
    categories: [
      'General Maintenance',
      'IT Support',
      'Administrative',
      'Facility Management',
      'Other',
    ],
    locationLabel: 'Location / Address',
  },
};

/**
 * Dynamically resolves org template object from string key or template object.
 */
export const resolveOrg = (org) => {
  if (!org) return ORG_TEMPLATES.COLLEGE;
  if (typeof org === 'string') {
    const key = org.toUpperCase();
    return ORG_TEMPLATES[key] || ORG_TEMPLATES.COLLEGE;
  }
  return org;
};

/**
 * Dynamically resolves categories for an org template or org key.
 */
export const getOrgCategories = (org = 'COLLEGE') => {
  const resolved = resolveOrg(org);
  return resolved.categories;
};

/**
 * Dynamically resolves location label for an org template or org key.
 */
export const getOrgLocationLabel = (org = 'COLLEGE') => {
  const resolved = resolveOrg(org);
  return resolved.locationLabel;
};

/**
 * Dynamically resolves user label for an org template or org key.
 */
export const getOrgUserLabel = (org = 'COLLEGE') => {
  const resolved = resolveOrg(org);
  return resolved.userLabel || resolved.userTerm || 'Student';
};

/**
 * Dynamically resolves role terminology based on role and currentOrg.
 */
export const getRoleTerm = (role, org = 'COLLEGE') => {
  const resolved = resolveOrg(org);
  if (role === ROLES.ADMIN) return resolved.adminTerm || 'Admin';
  if (role === ROLES.STAFF) return resolved.staffTerm || 'Staff';
  return resolved.userLabel || resolved.userTerm || 'Student';
};

export const CATEGORIES = ORG_TEMPLATES.COLLEGE.categories;

export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const PRIORITY_LABELS = {
  [PRIORITIES.LOW]: 'Low',
  [PRIORITIES.MEDIUM]: 'Medium',
  [PRIORITIES.HIGH]: 'High',
  [PRIORITIES.URGENT]: 'Urgent',
};

export const STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  PENDING_CONFIRMATION: 'pending_confirmation',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

export const STATUS_LABELS = {
  [STATUSES.PENDING]: 'Pending',
  [STATUSES.IN_PROGRESS]: 'In Progress',
  [STATUSES.PENDING_CONFIRMATION]: 'Pending User Confirmation',
  [STATUSES.RESOLVED]: 'Resolved',
  [STATUSES.REJECTED]: 'Rejected',
};
