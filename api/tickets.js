const INITIAL_SEEDS = [
  {
    id: 'CMS-2026-1001',
    title: 'Water leakage in Block B Room 304 restroom pipe',
    description: 'The sink pipe in Room 304 restroom has been leaking heavily since yesterday evening. Water is spilling into the main room area and causing floor damage.',
    category: 'Hostel',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    location: 'Hostel Block B, Room 304',
    orgKey: 'COLLEGE',
    student: {
      id: 'usr_student_1',
      name: 'Alex Chen',
      email: 'alex.chen@campus.edu',
      rollNo: 'CS-2024-042',
      room: 'Block B - 304',
    },
    assignedTo: {
      id: 'usr_staff_warden',
      name: 'Dr. Robert Vance',
      department: 'Hostel Administration',
    },
    attachments: [
      {
        id: 'att_1001_1',
        name: 'leaking_pipe_under_sink.jpg',
        size: '1.2 MB',
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=800',
      },
      {
        id: 'att_1001_2',
        name: 'restroom_floor_water.jpg',
        size: '850 KB',
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
      },
    ],
    statusHistory: [
      {
        status: 'PENDING',
        updatedBy: 'Alex Chen',
        note: 'Complaint submitted by student.',
        timestamp: '2026-07-22T08:30:00.000Z',
      },
      {
        status: 'IN_PROGRESS',
        updatedBy: 'Dr. Robert Vance',
        note: 'Assigned maintenance plumber (Ref #P-402) to inspect leak.',
        timestamp: '2026-07-22T11:15:00.000Z',
      },
    ],
    comments: [
      {
        id: 'c101',
        senderName: 'Alex Chen',
        senderRole: 'student',
        senderId: 'usr_student_1',
        text: 'Placing a bucket under the pipe for now, but water flow is increasing.',
        timestamp: '2026-07-22T09:10:00.000Z',
        isInternal: false,
      },
      {
        id: 'c102',
        senderName: 'Dr. Robert Vance',
        senderRole: 'staff',
        senderId: 'usr_staff_warden',
        text: 'Plumber dispatched. Expected arrival at 2:00 PM today.',
        timestamp: '2026-07-22T11:20:00.000Z',
        isInternal: false,
      },
    ],
  },
  {
    id: 'CMS-2026-1002',
    title: 'Wi-Fi Access Point offline in CS Engineering Lab 3',
    description: 'High latency and persistent disconnections on "Campus_Student_5G" SSID in CS Lab 3 during afternoon practical sessions.',
    category: 'IT & Wifi',
    priority: 'HIGH',
    status: 'PENDING',
    location: 'CS Department, Lab 3 (2nd Floor)',
    orgKey: 'COLLEGE',
    student: {
      id: 'usr_student_1',
      name: 'Alex Chen',
      email: 'alex.chen@campus.edu',
      rollNo: 'CS-2024-042',
      room: 'CS Dept',
    },
    assignedTo: null,
    statusHistory: [
      {
        status: 'PENDING',
        updatedBy: 'Alex Chen',
        note: 'Complaint submitted by student.',
        timestamp: '2026-07-23T09:00:00.000Z',
      },
    ],
    comments: [
      {
        id: 'c201',
        senderName: 'Alex Chen',
        senderRole: 'student',
        senderId: 'usr_student_1',
        text: 'Entire lab class is affected during network programming assignments.',
        timestamp: '2026-07-23T09:05:00.000Z',
        isInternal: false,
      },
    ],
  },
  {
    id: 'CMS-2026-1003',
    title: 'AC unit blowing warm air in Main Library Reading Room',
    description: 'The central air conditioning system unit 2 in the quiet study area is emitting warm air, making the room uncomfortable for reading.',
    category: 'Maintenance',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    location: 'Central Library, 2nd Floor Reading Room',
    orgKey: 'COLLEGE',
    student: {
      id: 'usr_student_2',
      name: 'Maya Patel',
      email: 'maya.patel@campus.edu',
      rollNo: 'EE-2024-118',
      room: 'Block C - 102',
    },
    assignedTo: {
      id: 'usr_staff_warden',
      name: 'Dr. Robert Vance',
      department: 'Hostel Administration',
    },
    statusHistory: [
      {
        status: 'RESOLVED',
        updatedBy: 'Dr. Robert Vance',
        note: 'AC compressor serviced and cooling restored to 21°C.',
        timestamp: '2026-07-21T16:45:00.000Z',
      },
    ],
    comments: [],
  },
  {
    id: 'CMS-2026-1006',
    title: 'Replacement of damaged study desk in Room 304',
    description: 'The wooden study table leg is broken and wobbling severely. Needs repair or replacement desk.',
    category: 'Hostel & Mess',
    priority: 'MEDIUM',
    status: 'PENDING_CONFIRMATION',
    location: 'Hostel Block B, Room 304',
    orgKey: 'COLLEGE',
    student: {
      id: 'usr_student_1',
      name: 'Alex Chen',
      email: 'alex.chen@campus.edu',
      rollNo: 'CS-2024-042',
      room: 'Block B - 304',
    },
    assignedTo: {
      id: 'usr_staff_warden',
      name: 'Dr. Robert Vance',
      department: 'Hostel Administration',
    },
    resolutionDetails: {
      notes: 'Carpentry staff replaced the broken study desk with a new ergonomic desk from central store. Please confirm if satisfactory.',
      staffName: 'Dr. Robert Vance',
      proposedAt: '2026-07-24T14:30:00.000Z',
    },
    statusHistory: [
      {
        status: 'PENDING',
        updatedBy: 'Alex Chen',
        note: 'Complaint submitted by student.',
        timestamp: '2026-07-24T10:00:00.000Z',
      },
      {
        status: 'PENDING_CONFIRMATION',
        updatedBy: 'Dr. Robert Vance',
        note: 'Resolution proposed. Pending student confirmation.',
        timestamp: '2026-07-24T14:30:00.000Z',
      },
    ],
    comments: [],
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
