import { Router, Request, Response } from 'express';
import CmsPage from '../models/CmsPage';
import Banner   from '../models/Banner';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// ─── CMS Pages ────────────────────────────────────────────────────────────────

/** GET /api/cms/pages — list all pages (admin) */
router.get('/pages', protect, authorize('admin'), async (_req: Request, res: Response) => {
  const pages = await CmsPage.find({}, 'slug title isPublished updatedAt').sort({ slug: 1 });
  res.json({ pages });
});

/** GET /api/cms/pages/:slug — get full page (public) */
router.get('/pages/:slug', async (req: Request, res: Response) => {
  const page = await CmsPage.findOne({ slug: req.params.slug });
  if (!page) { res.status(404).json({ message: 'Page not found' }); return; }
  res.json({ page });
});

/** POST /api/cms/pages — create page (admin) */
router.post('/pages', protect, authorize('admin'), async (req: Request, res: Response) => {
  const { slug, title, description, seoTitle, seoDesc, blocks } = req.body as {
    slug: string; title: string; description?: string;
    seoTitle?: string; seoDesc?: string; blocks?: unknown[];
  };
  const existing = await CmsPage.findOne({ slug });
  if (existing) { res.status(409).json({ message: 'Slug already exists' }); return; }
  const page = await CmsPage.create({ slug, title, description, seoTitle, seoDesc, blocks: blocks ?? [] });
  res.status(201).json({ page });
});

/** PUT /api/cms/pages/:slug — full page save (admin) */
router.put('/pages/:slug', protect, authorize('admin'), async (req: Request, res: Response) => {
  const page = await CmsPage.findOneAndUpdate(
    { slug: req.params.slug },
    { ...req.body, updatedBy: (req as any).user?._id },
    { new: true, runValidators: true, upsert: true },
  );
  res.json({ page });
});

/** PATCH /api/cms/pages/:slug/publish — toggle published (admin) */
router.patch('/pages/:slug/publish', protect, authorize('admin'), async (req: Request, res: Response) => {
  const { isPublished } = req.body as { isPublished: boolean };
  const page = await CmsPage.findOneAndUpdate(
    { slug: req.params.slug },
    { isPublished },
    { new: true },
  );
  if (!page) { res.status(404).json({ message: 'Page not found' }); return; }
  res.json({ page });
});

/** DELETE /api/cms/pages/:slug — delete page (admin) */
router.delete('/pages/:slug', protect, authorize('admin'), async (req: Request, res: Response) => {
  const page = await CmsPage.findOneAndDelete({ slug: req.params.slug });
  if (!page) { res.status(404).json({ message: 'Page not found' }); return; }
  res.json({ message: 'Deleted' });
});

// ─── Blocks (nested update helpers) ──────────────────────────────────────────

/** PUT /api/cms/pages/:slug/blocks — replace entire blocks array */
router.put('/pages/:slug/blocks', protect, authorize('admin'), async (req: Request, res: Response) => {
  const { blocks } = req.body as { blocks: unknown[] };
  const page = await CmsPage.findOneAndUpdate(
    { slug: req.params.slug },
    { blocks, updatedBy: (req as any).user?._id },
    { new: true },
  );
  if (!page) { res.status(404).json({ message: 'Page not found' }); return; }
  res.json({ page });
});

/** PATCH /api/cms/pages/:slug/blocks/:blockId — update a single block */
router.patch('/pages/:slug/blocks/:blockId', protect, authorize('admin'), async (req: Request, res: Response) => {
  const page = await CmsPage.findOne({ slug: req.params.slug });
  if (!page) { res.status(404).json({ message: 'Page not found' }); return; }
  const idx = page.blocks.findIndex((b) => b.id === req.params.blockId);
  if (idx === -1) { res.status(404).json({ message: 'Block not found' }); return; }
  const block = page.blocks[idx];
  if (!block) { res.status(404).json({ message: 'Block not found' }); return; }
  const blockObj = typeof (block as any).toObject === 'function' ? (block as any).toObject() : block;
  page.blocks[idx] = { ...blockObj, ...req.body };
  await page.save();
  res.json({ block: page.blocks[idx] });
});

// ─── Banners ──────────────────────────────────────────────────────────────────

/** GET /api/cms/banners — list banners (public) */
router.get('/banners', async (req: Request, res: Response) => {
  const { placement } = req.query as { placement?: string };
  const filter: Record<string, unknown> = { isActive: true };
  if (placement) filter.placement = placement;
  const now = new Date();
  filter.$or = [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }];
  const banners = await Banner.find(filter).sort({ order: 1 });
  res.json({ banners });
});

/** GET /api/cms/banners/all — admin list (all banners) */
router.get('/banners/all', protect, authorize('admin'), async (_req: Request, res: Response) => {
  const banners = await Banner.find({}).sort({ placement: 1, order: 1 });
  res.json({ banners });
});

/** POST /api/cms/banners — create banner */
router.post('/banners', protect, authorize('admin'), async (req: Request, res: Response) => {
  const banner = await Banner.create(req.body);
  res.status(201).json({ banner });
});

/** PUT /api/cms/banners/:id — update banner */
router.put('/banners/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!banner) { res.status(404).json({ message: 'Banner not found' }); return; }
  res.json({ banner });
});

/** PATCH /api/cms/banners/:id/toggle — toggle isActive */
router.patch('/banners/:id/toggle', protect, authorize('admin'), async (req: Request, res: Response) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) { res.status(404).json({ message: 'Banner not found' }); return; }
  banner.isActive = !banner.isActive;
  await banner.save();
  res.json({ banner });
});

/** PATCH /api/cms/banners/reorder — bulk update orders */
router.patch('/banners/reorder', protect, authorize('admin'), async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };
  await Promise.all(ids.map((id, i) => Banner.findByIdAndUpdate(id, { order: i })));
  res.json({ message: 'Reordered' });
});

/** DELETE /api/cms/banners/:id — delete banner */
router.delete('/banners/:id', protect, authorize('admin'), async (req: Request, res: Response) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) { res.status(404).json({ message: 'Banner not found' }); return; }
  res.json({ message: 'Deleted' });
});

export default router;
