import { Router } from 'express';
import Issue from '../models/Issue.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { requireRole } from '../middleware/auth.js';
import { wasUploadedBy } from '../services/blobStorage.js';
import { sendClientError } from '../utils/httpResponse.js';
import { getIssueTransition, ISSUE_STATUS, withApiId } from '../utils/issueLifecycle.js';

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

async function notifyAllNgos(type, title, message, issueId) {
  const ngos = await User.find({ role: 'ngo' }).select('userId').lean();
  await Promise.all(ngos.map((ngo) => notify(ngo.userId, type, title, message, issueId)));
}

async function notifyNearbyVolunteers(issue) {
  const volunteers = await User.find({ role: 'volunteer', location: { $exists: true } })
    .select('userId location')
    .lean();
  await Promise.all(volunteers.filter((volunteer) => {
    let location = volunteer.location;
    if (typeof location === 'string') {
      const parts = location.split(',').map((part) => Number.parseFloat(part.trim()));
      location = parts.length === 2 && parts.every(Number.isFinite)
        ? { lat: parts[0], lng: parts[1] }
        : null;
    }
    return location && validCoordinates(location.lat, location.lng)
      && distanceKm({ lat: issue.lat, lng: issue.lng }, location) <= 15;
  }).map((volunteer) => notify(
    volunteer.userId,
    'issue-approved',
    'New Verified Task Nearby',
    `Task "${issue.title}" is approved and needs a volunteer.`,
    String(issue._id)
  )));
}

function transitionError(req, res, issue, action) {
  const transition = getIssueTransition(action, issue.status, req.profile.role);
  if (transition) return transition;
  sendClientError(
    req,
    res,
    400,
    `Cannot ${action} an issue with status "${issue.status}" as ${req.profile.role}.`,
    `invalid_issue_transition:${action}:${issue.status}`
  );
  return null;
}

router.use(requireRole('citizen', 'volunteer', 'ngo'));

