import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { protect, authorize, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema, updateStockSchema } from '@stylehub/validators';
import { UserRole } from '@stylehub/types';
import { logActivity } from '../middleware/activityLogger';

const router = Router();

// ─── Public catalog ───────────────────────────────────────────────────────────
router.get('/',         optionalAuth, productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);

// ─── Vendor dashboard — their own products ────────────────────────────────────
// IMPORTANT: Must be defined BEFORE /:slug to prevent Express matching "vendor" as a slug
router.get('/vendor/mine',
  protect, authorize(UserRole.Vendor, UserRole.Admin),
  productController.getVendorProducts,
);

router.get('/:slug',    optionalAuth, productController.getProductBySlug);


// ─── Create product [vendor + admin] ─────────────────────────────────────────
router.post('/',
  protect, authorize(UserRole.Vendor, UserRole.Admin),
  validate(createProductSchema),
  logActivity('product.create', 'Product'),
  productController.createProduct,
);

// ─── Update product [vendor (own) + admin] ────────────────────────────────────
router.put('/:id',
  protect, authorize(UserRole.Vendor, UserRole.Admin),
  validate(updateProductSchema),
  logActivity('product.update', 'Product'),
  productController.updateProduct,
);

// ─── Update variant stock ─────────────────────────────────────────────────────
router.patch('/:id/variants/:variantId/stock',
  protect, authorize(UserRole.Vendor, UserRole.Admin),
  validate(updateStockSchema),
  logActivity('product.update', 'Product'),
  productController.updateVariantStock,
);

// ─── Archive product ──────────────────────────────────────────────────────────
router.delete('/:id',
  protect, authorize(UserRole.Vendor, UserRole.Admin),
  logActivity('product.delete', 'Product'),
  productController.deleteProduct,
);

export default router;
