import React, { useState, useEffect } from 'react';
import { X, Tag, Check, Calendar, Package } from 'lucide-react';
import apiClient from '../../api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const DEMO_PRODUCTS = [
  { _id: 'prod-1', name: 'Ivory Floral Anarkali Set', basePrice: 3499, images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200'] },
  { _id: 'prod-2', name: 'Camel Ribbed Co-ord Set', basePrice: 2799, images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200'] },
  { _id: 'prod-3', name: 'Peach Georgette Sharara Set', basePrice: 4299, images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200'] },
  { _id: 'prod-4', name: 'Handcrafted Stiletto Heels', basePrice: 3899, images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200'] },
  { _id: 'prod-5', name: 'Royal Velvet Designer Sherwani', basePrice: 8999, images: ['https://images.unsplash.com/photo-1564463836146-4e30522c2984?w=200'] },
];

export default function DiscountFormModal({ isOpen, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<'all' | 'category' | 'products'>('all');
  const [category, setCategory] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(20);
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [badgeText, setBadgeText] = useState('FESTIVE SALE');
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);

  // Product selection state for scope === 'products'
  const [productList, setProductList] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (scope === 'products' && productList.length === 0) {
      const loadProds = async () => {
        setLoadingProducts(true);
        try {
          const res = await apiClient.get('/products?limit=100');
          const raw = res.data?.data?.products || res.data?.data || res.data?.products || [];
          if (Array.isArray(raw) && raw.length > 0) {
            setProductList(raw);
          } else {
            setProductList(DEMO_PRODUCTS);
          }
        } catch (err) {
          setProductList(DEMO_PRODUCTS);
        } finally {
          setLoadingProducts(false);
        }
      };
      loadProds();
    }
  }, [scope, productList.length]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scope === 'products' && selectedProductIds.length === 0) {
      alert("Please select at least one product from the inventory list.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.post('/discounts', {
        title,
        scope,
        category: scope === 'category' ? category : undefined,
        products: scope === 'products' ? selectedProductIds : undefined,
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue),
        badgeText,
        endDate,
      });

      if (res.data?.success) {
        onCreated();
        onClose();
      } else {
        alert(res.data?.message || 'Failed to create discount campaign.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating discount campaign.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative border border-gray-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-rose-600">
          <Tag className="w-5 h-5" />
          <h2 className="text-xl font-bold text-gray-900 font-serif">Create Discount Campaign</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Campaign Title</label>
            <input
              type="text"
              required
              placeholder="e.g. End of Season Sale / Grand Festive Offer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'all', label: 'All Products' },
              { id: 'category', label: 'By Category' },
              { id: 'products', label: 'Selected Items' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScope(s.id as any)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  scope === s.id
                    ? 'border-rose-600 bg-rose-50 text-rose-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Category Selector */}
          {scope === 'category' && (
            <div>
              <label className="block font-medium text-gray-700 mb-1">Select Target Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-rose-500"
              >
                <option value="">Select Category...</option>
                <option value="Ethnic Wear">Ethnic Wear</option>
                <option value="Dresses">Dresses</option>
                <option value="Footwear">Footwear</option>
                <option value="Tops">Tops & Casuals</option>
                <option value="Denim">Denim</option>
              </select>
            </div>
          )}

          {/* Product Selection List for Selected Items */}
          {scope === 'products' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-medium text-gray-700">Select Target Products</label>
                <span className="text-xs font-semibold text-rose-600">{selectedProductIds.length} Selected</span>
              </div>

              {loadingProducts ? (
                <div className="p-6 text-center text-xs text-gray-500 border rounded-xl">
                  Loading store inventory...
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 p-2 space-y-1 bg-gray-50/50">
                  {productList.map((p) => {
                    const isChecked = selectedProductIds.includes(p._id);
                    return (
                      <label
                        key={p._id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                          isChecked ? 'bg-rose-50 border border-rose-200' : 'hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds((prev) => [...prev, p._id]);
                            } else {
                              setSelectedProductIds((prev) => prev.filter((id) => id !== p._id));
                            }
                          }}
                          className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                        />
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-8 h-8 object-cover rounded-md border" />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400 p-1 bg-gray-100 rounded-md" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            ₹{(p.basePrice || p.price || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-rose-500"
              >
                <option value="percent">Percentage (% OFF)</option>
                <option value="fixed">Fixed Amount (₹ OFF)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Value ({discountType === 'percent' ? '%' : '₹'})</label>
              <input
                type="number"
                min="1"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Sale Badge Tag</label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-rose-500 uppercase font-semibold text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Valid Until</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-md transition"
            >
              {loading ? 'Creating...' : 'Launch Discount Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
