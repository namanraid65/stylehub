import mongoose, { Schema, Document } from 'mongoose';

// ─── Cart item sub-document ───────────────────────────────────────────────────
export interface ICartItemDoc {
  _id: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  // Snapshot of selected variant for display (avoids extra populate on reads)
  variantSnapshot: {
    size: string;
    color: string;
    colorHex: string;
    sku: string;
    price: number;        // Effective price at time of add-to-cart
    image?: string;
  };
  quantity: number;
  addedAt: Date;
}

// ─── Cart document interface ──────────────────────────────────────────────────
export interface ICartDoc extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItemDoc[];
  couponCode?: string;
  updatedAt: Date;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────
const CartItemSchema = new Schema<ICartItemDoc>(
  {
    product:   { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    variantSnapshot: {
      size:     { type: String, required: true },
      color:    { type: String, required: true },
      colorHex: { type: String, required: true },
      sku:      { type: String, required: true },
      price:    { type: Number, required: true, min: 0 },
      image:    { type: String },
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    addedAt:  { type: Date, default: Date.now },
  },
  { _id: true },
);

const CartSchema = new Schema<ICartDoc>(
  {
    user:       { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items:      { type: [CartItemSchema], default: [] },
    couponCode: { type: String, trim: true, uppercase: true },
  },
  { timestamps: true },
);

// ─── Indexes (user unique auto-created from field) ──────────────────────────────────

const Cart = mongoose.model<ICartDoc>('Cart', CartSchema);
export default Cart;
