"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User, ShoppingBag, MapPin, Heart, Bell, Trash2, CheckCircle2,
  Mail, Phone, ShieldCheck, Clock, Download, ArrowRight,
  Check, Truck, Home, Package
} from "lucide-react";
import { useWishlistStore } from "@/lib/stores/wishlist.store";
import { useAddressStore, Address } from "@/lib/stores/address.store";
import { useNotificationStore } from "@/lib/stores/notification.store";
import ProductCard from "@/components/product/ProductCard";

// Dynamically import client-only PDF download button
const InvoiceDownloadButton = dynamic(
  () => import("@/components/invoice/InvoiceDownloadButton"),
  { ssr: false, loading: () => (
    <button className="text-xs border border-[var(--border)] px-3 py-1.5 rounded-lg text-[var(--muted)]" disabled>
      Preparing Invoice...
    </button>
  )}
);

const fmtPrice = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const tabs = [
  { id: "profile",      label: "My Profile",      icon: User },
  { id: "orders",       label: "Order History",   icon: ShoppingBag },
  { id: "addresses",    label: "Saved Addresses",  icon: MapPin },
  { id: "wishlist",     label: "My Wishlist",     icon: Heart },
  { id: "notifications",label: "Notifications",   icon: Bell },
] as const;

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [mounted, setMounted] = useState(false);
  const [placedOrders, setPlacedOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Auth States
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; phone?: string; createdAt?: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Profile Edit States
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const handleStartEdit = () => {
    setEditName(user?.name || "");
    setEditPhone(user?.phone || "");
    setEditPassword("");
    setEditConfirmPassword("");
    setProfileError("");
    setEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName) {
      setProfileError("Full Name is required.");
      return;
    }
    if (editPassword && editPassword !== editConfirmPassword) {
      setProfileError("Passwords do not match.");
      return;
    }
    if (editPhone && !/^[6-9]\d{9}$/.test(editPhone.trim())) {
      setProfileError("Phone number must be a valid 10-digit Indian mobile number.");
      return;
    }
    setProfileError("");
    setUpdatingProfile(true);
    try {
      const token = localStorage.getItem('stylehub-token');
      const payload = {
        name: editName,
        phone: editPhone.trim() || undefined,
        ...(editPassword ? { password: editPassword } : {})
      };
      const res = await fetch(`${apiBase}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.errors?.fieldErrors) {
          const firstErr = Object.values(json.errors.fieldErrors)[0];
          if (Array.isArray(firstErr) && firstErr.length > 0) {
            throw new Error(firstErr[0] as string);
          }
        }
        throw new Error(json.message || "Failed to update profile.");
      }
      setUser(json.data);
      setEditingProfile(false);
      alert("Profile updated successfully!");
    } catch (err: any) {
      console.error(err);
      setProfileError(err.message || "Something went wrong.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Amazon-style cancel/return modal states
  const [modalType, setModalType] = useState<'cancel' | 'return' | null>(null);
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);
  const [reasonCode, setReasonCode] = useState<string>("");
  const [commentText, setCommentText] = useState<string>("");
  const [submittingModal, setSubmittingModal] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

  const fetchProfile = async (t: string) => {
    try {
      const res = await fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setUser(json.data);
      } else {
        localStorage.removeItem('stylehub-token');
        localStorage.removeItem('stylehub-user-id');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleModalSubmit = async () => {
    if (!targetOrderId || !modalType) return;
    if (!reasonCode) {
      alert(`Please select a reason to process the request.`);
      return;
    }
    setSubmittingModal(true);
    try {
      const fullReason = commentText ? `${reasonCode} - ${commentText}` : reasonCode;
      const res = await fetch(`${apiBase}/orders/${targetOrderId}/${modalType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem('stylehub-token') ? { Authorization: `Bearer ${localStorage.getItem('stylehub-token')}` } : {})
        },
        body: JSON.stringify({ reason: fullReason })
      });
      if (res.ok) {
        alert(modalType === 'cancel' ? "Order cancelled successfully!" : "Return request processed successfully!");
        setModalType(null);
        setTargetOrderId(null);
        setReasonCode("");
        setCommentText("");
        fetchOrders();
      } else {
        const json = await res.json();
        alert(json.message || `Failed to process ${modalType}.`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the server.");
    } finally {
      setSubmittingModal(false);
    }
  };

  const fetchOrders = async () => {
    const token = localStorage.getItem('stylehub-token');
    if (!token) {
      // Fall back to localStorage orders for guest / unauthenticated sessions, but update them with live status!
      const stored = localStorage.getItem("stylehub-placed-orders");
      if (stored) {
        try {
          const localOrders = JSON.parse(stored);
          if (Array.isArray(localOrders) && localOrders.length > 0) {
            setOrdersLoading(true);
            const liveOrders = await Promise.all(
              localOrders.map(async (o: any) => {
                const orderId = o._id || o.orderId || o.orderNumber;
                try {
                  const res = await fetch(`${apiBase}/orders/${orderId}`);
                  if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.order) {
                      return json.order;
                    }
                  }
                } catch (e) {
                  console.error("Failed to fetch live order status:", e);
                }
                return o; // fallback
              })
            );
            setPlacedOrders(liveOrders);
            localStorage.setItem("stylehub-placed-orders", JSON.stringify(liveOrders));
          }
        } catch (e) {
          console.error(e);
        } finally {
          setOrdersLoading(false);
        }
      }
      return;
    }
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const res = await fetch(`${apiBase}/orders/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setPlacedOrders(json.data || []);
      } else {
        setOrdersError(json.message || "Failed to load orders.");
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      // Fallback: try localStorage
      const stored = localStorage.getItem("stylehub-placed-orders");
      if (stored) {
        try { setPlacedOrders(JSON.parse(stored)); } catch (e) { console.error(e); }
      } else {
        setOrdersError("Could not connect to server.");
      }
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchWishlistProducts = async (ids: string[]) => {
    if (!ids.length) { setWishlistProducts([]); return; }
    setWishlistLoading(true);
    try {
      const res = await fetch(`${apiBase}/products?ids=${ids.join(',')}&limit=50`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const raw: any[] = json.data?.products || json.data || [];
        setWishlistProducts(raw.filter((p: any) => ids.includes(p._id)));
      }
    } catch (err) {
      console.error("Failed to fetch wishlist products:", err);
    } finally {
      setWishlistLoading(false);
    }
  };
  const { ids: wishlistIds, toggle: toggleWish } = useWishlistStore();
  const { addresses, addAddress, deleteAddress } = useAddressStore();
  const { notifications, unreadCount, markRead, removeNotification, markAllRead } = useNotificationStore();

  useEffect(() => {
    setMounted(true);
    const t = localStorage.getItem('stylehub-token');
    if (t) {
      setToken(t);
      fetchProfile(t);
    } else {
      setProfileLoading(false);
    }
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load wishlist products whenever the wishlist IDs change
  useEffect(() => {
    if (mounted) fetchWishlistProducts(wishlistIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistIds, mounted]);

  // Sync active tab with search parameter if changed
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`/account?tab=${tabId}`);
  };

  if (!mounted || (token && profileLoading)) {
    return (
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
        <p className="text-sm font-body text-[var(--muted)]">Loading profile...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <CustomerAuthScreen
        onAuthSuccess={(t, u) => {
          setToken(t);
          setUser(u);
          fetchOrders();
        }}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--cream)] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-medium text-[var(--charcoal)]">My Account</h1>
          <p className="text-sm font-body text-[var(--muted)] mt-1">Manage your profile, orders, addresses, and wishlist</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* ── Sidebar Navigation ────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Short Profile summary */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-5 text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[var(--rose)]/20 to-[var(--rose)]/40 flex items-center justify-center font-display font-semibold text-[var(--rose)] text-xl mx-auto mb-3 shadow-inner">
                {user ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : "C"}
              </div>
              <h2 className="font-display text-lg font-medium text-[var(--charcoal)]">{user?.name || "Customer"}</h2>
              <p className="text-xs font-body text-[var(--muted)] mt-0.5">
                Customer · Joined {user?.createdAt ? new Date(user.createdAt).getFullYear() : 2026}
              </p>
            </div>

            {/* Tabs List */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-2.5 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-medium transition-all whitespace-nowrap lg:w-full ${
                      isSelected
                        ? "bg-[var(--rose)] text-white shadow-sm"
                        : "text-[var(--charcoal-mid)] hover:bg-[var(--cream)]"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ width: "1.125rem", height: "1.125rem" }} />
                    <span>{tab.label}</span>
                    {tab.id === "notifications" && unreadCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-auto font-bold ${
                        isSelected ? "bg-white text-[var(--rose)]" : "bg-[var(--rose)] text-white"
                      }`}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  localStorage.removeItem('stylehub-token');
                  localStorage.removeItem('stylehub-user-id');
                  setToken(null);
                  setUser(null);
                  router.push('/account');
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-medium text-red-500 hover:bg-red-50 transition-all whitespace-nowrap lg:w-full lg:mt-2"
              >
                <Trash2 className="h-4.5 w-4.5" style={{ width: "1.125rem", height: "1.125rem" }} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* ── Active Tab Content Panel ──────────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-[var(--border)] rounded-3xl p-6 md:p-8 min-h-[450px] shadow-sm">

              {/* 1. PROFILE TAB */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <h3 className="font-display text-xl font-medium text-[var(--charcoal)]">
                      Profile Overview
                    </h3>
                    {!editingProfile && (
                      <button
                        onClick={handleStartEdit}
                        className="px-4 py-1.5 rounded-full border border-[var(--charcoal)] hover:bg-[var(--charcoal)] hover:text-white transition-all text-xs font-body font-semibold text-[var(--charcoal)]"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {profileError && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-xs font-body text-red-600">
                      {profileError}
                    </div>
                  )}

                  {editingProfile ? (
                    <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Priya Sharma"
                            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20 focus:border-[var(--rose)]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">Phone Number</label>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="9876543210"
                            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20 focus:border-[var(--rose)]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">New Password (Optional)</label>
                          <input
                            type="password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20 focus:border-[var(--rose)]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">Confirm New Password</label>
                          <input
                            type="password"
                            value={editConfirmPassword}
                            onChange={(e) => setEditConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20 focus:border-[var(--rose)]"
                          />
                        </div>
                      </div>

                      {editPassword && (
                        <p className="text-[10px] text-[var(--muted)] font-body leading-relaxed">
                          Must contain at least 8 characters, with 1 uppercase, 1 lowercase, and 1 number.
                        </p>
                      )}

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setEditingProfile(false)}
                          className="px-6 py-2.5 rounded-xl border border-[var(--border)] text-xs font-body font-semibold text-[var(--charcoal-mid)] hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updatingProfile}
                          className="px-6 py-2.5 rounded-xl bg-[var(--rose)] hover:bg-[var(--rose-dark)] text-white text-xs font-body font-semibold transition-colors disabled:opacity-75 flex items-center justify-center gap-2"
                        >
                          {updatingProfile ? "Saving Changes..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--cream)] border border-[var(--border)]">
                            <Mail className="h-5 w-5 text-[var(--rose)]" />
                            <div>
                              <p className="text-[10px] font-body text-[var(--muted)] uppercase tracking-wider">Email Address</p>
                              <p className="text-sm font-body font-medium text-[var(--charcoal)]">{user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--cream)] border border-[var(--border)]">
                            <Phone className="h-5 w-5 text-[var(--rose)]" />
                            <div>
                              <p className="text-[10px] font-body text-[var(--muted)] uppercase tracking-wider">Phone Number</p>
                              <p className="text-sm font-body font-medium text-[var(--charcoal)]">{user?.phone || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--cream)] border border-[var(--border)]">
                            <ShieldCheck className="h-5 w-5 text-[var(--rose)]" />
                            <div>
                              <p className="text-[10px] font-body text-[var(--muted)] uppercase tracking-wider">Account Status</p>
                              <p className="text-sm font-body font-medium text-emerald-600">✓ Fully Verified Customer</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--cream)] border border-[var(--border)]">
                            <Clock className="h-5 w-5 text-[var(--rose)]" />
                            <div>
                              <p className="text-[10px] font-body text-[var(--muted)] uppercase tracking-wider">Preferred Currency</p>
                              <p className="text-sm font-body font-medium text-[var(--charcoal)]">INR (₹) Indian Rupee</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Account Shortcuts */}
                      <div className="mt-8 pt-6 border-t border-[var(--border)]">
                        <h4 className="font-display text-sm font-semibold text-[var(--charcoal)] mb-4">Account Settings & Help</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <button onClick={() => handleTabChange("orders")} className="p-4 rounded-2xl border border-[var(--border)] hover:border-[var(--rose)]/40 hover:bg-[var(--rose)]/[0.01] transition-all flex flex-col gap-1 text-left">
                            <span className="text-xs font-bold text-[var(--charcoal)] font-body">Your Orders</span>
                            <span className="text-[10px] text-[var(--muted)] font-body">Track, cancel, return, or check order invoices</span>
                          </button>
                          <button onClick={() => handleTabChange("addresses")} className="p-4 rounded-2xl border border-[var(--border)] hover:border-[var(--rose)]/40 hover:bg-[var(--rose)]/[0.01] transition-all flex flex-col gap-1 text-left">
                            <span className="text-xs font-bold text-[var(--charcoal)] font-body">Delivery Addresses</span>
                            <span className="text-[10px] text-[var(--muted)] font-body">Manage shipping details and preferences</span>
                          </button>
                          <Link href="/contact" className="p-4 rounded-2xl border border-[var(--border)] hover:border-[var(--rose)]/40 hover:bg-[var(--rose)]/[0.01] transition-all flex flex-col gap-1 text-left">
                            <span className="text-xs font-bold text-[var(--charcoal)] font-body">Customer Support</span>
                            <span className="text-[10px] text-[var(--muted)] font-body">Contact helpdesk for queries and inquiries</span>
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 2. ORDERS TAB */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <h3 className="font-display text-xl font-medium text-[var(--charcoal)]">
                      Order History
                    </h3>
                    <span className="text-xs font-body text-[var(--muted)]">({placedOrders.length} orders placed)</span>
                  </div>

                  {ordersLoading ? (
                    <div className="text-center py-16">
                      <div className="h-8 w-8 rounded-full border-2 border-[var(--rose)] border-t-transparent animate-spin mx-auto mb-4" />
                      <p className="text-sm font-body text-[var(--muted)]">Loading your orders…</p>
                    </div>
                  ) : ordersError ? (
                    <div className="text-center py-16">
                      <ShoppingBag className="h-12 w-12 text-[var(--muted)] mx-auto mb-4" />
                      <p className="text-sm font-body text-red-500">{ordersError}</p>
                    </div>
                  ) : placedOrders.length === 0 ? (
                    <div className="text-center py-16">
                      <ShoppingBag className="h-12 w-12 text-[var(--muted)] mx-auto mb-4" />
                      <p className="text-base font-body font-medium text-[var(--charcoal)]">No orders found</p>
                      <p className="text-xs font-body text-[var(--muted)] mt-1 mb-6">You haven't placed any orders yet.</p>
                      <Link href="/products" className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[var(--charcoal)] text-white text-xs font-semibold hover:bg-[var(--rose)] transition-colors">
                        Browse catalog <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {placedOrders.map((order) => {
                        // Support both API shape (_id, createdAt) and localStorage shape (orderId, placedAt)
                        const orderId    = order._id || order.orderId;
                        const orderDate  = order.createdAt || order.placedAt;
                        const dateStr = new Date(orderDate).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        });
                        // Items can come from fulfillments (API) or items array (localStorage)
                        const orderItems: any[] = order.items ?? order.fulfillments?.flatMap((f: any) => f.items) ?? [];
                        return (
                          <div key={orderId} className="border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm bg-white hover:border-[var(--rose)]/30 transition-all">
                            {/* Order Header Summary */}
                            <div className="bg-[var(--cream)] px-5 py-4 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-4 text-xs font-body">
                              <div className="space-y-1">
                                <p className="text-[var(--muted)] uppercase tracking-wider">Order Placed</p>
                                <p className="font-semibold text-[var(--charcoal)]">{dateStr}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[var(--muted)] uppercase tracking-wider">Total Amount</p>
                                <p className="font-bold text-[var(--rose)]">{fmtPrice(order.totals?.total)}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[var(--muted)] uppercase tracking-wider">Order Number</p>
                                <p className="font-bold text-[var(--charcoal)] tracking-wide">{order.orderNumber}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[var(--muted)] uppercase tracking-wider">Status</p>
                                <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-semibold capitalize">{order.status || 'confirmed'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <InvoiceDownloadButton
                                  result={{
                                    orderNumber: order.orderNumber,
                                    orderId: orderId,
                                    placedAt: orderDate,
                                    address: order.address,
                                    paymentMethod: order.paymentMethod,
                                  }}
                                  items={orderItems}
                                  subtotal={order.totals?.subtotal}
                                  discount={order.totals?.discount}
                                  tax={order.totals?.tax}
                                  delivery={order.totals?.delivery}
                                  total={order.totals?.total}
                                />
                                
                                {['placed', 'confirmed', 'pending'].includes(order.status) && (
                                  <button
                                    onClick={() => {
                                      setModalType('cancel');
                                      setTargetOrderId(orderId);
                                    }}
                                    className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 text-xs font-semibold hover:bg-red-100 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                )}

                                {order.status === 'delivered' && (
                                  <button
                                    onClick={() => {
                                      setModalType('return');
                                      setTargetOrderId(orderId);
                                    }}
                                    className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 text-xs font-semibold hover:bg-amber-100 transition-colors"
                                  >
                                    Return
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Visual Progress Tracker (Amazon style) */}
                            {order.status !== 'cancelled' ? (
                              <div className="px-5 py-6 border-b border-[var(--border)] bg-white">
                                <div className="relative flex items-center justify-between max-w-xl mx-auto">
                                  {/* Progress Line */}
                                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 -z-0 rounded-full" />
                                  <div 
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[var(--rose)] -z-0 transition-all duration-500 rounded-full"
                                    style={{
                                      width: 
                                        order.status === 'delivered' ? '100%' :
                                        order.status === 'shipped' ? '66.6%' :
                                        order.status === 'processing' ? '33.3%' : '0%'
                                    }}
                                  />

                                  {/* Steps */}
                                  {[
                                    { label: 'Ordered', status: 'confirmed', icon: Check },
                                    { label: 'Processing', status: 'processing', icon: Package },
                                    { label: 'Shipped', status: 'shipped', icon: Truck },
                                    { label: 'Delivered', status: 'delivered', icon: Home }
                                  ].map((step, stepIdx) => {
                                    const statuses = ['confirmed', 'processing', 'shipped', 'delivered'];
                                    const currentIdx = statuses.indexOf(order.status || 'confirmed');
                                    const isActive = stepIdx <= currentIdx;
                                    const isCurrent = stepIdx === currentIdx;
                                    const IconComponent = step.icon;

                                    return (
                                      <div key={step.label} className="relative z-10 flex flex-col items-center">
                                        <div 
                                          className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                            isActive 
                                              ? 'bg-[var(--rose)] border-[var(--rose)] text-white' 
                                              : 'bg-white border-gray-300 text-gray-400'
                                          } ${isCurrent ? 'ring-4 ring-[var(--rose)]/20 scale-110' : ''}`}
                                        >
                                          <IconComponent className="h-4 w-4" />
                                        </div>
                                        <span className={`text-[10px] font-body font-medium mt-1.5 whitespace-nowrap ${isActive ? 'text-[var(--charcoal)] font-semibold' : 'text-gray-400'}`}>
                                          {step.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="px-5 py-4 border-b border-[var(--border)] bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
                                This order has been cancelled.
                              </div>
                            )}

                            {/* Order items list */}
                            <div className="divide-y divide-[var(--border)] px-5">
                              {orderItems.map((item: any, idx: number) => (
                                <div key={idx} className="py-4 flex gap-4 items-center">
                                  <div className="h-16 w-12 rounded-lg bg-[var(--cream-dark)] overflow-hidden relative shrink-0 border border-[var(--border)]">
                                    {item.image && <img src={item.image} alt={item.name} className="object-cover h-full w-full" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-body font-medium text-[var(--rose)] uppercase tracking-wider">{item.brand || item.name}</p>
                                    <p className="text-sm font-body font-semibold text-[var(--charcoal)] truncate mt-0.5">{item.name}</p>
                                    <p className="text-xs font-body text-[var(--muted)] mt-0.5">
                                      {item.size && <>Size: <span className="text-[var(--charcoal)] font-medium mr-3">{item.size}</span></>}
                                      {item.color && <>Colour: <span className="text-[var(--charcoal)] font-medium">{item.color}</span></>}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-sm font-body font-bold text-[var(--charcoal)]">{fmtPrice(item.price)}</p>
                                    <p className="text-xs font-body text-[var(--muted)] mt-0.5">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. ADDRESSES TAB */}
              {activeTab === "addresses" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <h3 className="font-display text-xl font-medium text-[var(--charcoal)]">
                      Saved Addresses
                    </h3>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="text-center py-16">
                      <MapPin className="h-12 w-12 text-[var(--muted)] mx-auto mb-4" />
                      <p className="text-base font-body font-medium text-[var(--charcoal)]">No addresses saved</p>
                      <p className="text-xs font-body text-[var(--muted)] mt-1">Saved addresses appear here for express checkout.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div key={addr.id} className={`p-5 rounded-2xl border bg-white flex flex-col justify-between shadow-sm hover:border-[var(--rose)] transition-colors relative ${
                          addr.isDefault ? "border-[var(--rose)] bg-[var(--rose)]/[0.01]" : "border-[var(--border)]"
                        }`}>
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-body font-bold bg-[var(--charcoal)] text-white px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                {addr.label}
                              </span>
                              {addr.isDefault && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-body text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                  <CheckCircle2 className="h-3 w-3" /> Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-body font-semibold text-[var(--charcoal)]">{addr.fullName}</p>
                            <p className="text-xs font-body text-[var(--charcoal-mid)] mt-1.5 leading-relaxed">
                              {addr.line1}
                              {addr.line2 && `, ${addr.line2}`}
                              <br />
                              {addr.city}, {addr.state} — {addr.pincode}
                            </p>
                            <p className="text-xs font-body text-[var(--muted)] mt-2">📞 {addr.phone}</p>
                          </div>
                          
                          <div className="flex justify-end pt-4 border-t border-[var(--border)] mt-4">
                            <button
                              onClick={() => deleteAddress(addr.id)}
                              className="inline-flex items-center gap-1 text-xs font-body font-medium text-red-500 hover:text-red-700 transition-colors"
                              title="Delete address"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. WISHLIST TAB */}
              {activeTab === "wishlist" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <h3 className="font-display text-xl font-medium text-[var(--charcoal)]">
                      My Wishlist
                    </h3>
                    <span className="text-xs font-body text-[var(--muted)]">({wishlistIds.length} items)</span>
                  </div>

                  {wishlistIds.length === 0 ? (
                    <div className="text-center py-16">
                      <Heart className="h-12 w-12 text-[var(--muted)] mx-auto mb-4" />
                      <p className="text-base font-body font-medium text-[var(--charcoal)]">Wishlist is empty</p>
                      <p className="text-xs font-body text-[var(--muted)] mt-1 mb-6">Explore the storefront and tap the heart icon on any style.</p>
                      <Link href="/products" className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[var(--charcoal)] text-white text-xs font-semibold hover:bg-[var(--rose)] transition-colors">
                        Explore Catalog <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : wishlistLoading ? (
                    <div className="text-center py-16">
                      <div className="h-8 w-8 rounded-full border-2 border-[var(--rose)] border-t-transparent animate-spin mx-auto mb-4" />
                      <p className="text-sm font-body text-[var(--muted)]">Loading wishlist…</p>
                    </div>
                  ) : wishlistProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {wishlistProducts.map((p: any) => {
                        // Map API product to the ProductCard shape
                        const cardProduct = {
                          id: p._id, name: p.name, slug: p.slug,
                          brand: p.brand || p.vendor?.storeName || 'StyleHub',
                          category: p.category?.name || 'Fashion',
                          categorySlug: p.category?.slug || 'fashion',
                          vendor: { id: p.vendor?._id || '', name: p.vendor?.storeName || '', slug: p.vendor?.storeSlug || '', logo: '', banner: '', description: '', rating: 0, reviewCount: 0, productCount: 0, location: 'India', tags: [], verified: true },
                          vendorId: p.vendor?._id || '', vendorName: p.vendor?.storeName || '', vendorSlug: p.vendor?.storeSlug || '',
                          description: p.description || '', longDescription: p.description || '',
                          images: p.images || [], basePrice: p.basePrice || 0, compareAtPrice: p.compareAtPrice,
                          rating: p.avgRating ?? 0, reviewCount: p.reviewCount || 0, soldCount: 0,
                          gender: p.gender || 'unisex', tags: p.tags || [], material: p.material || '', careInstructions: '',
                          variants: (p.variants || []).map((v: any) => ({ size: v.size, color: v.color, colorHex: v.colorHex || '#9ca3af', stock: v.stock || 0, price: v.price || p.basePrice, sku: v.sku || '' })),
                          reviews: [], isFeatured: !!p.isFeatured, isNew: !!p.isNew, isBestSeller: false,
                        };
                        return (
                          <div key={p._id} className="relative group border border-[var(--border)] rounded-2xl overflow-hidden p-2 bg-white">
                            <ProductCard product={cardProduct} />
                            <button
                              onClick={() => toggleWish(p._id)}
                              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white shadow-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Remove from wishlist"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Heart className="h-12 w-12 text-[var(--muted)] mx-auto mb-4" />
                      <p className="text-sm font-body text-[var(--muted)]">Wishlisted items could not be loaded. Try refreshing.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 5. NOTIFICATIONS TAB */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <h3 className="font-display text-xl font-medium text-[var(--charcoal)]">
                      Notifications
                    </h3>
                    {notifications.length > 0 && unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="inline-flex items-center gap-1 text-xs font-body font-semibold text-[var(--rose)] hover:text-[var(--rose-dark)] transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-16">
                      <Bell className="h-12 w-12 text-[var(--muted)] mx-auto mb-4" />
                      <p className="text-base font-body font-medium text-[var(--charcoal)]">No notifications</p>
                      <p className="text-xs font-body text-[var(--muted)] mt-1">You are all caught up!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-2xl overflow-hidden bg-white">
                      {notifications.map((n) => {
                        const dateFormatted = new Date(n.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                        });
                        return (
                          <div
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            className={`p-4 flex gap-4 hover:bg-[var(--cream)]/40 transition-colors relative cursor-pointer ${
                              !n.isRead ? "bg-[var(--rose)]/[0.01]" : ""
                            }`}
                          >
                            {!n.isRead && (
                              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[var(--rose)]" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-body leading-snug ${!n.isRead ? "font-semibold text-[var(--charcoal)]" : "text-[var(--charcoal-mid)]"}`}>
                                {n.title}
                              </h4>
                              <p className="text-xs font-body text-[var(--muted)] mt-0.5 leading-relaxed">{n.message}</p>
                              <span className="text-[10px] font-body text-[var(--muted)] mt-1.5 block">{dateFormatted}</span>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                              className="p-1 rounded hover:bg-[var(--cream-dark)] transition-colors self-center text-[var(--muted)] hover:text-red-500"
                              title="Delete notification"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>

    {/* Premium Cancel/Return Modal (Amazon style) */}
    {modalType && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] overflow-hidden transform transition-all scale-100">
          {/* Modal Header */}
          <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--cream)]">
            <h4 className="font-display text-lg font-semibold text-[var(--charcoal)] capitalize">
              {modalType === 'cancel' ? 'Cancel Order' : 'Return Order Request'}
            </h4>
            <button 
              onClick={() => { setModalType(null); setTargetOrderId(null); setReasonCode(""); setCommentText(""); }}
              className="text-gray-400 hover:text-gray-600 font-bold text-lg font-body"
            >
              ✕
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                Reason for {modalType === 'cancel' ? 'Cancellation' : 'Return'}
              </label>
              <select 
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-white text-sm font-body text-[var(--charcoal)] focus:outline-none focus:border-[var(--rose)] transition-colors"
              >
                <option value="">Select a reason...</option>
                {modalType === 'cancel' ? (
                  <>
                    <option value="Order placed by mistake">Order placed by mistake</option>
                    <option value="Better price found elsewhere">Better price found elsewhere</option>
                    <option value="Need to change shipping address">Need to change shipping address</option>
                    <option value="Need to change sizes or colors">Need to change sizes or colors</option>
                    <option value="Shipping time is too long">Shipping time is too long</option>
                    <option value="Other / Better alternative found">Other / Better alternative found</option>
                  </>
                ) : (
                  <>
                    <option value="Item doesn't fit / Wrong size">Item doesn't fit / Wrong size</option>
                    <option value="Item arrived damaged or defective">Item arrived damaged or defective</option>
                    <option value="Item is different from description">Item is different from description</option>
                    <option value="Accidentally ordered wrong item">Accidentally ordered wrong item</option>
                    <option value="Item arrived too late">Item arrived too late</option>
                    <option value="No longer needed or wanted">No longer needed or wanted</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Please provide any additional details..."
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body text-[var(--charcoal)] focus:outline-none focus:border-[var(--rose)] transition-colors resize-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-[var(--border)] flex items-center justify-end gap-3">
            <button
              onClick={() => { setModalType(null); setTargetOrderId(null); setReasonCode(""); setCommentText(""); }}
              className="px-5 py-2.5 rounded-full border border-[var(--border)] bg-white text-xs font-semibold text-[var(--charcoal)] hover:bg-gray-100 transition-colors"
              disabled={submittingModal}
            >
              Discard
            </button>
            <button
              onClick={handleModalSubmit}
              className={`px-6 py-2.5 rounded-full text-xs font-semibold text-white transition-colors ${
                modalType === 'cancel'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
              disabled={submittingModal}
            >
              {submittingModal ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

interface CustomerAuthScreenProps {
  onAuthSuccess: (token: string, user: any) => void;
}

function CustomerAuthScreen({ onAuthSuccess }: CustomerAuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && (!name || !confirmPassword))) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isLogin && phone && !/^[6-9]\d{9}$/.test(phone.trim())) {
      setError("Phone number must be a valid 10-digit Indian mobile number (e.g. 9876543210).");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email, password }
        : { name, email, password, confirmPassword, phone: phone.trim() || undefined };

      const res = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.errors?.fieldErrors) {
          const firstErr = Object.values(json.errors.fieldErrors)[0];
          if (Array.isArray(firstErr) && firstErr.length > 0) {
            throw new Error(firstErr[0] as string);
          }
        }
        throw new Error(json.message || "Authentication failed.");
      }

      const token = json.data?.accessToken;
      if (!token) throw new Error("No token returned from server.");

      localStorage.setItem("stylehub-token", token);
      
      // Fetch dynamic profile
      const profileRes = await fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileJson = await profileRes.json();
      const user = profileRes.ok && profileJson.success ? profileJson.data : { name: name || "Customer", email };

      if (user?._id) {
        localStorage.setItem("stylehub-user-id", user._id);
      }

      onAuthSuccess(token, user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-[var(--border)] shadow-xl">
        <div className="text-center">
          <span className="font-display text-3xl font-semibold text-[var(--charcoal)] tracking-tight">
            Style<span className="text-[var(--rose)]">Hub</span>
          </span>
          <h2 className="mt-4 text-2xl font-display font-medium text-[var(--charcoal)]">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </h2>
          <p className="mt-2 text-sm font-body text-[var(--muted)]">
            {isLogin ? "Welcome back! Enter your details below." : "Join us to manage orders, wishlist and addresses."}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-xs font-body text-red-600">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Priya Sharma"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20 focus:border-[var(--rose)]"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@gmail.com"
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20 focus:border-[var(--rose)]"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">Phone Number (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20 focus:border-[var(--rose)]"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20 focus:border-[var(--rose)]"
            />
            {!isLogin && (
              <p className="text-[10px] text-[var(--muted)] font-body mt-1 leading-relaxed">
                Must contain at least 8 characters, with 1 uppercase, 1 lowercase, and 1 number.
              </p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">Confirm Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20 focus:border-[var(--rose)]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[var(--rose)] text-white text-sm font-body font-semibold hover:bg-[var(--rose-dark)] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-xs font-body text-[var(--rose)] hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