router.get('/', async (req, res, next) => {
  try {
    const { role, location } = req.profile;
    let filter = {};
    if (role === 'citizen') {
      filter.reportedBy = req.uid;
    } else if (role === 'volunteer') {
      filter = {
        $or: [
          { assignedVolunteerId: req.uid },
          { status: ISSUE_STATUS.APPROVED, assignedVolunteerId: null },
        ],
      };
    }

    if (req.query.mine === 'true') {
      if (role === 'citizen') filter = { ...filter, reportedBy: req.uid };
      if (role === 'volunteer') filter = { assignedVolunteerId: req.uid };
      if (role === 'ngo') filter = { assignedNgoId: req.uid };
    } else if (req.query.mine !== undefined && req.query.mine !== 'false') {
      return sendClientError(req, res, 400, 'mine must be true or false.', 'invalid_mine_filter');
    }

    if (req.query.status !== undefined) {
      const statuses = String(req.query.status).split(',').map((status) => status.trim()).filter(Boolean);
      const allowedStatuses = Object.values(ISSUE_STATUS);
      if (!statuses.length || statuses.some((status) => !allowedStatuses.includes(status))) {
        return sendClientError(req, res, 400, 'status contains an unsupported issue status.', 'invalid_status_filter');
      }
      filter = { $and: [filter, { status: { $in: statuses } }] };
    }

    const issues = await Issue.find(filter).sort({ createdAt: -1 }).lean();
    if (role !== 'volunteer') return res.json(issues.map(withApiId));

    let center;
    if (req.query.lat !== undefined || req.query.lng !== undefined) {
      const lat = Number(req.query.lat);
      const lng = Number(req.query.lng);
      if (!validCoordinates(lat, lng)) {
        return sendClientError(req, res, 400, 'Valid latitude and longitude coordinates are required together.', 'invalid_issue_query_location');
      }
      center = { lat, lng };
    } else if (location && typeof location === 'object' && validCoordinates(location.lat, location.lng)) {
      center = location;
    } else if (typeof location === 'string') {
      const parts = location.split(',').map((part) => Number.parseFloat(part.trim()));
      if (parts.length === 2 && validCoordinates(parts[0], parts[1])) center = { lat: parts[0], lng: parts[1] };
    }

    const visibleIssues = center
      ? issues.filter((issue) => issue.assignedVolunteerId === req.uid
        || (issue.status === ISSUE_STATUS.APPROVED
          && validCoordinates(issue.lat, issue.lng)
          && distanceKm(center, issue) <= 15))
      : issues;
    res.json(visibleIssues.map(withApiId));
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('citizen'), async (req, res, next) => {
  try {
    const { title, description, category, urgency, lat, lng, locationAddress, imageUrl, imageBlob, deadline } = req.body;
    if (
      typeof title !== 'string' || !title.trim()
      || typeof description !== 'string' || !description.trim()
      || typeof category !== 'string' || !category.trim()
      || !validCoordinates(lat, lng)
    ) {
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
      title: title.trim(),
      description,
      category: category.trim(),
      urgency,
      lat,
      lng,
      locationAddress,
      imageUrl,
      imageBlob,
      deadline,
      reportedBy: req.uid,
      reportedByName: req.profile.fullName || req.profile.name || '',
      status: ISSUE_STATUS.PENDING,
      assignedVolunteerId: null,
      assignedVolunteerName: null,
      assignedNgoId: null,
      assignedNgoName: null,
      geohash: req.body.geohash,
    });
    const issueId = String(issue._id);
    await Promise.all([
      notify(req.uid, 'issue-reported', 'Issue Reported', 'Your issue is pending approval.', issueId),
      notifyAllNgos('issue-reported', 'New Issue Reported', `A citizen reported "${issue.title}".`, issueId),
    ]);
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
    if (req.profile.role === 'volunteer'
      && issue.assignedVolunteerId !== req.uid
      && !(issue.status === ISSUE_STATUS.APPROVED && !issue.assignedVolunteerId)) {
      return sendClientError(req, res, 403, 'You cannot read this issue.', 'issue_not_available_to_volunteer');
    }
    res.json(withApiId(issue));
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/approve', requireRole('ngo'), async (req, res, next) => {
  try {
    const current = await Issue.findById(req.params.id).lean();
    if (!current) return res.status(404).json({ error: 'Issue not found.' });
    const transition = transitionError(req, res, current, 'approve');
    if (!transition) return;
    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.id, status: transition.from },
      {
        $set: {
          status: transition.to,
          assignedNgoId: req.uid,
          assignedNgoName: req.profile.fullName || req.profile.name || '',
        },
      },
      { new: true, runValidators: true }
    );
    if (!issue) {
      return sendClientError(req, res, 400, 'This issue changed before it could be approved.', 'issue_transition_conflict');
    }
    await Promise.all([
      notify(issue.reportedBy, 'issue-approved', 'Issue Approved', 'Your issue has been approved and is looking for volunteers.', String(issue._id)),
      notifyNearbyVolunteers(issue),
    ]);
    res.json(issue);
  } catch (error) {
    next(error);
  }
});

