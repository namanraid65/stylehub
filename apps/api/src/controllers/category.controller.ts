import { Request, Response } from 'express';
import slugify from 'slugify';
import Category from '../models/Category';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponseBuilder } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

// ─── GET /api/categories ──────────────────────────────────────────────────────
// Returns the full category tree (root → children) for nav menus
export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true })
    .sort({ level: 1, sortOrder: 1 })
    .lean();
  res.json(ApiResponseBuilder.success('Categories fetched.', categories));
});

// ─── GET /api/categories/tree ─────────────────────────────────────────────────
// Returns nested tree structure { parent, children: [...] }
export const getCategoryTree = asyncHandler(async (_req: Request, res: Response) => {
  const all = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();

  const map = new Map(all.map((c) => [c._id.toString(), { ...c, children: [] as typeof all }]));
  const roots: typeof all = [];

  for (const cat of map.values()) {
    if (cat.parent) {
      const parent = map.get(cat.parent.toString());
      if (parent) (parent.children as typeof all).push(cat);
    } else {
      roots.push(cat);
    }
  }

  res.json(ApiResponseBuilder.success('Category tree fetched.', roots));
});

// ─── GET /api/categories/:slug ────────────────────────────────────────────────
export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findOne({ slug: req.params['slug'], isActive: true })
    .populate('parent', 'name slug')
    .lean();
  if (!category) throw ApiError.notFound('Category');
  res.json(ApiResponseBuilder.success('Category fetched.', category));
});

// ─── POST /api/categories — [admin] ──────────────────────────────────────────
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, ...rest } = req.body as { name: string; slug?: string; [key: string]: unknown };

  const autoSlug = slug ?? slugify(name, { lower: true, strict: true });
  const existing = await Category.findOne({ slug: autoSlug });
  if (existing) throw ApiError.conflict(`Category slug "${autoSlug}" is already taken.`);

  const category = await Category.create({ name, slug: autoSlug, ...rest });
  res.status(201).json(ApiResponseBuilder.success('Category created.', category));
});

// ─── PUT /api/categories/:id — [admin] ───────────────────────────────────────
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndUpdate(req.params['id'], req.body, {
    new: true, runValidators: true,
  });
  if (!category) throw ApiError.notFound('Category');
  res.json(ApiResponseBuilder.success('Category updated.', category));
});

// ─── DELETE /api/categories/:id — [admin] ────────────────────────────────────
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params['id']);
  if (!category) throw ApiError.notFound('Category');

  // Soft-delete: deactivate instead of removing (preserves product references)
  category.isActive = false;
  await category.save();
  res.json(ApiResponseBuilder.success('Category deactivated.'));
});
