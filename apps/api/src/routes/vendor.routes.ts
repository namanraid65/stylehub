import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Vendor from '../models/Vendor';
import User from '../models/User';
import Product from '../models/Product';
import Enquiry from '../models/Enquiry';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '@stylehub/types';
import { ApiError } from '../utils/ApiError';
import { ApiResponseBuilder } from '../utils/ApiResponse';
import { logActivity } from '../middleware/activityLogger';

const router = Router();

/**
 * GET /api/vendors/public/all
 * Public: Get all approved vendors.
 */
router.get('/public/all', async (req: Request, res: Response) => {
  try {
    const vendors = await Vendor.find({ status: 'approved' })
      .select('storeName storeSlug storeLogo storeBanner storeDescription storeLocation storeTags storeRating totalReviews status')
      .lean();
    res.json({ success: true, data: vendors });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve vendors.' });
  }
});

/**
 * GET /api/vendors/public/slug/:slug
 * Public: Get approved vendor by store slug.
 */
router.get('/public/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      res.status(400).json({ success: false, message: 'Slug parameter is required.' });
      return;
    }
    const vendor = await Vendor.findOne({ storeSlug: slug.toLowerCase(), status: 'approved' })
      .select('storeName storeSlug storeLogo storeBanner storeDescription storeLocation storeTags storeRating totalReviews status')
      .lean();
    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor not found.' });
      return;
    }
    res.json({ success: true, data: vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve vendor.' });
  }
});

/**
 * GET /api/vendors/me
 * Get logged-in user's vendor profile.
 */
router.get('/me', protect, authorize(UserRole.Vendor, UserRole.Admin), async (req: Request, res: Response) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user!._id });
    if (!vendor) {
      res.status(404).json(ApiResponseBuilder.error('Vendor profile not found.'));
      return;
    }
    res.json(ApiResponseBuilder.success('Vendor profile retrieved.', vendor));
  } catch (err) {
    res.status(500).json(ApiResponseBuilder.error('Failed to fetch vendor profile.'));
  }
});

/**
 * PUT /api/vendors/me
 * Update logged-in user's vendor profile.
 */
router.put('/me', protect, authorize(UserRole.Vendor, UserRole.Admin), async (req: Request, res: Response) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user!._id });
    if (!vendor) {
      res.status(404).json(ApiResponseBuilder.error('Vendor profile not found.'));
      return;
    }

    const {
      storeName,
      storeDescription,
      storeLogo,
      storeBanner,
      storeTags,
      storeLocation,
      socialLinks,
      businessName,
      gstNumber,
      panNumber,
      businessAddress,
      bankDetails,
    } = req.body;

    if (storeName) {
      vendor.storeName = storeName;
    }
    if (storeDescription !== undefined) vendor.storeDescription = storeDescription;
    if (storeLogo !== undefined) vendor.storeLogo = storeLogo;
    if (storeBanner !== undefined) vendor.storeBanner = storeBanner;
    if (storeTags !== undefined) vendor.storeTags = storeTags;
    if (storeLocation !== undefined) vendor.storeLocation = storeLocation;
    if (socialLinks !== undefined) vendor.socialLinks = socialLinks;
    if (businessName !== undefined) vendor.businessName = businessName;
    if (gstNumber !== undefined) vendor.gstNumber = gstNumber;
    if (panNumber !== undefined) vendor.panNumber = panNumber;
    if (businessAddress !== undefined) vendor.businessAddress = businessAddress;
    if (bankDetails !== undefined) vendor.bankDetails = bankDetails;

    await vendor.save();
    res.json(ApiResponseBuilder.success('Vendor profile updated successfully.', vendor));
  } catch (err) {
    res.status(500).json(ApiResponseBuilder.error('Failed to update vendor profile.'));
  }
});

/**
 * GET /api/vendors
 * Admin: Get all vendors.
 */
router.get('/', protect, authorize(UserRole.Admin), async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Number(req.query.limit ?? 20));
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const [vendorsRaw, total] = await Promise.all([
      Vendor.find(query)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vendor.countDocuments(query),
    ]);

    const vendors = await Promise.all(
      vendorsRaw.map(async (v) => {
        const totalProducts = await Product.countDocuments({ vendor: v._id, status: 'active' });
        return {
          ...v,
          totalProducts,
        };
      })
    );

    res.json(ApiResponseBuilder.paginated('Vendors retrieved.', vendors, page, limit, total));
  } catch (err) {
    res.status(500).json(ApiResponseBuilder.error('Failed to retrieve vendors.'));
  }
});

