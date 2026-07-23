import { Router } from 'express';
import { getDiscounts, createDiscount, toggleDiscountStatus, deleteDiscount } from '../controllers/discount.controller';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '@stylehub/types';

const router = Router();

// Public: Fetch active discount campaigns
router.get('/', getDiscounts);

// Admin & Vendor: Manage discount campaigns (requires authentication)
router.post('/', protect, authorize(UserRole.Admin, UserRole.Vendor), createDiscount);
router.patch('/:id/toggle', protect, authorize(UserRole.Admin, UserRole.Vendor), toggleDiscountStatus);
router.delete('/:id', protect, authorize(UserRole.Admin, UserRole.Vendor), deleteDiscount);

export default router;
