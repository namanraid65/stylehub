import mongoose, { Schema, Document } from 'mongoose';

// ─── Embedded shipping address snapshot ──────────────────────────────────────
export interface IAddressSnapshot {
  fullName:  string;
  phone:     string;
  line1:     string;
  line2?:    string;
  city:      string;
  state:     string;
  pincode:   string;
  country?:  string;
}

// ─── Fulfillment Item ────────────────────────────────────────────────────────
export interface IFulfillmentItem {
  productId: string;
  name:      string;
  sku:       string;
  price:     number;
  quantity:  number;
  size:      string;
  color:     string;
}

// ─── Fulfillment Group ───────────────────────────────────────────────────────
export interface IFulfillmentGroup {
  vendorId:   string;
  vendorName: string;
  items:      IFulfillmentItem[];
  subtotal:   number;
  delivery:   number;
  status:     string;
  createdAt:  Date;
}

// ─── Order Totals ────────────────────────────────────────────────────────────
export interface IOrderTotals {
  subtotal: number;
  discount: number;
  tax:      number;
  delivery: number;
  total:    number;
}

// ─── Coupon Snapshot ──────────────────────────────────────────────────────────
export interface ICouponSnapshot {
  code:         string;
  type:         'percent' | 'fixed';
  value:        number;
  maxDiscount?: number;
}

// ─── Status history entry ─────────────────────────────────────────────────────
export interface IStatusHistoryEntry {
  status:    string;
  timestamp: Date;
  note?:     string;
  updatedBy?: mongoose.Types.ObjectId;
}

// ─── Guest Info ───────────────────────────────────────────────────────────────
export interface IGuestInfo {
  name?:  string;
  email?: string;
}

// ─── Order document interface ─────────────────────────────────────────────────
export interface IOrderDoc extends Document {
  orderNumber:    string;
  customer?:      mongoose.Types.ObjectId;
  guestInfo?:     IGuestInfo;
  address:        IAddressSnapshot;
  fulfillments:   IFulfillmentGroup[];
  coupon?:        ICouponSnapshot;
  totals:         IOrderTotals;
  paymentMethod:  string;
  paymentStatus:  string;
  status:         string;
  statusHistory:  IStatusHistoryEntry[];
  notes?:         string;
  cancelReason?:  string;
  returnReason?:  string;
  createdAt:      Date;
  updatedAt:      Date;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────
const AddressSnapshotSchema = new Schema<IAddressSnapshot>({
  fullName: { type: String, required: true },
  phone:    { type: String, required: true },
  line1:    { type: String, required: true },
  line2:    { type: String },
  city:     { type: String, required: true },
  state:    { type: String, required: true },
  pincode:  { type: String, required: true },
  country:  { type: String, default: 'IN' },
}, { _id: false });

const FulfillmentItemSchema = new Schema<IFulfillmentItem>({
  productId: { type: String, required: true },
  name:      { type: String, required: true },
  sku:       { type: String, required: true },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true },
  size:      { type: String, required: true },
  color:     { type: String, required: true },
}, { _id: false });

const FulfillmentGroupSchema = new Schema<IFulfillmentGroup>({
  vendorId:   { type: String, required: true },
  vendorName: { type: String, required: true },
  items:      { type: [FulfillmentItemSchema], required: true },
  subtotal:   { type: Number, required: true },
  delivery:   { type: Number, required: true },
  status:     { type: String, required: true, default: 'pending' },
  createdAt:  { type: Date, required: true, default: Date.now },
}, { _id: false });

const OrderTotalsSchema = new Schema<IOrderTotals>({
  subtotal: { type: Number, required: true },
  discount: { type: Number, required: true, default: 0 },
  tax:      { type: Number, required: true, default: 0 },
  delivery: { type: Number, required: true, default: 0 },
  total:    { type: Number, required: true },
}, { _id: false });

const CouponSnapshotSchema = new Schema<ICouponSnapshot>({
  code:        { type: String, required: true },
  type:        { type: String, enum: ['percent', 'fixed'], required: true },
  value:       { type: Number, required: true },
  maxDiscount: { type: Number },
}, { _id: false });

const StatusHistorySchema = new Schema<IStatusHistoryEntry>({
  status:    { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  note:      { type: String },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

// ─── Main Order Schema ────────────────────────────────────────────────────────
const OrderSchema = new Schema<IOrderDoc>(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    customer:        { type: Schema.Types.ObjectId, ref: 'User' },
    guestInfo: {
      name:  { type: String },
      email: { type: String },
    },
    address:         { type: AddressSnapshotSchema, required: true },
    fulfillments:    { type: [FulfillmentGroupSchema], required: true, default: [] },
    coupon:          { type: CouponSnapshotSchema },
    totals:          { type: OrderTotalsSchema, required: true },
    paymentMethod:   { type: String, required: true },
    paymentStatus:   { type: String, required: true, default: 'pending' },
    status:          { type: String, required: true, default: 'confirmed' },
    statusHistory:   { type: [StatusHistorySchema], default: [] },
    notes:           { type: String, maxlength: 500 },
    cancelReason:    { type: String },
    returnReason:    { type: String },
  },
  { timestamps: true },
);

// ─── Pre-save: generate human-readable order number if not set ────────────────
OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `SH-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ status: 1, paymentStatus: 1 });
OrderSchema.index({ 'fulfillments.vendorId': 1 });
OrderSchema.index({ createdAt: -1 });

const Order = mongoose.model<IOrderDoc>('Order', OrderSchema);
export default Order;
