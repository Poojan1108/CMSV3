const INITIAL_SEEDS = [
  {
    id: 'CMS-2026-1001',
    title: 'Lab 3 Ethernet Ports & High-Speed Switch Down',
    description: 'Network switch in Computer Lab 3 is completely unresponsive. CS batch unable to take online lab exams.',
    category: 'Lab Equipment',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    location: 'Block C - Computer Lab 3',
    orgKey: 'COLLEGE',
    student: { id: 's1', name: 'Rahul Verma', email: 'rahul.verma@college.edu' },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    statusHistory: [
      { status: 'PENDING', updatedBy: 'Rahul Verma', note: 'Complaint registered in system.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
      { status: 'IN_PROGRESS', updatedBy: 'IT Staff', note: 'Replacing faulty patch cable and resetting core switch.', timestamp: new Date(Date.now() - 3600000).toISOString() },
    ],
    comments: [
      { id: 'c1', senderName: 'IT Staff', senderRole: 'STAFF', text: 'Hardware engineer dispatched to inspect switch rack.', timestamp: new Date(Date.now() - 3600000).toISOString(), isInternal: false },
    ],
  },
  {
    id: 'CMS-2026-1002',
    title: 'Water Cooler Leakage & Stagnation in Hostel B',
    description: 'The 2nd floor water cooler has been overflowing since morning. Slippery floor posing hazard to residents.',
    category: 'Hostel Facilities',
    priority: 'URGENT',
    status: 'PENDING_CONFIRMATION',
    location: 'Boys Hostel B, 2nd Floor Corridor',
    orgKey: 'COLLEGE',
    student: { id: 's2', name: 'Ananya Sharma', email: 'ananya.s@college.edu' },
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    resolutionDetails: {
      notes: 'Plumber repaired broken inlet float valve and housekeeping dried the corridor.',
      staffName: 'Priya Nair',
      proposedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    statusHistory: [
      { status: 'PENDING', updatedBy: 'Ananya Sharma', note: 'Complaint registered in system.', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
      { status: 'PENDING_CONFIRMATION', updatedBy: 'Priya Nair', note: 'Valve replaced. Awaiting student verification.', timestamp: new Date(Date.now() - 1800000).toISOString() },
    ],
    comments: [
      { id: 'c2', senderName: 'Priya Nair', senderRole: 'STAFF', text: 'Valve replaced. Please check and confirm.', timestamp: new Date(Date.now() - 1800000).toISOString(), isInternal: false },
    ],
  },
];

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query } = req;

  try {
    // 1. Stats endpoint
    if (req.url.includes('/stats') || query.action === 'stats') {
      return res.status(200).json({
        total: INITIAL_SEEDS.length,
        pending: INITIAL_SEEDS.filter((t) => t.status === 'PENDING').length,
        inProgress: INITIAL_SEEDS.filter((t) => t.status === 'IN_PROGRESS').length,
        pendingConfirmation: INITIAL_SEEDS.filter((t) => t.status === 'PENDING_CONFIRMATION').length,
        resolved: INITIAL_SEEDS.filter((t) => t.status === 'RESOLVED').length,
        rejected: INITIAL_SEEDS.filter((t) => t.status === 'REJECTED').length,
        slaBreached: 0,
      });
    }

    // 2. GET tickets
    if (method === 'GET') {
      return res.status(200).json({
        tickets: INITIAL_SEEDS,
      });
    }

    // 3. POST ticket
    if (method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const newTicket = {
        id: `CMS-2026-${(1001 + Math.floor(Math.random() * 9000)).toString()}`,
        ...body,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: [
          {
            status: 'PENDING',
            updatedBy: body.student?.name || 'User',
            note: 'Complaint registered in system.',
            timestamp: new Date().toISOString(),
          },
        ],
        comments: [],
      };

      return res.status(201).json({ ticket: newTicket });
    }

    // 4. PATCH status
    if (method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      return res.status(200).json({
        success: true,
        status: body.status,
        updatedAt: new Date().toISOString(),
      });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
