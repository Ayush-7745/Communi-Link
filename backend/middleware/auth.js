import { getAuth } from 'firebase-admin/auth';
import User from '../models/User.js';

export async function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'Invalid or expired authentication token.' });

  try {
    const decoded = await getAuth().verifyIdToken(match[1]);
    req.uid = decoded.uid;
    req.tokenClaims = decoded;
    next();
  } catch (error) {
    console.error('Firebase ID token verification failed:', {
      code: error?.code || 'unknown',
      message: error?.message || String(error),
    });
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const profile = await User.findOne({ userId: req.uid }).lean();
      if (!profile) return res.status(403).json({ error: 'User profile is not registered.' });
      if (!roles.includes(profile.role)) return res.status(403).json({ error: 'This action is not allowed for your role.' });
      req.profile = profile;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAdminClaim(req, res, next) {
  if (req.tokenClaims?.admin !== true) return res.status(403).json({ error: 'Administrator claim required.' });
  next();
}
