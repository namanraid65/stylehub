import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2, ArrowLeft, Info, Tag, Package, Palette,
  FileText, CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import ImageUploadZone from '../../components/vendor/ImageUploadZone';
import VariantBuilder, { type VariantRow } from '../../components/vendor/VariantBuilder';
import productApi from '../../api/product.api';
import categoryApi from '../../api/category.api';
import { cn } from '../../lib/utils';

// ─── Schema ───────────────────────────────────────────────────────────────────
const productSchema = z.object({
  name:              z.string().min(3).max(150),
  description:       z.string().min(20).max(5000),
  brand:             z.string().min(1).max(80),
  category:          z.string().min(1, 'Select a category'),
  gender:            z.enum(['men', 'women', 'unisex', 'kids', 'boys', 'girls']),
  sku:               z.string().min(1),
  tags:              z.string().optional(),          // comma-separated, parsed on submit
  material:          z.string().max(200).optional(),
  careInstructions:  z.string().max(500).optional(),
  basePrice:         z.coerce.number().positive('Price must be positive'),
  compareAtPrice:    z.coerce.number().positive().optional(),
  status:            z.enum(['draft', 'active', 'inactive']),
  isFeatured:        z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

// Categories are loaded dynamically from the API

const GENDER_OPTIONS = [
  { value: 'men',    label: 'Men' },
  { value: 'women',  label: 'Women' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'kids',   label: 'Kids' },
  { value: 'boys',   label: 'Boys' },
  { value: 'girls',  label: 'Girls' },
];

// ─── Tab indicator ────────────────────────────────────────────────────────────
interface TabMeta {
  id:    string;
  label: string;
  icon:  React.ElementType;
  error?: boolean;
}

// ─── Product Form Page ────────────────────────────────────────────────────────
interface ProductFormPageProps {
  mode?:    'create' | 'edit';
  productId?: string;
}

const ProductFormPage: React.FC<ProductFormPageProps> = ({ mode = 'create' }) => {
  const navigate  = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [images, setImages]       = useState<string[]>([]);
  const [variants, setVariants]   = useState<VariantRow[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving]       = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [savedId, setSavedId]     = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as never,
    defaultValues: { status: 'draft' as const, isFeatured: false, gender: 'unisex' as const },
  });

  const basePrice = watch('basePrice') ?? 0;

  // 1. Fetch categories dynamically
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryApi.list();
        setCategories(res.data.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // 2. Fetch product for editing
  useEffect(() => {
    if (mode === 'edit' && productId) {
      const loadProduct = async () => {
        setLoadingProduct(true);
        try {
          const res = await productApi.getBySlug(productId);
          const p = res.data.data;

          reset({
            name: p.name,
            description: p.description,
            brand: p.brand,
            category: typeof p.category === 'object' ? p.category._id : p.category,
            gender: p.gender as any,
            sku: p.sku,
            tags: p.tags?.join(', ') || '',
            material: p.material || '',
            careInstructions: p.careInstructions || '',
            basePrice: p.basePrice,
            compareAtPrice: p.compareAtPrice,
            status: p.status as any,
            isFeatured: p.isFeatured || false,
          });

          setImages(p.images || []);
          setVariants(
            (p.variants || []).map((v, i) => ({
              _localId: String(i),
              size: v.size,
              sizeCategory: v.sizeCategory,
              color: v.color,
              colorHex: v.colorHex,
              sku: v.sku,
              price: v.price,
              stock: v.stock,
              images: v.images || [],
              isActive: v.isActive,
            }))
          );
        } catch (err) {
          console.error('Failed to load product details:', err);
        } finally {
          setLoadingProduct(false);
        }
      };
      loadProduct();
    }
  }, [mode, productId, reset]);

  const onSubmit = async (data: ProductFormValues) => {
    if (images.length === 0) {
      setActiveTab('images');
      return;
    }
    if (variants.length === 0) {
      setActiveTab('variants');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name:             data.name,
        description:      data.description,
        category:         data.category,
        brand:            data.brand,
        sku:              data.sku,
        tags:             data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        images,
        gender:           data.gender,
        ...(data.material         ? { material:         data.material }         : {}),
        ...(data.careInstructions ? { careInstructions: data.careInstructions } : {}),
        basePrice:        data.basePrice,
        ...(data.compareAtPrice   ? { compareAtPrice:   data.compareAtPrice }   : {}),
        variants:         variants.map(({ _localId, ...v }) => v),
        status:           data.status,
        isFeatured:       data.isFeatured,
      };

      if (mode === 'edit' && productId) {
        await productApi.update(productId, payload);
        setSavedId(productId);
      } else {
        const res = await productApi.create(payload);
        setSavedId(res.data.data._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Tab config ──────────────────────────────────────────────────────────────
  const TABS: TabMeta[] = [
    { id: 'info',     label: 'Basic Info',  icon: Info,      error: !!errors.name || !!errors.description || !!errors.brand || !!errors.category },
    { id: 'pricing',  label: 'Pricing',     icon: Tag,       error: !!errors.basePrice },
    { id: 'images',   label: 'Images',      icon: Palette,   error: images.length === 0 },
    { id: 'variants', label: 'Variants',    icon: Package,   error: variants.length === 0 },
    { id: 'publish',  label: 'Publish',     icon: FileText },
  ];

  if (loadingProduct) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (savedId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-green">
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold font-display">Product {mode === 'create' ? 'Created' : 'Updated'}!</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Your product has been saved. It will be live after admin review.
        </p>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={() => navigate('/products')}>Back to Products</Button>
          <Button onClick={() => { setSavedId(null); setImages([]); setVariants([]); }}>
            Add Another Product
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">
            {mode === 'create' ? 'Add New Product' : 'Edit Product'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Fill out all tabs and click Publish when ready.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab nav */}
          <TabsList className="h-auto flex-wrap gap-1 p-1 bg-muted w-full justify-start">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'gap-1.5 data-[state=active]:bg-background',
                  tab.error && 'after:content-[""] after:ml-1 after:h-1.5 after:w-1.5 after:rounded-full after:bg-destructive',
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.error && <span className="h-1.5 w-1.5 rounded-full bg-destructive" />}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Tab: Basic Info ────────────────────────────────────────────── */}
          <TabsContent value="info">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Name */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input id="name" placeholder="e.g. Classic Oxford Button-Down Shirt" error={errors.name?.message} {...register('name')} />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea id="description" rows={5} placeholder="Describe materials, fit, styling tips…" error={errors.description?.message} {...register('description')} />
                  </div>

                  {/* Brand */}
                  <div className="space-y-1.5">
                    <Label htmlFor="brand">Brand *</Label>
                    <Input id="brand" placeholder="e.g. UrbanThreads" error={errors.brand?.message} {...register('brand')} />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <Label>Category *</Label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger error={errors.category?.message}>
                            <SelectValue placeholder="Select category…" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.category && <p className="text-xs text-destructive mt-1">{errors.category.message}</p>}
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <Label>Gender *</Label>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GENDER_OPTIONS.map((g) => (
                              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* SKU */}
                  <div className="space-y-1.5">
                    <Label htmlFor="sku">Base SKU *</Label>
                    <Input id="sku" placeholder="e.g. UT-SHIRT-001" error={errors.sku?.message} className="font-mono" {...register('sku')} />
                  </div>

                  {/* Tags */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="tags">Tags <span className="text-muted-foreground">(comma-separated)</span></Label>
                    <Input id="tags" placeholder="casual, cotton, summer, slim-fit" {...register('tags')} />
                  </div>

                  {/* Material */}
                  <div className="space-y-1.5">
                    <Label htmlFor="material">Material</Label>
                    <Input id="material" placeholder="e.g. 100% Organic Cotton" {...register('material')} />
                  </div>

                  {/* Care */}
                  <div className="space-y-1.5">
                    <Label htmlFor="careInstructions">Care Instructions</Label>
                    <Input id="careInstructions" placeholder="e.g. Machine wash cold, tumble dry low" {...register('careInstructions')} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => setActiveTab('pricing')}>Next: Pricing →</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Pricing ───────────────────────────────────────────────── */}
          <TabsContent value="pricing">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Base price */}
                  <div className="space-y-1.5">
                    <Label htmlFor="basePrice">Selling Price * <span className="text-muted-foreground text-xs">(₹)</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        id="basePrice"
                        type="number"
                        step="0.01"
                        placeholder="999"
                        className="pl-7"
                        error={errors.basePrice?.message}
                        {...register('basePrice')}
                      />
                    </div>
                  </div>

                  {/* MRP */}
                  <div className="space-y-1.5">
                    <Label htmlFor="compareAtPrice">MRP / Compare At <span className="text-muted-foreground text-xs">(₹)</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        id="compareAtPrice"
                        type="number"
                        step="0.01"
                        placeholder="1499"
                        className="pl-7"
                        error={errors.compareAtPrice?.message}
                        {...register('compareAtPrice')}
                      />
                    </div>
                  </div>

                  {/* Discount preview */}
                  {watch('basePrice') && watch('compareAtPrice') && Number(watch('compareAtPrice')) > Number(watch('basePrice')) && (
                    <div className="flex items-end pb-1">
                      <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 px-4 py-2 text-center">
                        <p className="text-xs text-muted-foreground">Discount</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400 font-display">
                          {Math.round((1 - Number(watch('basePrice')) / Number(watch('compareAtPrice'))) * 100)}% OFF
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('info')}>← Back</Button>
                  <Button type="button" onClick={() => setActiveTab('images')}>Next: Images →</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Images ────────────────────────────────────────────────── */}
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Product Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUploadZone
                  images={images}
                  onChange={setImages}
                  maxImages={8}
                  label="Product Photos (first image = main thumbnail)"
                />
                {images.length === 0 && (
                  <p className="text-xs text-destructive">At least one product image is required to publish.</p>
                )}
                <div className="flex justify-between mt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('pricing')}>← Back</Button>
                  <Button type="button" onClick={() => setActiveTab('variants')}>Next: Variants →</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Variants ──────────────────────────────────────────────── */}
          <TabsContent value="variants">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Size & Colour Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <VariantBuilder
                  variants={variants}
                  onChange={setVariants}
                  basePrice={basePrice}
                />
                {variants.length === 0 && (
                  <p className="text-xs text-destructive">Add at least one variant to publish.</p>
                )}
                <div className="flex justify-between mt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('images')}>← Back</Button>
                  <Button type="button" onClick={() => setActiveTab('publish')}>Next: Publish →</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Publish ───────────────────────────────────────────────── */}
          <TabsContent value="publish">
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Status */}
                <div className="space-y-1.5">
                  <Label>Publication Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">
                            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-yellow-400" />Draft</span>
                          </SelectItem>
                          <SelectItem value="active">
                            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-400" />Active (visible to customers)</span>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gray-400" />Inactive (hidden)</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Featured toggle */}
                <div className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div>
                    <p className="text-sm font-medium">Feature this product</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Featured products appear on the homepage.</p>
                  </div>
                  <Controller
                    name="isFeatured"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                {/* Summary review */}
                <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                  <p className="text-sm font-semibold">Product Summary</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: 'Images',   value: images.length },
                      { label: 'Variants', value: variants.length },
                      { label: 'Total Stock', value: variants.reduce((s, v) => s + (v.stock || 0), 0) },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg bg-card p-3">
                        <p className="text-xl font-bold font-display">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        {s.value === 0 && (
                          <Badge variant="destructive" className="text-[9px] mt-1">Required</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('variants')}>← Back</Button>
                  <Button
                    type="submit"
                    disabled={saving || images.length === 0 || variants.length === 0}
                    className="min-w-[160px] gap-2"
                  >
                    {saving ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    ) : (
                      `${mode === 'create' ? 'Create' : 'Update'} Product`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
};

export default ProductFormPage;
