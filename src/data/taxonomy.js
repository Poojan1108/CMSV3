/**
 * Domain taxonomy shared across org templates.
 * Extracted from page components so presentation layers stay free of
 * hard-coded business data.
 */

/** Sub-category options keyed by department / category name. */
export const SUB_CATEGORIES_MAP = {
  'Hostel & Mess': [
    'Plumbing & Restroom',
    'Electrical & Lighting',
    'Room Furniture & Lock',
    'Mess Food Quality',
    'Cleanliness & Pest Control',
  ],
  Academics: [
    'Lab Equipment Repair',
    'Classroom Projector / Board',
    'Course Material Access',
    'Schedule & Timetable',
  ],
  'IT & Wifi': [
    'Wi-Fi Disconnection',
    'Slow Speed',
    'Portal Login Issue',
    'IP Configuration',
    'Lab Hardware Failure',
  ],
  Sanitation: [
    'Trash Accumulation',
    'Washroom Hygiene',
    'Corridor Sweeping',
    'Pest Control Disinfection',
  ],
  Library: [
    'Quiet Zone Noise',
    'E-Resource Access',
    'Book Return System',
    'Study Desk Sockets',
  ],
  'Campus Security': [
    'CCTV Footage Request',
    'Visitor Pass Issue',
    'Lost & Found',
    'Gate Clearance',
  ],
  'Plumbing & Water': ['Pipe Leakage', 'Tap Repair', 'Drainage Clog', 'Water Pressure', 'Flush Tank Fault', 'Ceiling Seepage'],
  Plumbing: ['Pipe Leakage', 'Tap Repair', 'Drainage Clog', 'Water Pressure', 'Flush Tank Fault'],
  'Electrical & Power': ['Power Outage', 'Switchboard Repair', 'Light/Fan Fitting', 'Short Circuit Hazard', 'MCB Tripping'],
  Electrical: ['Power Outage', 'Switchboard Repair', 'Light/Fan Fitting', 'Short Circuit Hazard'],
  'Elevators & Lifts': ['Elevator Stuck', 'Button Unresponsive', 'Noisy Operation', 'Door Sensor Defect', 'Lift Power Failure'],
  Elevator: ['Elevator Stuck', 'Button Unresponsive', 'Noisy Operation', 'Door Sensor Defect'],
  'Security & Gate': ['CCTV Access', 'Visitor Access', 'Parking Violation', 'Noise Nuisance', 'Boom Barrier Issue'],
  Security: ['CCTV Access', 'Visitor Access', 'Parking Violation', 'Noise Nuisance'],
  'Waste Management': ['Garbage Overflow', 'Recycling Bin Full', 'Organic Waste Disposal', 'Door-to-Door Pickup Delay'],
  'Clubhouse & Amenities': [
    'Equipment Maintenance',
    'Pool Hygiene',
    'Booking Conflict',
    'Air Conditioning',
    'Lighting Fault',
  ],
  'Clubhouse & Gym': [
    'Equipment Maintenance',
    'Pool Hygiene',
    'Booking Conflict',
    'Air Conditioning',
  ],
  'Network & VPN': [
    'GlobalProtect / AnyConnect VPN',
    'Wi-Fi / LAN Disconnection',
    'Slow Bandwidth / Latency',
    'Zscaler / Proxy Authentication',
    'Static IP / Firewall Access',
  ],
  'IT Infrastructure': ['Network Outage', 'VPN Access', 'Server Connection', 'VoIP Phone Line'],
  'HR & Operations': [
    'Employee ID Badge / Access Card',
    'Payroll & Compensation Query',
    'Leave & Attendance Portal',
    'Provident Fund / Tax Deduction',
    'Policy & Workplace Clarification',
  ],
  'HR Services': ['Payroll / Payslip Query', 'Leave Portal Error', 'ID Card / Badge', 'Policy Clarification'],
  'Facility & AC': [
    'AC Cooling Failure',
    'Floor / Room Temperature',
    'Ergonomic Desk / Chair',
    'Lighting & Power Sockets',
    'Door Lock / Keycard',
  ],
  'Facilities & AC': ['AC Cooling Failure', 'Room Temperature', 'Door / Window Lock', 'Wall / Paint Repair'],
  'Workstation Hardware': [
    'Monitor Display Fault',
    'Keyboard & Mouse',
    'Docking Hub / Cables',
    'Laptop Power Adapter',
    'Dual Monitor / Ergonomic Arm',
  ],
  'Cafeteria & Pantry': [
    'Coffee / Beverage Machine',
    'Water Dispenser / Filter',
    'Food Quality & Hygiene',
    'Vending Machine Fault',
    'Pantry Supplies & Cleanliness',
  ],
  Cafeteria: ['Food Quality / Taste', 'Hygiene & Cleanliness', 'Billing / POS Issue', 'Vending Machine'],
  'Meeting Rooms': [
    'Video Conferencing / Teams Room',
    'Projector & HDMI Display',
    'Room Booking Conflict',
    'Microphone & Audio System',
    'Air Conditioning & Blinds',
  ],
  'General Maintenance': ['Furniture Repair', 'Structural Repair', 'Lighting Issue', 'Odour / Cleaning'],
  'IT Support': ['Software Installation', 'Password Reset', 'Peripheral Setup', 'Network Speed'],
  Administrative: ['Document Verification', 'Fee Receipt Issue', 'Official Letter Request'],
  'Facility Management': ['HVAC & Cooling', 'Janitorial Services', 'Key & Locksmith', 'Parking Access'],
  General: ['General Query', 'Feedback & Suggestion', 'Policy Inquiry', 'Other Issue'],
  Other: ['Miscellaneous Requirement', 'Unlisted Complaint'],
};

