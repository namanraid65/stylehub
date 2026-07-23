import { Router } from 'express';
import healthRouter       from './health.routes';
import authRouter         from './auth.routes';
import categoryRouter     from './category.routes';
import productRouter      from './product.routes';
import cartRouter         from './cart.routes';
import couponRouter       from './coupon.routes';
import orderRouter        from './order.routes';
import enquiryRouter      from './enquiry.routes';
import reviewRouter       from './review.routes';
import qaRouter           from './qa.routes';
import notificationRouter from './notification.routes';
import activityRouter     from './activity.routes';
import analyticsRouter    from './analytics.routes';
import cmsRouter          from './cms.routes';
import vendorRouter       from './vendor.routes';
import customerRouter     from './customer.routes';
import discountRouter     from './discount.routes';
import walletRouter       from './wallet.routes';
import uploadRouter       from './upload.routes';

const router = Router();

// ─── Mount all route groups ───────────────────────────────────────────────────
router.use('/health',        healthRouter);
router.use('/auth',          authRouter);
router.use('/categories',    categoryRouter);
router.use('/products',      productRouter);
router.use('/cart',          cartRouter);
router.use('/coupons',       couponRouter);
router.use('/orders',        orderRouter);
router.use('/enquiries',     enquiryRouter);
router.use('/reviews',       reviewRouter);
router.use('/qa',            qaRouter);
router.use('/notifications', notificationRouter);
router.use('/activity',      activityRouter);
router.use('/analytics',    analyticsRouter);
router.use('/cms',          cmsRouter);
router.use('/vendors',      vendorRouter);
router.use('/customers',    customerRouter);
router.use('/discounts',    discountRouter);
router.use('/wallet',       walletRouter);
router.use('/upload',       uploadRouter);



export default router;
