import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import type { LucideIcon } from 'lucide-react';
import {
  Layout, Image as ImageIcon, Star, Package, FileText, Megaphone,
  Plus, Trash2, GripVertical, Eye, EyeOff, Save, Globe, ChevronDown,
  ChevronUp, Settings, CheckCircle2, AlertCircle, Loader2, ExternalLink,
  AlignLeft, Gift, MessageSquare, LayoutGrid, RefreshCw,
} from 'lucide-react';
import cmsApi, { CmsPage, CmsBlock, Banner } from '../../api/cms.api';
import { cn } from '../../lib/utils';

type BlockType = CmsBlock['type'];

const BLOCK_PALETTE: { type: BlockType; label: string; icon: LucideIcon; description: string }[] = [
  { type: 'hero',              label: 'Hero Banner',         icon: Megaphone,  description: 'Full-width hero with headline, CTA' },
  { type: 'featured_products', label: 'Featured Products',   icon: Package,    description: 'Dynamic product grid' },
  { type: 'banner_strip',      label: 'Info/Trust Strip',    icon: Gift,       description: 'Row of icons + text' },
  { type: 'cta',               label: 'Call to Action',      icon: Star,       description: 'Prominent CTA block' },
  { type: 'testimonials',      label: 'Testimonials',        icon: MessageSquare, description: 'Customer reviews carousel' },
  { type: 'rich_text',         label: 'Rich Text',           icon: AlignLeft,  description: 'Formatted text content' },
  { type: 'image',             label: 'Image',               icon: ImageIcon,  description: 'Single image or banner' },
  { type: 'faq',               label: 'FAQ',                 icon: FileText,   description: 'Accordion FAQ section' },
  { type: 'spacer',            label: 'Spacer',              icon: LayoutGrid, description: 'Vertical spacing' },
];

const BLOCK_ICONS: Record<string, LucideIcon> = {
  hero:              Megaphone,
  featured_products: Package,
  banner_strip:      Gift,
  cta:               Star,
  testimonials:      MessageSquare,
  rich_text:         AlignLeft,
  image:             ImageIcon,
  faq:               FileText,
  spacer:            LayoutGrid,
};

const genId = () => Math.random().toString(36).substring(2, 10);

