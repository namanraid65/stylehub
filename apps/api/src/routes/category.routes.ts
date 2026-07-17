import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCategorySchema, updateCategorySchema } from '@stylehub/validators';
import { UserRole } from '@stylehub/types';

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/',       categoryController.getCategories);
router.get('/tree',   categoryController.getCategoryTree);
router.get('/:slug',  categoryController.getCategoryBySlug);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.post('/',
  protect, authorize(UserRole.Admin),
  validate(createCategorySchema),
  categoryController.createCategory,
);

router.put('/:id',
  protect, authorize(UserRole.Admin),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);

router.delete('/:id',
  protect, authorize(UserRole.Admin),
  categoryController.deleteCategory,
);

export default router;
