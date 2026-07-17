import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import type { LucideIcon } from 'lucide-react';
import {
  Layout, Image as ImageIcon, Star, Package, FileText, Megaphone,
  Plus, Trash2, GripVertical, Eye, EyeOff, Save, Globe, ChevronDown,
  ChevronUp, Settings, CheckCircle2, AlertCircle, Loader2, ExternalLink,
  AlignLeft, Gift, MessageSquare, LayoutGrid,
} from 'lucide-react';
import { cn } from '../../lib/utils';


// ─── Types ────────────────────────────────────────────────────────────────────
type BlockType = 'hero' | 'rich_text' | 'image' | 'featured_products' | 'banner_strip' | 'testimonials' | 'faq' | 'cta' | 'spacer';

interface CmsBlock {
  id:       string;
  type:     BlockType;
  order:    number;
  isActive: boolean;
  data:     Record<string, unknown>;
  label?:   string;
}

interface CmsPageData {
  slug:        string;
  title:       string;
  description: string;
  seoTitle?:   string;
  seoDesc?:    string;
  blocks:      CmsBlock[];
  isPublished: boolean;
}

interface Banner {
  id:        string;
  title:     string;
  subtitle?: string;
  imageUrl:  string;
  linkUrl?:  string;
  linkLabel?: string;
  placement: string;
  order:     number;
  isActive:  boolean;
  bgColor?:  string;
}

// ─── Mock initial data ────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).substring(2, 10);

const INITIAL_HOMEPAGE: CmsPageData = {
  slug: 'homepage', title: 'Homepage', description: 'StyleHub homepage sections',
  isPublished: true,
  blocks: [
    { id: genId(), type: 'hero',  order: 1, isActive: true, label: 'Hero Banner',
      data: { headline: 'Discover Your Style', subheadline: "Handpicked fashion from India's finest artisan vendors", cta: 'Shop Now', ctaHref: '/products' } },
    { id: genId(), type: 'banner_strip', order: 2, isActive: true, label: 'Trust Bar',
      data: { items: ['Free Delivery ₹1999+', 'Easy 15-day Returns', '100% Authentic', 'Secure Payments'] } },
    { id: genId(), type: 'featured_products', order: 3, isActive: true, label: 'New Arrivals',
      data: { title: 'New Arrivals', filter: 'isNew', limit: 8 } },
    { id: genId(), type: 'featured_products', order: 4, isActive: true, label: 'Trending Now',
      data: { title: 'Trending Now', filter: 'isTrending', limit: 8 } },
    { id: genId(), type: 'testimonials', order: 5, isActive: true, label: 'Testimonials',
      data: { title: 'What Customers Say' } },
    { id: genId(), type: 'cta', order: 6, isActive: false, label: 'Sale CTA',
      data: { headline: 'Monsoon Sale — Up to 40% Off', buttonLabel: 'Shop Sale', buttonHref: '/products?sale=1' } },
  ],
};

const STATIC_PAGES = [
  { slug: 'about',          title: 'About Us',       wordCount: 420, isPublished: true  },
  { slug: 'contact',        title: 'Contact Us',      wordCount: 180, isPublished: true  },
  { slug: 'returns',        title: 'Returns Policy',  wordCount: 310, isPublished: true  },
  { slug: 'privacy-policy', title: 'Privacy Policy',  wordCount: 580, isPublished: true  },
  { slug: 'terms-of-service', title: 'Terms of Service', wordCount: 820, isPublished: true },
  { slug: 'shipping-policy', title: 'Shipping Policy', wordCount: 240, isPublished: false },
];

const INITIAL_BANNERS: Banner[] = [
  { id: genId(), title: 'New Season Collection', subtitle: 'Up to 30% off ethnic wear',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200', linkUrl: '/products?category=ethnic', linkLabel: 'Explore Now',
    placement: 'homepage_hero', order: 1, isActive: true, bgColor: '#2D1B69' },
  { id: genId(), title: 'Sale: Up to 50% Footwear', subtitle: 'Handcrafted at unbeatable prices',
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1200', linkUrl: '/products?category=footwear', linkLabel: 'Shop Now',
    placement: 'homepage_hero', order: 2, isActive: true, bgColor: '#8B4513' },
  { id: genId(), title: 'Free Shipping Week', subtitle: 'Free delivery, no minimum',
    imageUrl: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=1200', linkUrl: '/products', linkLabel: 'Shop All',
    placement: 'homepage_mid', order: 1, isActive: false, bgColor: '#C84B31' },
];

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


