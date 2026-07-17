import mongoose, { Schema, Document } from 'mongoose';

export type EnquiryStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface IReplyDoc {
  from:      mongoose.Types.ObjectId;
  message:   string;
  isAdmin:   boolean;
  createdAt: Date;
}

export interface IEnquiryDoc extends Document {
  // Sender info
  name:    string;
  email:   string;
  phone?:  string;
  // Enquiry content
  subject: string;
  message: string;
  // References (optional — could be about a product or store)
  product?: mongoose.Types.ObjectId;
  vendor?:  mongoose.Types.ObjectId;
  order?:   mongoose.Types.ObjectId;
  // User ref if logged in
  user?:    mongoose.Types.ObjectId;
  // Management
  status:      EnquiryStatus;
  assignedTo?: mongoose.Types.ObjectId;
  replies:     IReplyDoc[];
  resolvedAt?: Date;
  createdAt:   Date;
  updatedAt:   Date;
}

const ReplySchema = new Schema<IReplyDoc>(
  {
    from:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message:   { type: String, required: true, trim: true, maxlength: 2000 },
    isAdmin:   { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const EnquirySchema = new Schema<IEnquiryDoc>(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, lowercase: true, trim: true },
    phone:   { type: String, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },

    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    vendor:  { type: Schema.Types.ObjectId, ref: 'Vendor'  },
    order:   { type: Schema.Types.ObjectId, ref: 'Order'   },
    user:    { type: Schema.Types.ObjectId, ref: 'User'    },

    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'] as EnquiryStatus[],
      default: 'open',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    replies:    { type: [ReplySchema], default: [] },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
EnquirySchema.index({ status: 1, createdAt: -1 });
EnquirySchema.index({ email: 1 });
EnquirySchema.index({ user: 1 });
EnquirySchema.index({ assignedTo: 1, status: 1 });

const Enquiry = mongoose.model<IEnquiryDoc>('Enquiry', EnquirySchema);
export default Enquiry;
