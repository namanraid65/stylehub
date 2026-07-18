// ─────────────────────────────────────────────────────────────────────────────
// Enums — single source of truth for all status/role values across the monorepo
// ─────────────────────────────────────────────────────────────────────────────

export enum UserRole {
  Customer = 'customer',
  Vendor = 'vendor',
  Admin = 'admin',
}

export enum VendorStatus {
  Pending = 'pending',
  Approved = 'approved',
  Suspended = 'suspended',
}

export enum ProductStatus {
  Draft = 'draft',
  Active = 'active',
  Archived = 'archived',
}

export enum Gender {
  Men = 'men',
  Women = 'women',
  Unisex = 'unisex',
  Kids = 'kids',
  Boys = 'boys',
  Girls = 'girls',
}

export enum OrderStatus {
  Placed = 'placed',
  Confirmed = 'confirmed',
  Processing = 'processing',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
  Returned = 'returned',
}

export enum PaymentStatus {
  Pending = 'pending',
  Paid = 'paid',
  Failed = 'failed',
  Refunded = 'refunded',
}

export enum PaymentMethod {
  Card = 'card',
  UPI = 'upi',
  COD = 'cod',
}

export enum PayoutStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export enum CouponType {
  Percentage = 'percentage',
  Fixed = 'fixed',
}

export enum CouponScope {
  Platform = 'platform',
  Vendor = 'vendor',
}

export enum SizeCategory {
  Clothing = 'clothing', // XS, S, M, L, XL, XXL
  Footwear = 'footwear', // EU 36–47 / UK 3–12
  OneSize = 'one-size',  // Accessories
}
