import { Router } from 'express';
import User from '../models/User.js';
import { requireAdminClaim, requireRole } from '../middleware/auth.js';
import { sendClientError } from '../utils/httpResponse.js';

const router = Router();
const allowedProfileFields = [
  'fullName', 'name', 'phone', 'profilePhoto', 'location', 'geohash',
  'skills', 'availability', 'orgType', 'registrationNumber', 'orgAddress',
  'yearEstablished', 'areaOfWork', 'inchargeName', 'inchargeEmail',
  'inchargePhone', 'website',
];

function distanceKm(a, b) {
  const radians = (value) => value * Math.PI / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function coordinates(location) {
  if (location && typeof location === 'object' && Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
    if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) return null;
    return { lat: location.lat, lng: location.lng };
  }
  if (typeof location === 'string') {
    const parts = location.split(',').map((part) => Number.parseFloat(part.trim()));
    if (
      parts.length === 2 && parts.every(Number.isFinite)
      && parts[0] >= -90 && parts[0] <= 90 && parts[1] >= -180 && parts[1] <= 180
    ) return { lat: parts[0], lng: parts[1] };
  }
  return null;
}

router.post('/', async (req, res, next) => {
  try {
    if (req.body.userId && req.body.userId !== req.uid) {
      return sendClientError(req, res, 403, 'Profile userId must match the authenticated user.', 'user_id_mismatch');
    }
    const { role, email } = req.body;
    if (!['citizen', 'volunteer', 'ngo'].includes(role) || typeof email !== 'string' || !email) {
      return sendClientError(req, res, 400, 'A valid email and role are required.', 'invalid_email_or_role');
    }
    if (email.toLowerCase() !== String(req.tokenClaims.email || '').toLowerCase()) {
      return sendClientError(
        req,
        res,
        403,
        'Profile email must match the authenticated Firebase account.',
        'email_mismatch'
      );
    }
    if (req.body.location != null && !coordinates(req.body.location)) {
      return sendClientError(
        req,
        res,
        400,
        'Location must contain valid latitude and longitude coordinates.',
        'invalid_location_coordinates'
      );
    }
    if (await User.exists({ userId: req.uid })) {
      return res.status(409).json({
        error: 'A profile already exists; the role cannot be changed.',
        reason: 'profile_already_exists',
      });
    }

    const profile = await User.create({
      ...Object.fromEntries(allowedProfileFields.filter((key) => key in req.body).map((key) => [key, req.body[key]])),
      uid: req.uid,
      userId: req.uid,
      email,
      role,
      points: 0,
    });
    res.status(201).json(profile);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'A profile already exists; the role cannot be changed.',
        reason: 'profile_already_exists',
      });
    }
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const profile = await User.findOne({ userId: req.uid }).lean();
    if (!profile) return res.status(404).json({ error: 'profile_not_found' });
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.patch('/me', requireRole('citizen', 'volunteer', 'ngo'), async (req, res, next) => {
  try {
    if (req.body.location != null && !coordinates(req.body.location)) {
      return sendClientError(
        req,
        res,
        400,
        'Location must contain valid latitude and longitude coordinates.',
        'invalid_location_coordinates'
      );
    }
    const updates = Object.fromEntries(
      allowedProfileFields.filter((key) => key in req.body).map((key) => [key, req.body[key]])
    );
    if (!Object.keys(updates).length) {
      return sendClientError(req, res, 400, 'No editable profile fields supplied.', 'no_editable_profile_fields');
    }
    const profile = await User.findOneAndUpdate(
      { userId: req.uid },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.get('/directory', requireRole('ngo'), async (req, res, next) => {
  try {
    const role = req.query.role;
    if (!['volunteer', 'ngo'].includes(role)) {
      return sendClientError(req, res, 400, 'A valid directory role is required.', 'invalid_directory_role');
    }
    const users = await User.find({ role })
      .select('userId role fullName name email phone profilePhoto location geohash skills availability createdAt online verified rating tasksCompleted reliability city')
      .lean();
    const center = coordinates({
      lat: Number(req.query.lat),
      lng: Number(req.query.lng),
    });
    const nearbyUsers = center
      ? users.filter((user) => {
        const point = coordinates(user.location);
        return point && distanceKm(center, point) <= 15;
      })
      : users;
    res.json(nearbyUsers.map((user) => ({
      ...user,
      location: coordinates(user.location) || user.location,
    })));
  } catch (error) {
    next(error);
  }
});

router.get('/by-id/:userId', requireRole('citizen', 'volunteer', 'ngo'), async (req, res, next) => {
  try {
    const fields = req.params.userId === req.uid
      ? ''
      : 'userId role fullName name email phone profilePhoto location skills availability';
    const profile = await User.findOne({ userId: req.params.userId }).select(fields).lean();
    if (!profile) return res.status(404).json({ error: 'User profile not found.' });
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.post('/maintenance/geohashes', requireAdminClaim, async (req, res, next) => {
  try {
    const { geohashForLocation } = await import('geofire-common');
    const users = await User.find({ location: { $exists: true } });
    const issues = await (await import('../models/Issue.js')).default.find({ lat: { $exists: true }, lng: { $exists: true } });
    let updatedUsers = 0;
    let updatedIssues = 0;
    for (const user of users) {
      const point = coordinates(user.location);
      if (point && !user.geohash) {
        user.location = point;
        user.geohash = geohashForLocation([point.lat, point.lng]);
        await user.save();
        updatedUsers++;
      }
    }
    for (const issue of issues) {
      if (Number.isFinite(issue.lat) && Number.isFinite(issue.lng) && !issue.geohash) {
        issue.geohash = geohashForLocation([issue.lat, issue.lng]);
        await issue.save();
        updatedIssues++;
      }
    }
    res.json({ updatedUsers, updatedIssues });
  } catch (error) {
    next(error);
  }
});

export default router;