// ─── Block editor panel ───────────────────────────────────────────────────────
function BlockEditor({ block, onChange }: { block: CmsBlock; onChange: (data: Record<string, unknown>) => void }) {
  const data = block.data || {};

  switch (block.type) {
    case 'hero':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Headline</label>
            <Input value={String(data.headline ?? '')} onChange={(e) => onChange({ ...data, headline: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Sub-headline</label>
            <Input value={String(data.subheadline ?? '')} onChange={(e) => onChange({ ...data, subheadline: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">CTA Label</label>
              <Input value={String(data.cta ?? '')} onChange={(e) => onChange({ ...data, cta: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">CTA Link</label>
              <Input value={String(data.ctaHref ?? '')} onChange={(e) => onChange({ ...data, ctaHref: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Image URL</label>
            <Input value={String(data.imageUrl ?? '')} onChange={(e) => onChange({ ...data, imageUrl: e.target.value })} placeholder="https://..." />
          </div>
        </div>
      );

    case 'featured_products':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Section Title</label>
            <Input value={String(data.title ?? '')} onChange={(e) => onChange({ ...data, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Subtitle</label>
            <Input value={String(data.subtitle ?? '')} onChange={(e) => onChange({ ...data, subtitle: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Filter</label>
              <select
                value={String(data.filter ?? 'isFeatured')}
                onChange={(e) => onChange({ ...data, filter: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="isFeatured">Featured</option>
                <option value="isNew">New Arrivals</option>
                <option value="isTrending">Trending</option>
                <option value="all">All Products</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Show Count</label>
              <select
                value={String(data.limit ?? 8)}
                onChange={(e) => onChange({ ...data, limit: Number(e.target.value) })}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                {[4, 6, 8, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} products
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Headline</label>
            <Input value={String(data.headline ?? '')} onChange={(e) => onChange({ ...data, headline: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Subheadline</label>
            <Input value={String(data.subheadline ?? '')} onChange={(e) => onChange({ ...data, subheadline: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Button Label</label>
              <Input value={String(data.buttonLabel ?? '')} onChange={(e) => onChange({ ...data, buttonLabel: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Button Link</label>
              <Input value={String(data.buttonHref ?? '')} onChange={(e) => onChange({ ...data, buttonHref: e.target.value })} />
            </div>
          </div>
        </div>
      );

    case 'rich_text':
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">HTML Content</label>
          <textarea
            value={String(data.html ?? '')}
            onChange={(e) => onChange({ ...data, html: e.target.value })}
            rows={8}
            className="w-full font-mono text-xs border rounded-lg p-3 resize-y bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="<h2>Your content here</h2><p>...</p>"
          />
        </div>
      );

    default:
      return <p className="text-xs text-muted-foreground italic">No specialized config required for this block.</p>;
  }
}

// ─── Individual block row ─────────────────────────────────────────────────────
function BlockRow({
  block, index, total,
  onMove, onToggle, onRemove, onDataChange, onLabelChange,
}: {
  block: CmsBlock; index: number; total: number;
  onMove: (dir: 'up' | 'down') => void;
  onToggle: () => void;
  onRemove: () => void;
  onDataChange: (data: Record<string, unknown>) => void;
  onLabelChange: (label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const Icon = BLOCK_ICONS[block.type] ?? Layout;

  return (
    <div className={cn('rounded-xl border transition-all', block.isActive ? 'border-border' : 'border-dashed border-muted-foreground/30 opacity-60')}>
      <div className="flex items-center gap-3 p-3">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', block.isActive ? 'bg-violet-100 text-violet-600' : 'bg-muted text-muted-foreground')}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <input
            value={block.label ?? block.type}
            onChange={(e) => onLabelChange(e.target.value)}
            className="text-sm font-medium bg-transparent border-none outline-none w-full"
          />
          <p className="text-[10px] text-muted-foreground">{block.type}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onMove('up')}   disabled={index === 0}         className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"><ChevronUp   className="h-3.5 w-3.5" /></button>
          <button onClick={() => onMove('down')} disabled={index === total - 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
          <button onClick={onToggle} className="p-1.5 rounded hover:bg-muted transition-colors">
            {block.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
          <button onClick={() => setOpen(!open)} className="p-1.5 rounded hover:bg-muted transition-colors">
            <Settings className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-90')} />
          </button>
          <button onClick={onRemove} className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t px-4 py-4 bg-muted/20">
          <BlockEditor block={block} onChange={onDataChange} />
        </div>
      )}
    </div>
  );
}

// ─── Main Editor Component ───────────────────────────────────────────────────
export default function CMSPageEditor() {
  const [activeTab, setActiveTab] = useState<'homepage' | 'pages' | 'banners'>('homepage');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Homepage CMS data
  const [homepage, setHomepage] = useState<CmsPage>({
    slug: 'homepage',
    title: 'Homepage',
    description: 'Homepage layout and sections',
    blocks: [],
    isPublished: true,
  });

  // Pages list & Banners list
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  // New Page State
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  // New Banner State
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerLink, setNewBannerLink] = useState('');

  const loadCmsData = async () => {
    setLoading(true);
    try {
      const [pagesRes, homepageRes, bannersRes] = await Promise.all([
        cmsApi.getPages().catch(() => ({ data: { pages: [] } })),
        cmsApi.getPageBySlug('homepage').catch(() => null),
        cmsApi.getBanners().catch(() => ({ data: { banners: [] } })),
      ]);

      setPages(pagesRes.data?.pages || []);
      setBanners(bannersRes.data?.banners || []);

      if (homepageRes && homepageRes.data?.page) {
        setHomepage(homepageRes.data.page);
      }
    } catch (err) {
      console.error('Failed to load CMS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCmsData();
  }, []);

  // Save homepage layout
  const saveHomepage = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await cmsApi.updatePage('homepage', homepage);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save homepage:', err);
    } finally {
      setSaving(false);
    }
  };

  // Block manipulation
  const addBlock = (type: BlockType) => {
    const newBlock: CmsBlock = {
      id: genId(),
      type,
      order: homepage.blocks.length + 1,
      isActive: true,
      data: {},
      label: type.replace('_', ' ').toUpperCase(),
    };
    setHomepage((prev) => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
  };

  const moveBlock = (index: number, dir: 'up' | 'down') => {
    const blocks = [...homepage.blocks];
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= blocks.length) return;
    const temp = blocks[index]!;
    blocks[index] = blocks[target]!;
    blocks[target] = temp;
    setHomepage((prev) => ({ ...prev, blocks }));
  };

  const toggleBlock = (index: number) => {
    const blocks = [...homepage.blocks];
    const b = blocks[index];
    if (b) b.isActive = !b.isActive;
    setHomepage((prev) => ({ ...prev, blocks }));
  };

  const removeBlock = (index: number) => {
    const blocks = homepage.blocks.filter((_, i) => i !== index);
    setHomepage((prev) => ({ ...prev, blocks }));
  };

  const updateBlockData = (index: number, data: Record<string, unknown>) => {
    const blocks = [...homepage.blocks];
    const b = blocks[index];
    if (b) b.data = data;
    setHomepage((prev) => ({ ...prev, blocks }));
  };

  const updateBlockLabel = (index: number, label: string) => {
    const blocks = [...homepage.blocks];
    const b = blocks[index];
    if (b) b.label = label;
    setHomepage((prev) => ({ ...prev, blocks }));
  };

  // Create Static Page
  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle || !newPageSlug) return;
    try {
      await cmsApi.createPage({ title: newPageTitle, slug: newPageSlug, isPublished: true, blocks: [] });
      setNewPageTitle('');
      setNewPageSlug('');
      loadCmsData();
    } catch (err) {
      console.error('Failed to create page:', err);
    }
  };

  // Delete Page
  const handleDeletePage = async (slug: string) => {
    if (!window.confirm(`Are you sure you want to delete /${slug}?`)) return;
    try {
      await cmsApi.deletePage(slug);
      loadCmsData();
    } catch (err) {
      console.error('Failed to delete page:', err);
    }
  };

  // Create Banner
  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerImage) return;
    try {
      await cmsApi.createBanner({
        title: newBannerTitle,
        imageUrl: newBannerImage,
        linkUrl: newBannerLink || '/products',
        placement: 'homepage_hero',
        order: banners.length + 1,
        isActive: true,
      });
      setNewBannerTitle('');
      setNewBannerImage('');
      setNewBannerLink('');
      loadCmsData();
    } catch (err) {
      console.error('Failed to create banner:', err);
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Delete banner?')) return;
    try {
      await cmsApi.deleteBanner(id);
      loadCmsData();
    } catch (err) {
      console.error('Failed to delete banner:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">CMS Page & Banner Editor</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage storefront sections, promotional banners, and custom landing pages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadCmsData} disabled={loading} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
          </Button>
          {activeTab === 'homepage' && (
            <Button onClick={saveHomepage} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : savedSuccess ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save Layout'}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('homepage')}
          className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors', activeTab === 'homepage' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}
        >
          Homepage Layout
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors', activeTab === 'banners' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}
        >
          Hero Banners ({banners.length})
        </button>
        <button
          onClick={() => setActiveTab('pages')}
          className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors', activeTab === 'pages' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}
        >
          Static Pages ({pages.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* TAB 1: Homepage Builder */}
          {activeTab === 'homepage' && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column: Active Blocks */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Homepage Section Layout</CardTitle>
                    <CardDescription className="text-xs">Drag or use arrows to reorder homepage content blocks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {homepage.blocks.length === 0 ? (
                      <p className="text-center py-10 text-xs text-muted-foreground">No sections added yet. Click a section on the right to add it.</p>
                    ) : (
                      homepage.blocks.map((block, idx) => (
                        <BlockRow
                          key={block.id || idx}
                          block={block}
                          index={idx}
                          total={homepage.blocks.length}
                          onMove={(dir) => moveBlock(idx, dir)}
                          onToggle={() => toggleBlock(idx)}
                          onRemove={() => removeBlock(idx)}
                          onDataChange={(d) => updateBlockData(idx, d)}
                          onLabelChange={(l) => updateBlockLabel(idx, l)}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Palette */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Add Section</CardTitle>
                    <CardDescription className="text-xs">Select a block type to add to your homepage</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {BLOCK_PALETTE.map((b) => {
                      const Icon = b.icon;
                      return (
                        <button
                          key={b.type}
                          onClick={() => addBlock(b.type)}
                          className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary hover:bg-primary/5 text-left transition-all group"
                        >
                          <div className="h-8 w-8 rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold">{b.label}</p>
                            <p className="text-[10px] text-muted-foreground">{b.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: Banners */}
          {activeTab === 'banners' && (
            <div className="space-y-6">
              {/* Add Banner Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Create New Hero Banner</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateBanner} className="grid gap-4 sm:grid-cols-3">
                    <Input placeholder="Banner Title" value={newBannerTitle} onChange={(e) => setNewBannerTitle(e.target.value)} required />
                    <Input placeholder="Image URL (https://...)" value={newBannerImage} onChange={(e) => setNewBannerImage(e.target.value)} required />
                    <Input placeholder="Target Link (/products)" value={newBannerLink} onChange={(e) => setNewBannerLink(e.target.value)} />
                    <Button type="submit" className="sm:col-span-3 gap-2">
                      <Plus className="h-4 w-4" /> Add Hero Banner
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Banners List */}
              <div className="grid gap-4 sm:grid-cols-2">
                {banners.map((b) => (
                  <Card key={b._id || b.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="h-32 rounded-xl bg-muted overflow-hidden relative">
                        <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                        <Badge className="absolute top-2 left-2">{b.placement}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm">{b.title}</h4>
                          <p className="text-xs text-muted-foreground">{b.linkUrl}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteBanner(b._id || b.id || '')} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Static Pages */}
          {activeTab === 'pages' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Create Static Page</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePage} className="flex gap-3">
                    <Input placeholder="Page Title (e.g. Terms & Conditions)" value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} required />
                    <Input placeholder="Slug (e.g. terms-of-service)" value={newPageSlug} onChange={(e) => setNewPageSlug(e.target.value)} required />
                    <Button type="submit" className="gap-2 whitespace-nowrap">
                      <Plus className="h-4 w-4" /> Create Page
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="grid gap-3">
                {pages.map((p) => (
                  <Card key={p.slug}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{p.title}</h4>
                          <Badge variant="outline">/{p.slug}</Badge>
                        </div>
                      </div>
                      {p.slug !== 'homepage' && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePage(p.slug)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
