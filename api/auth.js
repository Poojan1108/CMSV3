export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, url } = req;
  const isLogin = url.includes('/login') || req.query.action === 'login';
  const isRegister = url.includes('/register') || req.query.action === 'register';

  try {
    if (method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

      if (isLogin) {
        const { email } = body;
        const role = email?.includes('admin') ? 'ADMIN' : email?.includes('staff') ? 'STAFF' : 'STUDENT';
        const name = email ? email.split('@')[0] : 'User';

        return res.status(200).json({
          token: `jwt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          user: {
            id: `usr_${Date.now()}`,
            name,
            email,
            role,
            orgKey: 'COLLEGE',
          },
        });
      }

      if (isRegister) {
        const { name, email, role } = body;
        return res.status(201).json({
          token: `jwt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          user: {
            id: `usr_${Date.now()}`,
            name: name || 'Student',
            email,
            role: role || 'STUDENT',
            orgKey: 'COLLEGE',
          },
        });
      }
    }

    // Default: Return current user session
    return res.status(200).json({
      user: {
        id: 'usr_demo_1',
        name: 'Demo Student',
        email: 'student@college.edu',
        role: 'STUDENT',
        orgKey: 'COLLEGE',
      },
    });
  } catch (err) {
    return res.status(500).json({
      statusCode: 500,
      error: 'Server Error',
      message: err.message,
    });
  }
}