/** Fallback sub-categories when a category has no explicit mapping. */
export const DEFAULT_SUB_CATEGORIES = [
  'General Issue',
  'Equipment Repair',
  'Operational Delay',
  'Other',
];

/**
 * Resolves the sub-category list for a given category name.
 * @param {string} category
 * @returns {string[]}
 */
export const getSubCategories = (category) =>
  SUB_CATEGORIES_MAP[category] || DEFAULT_SUB_CATEGORIES;

/** Knowledge-base articles used for self-service deflection on the intake form. */
export const KB_ARTICLES = [
  {
    keywords: ['wifi', 'wi-fi', 'internet', 'network', 'connect', 'latency', 'disconnect'],
    title: 'Self-Help: Resolving Network & Wi-Fi Disconnections',
    solution:
      'Try forgetting the organization Wi-Fi network on your device, clearing saved credentials, and re-authenticating. Verify if adjacent devices in your area are also affected.',
  },
  {
    keywords: ['water', 'pipe', 'leak', 'sink', 'plumb', 'tap', 'restroom', 'drain'],
    title: 'Emergency Checklist: Pipe Leakage & Stopcock Location',
    solution:
      'In case of active pipe leakage, shut off the main isolation valve or stopcock located under the sink counter or utility riser to prevent water damage while maintenance arrives.',
  },
  {
    keywords: ['ac', 'cooling', 'air condition', 'hvac', 'warm air', 'temperature', 'fan'],
    title: 'Quick Check: HVAC Controller & Thermostat Mode',
    solution:
      'Ensure the AC control mode is set to "Cool" (snowflake icon) with fan speed set to "Auto" or "High" and setpoint adjusted between 20°C - 22°C.',
  },
  {
    keywords: ['food', 'canteen', 'mess', 'lunch', 'snack', 'meal', 'catering', 'cafeteria'],
    title: 'Cafeteria & Dining Services Feedback Protocol',
    solution:
      'For urgent meal or dining service quality issues, notify the facility supervisor or dining manager on-duty immediately so raw batch samples can be inspected.',
  },
  {
    keywords: ['password', 'login', 'portal', 'account', 'auth'],
    title: 'Account & Credentials Self-Service Reset',
    solution:
      'You can reset your account password using the Self-Service Portal without waiting for manual IT queue processing.',
  },
];

/** Quick-select location presets keyed by organization template key. */
export const QUICK_LOCATIONS = {
  COLLEGE: [
    'Block B - Room 304',
    'CS Dept Lab 3',
    'Central Library Reading Room',
    'Main Canteen Foyer',
  ],
  SOCIETY: [
    'Tower A - Flat 402',
    'Clubhouse Gym',
    'Main Entrance Gate',
    'Underground Parking B2',
  ],
  CORPORATE: [
    'Floor 4 - Desk 412',
    'Conference Room B',
    'Main Executive Cafeteria',
    'IT Server Hub',
  ],
};

export const FALLBACK_LOCATIONS = [
  'Building A - Floor 1',
  'Main Reception',
  'Outer Courtyard',
  'Facility Store',
];

/**
 * Resolves quick-location presets for an org key, archetype type, or organization object.
 * Checks archetype type (college, society, corporate) first, then key, then safe fallbacks.
 * @param {string|object} orgKeyOrOrg
 * @returns {string[]}
 */
export const getQuickLocations = (orgKeyOrOrg) => {
  if (!orgKeyOrOrg) return FALLBACK_LOCATIONS;
  if (typeof orgKeyOrOrg === 'object') {
    const typeKey = (orgKeyOrOrg.type || '').toUpperCase();
    return QUICK_LOCATIONS[typeKey] || FALLBACK_LOCATIONS;
  }
  const key = String(orgKeyOrOrg).toUpperCase();
  return (
    QUICK_LOCATIONS[key] ||
    (key.includes('COLLEGE') || key.includes('IIT') || key.includes('UNIV') ? QUICK_LOCATIONS.COLLEGE : null) ||
    (key.includes('SOCIETY') || key.includes('RESIDENCY') || key.includes('RWA') ? QUICK_LOCATIONS.SOCIETY : null) ||
    (key.includes('CORP') || key.includes('TCS') || key.includes('OFFICE') ? QUICK_LOCATIONS.CORPORATE : null) ||
    FALLBACK_LOCATIONS
  );
};

/** Inspection access time windows offered on the intake form. */
export const ACCESS_TIME_SLOTS = [
  'Morning (8 AM - 12 PM)',
  'Afternoon (12 PM - 4 PM)',
  'Evening (4 PM - 8 PM)',
];

/** Preferred contact channels. */
export const CONTACT_METHODS = [
  {
    id: 'In-App Notification',
    label: 'In-App Notification',
    desc: 'Real-time portal updates and live tracker pushes.',
  },
  {
    id: 'Email Notification',
    label: 'Email Digest',
    desc: 'Status milestones sent to your registered email.',
  },
  {
    id: 'Phone Call / SMS',
    label: 'Phone Call / SMS',
    desc: 'Direct call from the assigned technician before arrival.',
  },
];

/** Shared department queues available as reassignment targets. */
export const DEPARTMENT_QUEUES = [
  { id: 'dept_estate', name: 'Estate & Facilities Team', department: 'Estate Management' },
  { id: 'dept_sanitation', name: 'Sanitation & Hygiene Unit', department: 'Campus Sanitation' },
  { id: 'dept_security', name: 'Campus Security Desk', department: 'Security & Safety' },
];
