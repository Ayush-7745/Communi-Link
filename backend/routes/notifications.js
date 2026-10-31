import { Router } from 'express';
import Notification from '../models/Notification.js';
import { requireRole } from '../middleware/auth.js';
import { sendClientError } from '../utils/httpResponse.js';

const router = Router();
router.use(requireRole('citizen', 'volunteer', 'ngo'));

router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.uid }).sort({ createdAt: -1 }).lean();
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { userId = req.uid, type, title, message, issueId } = req.body;
    if (userId !== req.uid) {
      return sendClientError(
        req,
        res,
        403,
        'Notifications can only be created for the authenticated user.',
        'notification_user_id_mismatch'
      );
    }
    if (!type || !title || !message) {
      return sendClientError(req, res, 400, 'type, title, and message are required.', 'missing_notification_fields');
    }
    const notification = await Notification.create({ userId: req.uid, type, title, message, issueId, read: false });
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.uid },
      { $set: { read: true } },
      { new: true }
    ).lean();
    if (!notification) return res.status(404).json({ error: 'Notification not found.' });
    res.json(notification);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.uid });
    if (!notification) return res.status(404).json({ error: 'Notification not found.' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
