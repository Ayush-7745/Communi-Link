import { getAuth } from 'firebase-admin/auth';
import User from '../models/User.js';
import { sendClientError } from '../utils/httpResponse.js';

export async function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return sendClientError(
      req,
      res,
      401,
      'Invalid or expired authentication token.',
      'missing_or_malformed_bearer_token'
    );
  }

  try {
    const decoded = await getAuth().verifyIdToken(match[1]);
    req.uid = decoded.uid;
    req.tokenClaims = decoded;
    next();
  } catch (error) {
    sendClientError(
      req,
      res,
      401,
      'Invalid or expired authentication token.',
      'token_verification_failed'
    );
  }
}

export function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const profile = await User.findOne({ userId: req.uid }).lean();
      if (!profile) {
        return sendClientError(req, res, 403, 'A user profile is required for this action.', 'profile_not_registered');
      }
      if (!roles.includes(profile.role)) {
        return sendClientError(
          req,
          res,
          403,
          `This action requires one of these roles: ${roles.join(', ')}.`,
          `role_not_allowed:${profile.role}`
        );
      }
      req.profile = profile;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAdminClaim(req, res, next) {
  if (req.tokenClaims?.admin !== true) {
    return sendClientError(req, res, 403, 'Administrator claim required.', 'missing_admin_claim');
  }
  next();
}
