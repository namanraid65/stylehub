import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import type { ProductVariant } from '../../api/product.api';

// ─── Constants ────────────────────────────────────────────────────────────────
const CLOTHING_SIZES  = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const FOOTWEAR_SIZES  = ['UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'];
const KIDS_SIZES      = ['2Y', '3Y', '4Y', '5Y', '6Y', '7Y', '8Y', '10Y', '12Y'];
const ACCESS_SIZES    = ['Free Size', 'S/M', 'M/L'];

const SIZE_CATEGORIES = [
  { label: 'Clothing',    sizes: CLOTHING_SIZES,  value: 'clothing' },
  { label: 'Footwear',    sizes: FOOTWEAR_SIZES,  value: 'footwear' },
  { label: 'Kids',        sizes: KIDS_SIZES,       value: 'kids' },
  { label: 'Accessories', sizes: ACCESS_SIZES,     value: 'accessories' },
];

const FASHION_COLORS = [
  { name: 'Black',   hex: '#0A0A0A' },
  { name: 'White',   hex: '#F5F5F5' },
  { name: 'Navy',    hex: '#1E3A5F' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Sky Blue',   hex: '#38BDF8' },
  { name: 'Red',     hex: '#DC2626' },
  { name: 'Maroon',  hex: '#7F1D1D' },
  { name: 'Pink',    hex: '#EC4899' },
  { name: 'Hot Pink',hex: '#FF69B4' },
  { name: 'Purple',  hex: '#9333EA' },
  { name: 'Lavender',hex: '#C4B5FD' },
  { name: 'Green',   hex: '#16A34A' },
  { name: 'Olive',   hex: '#84844B' },
  { name: 'Yellow',  hex: '#EAB308' },
  { name: 'Orange',  hex: '#F97316' },
  { name: 'Brown',   hex: '#92400E' },
  { name: 'Camel',   hex: '#C19A6B' },
  { name: 'Beige',   hex: '#D4B896' },
  { name: 'Gray',    hex: '#6B7280' },
  { name: 'Silver',  hex: '#C0C0C0' },
  { name: 'Gold',    hex: '#FFD700' },
  { name: 'Multi',   hex: 'linear-gradient(135deg,#FF6B6B,#FFD93D,#6BCF7F,#4D96FF)' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
export type VariantRow = Omit<ProductVariant, '_id' | 'price'> & {
  _id?:      string;
  _localId:  string;
  price?:    number | undefined;
};

interface VariantBuilderProps {
  variants:  VariantRow[];
  onChange:  (variants: VariantRow[]) => void;
  basePrice: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

const makeVariant = (sizeCategory = 'clothing'): VariantRow => ({
  _localId:     uid(),
  size:         '',
  sizeCategory,
  color:        '',
  colorHex:     '',
  sku:          '',
  price:        undefined,
  stock:        0,
  images:       [],
  isActive:     true,
});

// ─── Color Swatch Picker ──────────────────────────────────────────────────────
interface ColorPickerProps {
  value:    string;
  onChange: (name: string, hex: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const selected = FASHION_COLORS.find((c) => c.name === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring hover:bg-muted/50',
        )}
      >
        {selected ? (
          <>
            <span
              className="h-4 w-4 rounded-full shrink-0 border border-border/50"
              style={{ background: selected.hex }}
            />
            <span>{selected.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Select colour…</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-40 mt-1 w-64 rounded-xl border bg-popover p-3 shadow-xl">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Fashion Colours</p>
            <div className="grid grid-cols-6 gap-1.5">
              {FASHION_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onClick={() => { onChange(c.name, c.hex); setOpen(false); }}
                  className={cn(
                    'h-7 w-7 rounded-lg border-2 transition-all hover:scale-110',
                    value === c.name ? 'border-primary ring-2 ring-primary/40' : 'border-border/60',
                  )}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
            {/* Custom hex */}
            <div className="mt-2 pt-2 border-t border-border flex gap-2 items-center">
              <span className="text-xs text-muted-foreground shrink-0">Custom:</span>
              <input
                type="color"
                className="h-7 w-12 rounded cursor-pointer border border-input"
                onChange={(e) => onChange('Custom', e.target.value)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Size Quick-Select ────────────────────────────────────────────────────────
interface SizePickerProps {
  sizeCategory: string;
  value:        string;
  onChange:     (size: string) => void;
}

const SizePicker: React.FC<SizePickerProps> = ({ sizeCategory, value, onChange }) => {
  const cat   = SIZE_CATEGORIES.find((c) => c.value === sizeCategory) ?? SIZE_CATEGORIES[0]!;
  const sizes = cat.sizes;

  return (
    <div className="flex flex-wrap gap-1.5">
      {sizes.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            'h-7 rounded-md px-2 text-xs font-medium border transition-all',
            value === s
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border hover:border-primary/50 hover:bg-muted/60',
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
};

// ─── Variant Builder ──────────────────────────────────────────────────────────
const VariantBuilder: React.FC<VariantBuilderProps> = ({ variants, onChange, basePrice }) => {
  const [activeSizeCat, setActiveSizeCat] = useState('clothing');

  const addVariant = () => onChange([...variants, makeVariant(activeSizeCat)]);

  const updateVariant = (localId: string, patch: Partial<VariantRow>) => {
    onChange(variants.map((v) => (v._localId === localId ? { ...v, ...patch } : v)));
  };

  const removeVariant = (localId: string) =>
    onChange(variants.filter((v) => v._localId !== localId));

  // Auto-generate SKU from size+color
  const autoSku = (v: VariantRow) =>
    `${v.size}-${v.color}`.toUpperCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-4">
      {/* Size category selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Size chart:</span>
        {SIZE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setActiveSizeCat(cat.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium border transition-all',
              activeSizeCat === cat.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50',
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Variant rows */}
      {variants.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">No variants yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add at least one size + colour variant to publish this product.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((v, idx) => (
            <div
              key={v._localId}
              className="relative rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors"
            >
              {/* Variant header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {v.colorHex && (
                    <span
                      className="h-5 w-5 rounded-full border border-border/60 shadow-sm"
                      style={{ background: v.colorHex }}
                    />
                  )}
                  <span className="text-sm font-semibold">
                    {v.size && v.color ? `${v.size} / ${v.color}` : `Variant ${idx + 1}`}
                  </span>
                  {v.sku && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {v.sku}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Active toggle */}
                  <button
                    type="button"
                    onClick={() => updateVariant(v._localId, { isActive: !v.isActive })}
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      v.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {v.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVariant(v._localId)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Size picker */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Size</p>
                <SizePicker
                  sizeCategory={v.sizeCategory || activeSizeCat}
                  value={v.size}
                  onChange={(size) =>
                    updateVariant(v._localId, {
                      size,
                      sizeCategory: activeSizeCat,
                      sku: autoSku({ ...v, size }),
                    })
                  }
                />
              </div>

              {/* Bottom fields row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Color */}
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Colour</p>
                  <ColorPicker
                    value={v.color}
                    onChange={(name, hex) =>
                      updateVariant(v._localId, {
                        color: name,
                        colorHex: hex,
                        sku: autoSku({ ...v, color: name }),
                      })
                    }
                  />
                </div>

                {/* SKU */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">SKU</p>
                  <Input
                    placeholder="AUTO-SKU"
                    value={v.sku}
                    onChange={(e) => updateVariant(v._localId, { sku: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                {/* Price override */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Price <span className="text-[10px]">(override)</span>
                  </p>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input
                      type="number"
                      placeholder={String(basePrice)}
                      value={v.price ?? ''}
                      onChange={(e) =>
                        updateVariant(v._localId, {
                          price: e.target.value ? Number(e.target.value) : undefined,
                        } as Partial<VariantRow>)
                      }
                      className="h-9 pl-6"
                    />
                  </div>
                </div>

                {/* Stock */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Stock</p>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={v.stock}
                    onChange={(e) => updateVariant(v._localId, { stock: Number(e.target.value) })}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add variant button */}
      <Button
        type="button"
        variant="outline"
        onClick={addVariant}
        className="w-full gap-2 border-dashed hover:border-primary/50 hover:bg-primary/5"
      >
        <Plus className="h-4 w-4" />
        Add Variant
      </Button>

      {/* Summary chips */}
      {variants.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {/* Unique sizes */}
          {[...new Set(variants.map((v) => v.size).filter(Boolean))].map((s) => (
            <span key={s} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
              {s}
            </span>
          ))}
          {/* Unique colors */}
          {[...new Set(variants.map((v) => v.color).filter(Boolean))].map((c) => {
            const col = FASHION_COLORS.find((fc) => fc.name === c);
            return (
              <span
                key={c}
                className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs"
              >
                {col && (
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.hex }} />
                )}
                {c}
              </span>
            );
          })}
          <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
            Total stock: {variants.reduce((s, v) => s + (v.stock || 0), 0)}
          </span>
        </div>
      )}
    </div>
  );
};

export default VariantBuilder;
