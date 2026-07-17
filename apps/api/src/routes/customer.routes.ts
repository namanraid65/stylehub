import { Router, Request, Response } from 'express';
import User from '../models/User';
import Order from '../models/Order';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '@stylehub/types';
import { ApiResponseBuilder } from '../utils/ApiResponse';

const router = Router();

/**
 * GET /api/customers
 * Admin: Get all customers with their order stats.
 */
router.get('/', protect, authorize(UserRole.Admin), async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Number(req.query.limit ?? 20));
    const skip = (page - 1) * limit;

    const query = { role: UserRole.Customer };

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const data = await Promise.all(
      users.map(async (u: any) => {
        const orders = await Order.find({ customer: u._id });
        const orderCount = orders.length;
        const totalSpent = orders.reduce((sum, o) => sum + (o.totals?.total ?? 0), 0);
        return {
          ...u,
          orderCount,
          totalSpent,
        };
      })
    );

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json(ApiResponseBuilder.error('Failed to fetch customers.'));
  }
});

/**
 * PATCH /api/customers/:id/status
 * Admin: Suspend or activate a customer account.
 */
router.patch('/:id/status', protect, authorize(UserRole.Admin), async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== UserRole.Customer) {
      res.status(404).json(ApiResponseBuilder.error('Customer not found.'));
      return;
    }

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      res.status(400).json(ApiResponseBuilder.error('isActive must be a boolean.'));
      return;
    }

    user.isActive = isActive;
    await user.save();

    res.json(ApiResponseBuilder.success(`Customer account status updated to ${isActive ? 'Active' : 'Suspended'}.`, user));
  } catch (err) {
    res.status(500).json(ApiResponseBuilder.error('Failed to update customer status.'));
  }
});

export default router;