/**
 * PATCH /api/vendors/:id/status
 * Admin: Update vendor status.
 */
router.patch('/:id/status',
  protect,
  authorize(UserRole.Admin),
  logActivity('admin.action', 'Vendor', (req: any, resBody: any) => {
    const status = req.body?.status || '';
    const name = resBody?.data?.storeName || 'Vendor';
    return `Admin ${status} vendor "${name}"`;
  }),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body as { status: string; reason?: string };

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      res.status(404).json(ApiResponseBuilder.error('Vendor not found.'));
      return;
    }

    vendor.status = status as any;
    if (reason) {
      vendor.rejectionReason = reason;
    }
    if (status === 'approved') {
      vendor.approvedAt = new Date();
      // Ensure the associated user has the role 'vendor'
      await User.findByIdAndUpdate(vendor.user, { role: UserRole.Vendor });
    }

    await vendor.save();
    res.json(ApiResponseBuilder.success('Vendor status updated.', vendor));
  } catch (err) {
    res.status(500).json(ApiResponseBuilder.error('Failed to update vendor status.'));
  }
});

/**
 * DELETE /api/vendors/:id
 * Admin: Delete vendor and cascade delete their products, enquiries, and user account.
 */
router.delete('/:id',
  protect,
  authorize(UserRole.Admin),
  logActivity('admin.action', 'Vendor', (req: any, resBody: any) => {
    const name = resBody?.data?.storeName || 'Vendor';
    return `Admin deleted vendor "${name}"`;
  }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const vendor = await Vendor.findById(id);
      if (!vendor) {
        res.status(404).json(ApiResponseBuilder.error('Vendor not found.'));
        return;
      }

      // 1. Delete associated User credentials
      if (vendor.user) {
        await User.findByIdAndDelete(vendor.user);
      }

      // 2. Delete associated Products
      await Product.deleteMany({ vendor: vendor._id });

      // 3. Delete associated Enquiries
      await Enquiry.deleteMany({ vendor: vendor._id });

      // 4. Finally delete the Vendor document
      await Vendor.findByIdAndDelete(id);

      res.json(ApiResponseBuilder.success('Vendor and all associated data deleted successfully.', vendor));
    } catch (err) {
      res.status(500).json(ApiResponseBuilder.error('Failed to delete vendor and associated data.'));
    }
  }
);

/**
 * POST /api/vendors/:id/follow
 * Follow / unfollow vendor storefront.
 */
router.post('/:id/follow', protect, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      res.status(400).json(ApiResponseBuilder.error('Invalid vendor ID.'));
      return;
    }
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      res.status(404).json(ApiResponseBuilder.error('Vendor not found.'));
      return;
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json(ApiResponseBuilder.error('User not found.'));
      return;
    }

    // Initialize followedVendors if it doesn't exist
    if (!user.followedVendors) {
      user.followedVendors = [];
    }

    const vendorObjectId = new mongoose.Types.ObjectId(id);
    const index = user.followedVendors.findIndex(vId => vId.toString() === id);

    let isFollowing = false;
    if (index > -1) {
      // Unfollow
      user.followedVendors.splice(index, 1);
    } else {
      // Follow
      user.followedVendors.push(vendorObjectId);
      isFollowing = true;
    }

    await user.save();
    res.json(ApiResponseBuilder.success(
      isFollowing ? 'Store followed successfully.' : 'Store unfollowed successfully.',
      { isFollowing }
    ));
  } catch (err) {
    res.status(500).json(ApiResponseBuilder.error('Failed to toggle follow state.'));
  }
});

/**
 * GET /api/vendors/:id/follow-status
 * Check if the user is following the vendor.
 */
router.get('/:id/follow-status', protect, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      res.status(400).json(ApiResponseBuilder.error('Invalid vendor ID.'));
      return;
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json(ApiResponseBuilder.error('User not found.'));
      return;
    }

    const isFollowing = !!(user.followedVendors && user.followedVendors.some(vId => vId.toString() === id));
    res.json(ApiResponseBuilder.success('Follow status retrieved.', { isFollowing }));
  } catch (err) {
    res.status(500).json(ApiResponseBuilder.error('Failed to check follow status.'));
  }
});

export default router;