// ─── Block editor panel ───────────────────────────────────────────────────────
function BlockEditor({ block, onChange }: { block: CmsBlock; onChange: (data: Record<string, unknown>) => void }) {
  const data = block.data;

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
                {[4,6,8,12].map((n) => <option key={n} value={n}>{n} products</option>)}
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">BG Color</label>
              <div className="flex gap-2">
                <input type="color" value={String(data.bgColor ?? '#2D1B69')} onChange={(e) => onChange({ ...data, bgColor: e.target.value })} className="h-9 w-9 rounded border cursor-pointer" />
                <Input value={String(data.bgColor ?? '#2D1B69')} onChange={(e) => onChange({ ...data, bgColor: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Text Color</label>
              <div className="flex gap-2">
                <input type="color" value={String(data.textColor ?? '#FFFFFF')} onChange={(e) => onChange({ ...data, textColor: e.target.value })} className="h-9 w-9 rounded border cursor-pointer" />
                <Input value={String(data.textColor ?? '#FFFFFF')} onChange={(e) => onChange({ ...data, textColor: e.target.value })} className="flex-1" />
              </div>
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
            rows={10}
            className="w-full font-mono text-xs border rounded-lg p-3 resize-y bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="<h2>Your content here</h2><p>...</p>"
          />
        </div>
      );

    case 'testimonials':
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Section Title</label>
          <Input value={String(data.title ?? '')} onChange={(e) => onChange({ ...data, title: e.target.value })} />
          <p className="text-xs text-muted-foreground mt-2">Testimonials are pulled from approved product reviews automatically.</p>
        </div>
      );

    case 'spacer':
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Height (px)</label>
          <Input type="number" value={String(data.height ?? 40)} onChange={(e) => onChange({ ...data, height: Number(e.target.value) })} />
        </div>
      );

    default:
      return <p className="text-sm text-muted-foreground italic">No editor for this block type yet.</p>;
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
      {/* Header row */}
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

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onMove('up')}   disabled={index === 0}         className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"><ChevronUp   className="h-3.5 w-3.5" /></button>
          <button onClick={() => onMove('down')} disabled={index === total - 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
          <button onClick={onToggle} className="p-1.5 rounded hover:bg-muted transition-colors" title={block.isActive ? 'Hide block' : 'Show block'}>
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

      {/* Expanded editor */}
      {open && (
        <div className="border-t px-4 py-4 bg-muted/20">
          <BlockEditor block={block} onChange={onDataChange} />
        </div>
      )}
    </div>
  );
}

