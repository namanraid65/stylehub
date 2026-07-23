import { Request, Response } from 'express';
import { Discount } from '../models/Discount';
import { logger } from '../utils/logger';

export const getDiscounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { activeOnly, vendorId } = req.query;
    const query: any = {};

    if (activeOnly === 'true') {
      const now = new Date();
      query.isActive = true;
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    }

    if (vendorId) {
      query.$or = [{ vendor: vendorId }, { vendor: { $exists: false } }, { vendor: null }];
    }

    const discounts = await Discount.find(query)
      .populate('vendor', 'name email storeName')
      .populate('products', 'name slug images price')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: discounts.length, data: discounts });
  } catch (err: any) {
    logger.error('Error fetching discounts:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch discounts' });
  }
};

export const createDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const {
      title,
      code,
      scope,
      category,
      products,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      badgeText,
      startDate,
      endDate,
    } = req.body;

    if (!title || !discountType || !discountValue || !endDate) {
      res.status(400).json({ success: false, message: 'Missing required discount fields' });
      return;
    }

    const discountData: any = {
      title,
      code: code ? code.toUpperCase().trim() : undefined,
      scope: scope || 'all',
      category: category || '',
      products: products || [],
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue || 0),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      badgeText: badgeText || 'SPECIAL SALE',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: new Date(endDate),
      isActive: true,
    };

    if (user && user.role === 'vendor') {
      discountData.vendor = user.id;
    }

    const newDiscount = await Discount.create(discountData);
    logger.info(`Discount campaign created: ${newDiscount.title} (${newDiscount._id})`);

    res.status(201).json({ success: true, data: newDiscount });
  } catch (err: any) {
    logger.error('Error creating discount:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create discount' });
  }
};

export const toggleDiscountStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const discount = await Discount.findById(id);

    if (!discount) {
      res.status(404).json({ success: false, message: 'Discount campaign not found' });
      return;
    }

    discount.isActive = !discount.isActive;
    await discount.save();

    res.json({ success: true, message: `Discount status updated to ${discount.isActive ? 'Active' : 'Inactive'}`, data: discount });
  } catch (err: any) {
    logger.error('Error toggling discount:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to toggle discount' });
  }
};

export const deleteDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Discount.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Discount campaign not found' });
      return;
    }

    res.json({ success: true, message: 'Discount campaign deleted successfully' });
  } catch (err: any) {
    logger.error('Error deleting discount:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to delete discount' });
  }
};