async function assignToVolunteer(req, res, next) {
  try {
    const volunteerId = req.body.volunteerId;
    if (typeof volunteerId !== 'string' || !volunteerId.trim()) {
      return sendClientError(req, res, 400, 'volunteerId is required.', 'missing_volunteer_id');
    }
    const volunteer = await User.findOne({ userId: volunteerId, role: 'volunteer' }).lean();
    if (!volunteer) return res.status(404).json({ error: 'Volunteer profile not found.' });
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found.' });
    const action = issue.status === ISSUE_STATUS.ASSIGNED ? 'reassign' : 'assign';
    const transition = transitionError(req, res, issue, action);
    if (!transition) return;
    if (issue.assignedNgoId !== req.uid) {
      return sendClientError(req, res, 403, 'Only the approving NGO can assign this issue.', 'issue_not_assigned_to_ngo');
    }
    const previousVolunteerId = issue.assignedVolunteerId;
    const filter = {
      _id: req.params.id,
      status: transition.from,
      assignedNgoId: req.uid,
      assignedVolunteerId: previousVolunteerId || null,
    };
    const updatedIssue = await Issue.findOneAndUpdate(
      filter,
      {
        $set: {
          status: transition.to,
          assignedVolunteerId: volunteer.userId,
          assignedVolunteerName: volunteer.fullName || volunteer.name || '',
          assignedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );
    if (!updatedIssue) {
      return sendClientError(req, res, 400, 'This issue changed before the volunteer could be assigned.', 'issue_transition_conflict');
    }
    await Promise.all([
      notify(updatedIssue.reportedBy, 'task-assigned', 'Volunteer Assigned', 'A volunteer has been assigned to your issue.', String(updatedIssue._id)),
      notify(volunteer.userId, 'task-assigned', 'Task Assigned', 'An NGO assigned you to a task.', String(updatedIssue._id)),
      ...(previousVolunteerId && previousVolunteerId !== volunteer.userId
        ? [notify(previousVolunteerId, 'task-reassigned', 'Task Reassigned', 'An NGO reassigned this task to another volunteer.', String(updatedIssue._id))]
        : []),
    ]);
    res.json(updatedIssue);
  } catch (error) {
    next(error);
  }
}

router.patch('/:id/assign', requireRole('ngo'), assignToVolunteer);
router.patch('/:id/assign-volunteer', requireRole('ngo'), assignToVolunteer);

router.patch('/:id/accept', requireRole('volunteer'), async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found.' });
    const transition = transitionError(req, res, issue, 'accept');
    if (!transition) return;
    if (issue.assignedVolunteerId) {
      return sendClientError(req, res, 400, 'This issue has already been assigned.', 'issue_already_assigned');
    }
    const updatedIssue = await Issue.findOneAndUpdate(
      { _id: req.params.id, status: transition.from, assignedVolunteerId: null },
      {
        $set: {
          status: transition.to,
          assignedVolunteerId: req.uid,
          assignedVolunteerName: req.profile.fullName || req.profile.name || '',
          assignedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );
    if (!updatedIssue) {
      return sendClientError(req, res, 400, 'This issue was already accepted by another volunteer.', 'issue_transition_conflict');
    }
    await Promise.all([
      notify(updatedIssue.reportedBy, 'task-assigned', 'Volunteer Assigned', 'A volunteer has accepted your issue.', String(updatedIssue._id)),
      notify(updatedIssue.assignedNgoId, 'task-accepted', 'Task Accepted', 'A volunteer accepted an approved task.', String(updatedIssue._id)),
    ]);
    res.json(updatedIssue);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/complete', requireRole('volunteer'), async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found.' });
    const transition = transitionError(req, res, issue, 'complete');
    if (!transition) return;
    if (issue.assignedVolunteerId !== req.uid) {
      return sendClientError(req, res, 403, 'Only the assigned volunteer can complete this issue.', 'volunteer_not_assigned');
    }
    const { completionProofBlob } = req.body;
    if (!completionProofBlob || !(await wasUploadedBy(completionProofBlob, req.uid))) {
      return sendClientError(
        req,
        res,
        400,
        'Upload a completion image before completing your assigned issue.',
        'completion_proof_missing_or_not_owned'
      );
    }
    const updatedIssue = await Issue.findOneAndUpdate(
      { _id: req.params.id, status: transition.from, assignedVolunteerId: req.uid },
      {
        $set: {
          status: transition.to,
          completedAt: new Date(),
          completionProofBlob,
          volunteerNotes: typeof req.body.volunteerNotes === 'string' ? req.body.volunteerNotes : '',
        },
      },
      { new: true, runValidators: true }
    );
    if (!updatedIssue) {
      return sendClientError(req, res, 400, 'This issue changed before completion could be recorded.', 'issue_transition_conflict');
    }
    await Promise.all([
      notify(updatedIssue.assignedNgoId, 'task-completed', 'Task Completed', 'A volunteer completed a task; it is ready for verification.', String(updatedIssue._id)),
      notify(updatedIssue.reportedBy, 'task-completed', 'Issue Completed', 'The volunteer marked your issue completed; it is awaiting verification.', String(updatedIssue._id)),
    ]);
    res.json(updatedIssue);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/verify', requireRole('ngo'), async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found.' });
    const transition = transitionError(req, res, issue, 'verify');
    if (!transition) return;
    if (issue.assignedNgoId !== req.uid) {
      return sendClientError(req, res, 403, 'Only the approving NGO can verify this issue.', 'issue_not_assigned_to_ngo');
    }
    const updatedIssue = await Issue.findOneAndUpdate(
      { _id: req.params.id, status: transition.from, assignedNgoId: req.uid },
      { $set: { status: transition.to, verifiedBy: req.uid, verifiedAt: new Date() } },
      { new: true, runValidators: true }
    );
    if (!updatedIssue) {
      return sendClientError(req, res, 400, 'This issue changed before it could be verified.', 'issue_transition_conflict');
    }
    if (updatedIssue.assignedVolunteerId) {
      await User.updateOne({ userId: updatedIssue.assignedVolunteerId }, { $inc: { points: 10 } });
    }
    await Promise.all([
      notify(updatedIssue.assignedVolunteerId, 'issue-verified', 'Task Verified', `Task "${updatedIssue.title}" was verified. 10 points awarded.`, String(updatedIssue._id)),
      notify(updatedIssue.reportedBy, 'issue-verified', 'Issue Resolved', `Your issue "${updatedIssue.title}" has been resolved and verified.`, String(updatedIssue._id)),
    ]);
    res.json(updatedIssue);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/reject', requireRole('ngo'), async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found.' });
    const transition = transitionError(req, res, issue, 'reject');
    if (!transition) return;
    if (issue.status === ISSUE_STATUS.COMPLETED && issue.assignedNgoId !== req.uid) {
      return sendClientError(req, res, 403, 'Only the approving NGO can return this issue to the volunteer.', 'issue_not_assigned_to_ngo');
    }
    const update = {
      $set: { status: transition.to },
      ...(transition.to === ISSUE_STATUS.ASSIGNED
        ? { $unset: { completedAt: 1, completionProofBlob: 1 } }
        : {}),
    };
    const updatedIssue = await Issue.findOneAndUpdate(
      { _id: req.params.id, status: transition.from },
      update,
      { new: true, runValidators: true }
    );
    if (!updatedIssue) {
      return sendClientError(req, res, 400, 'This issue changed before it could be rejected.', 'issue_transition_conflict');
    }
    if (transition.to === ISSUE_STATUS.ASSIGNED) {
      await Promise.all([
        notify(updatedIssue.assignedVolunteerId, 'task-reassigned', 'Completion Needs Changes', 'The NGO returned your task for additional work.', String(updatedIssue._id)),
        notify(updatedIssue.reportedBy, 'task-reassigned', 'Issue Needs More Work', 'The NGO requested additional work before verification.', String(updatedIssue._id)),
      ]);
    } else {
      await Promise.all([
        notify(updatedIssue.reportedBy, 'issue-rejected', 'Issue Rejected', 'The NGO rejected your reported issue.', String(updatedIssue._id)),
        notifyAllNgos('issue-rejected', 'Issue Rejected', `Issue "${updatedIssue.title}" was rejected.`, String(updatedIssue._id)),
      ]);
    }
    res.json(updatedIssue);
  } catch (error) {
    next(error);
  }
});

export default router;
