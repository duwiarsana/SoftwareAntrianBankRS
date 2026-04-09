import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'queuepro-secret';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid' });
  }
}

export function adminOnly(req, res, next) {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak, hanya admin' });
  }
  next();
}

export function superAdminOnly(req, res, next) {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak, hanya Master Account' });
  }
  next();
}

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      orgId: user.orgId || null 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
