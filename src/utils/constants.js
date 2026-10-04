export const ROLES = {
  STUDENT: 'student',
  STAFF: 'staff',
  ADMIN: 'admin',
};

/**
 * 3 Pure Archetype Blueprints for Creator Registration
 * These define domain semantics (roles, terms, categories, location labels)
 * without any hardcoded organization brand names.
 */
export const ORG_ARCHETYPES = {
  COLLEGE: {
    id: 'COLLEGE',
    label: 'College / University',
    type: 'college',
    defaultUserTerm: 'Student',
    defaultStaffTerm: 'Faculty & Warden',
    defaultAdminTerm: 'Dean / Administrator',
    defaultLocationLabel: 'Hostel Block / Room No',
    categories: [
      'Hostel & Mess',
      'Academics',
      'IT & Wifi',
      'Sanitation',
      'Library',
      'Campus Security',
      'General Maintenance',
    ],
  },
  SOCIETY: {
    id: 'SOCIETY',
    label: 'Housing Society / Residential',
    type: 'society',
    defaultUserTerm: 'Resident',
    defaultStaffTerm: 'Facility Staff',
    defaultAdminTerm: 'Society Secretary / Admin',
    defaultLocationLabel: 'Block & Flat / Unit No',
    categories: [
      'Plumbing & Water',
      'Electrical & Power',
      'Elevators & Lifts',
      'Clubhouse & Amenities',
      'Waste Management',
      'Security & Gate',
      'General Maintenance',
    ],
  },
  CORPORATE: {
    id: 'CORPORATE',
    label: 'Corporate / Workplace',
    type: 'corporate',
    defaultUserTerm: 'Employee',
    defaultStaffTerm: 'IT & Facilities',
    defaultAdminTerm: 'Workspace Admin',
    defaultLocationLabel: 'Floor / Workstation Desk ID',
    categories: [
      'Workstation Hardware',
      'Facility & AC',
      'Network & VPN',
      'Cafeteria & Pantry',
      'Meeting Rooms',
      'HR & Operations',
      'General Maintenance',
    ],
  },
};

/**
 * Backward-compatible template registry with generic archetypes
 */
export const ORG_TEMPLATES = {
  COLLEGE: {
    name: 'College / University Template',
    type: 'college',
    userLabel: 'Student',
    userTerm: 'Student',
    staffTerm: 'Faculty & Warden',
    adminTerm: 'Dean / Administrator',
    categories: ORG_ARCHETYPES.COLLEGE.categories,
    locationLabel: ORG_ARCHETYPES.COLLEGE.defaultLocationLabel,
  },
  SOCIETY: {
    name: 'Housing Society Template',
    type: 'society',
    userLabel: 'Resident',
    userTerm: 'Resident',
    staffTerm: 'Facility Staff',
    adminTerm: 'Society Secretary / Admin',
    categories: ORG_ARCHETYPES.SOCIETY.categories,
    locationLabel: ORG_ARCHETYPES.SOCIETY.defaultLocationLabel,
  },
  CORPORATE: {
    name: 'Corporate Workplace Template',
    type: 'corporate',
    userLabel: 'Employee',
    userTerm: 'Employee',
    staffTerm: 'IT & Facilities',
    adminTerm: 'Workspace Admin',
    categories: ORG_ARCHETYPES.CORPORATE.categories,
    locationLabel: ORG_ARCHETYPES.CORPORATE.defaultLocationLabel,
  },
};


/**
 * Default Indian archetype organizations matching database seeds
 */
export const SEEDED_ORGS = {
  IIT_BOMBAY: {
    name: 'IIT Bombay',
    type: 'college',
    userLabel: 'Student',
    userTerm: 'Student',
    staffTerm: 'Faculty & Warden',
    adminTerm: 'Dean of Student Affairs',
    categories: ORG_ARCHETYPES.COLLEGE.categories,
    locationLabel: 'Hostel Wing & Room No (e.g. Hostel 16, B-312)',
  },
  PRESTIGE_RESIDENCY: {
    name: 'Prestige Shantiniketan RWA',
    type: 'society',
    userLabel: 'Resident',
    userTerm: 'Resident',
    staffTerm: 'Facility Staff',
    adminTerm: 'Society Secretary & MC',
    categories: ORG_ARCHETYPES.SOCIETY.categories,
    locationLabel: 'Tower & Flat No (e.g. Tower 7, Flat 1402)',
  },
  TCS_OLYMPUS: {
    name: 'TCS Olympus Center',
    type: 'corporate',
    userLabel: 'Employee',
    userTerm: 'Employee',
    staffTerm: 'Facilities & IT Support',
    adminTerm: 'Workplace Operations Admin',
    categories: ORG_ARCHETYPES.CORPORATE.categories,
    locationLabel: 'Wing, Floor & Desk ID (e.g. B-Wing, 4th Floor, Desk W-412)',
  },
};

/**
 * Universal neutral fallback blueprint when no organization context or registry is matched.
 * Never hardcodes any specific campus or organization brand name.
 */
export const UNIVERSAL_FALLBACK_ORG = {
  name: 'Organization Workspace',
  type: 'general',
  userLabel: 'Member',
  userTerm: 'Member',
  staffTerm: 'Staff Resolver',
  adminTerm: 'Administrator',
  locationLabel: 'Location / Room / Desk',
  categories: [
    'Facilities & Maintenance',
    'IT & Technical Support',
    'Operations & Administration',
    'Security & Access',
    'General Queries',
  ],
};

/**
 * Dynamically resolves org template object from string key, object, or registry.
 * @param {string|object} org - Organization key or object
 * @param {object} [registry={}] - Optional live organization registry map
 * @returns {object} Resolved organization configuration
 */
export const resolveOrg = (org, registry = {}) => {
  if (!org) return UNIVERSAL_FALLBACK_ORG;
  if (typeof org === 'object' && org !== null) return org;
  if (typeof org === 'string') {
    const key = org.toUpperCase();
    return (
      registry[key] ||
      registry[org] ||
      SEEDED_ORGS[key] ||
      ORG_TEMPLATES[key] ||
      UNIVERSAL_FALLBACK_ORG
    );
  }
  return UNIVERSAL_FALLBACK_ORG;
};

/**
 * Dynamically resolves categories for an org template or org key.
 */
export const getOrgCategories = (org, registry) => {
  const resolved = resolveOrg(org, registry);
  return resolved.categories || UNIVERSAL_FALLBACK_ORG.categories;
};

/**
 * Dynamically resolves location label for an org template or org key.
 */
export const getOrgLocationLabel = (org, registry) => {
  const resolved = resolveOrg(org, registry);
  return resolved.locationLabel || UNIVERSAL_FALLBACK_ORG.locationLabel;
};

/**
 * Dynamically resolves user label for an org template or org key.
 */
export const getOrgUserLabel = (org, registry) => {
  const resolved = resolveOrg(org, registry);
  return resolved.userLabel || resolved.userTerm || UNIVERSAL_FALLBACK_ORG.userTerm;
};

/**
 * Dynamically resolves role terminology based on role and currentOrg.
 */
export const getRoleTerm = (role, org, registry) => {
  const resolved = resolveOrg(org, registry);
  if (role === ROLES.ADMIN) return resolved.adminTerm || UNIVERSAL_FALLBACK_ORG.adminTerm;
  if (role === ROLES.STAFF) return resolved.staffTerm || UNIVERSAL_FALLBACK_ORG.staffTerm;
  return resolved.userLabel || resolved.userTerm || UNIVERSAL_FALLBACK_ORG.userTerm;
};

export const CATEGORIES = UNIVERSAL_FALLBACK_ORG.categories;

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
