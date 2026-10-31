import { Router } from 'express';
import Issue from '../models/Issue.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { requireRole } from '../middleware/auth.js';
import { wasUploadedBy } from '../services/blobStorage.js';
import { sendClientError } from '../utils/httpResponse.js';

const router = Router();

function validCoordinates(lat, lng) {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90
    && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

function distanceKm(a, b) {
  const radians = (value) => value * Math.PI / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

async function notify(userId, type, title, message, issueId) {
  if (!userId) return;
  await Notification.create({ userId, type, title, message, issueId, read: false });
}

async function notifyNearbyVolunteers(issue) {
  const volunteers = await User.find({ role: 'volunteer', location: { $exists: true } }).lean();
  await Promise.all(volunteers.filter((volunteer) => {
    const location = volunteer.location;
    let point = location;
    if (typeof location === 'string') {
      const parts = location.split(',').map((part) => Number.parseFloat(part.trim()));
      point = parts.length === 2 && parts.every(Number.isFinite)
        ? { lat: parts[0], lng: parts[1] }
        : null;
    }
    return point && Number.isFinite(point.lat) && Number.isFinite(point.lng)
      && distanceKm({ lat: issue.lat, lng: issue.lng }, point) <= 15;
  }).map((volunteer) => notify(
    volunteer.userId,
    'issue-approved',
    'New Verified Task Nearby',
    `Task "${issue.title}" is approved and needs a volunteer.`,
    issue._id.toString()
  )));
}

router.use(requireRole('citizen', 'volunteer', 'ngo'));

router.get('/', async (req, res, next) => {
  try {
    const { role, location } = req.profile;
    let filter = {};
    if (role === 'citizen') {
      filter.reportedBy = req.uid;
    } else {
      const statuses = role === 'volunteer'
        ? ['approved', 'assigned', 'completed', 'verified']
        : ['pending', 'approved', 'assigned', 'completed', 'verified'];
      filter.status = { $in: statuses };
    }
    const issues = await Issue.find(filter).sort({ createdAt: -1 }).lean();
    if (role === 'citizen') return res.json(issues);

    const hasQueryLocation = req.query.lat !== undefined && req.query.lng !== undefined;
    const center = hasQueryLocation
      ? { lat: Number(req.query.lat), lng: Number(req.query.lng) }
      : location && typeof location === 'object' ? location : null;
    if (!center || !validCoordinates(center.lat, center.lng)) {
      return res.json(role === 'volunteer'
        ? issues.filter((issue) => issue.assignedVolunteerId === req.uid)
        : []);
    }

    res.json(issues.filter((issue) =>
      issue.assignedVolunteerId === req.uid
      || (Number.isFinite(issue.lat) && Number.isFinite(issue.lng)
        && distanceKm(center, { lat: issue.lat, lng: issue.lng }) <= 15)
    ));
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('citizen'), async (req, res, next) => {
  try {
    const { title, description, category, urgency, lat, lng, locationAddress, imageUrl, imageBlob, deadline } = req.body;
    if (!title || !description || !category || !validCoordinates(lat, lng)) {
      return sendClientError(
        req,
        res,
        400,
        'Title, description, category, and valid latitude and longitude coordinates are required.',
        'missing_or_invalid_issue_fields'
      );
    }
    if (locationAddress !== undefined && typeof locationAddress !== 'string') {
      return sendClientError(req, res, 400, 'locationAddress must be a string.', 'invalid_location_address');
    }
    if (imageBlob && !(await wasUploadedBy(imageBlob, req.uid))) {
      return sendClientError(
        req,
        res,
        403,
        'The issue image must be uploaded by the reporting Citizen.',
        'issue_image_not_owned_by_reporter'
      );
    }
    const issue = await Issue.create({
      title, description, category, urgency, lat, lng, locationAddress, imageUrl, imageBlob, deadline,
      reportedBy: req.uid,
      reportedByName: req.profile.fullName,
      status: 'pending',
      assignedVolunteerId: null,
      assignedNgoId: null,
      geohash: req.body.geohash,
    });
    await notify(req.uid, 'issue-reported', 'Issue Reported', 'Your issue is pending approval.', issue._id.toString());
    res.status(201).json(issue);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id).lean();
    if (!issue) return res.status(404).json({ error: 'Issue not found.' });
    if (req.profile.role === 'citizen' && issue.reportedBy !== req.uid) {
      return sendClientError(req, res, 403, 'You cannot read this issue.', 'issue_not_owned_by_citizen');
    }
    res.json(issue);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/approve', requireRole('ngo'), async (req, res, next) => {
  try {
    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { $set: { status: 'approved', assignedNgoId: req.uid, assignedNgoName: req.profile.fullName } },
      { new: true, runValidators: true }
    );
    if (!issue) return res.status(409).json({ error: 'Only pending issues can be approved.' });
    await Promise.all([
      notify(issue.reportedBy, 'issue-approved', 'Issue Approved', 'Your issue has been approved and is looking for volunteers.', issue.id),
      notifyNearbyVolunteers(issue),
    ]);
    res.json(issue);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/assign', requireRole('volunteer'), async (req, res, next) => {
  try {
    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.id, status: 'approved', assignedVolunteerId: null },
      {
        $set: {
          status: 'assigned',
          assignedVolunteerId: req.uid,
          assignedVolunteerName: req.profile.fullName,
          assignedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );
    if (!issue) return res.status(409).json({ error: 'Only unassigned approved issues can be accepted.' });
    await Promise.all([
      notify(issue.reportedBy, 'task-assigned', 'Volunteer Assigned', 'A volunteer has accepted your issue.', issue.id),
      notify(issue.assignedNgoId, 'task-accepted', 'Task Accepted', 'A volunteer accepted an approved task.', issue.id),
    ]);
    res.json(issue);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/assign-volunteer', requireRole('ngo'), async (req, res, next) => {
  try {
    const volunteer = await User.findOne({ userId: req.body.volunteerId, role: 'volunteer' }).lean();
    if (!volunteer) return res.status(404).json({ error: 'Volunteer profile not found.' });
    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.id, status: 'approved', assignedNgoId: req.uid, assignedVolunteerId: null },
      {
        $set: {
          status: 'assigned',
          assignedVolunteerId: volunteer.userId,
          assignedVolunteerName: volunteer.fullName,
          assignedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );
    if (!issue) return res.status(409).json({ error: 'Only unassigned approved issues assigned to your NGO can be assigned.' });
    await Promise.all([
      notify(issue.reportedBy, 'task-assigned', 'Volunteer Assigned', 'A volunteer has been assigned to your issue.', issue.id),
      notify(volunteer.userId, 'task-assigned', 'Task Assigned', 'An NGO assigned you to a task.', issue.id),
    ]);
    res.json(issue);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/complete', requireRole('volunteer'), async (req, res, next) => {
  try {
    const { completionProofBlob } = req.body;
    if (!completionProofBlob || !(await wasUploadedBy(completionProofBlob, req.uid))) {
      return sendClientError(
        req,
        res,
        403,
        'Upload a completion image before completing your assigned issue.',
        'completion_proof_missing_or_not_owned'
      );
    }
    const update = {
      status: 'completed',
      completedAt: new Date(),
      completionProofBlob,
      volunteerNotes: typeof req.body.volunteerNotes === 'string' ? req.body.volunteerNotes : '',
    };
    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.id, status: 'assigned', assignedVolunteerId: req.uid },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!issue) return res.status(409).json({ error: 'Only your assigned issues can be marked completed.' });
    await Promise.all([
      notify(issue.assignedNgoId, 'task-completed', 'Task Completed', 'A volunteer completed a task; it is ready for verification.', issue.id),
      notify(issue.reportedBy, 'task-completed', 'Issue Completed', 'The volunteer marked your issue completed; it is awaiting verification.', issue.id),
    ]);
    res.json(issue);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/verify', requireRole('ngo'), async (req, res, next) => {
  try {
    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.id, status: 'completed', assignedNgoId: req.uid },
      { $set: { status: 'verified' } },
      { new: true, runValidators: true }
    );
    if (!issue) return res.status(409).json({ error: 'Only completed issues assigned to your NGO can be verified.' });
    if (issue.assignedVolunteerId) {
      await User.updateOne({ userId: issue.assignedVolunteerId }, { $inc: { points: 10 } });
    }
    await Promise.all([
      notify(issue.assignedVolunteerId, 'issue-verified', 'Task Verified', `Task "${issue.title}" was verified. 10 points awarded.`, issue.id),
      notify(issue.reportedBy, 'issue-verified', 'Issue Resolved', `Your issue "${issue.title}" has been resolved and verified.`, issue.id),
    ]);
    res.json(issue);
  } catch (error) {
    next(error);
  }
});

export default router;
