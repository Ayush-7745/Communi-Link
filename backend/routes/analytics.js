import { Router } from 'express';
import Issue from '../models/Issue.js';
import { requireRole } from '../middleware/auth.js';
import { ISSUE_STATUS } from '../utils/issueLifecycle.js';

const router = Router();

router.get('/', requireRole('ngo'), async (req, res, next) => {
  try {
    const statuses = Object.values(ISSUE_STATUS);
    const [total, ...statusCounts] = await Promise.all([
      Issue.countDocuments(),
      ...statuses.map((status) => Issue.countDocuments({ status })),
    ]);
    const byStatus = Object.fromEntries(statuses.map((status, index) => [status, statusCounts[index]]));
    const byCategory = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);
    res.json({
      total,
      ...byStatus,
      byStatus,
      byCategory,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
