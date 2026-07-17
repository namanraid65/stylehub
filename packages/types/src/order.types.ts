import { OrderStatus, PaymentMethod, PaymentStatus } from './enums';
import { IAddress } from './user.types';

export interface IOrderItem {
  _id: string;
  product: string;
  vendor: string;
  variant: {
    size: string;
    color: string;
    colorHex: string;
    sku: string;
  };
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IVendorSubOrder {
  vendor: string;
  items: string[];
  subtotal: number;
  commission: number;
  vendorPayout: number;
  payoutStatus: 'pending' | 'processing' | 'paid';
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  customer: string;
  items: IOrderItem[];
  vendorSubOrders: IVendorSubOrder[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  totalAmount: number;
  shippingAddress: Omit<IAddress, '_id' | 'user' | 'isDefault'>;
  shippingMethod?: string;
  trackingNumber?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  stripePaymentId?: string;
  status: OrderStatus;
  statusHistory: Array<{ status: OrderStatus; timestamp: string; note?: string }>;
  coupon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICartItem {
  product: string;
  variant: { size: string; color: string; sku: string };
  quantity: number;
  addedAt: string;
}

export interface ICart {
  _id: string;
  user: string;
  items: ICartItem[];
  updatedAt: string;
}
