import { Router } from 'express';
import Issue from '../models/Issue.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireRole('ngo'), async (req, res, next) => {
  try {
    const [total, pending, approved, assigned, completed, verified] = await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: 'pending' }),
      Issue.countDocuments({ status: 'approved' }),
      Issue.countDocuments({ status: 'assigned' }),
      Issue.countDocuments({ status: 'completed' }),
      Issue.countDocuments({ status: 'verified' }),
    ]);
    const byCategory = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);
    res.json({ total, pending, approved, assigned, completed, verified, byCategory });
  } catch (error) {
    next(error);
  }
});

export default router;