// ─── Banner Form ──────────────────────────────────────────────────────────────
function BannerCard({ banner, onUpdate, onDelete, onToggle }: {
  banner: Banner;
  onUpdate: (b: Banner) => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(banner);

  return (
    <div className={cn('rounded-xl border overflow-hidden transition-all', !banner.isActive && 'opacity-60')}>
      <div className="flex items-center gap-3 p-3">
        <div className="h-12 w-20 rounded-lg bg-muted overflow-hidden shrink-0" style={{ backgroundColor: banner.bgColor ?? '#888' }}>
          <div className="h-full w-full flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-white/60" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold line-clamp-1">{banner.title}</p>
          <p className="text-xs text-muted-foreground">{banner.placement} · Order {banner.order}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={banner.isActive ? 'default' : 'secondary'} className="text-[10px]">
            {banner.isActive ? 'Active' : 'Hidden'}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)} className="h-7 text-xs">Edit</Button>
          <button onClick={onToggle} className="p-1.5 rounded hover:bg-muted transition-colors">
            {banner.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="border-t p-4 bg-muted/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
              <Input value={local.title} onChange={(e) => setLocal({ ...local, title: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Subtitle</label>
              <Input value={local.subtitle ?? ''} onChange={(e) => setLocal({ ...local, subtitle: e.target.value })} /></div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Image URL</label>
            <Input value={local.imageUrl} onChange={(e) => setLocal({ ...local, imageUrl: e.target.value })} placeholder="https://..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Link URL</label>
              <Input value={local.linkUrl ?? ''} onChange={(e) => setLocal({ ...local, linkUrl: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Button Label</label>
              <Input value={local.linkLabel ?? ''} onChange={(e) => setLocal({ ...local, linkLabel: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Placement</label>
              <select value={local.placement} onChange={(e) => setLocal({ ...local, placement: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                <option value="homepage_hero">Homepage Hero</option>
                <option value="homepage_mid">Homepage Mid</option>
                <option value="category_top">Category Top</option>
                <option value="sidebar">Sidebar</option>
              </select></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Order</label>
              <Input type="number" value={local.order} onChange={(e) => setLocal({ ...local, order: Number(e.target.value) })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">BG Color</label>
              <div className="flex gap-1">
                <input type="color" value={local.bgColor ?? '#666'} onChange={(e) => setLocal({ ...local, bgColor: e.target.value })} className="h-9 w-9 rounded border cursor-pointer" />
                <Input value={local.bgColor ?? ''} onChange={(e) => setLocal({ ...local, bgColor: e.target.value })} className="flex-1" />
              </div></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { onUpdate(local); setEditing(false); }}>Save Banner</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main CMSPageEditor ───────────────────────────────────────────────────────
type Tab = 'homepage' | 'banners' | 'pages';

export default function CMSPageEditor() {
  const [tab,      setTab]      = useState<Tab>('homepage');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [homepage, setHomepage] = useState<CmsPageData>(INITIAL_HOMEPAGE);
  const [banners,  setBanners]  = useState<Banner[]>(INITIAL_BANNERS);
  const [pages,    setPages]    = useState(STATIC_PAGES);

  // ── Homepage blocks ──────────────────────────────────────────────────────
  const moveBlock = (index: number, dir: 'up' | 'down') => {
    const blocks = [...homepage.blocks];
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= blocks.length) return;
    [blocks[index], blocks[target]] = [blocks[target]!, blocks[index]!];
    setHomepage({ ...homepage, blocks: blocks.map((b, i) => ({ ...b, order: i + 1 })) });
  };

  const addBlock = (type: BlockType, label: string) => {
    const newBlock: CmsBlock = {
      id: genId(), type, order: homepage.blocks.length + 1,
      isActive: true, label, data: {},
    };
    setHomepage({ ...homepage, blocks: [...homepage.blocks, newBlock] });
  };

  const updateBlockData = (id: string, data: Record<string, unknown>) =>
    setHomepage({ ...homepage, blocks: homepage.blocks.map((b) => b.id === id ? { ...b, data } : b) });

  const updateBlockLabel = (id: string, label: string) =>
    setHomepage({ ...homepage, blocks: homepage.blocks.map((b) => b.id === id ? { ...b, label } : b) });

  const toggleBlock = (id: string) =>
    setHomepage({ ...homepage, blocks: homepage.blocks.map((b) => b.id === id ? { ...b, isActive: !b.isActive } : b) });

  const removeBlock = (id: string) =>
    setHomepage({ ...homepage, blocks: homepage.blocks.filter((b) => b.id !== id) });

  // ── Banners ──────────────────────────────────────────────────────────────
  const addBanner = () => {
    setBanners([...banners, {
      id: genId(), title: 'New Banner', subtitle: '', imageUrl: '',
      linkUrl: '/products', linkLabel: 'Shop Now',
      placement: 'homepage_hero', order: banners.length + 1, isActive: false, bgColor: '#2D1B69',
    }]);
  };

  // ── Save simulation ──────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, []);

  const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: 'homepage', label: 'Homepage Sections', icon: Layout },
    { key: 'banners',  label: 'Banners',           icon: ImageIcon },
    { key: 'pages',    label: 'Pages',              icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">CMS Editor</h1>
          <p className="text-sm text-muted-foreground">Manage homepage sections, banners, and static pages</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open('/', '_blank')}>
            <Globe className="h-3.5 w-3.5" /> Preview Site
          </Button>
          <Button size="sm" className="gap-1.5 min-w-[100px]" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Homepage Sections ── */}
      {tab === 'homepage' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Block list */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-sm">Homepage Blocks</h2>
              <Badge variant="outline" className="text-xs">
                {homepage.blocks.filter((b) => b.isActive).length}/{homepage.blocks.length} active
              </Badge>
            </div>

            {homepage.blocks.length === 0 && (
              <div className="rounded-xl border-2 border-dashed py-16 flex flex-col items-center gap-2 text-center">
                <Layout className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No blocks yet</p>
                <p className="text-xs text-muted-foreground">Add a block from the palette →</p>
              </div>
            )}

            {homepage.blocks.map((block, i) => (
              <BlockRow
                key={block.id}
                block={block}
                index={i}
                total={homepage.blocks.length}
                onMove={(dir) => moveBlock(i, dir)}
                onToggle={() => toggleBlock(block.id)}
                onRemove={() => removeBlock(block.id)}
                onDataChange={(data) => updateBlockData(block.id, data)}
                onLabelChange={(label) => updateBlockLabel(block.id, label)}
              />
            ))}
          </div>

          {/* Palette */}
          <div className="space-y-3">
            <h2 className="font-semibold text-sm">Add Block</h2>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 space-y-1.5">
                {BLOCK_PALETTE.map(({ type, label, icon: Icon, description }) => (
                  <button
                    key={type}
                    onClick={() => addBlock(type, label)}
                    className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted text-left transition-colors group"
                  >
                    <div className="h-7 w-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{description}</p>
                    </div>
                    <Plus className="h-3.5 w-3.5 ml-auto mt-0.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Page settings */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm">Page Settings</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">SEO Title</label>
                  <Input value={homepage.seoTitle ?? ''} onChange={(e) => setHomepage({ ...homepage, seoTitle: e.target.value })} placeholder="StyleHub — Premium Fashion..." className="text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">SEO Description</label>
                  <textarea
                    value={homepage.seoDesc ?? ''}
                    onChange={(e) => setHomepage({ ...homepage, seoDesc: e.target.value })}
                    rows={3} placeholder="Discover handpicked fashion..."
                    className="w-full text-sm border rounded-lg p-3 resize-none bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox" id="published" checked={homepage.isPublished}
                    onChange={(e) => setHomepage({ ...homepage, isPublished: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="published" className="text-sm font-medium">Published</label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Banners ── */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Banners & Promotions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{banners.filter((b) => b.isActive).length} active of {banners.length} total</p>
            </div>
            <Button size="sm" onClick={addBanner} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New Banner
            </Button>
          </div>

          {/* Group by placement */}
          {['homepage_hero', 'homepage_mid', 'category_top', 'sidebar'].map((placement) => {
            const group = banners.filter((b) => b.placement === placement);
            if (group.length === 0) return null;
            const labels: Record<string, string> = {
              homepage_hero: 'Homepage Hero', homepage_mid: 'Homepage Mid-Page',
              category_top: 'Category Page Top', sidebar: 'Sidebar',
            };
            return (
              <div key={placement}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{labels[placement]}</p>
                <div className="space-y-2">
                  {group.map((b) => (
                    <BannerCard
                      key={b.id}
                      banner={b}
                      onUpdate={(updated) => setBanners(banners.map((x) => x.id === updated.id ? updated : x))}
                      onDelete={() => setBanners(banners.filter((x) => x.id !== b.id))}
                      onToggle={() => setBanners(banners.map((x) => x.id === b.id ? { ...x, isActive: !x.isActive } : x))}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pages ── */}
      {tab === 'pages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Static Pages</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Editable content pages</p>
            </div>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New Page</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pages.map((page) => (
              <Card key={page.slug} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{page.title}</p>
                        <p className="text-xs text-muted-foreground">/{page.slug} · {page.wordCount} words</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={page.isPublished ? 'default' : 'secondary'} className="text-[10px]">
                        {page.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1 text-xs gap-1">
                      <Settings className="h-3 w-3" /> Edit Content
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => window.open(`/${page.slug}`, '_blank')}>
                      <ExternalLink className="h-3 w-3" /> View
                    </Button>
                    <button
                      onClick={() => setPages(pages.map((p) => p.slug === page.slug ? { ...p, isPublished: !p.isPublished } : p))}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                    >
                      {page.isPublished ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
