import React, { useState, useEffect } from 'react';
import { Tag, Plus, ToggleLeft, ToggleRight, Trash2, Calendar, Percent, DollarSign, Layers, PackageCheck, AlertCircle, Zap } from 'lucide-react';
import apiClient from '../../api/client';
import DiscountFormModal from '../../components/discounts/DiscountFormModal';

export interface DiscountItem {
  _id: string;
  title: string;
  code?: string;
  scope: 'all' | 'category' | 'products';
  category?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  badgeText: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  vendor?: { name: string; storeName?: string };
}

const DEFAULT_DISCOUNTS: DiscountItem[] = [
  {
    _id: 'disc-1',
    title: 'Grand Festive Flash Sale',
    code: 'FESTIVE30',
    scope: 'all',
    discountType: 'percent',
    discountValue: 30,
    minOrderValue: 999,
    badgeText: 'FESTIVE 30% OFF',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 14).toISOString(),
    isActive: true,
    vendor: { name: 'System Admin', storeName: 'StyleHub Platform' }
  },
  {
    _id: 'disc-2',
    title: 'Ethnic Wear Designer Sale',
    code: 'ETHNIC20',
    scope: 'category',
    category: 'Ethnic Wear',
    discountType: 'percent',
    discountValue: 20,
    minOrderValue: 1499,
    badgeText: 'ETHNIC 20% OFF',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    isActive: true,
    vendor: { name: 'DesiCouture', storeName: 'DesiCouture Boutique' }
  },
  {
    _id: 'disc-3',
    title: 'Footwear Flat Clearance',
    code: 'SHOES500',
    scope: 'category',
    category: 'Footwear',
    discountType: 'fixed',
    discountValue: 500,
    minOrderValue: 1999,
    badgeText: 'FLAT ₹500 OFF',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 10).toISOString(),
    isActive: true,
    vendor: { name: 'SoleMate', storeName: 'SoleMate Boutique' }
  }
];

const getSavedDiscounts = (): DiscountItem[] => {
  if (typeof window === 'undefined') return DEFAULT_DISCOUNTS;
  const saved = localStorage.getItem('stylehub_admin_discounts_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return DEFAULT_DISCOUNTS;
};

const saveDiscountsState = (list: DiscountItem[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('stylehub_admin_discounts_state', JSON.stringify(list));
  }
};

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountItem[]>(getSavedDiscounts);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flashBannerEnabled, setFlashBannerEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem('stylehub_flash_banner_active');
      return val !== null ? val === 'true' : true;
    }
    return true;
  });

  const toggleFlashBanner = () => {
    const nextVal = !flashBannerEnabled;
    setFlashBannerEnabled(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stylehub_flash_banner_active', String(nextVal));
    }
  };

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/discounts');
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        setDiscounts(res.data.data);
        saveDiscountsState(res.data.data);
      } else {
        setDiscounts(getSavedDiscounts());
      }
    } catch (err) {
      setDiscounts(getSavedDiscounts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleToggle = async (id: string) => {
    setDiscounts((prev) => {
      const updated = prev.map((d) => (d._id === id ? { ...d, isActive: !d.isActive } : d));
      saveDiscountsState(updated);
      return updated;
    });
    try {
      await apiClient.patch(`/discounts/${id}/toggle`);
    } catch (err) {
      console.error('Failed to toggle discount via API:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    setDiscounts((prev) => {
      const updated = prev.filter((d) => d._id !== id);
      saveDiscountsState(updated);
      return updated;
    });
    try {
      await apiClient.delete(`/discounts/${id}`);
    } catch (err) {
      console.error('Failed to delete discount via API:', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 font-serif">
            <Tag className="w-6 h-6 text-rose-600" />
            Promotions & Discount Campaigns
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create custom promotional sale events for All Products, Categories, or Specific Inventory items.
          </p>

        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-md transition text-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Create Discount Campaign
        </button>
      </div>

      {/* ⚡ Dedicated Storefront Flash Sale Banner Control */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-rose-950 text-white rounded-2xl p-6 shadow-xl border border-rose-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30 shrink-0">
              <Zap className="w-7 h-7 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif">Homepage Flash Sale Deal Banner</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  flashBannerEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {flashBannerEnabled ? 'LIVE ON STOREFRONT' : 'HIDDEN ON STOREFRONT'}
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5">
                Controls the real-time countdown deal bar (&ldquo;Flat 30% OFF Storewide & New Drops&rdquo;) on the Customer Homepage.
              </p>
            </div>
          </div>
          <button
            onClick={toggleFlashBanner}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all whitespace-nowrap ${
              flashBannerEnabled
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
            }`}
          >
            {flashBannerEnabled ? (
              <>
                <ToggleRight className="w-5 h-5 text-white" /> TURN OFF BANNER (HIDE)
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 text-white" /> TURN ON BANNER (SHOW)
              </>
            )}
          </button>
        </div>
      </div>


      {/* Campaigns Grid */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading discount campaigns...</div>
      ) : discounts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm space-y-3">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">No active discount campaigns</h3>
          <p className="text-sm text-gray-500">Launch a campaign to boost sales across your store or categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discounts.map((discount) => (
            <div
              key={discount._id}
              className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 relative transition-all ${
                discount.isActive ? 'border-rose-200 hover:shadow-md' : 'border-gray-200 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full uppercase tracking-wider">
                  {discount.badgeText || 'SALE'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggle(discount._id)}
                    className="p-1 text-gray-500 hover:text-rose-600 transition"
                    title={discount.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {discount.isActive ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(discount._id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900">{discount.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">
                  Scope: <strong className="uppercase text-gray-700">{discount.scope}</strong>
                  {discount.category ? ` (${discount.category})` : ''}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">Discount Value</span>
                <span className="text-lg font-bold text-rose-600">
                  {discount.discountType === 'percent' ? `${discount.discountValue}% OFF` : `₹${discount.discountValue} OFF`}
                </span>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Valid till: {new Date(discount.endDate).toLocaleDateString()}
                </div>
                {discount.vendor && (
                  <div className="text-gray-400">Created by: {discount.vendor.storeName || discount.vendor.name}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Campaign Form Modal */}
      <DiscountFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchDiscounts}
      />
    </div>
  );
}
