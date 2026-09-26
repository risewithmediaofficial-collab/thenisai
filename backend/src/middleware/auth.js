import { Staff } from '../models/index.js';

// In-memory active sessions store
export const activeSessions = new Map();

/**
 * Middleware: Verify request is from an authenticated admin
 */
export async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const token = authHeader.split(' ')[1];
    let sessionUser = activeSessions.get(token);

    if (!sessionUser) {
      const tokenParts = token.split('_');
      const staffId = tokenParts[2];
      if (staffId) {
        const staff = await Staff.findOne({ id: staffId });
        if (staff) {
          sessionUser = {
            id: staff.id,
            username: staff.username,
            name: staff.name,
            title: staff.title,
            role: staff.role,
            counter: staff.counter,
          };
          activeSessions.set(token, sessionUser);
        }
      }
    }

    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin privileges required.' });
    }
    req.adminUser = sessionUser;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Authorization check failed.' });
  }
}
