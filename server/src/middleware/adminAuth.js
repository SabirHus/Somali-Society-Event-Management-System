// server/src/middleware/adminAuth.js
export function requireAdmin(req, res, next) {
  const expected = (process.env.ADMIN_PASSWORD || '').trim();
  const got = (req.header('x-admin-password') || '').trim();

  if (!expected || got !== expected) {
    return res.sendStatus(401);
  }
  next();
}
