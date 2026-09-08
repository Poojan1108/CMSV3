const MOCK_USERS = [
  {
    id: 'usr_student_1',
    name: 'Alex Chen',
    email: 'alex.chen@campus.edu',
    role: 'student',
    rollNo: 'CS-2024-042',
    department: 'Computer Science',
    hostel: 'Block B, Room 304',
    phone: '+1 (555) 234-5678',
    orgKey: 'COLLEGE',
  },
  {
    id: 'usr_staff_warden',
    name: 'Dr. Robert Vance',
    email: 'r.vance@campus.edu',
    role: 'staff',
    department: 'Hostel Administration',
    assignedCategories: ['Hostel', 'Sanitation', 'Maintenance'],
    phone: '+1 (555) 345-6789',
    orgKey: 'COLLEGE',
  },
  {
    id: 'usr_staff_it',
    name: 'Sarah Jenkins',
    email: 's.jenkins@campus.edu',
    role: 'staff',
    department: 'IT Infrastructure & Networking',
    assignedCategories: ['IT & Wifi', 'Academics'],
    phone: '+1 (555) 456-7890',
    orgKey: 'COLLEGE',
  },
  {
    id: 'usr_admin_1',
    name: 'Dean Eleanor Vance',
    email: 'admin.eleanor@campus.edu',
    role: 'admin',
    department: 'Campus Executive Office',
    phone: '+1 (555) 567-8901',
    orgKey: 'COLLEGE',
  },
];

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, url } = req;
  const isLogin = url.includes('/login') || req.query?.action === 'login';
  const isRegister = url.includes('/register') || req.query?.action === 'register';

  try {
    if (method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

      if (isLogin) {
        const email = (body.email || '').trim().toLowerCase();
        const matched = MOCK_USERS.find((u) => u.email.toLowerCase() === email);

        let role = 'student';
        if (email.includes('admin')) role = 'admin';
        else if (email.includes('staff') || email.includes('vance') || email.includes('jenkins')) role = 'staff';

        const user = matched || {
          id: role === 'student' ? 'usr_student_1' : role === 'admin' ? 'usr_admin_1' : 'usr_staff_warden',
          name: email ? email.split('@')[0] : 'Alex Chen',
          email: body.email,
          role,
          orgKey: 'COLLEGE',
        };

        return res.status(200).json({
          token: `jwt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          user,
        });
      }

      if (isRegister) {
        const { name, email, role = 'student', orgKey = 'COLLEGE' } = body;
        const normalizedRole = String(role).toLowerCase();
        return res.status(201).json({
          token: `jwt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          user: {
            id: normalizedRole === 'student' ? 'usr_student_1' : `usr_${Date.now()}`,
            name: name || 'User',
            email,
            role: normalizedRole,
            orgKey,
          },
        });
      }
    }

    // Default: Return demo student session
    return res.status(200).json({
      user: MOCK_USERS[0],
    });
  } catch (err) {
    return res.status(500).json({
      statusCode: 500,
      error: 'Server Error',
      message: err.message,
    });
  }
}
