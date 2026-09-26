import { activeSessions } from './auth.js';

export function isSandboxRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  const user = activeSessions.get(token);
  return user?.role === 'tester' || token.includes('staff-3') || token.includes('viewer');
}

/**
 * Sandbox safety middleware: Tester mutations are simulated without touching DB
 */
export function sandboxMiddleware(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.path !== '/api/auth/login' && req.path !== '/api/auth/logout') {
    if (isSandboxRequest(req)) {
      console.log(`[Sandbox] Simulated ${req.method} ${req.path} for Tester (DB write blocked)`);
      if (req.path === '/api/bills' && req.method === 'POST') {
        const fakeBill = { ...req.body, id: `test-bill-${Date.now()}`, isSandbox: true };
        return res.status(201).json({ success: true, isSandbox: true, message: 'Simulated bill creation in Sandbox', bill: fakeBill });
      }
      if (req.path === '/api/orders' && req.method === 'POST') {
        const fakeOrder = { ...req.body, id: `test-ord-${Date.now()}`, isSandbox: true };
        return res.status(201).json({ success: true, isSandbox: true, message: 'Simulated order in Sandbox', order: fakeOrder });
      }
      return res.json({ success: true, isSandbox: true, message: 'Simulated action in Sandbox Mode. Database was not modified.' });
    }
  }
  next();
}
