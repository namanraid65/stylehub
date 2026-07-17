import mongoose, { Schema, Document } from 'mongoose';

export type ActivityAction =
  | 'auth.login'   | 'auth.logout'  | 'auth.register'
  | 'order.create' | 'order.status' | 'order.cancel'
  | 'product.create' | 'product.update' | 'product.delete'
  | 'review.submit'  | 'review.approve' | 'review.reject'
  | 'enquiry.create' | 'enquiry.reply'  | 'enquiry.resolve'
  | 'coupon.apply'   | 'coupon.create'
  | 'vendor.update'  | 'user.update'
  | 'admin.action';

export type ActivityEntity =
  | 'Order' | 'Product' | 'Review' | 'Enquiry'
  | 'User'  | 'Vendor'  | 'Coupon' | 'System';

export interface IActivityLogDoc extends Document {
  actor:      mongoose.Types.ObjectId;
  actorRole:  'customer' | 'vendor' | 'admin' | 'system';
  actorName:  string;
  action:     ActivityAction;
  entity:     ActivityEntity;
  entityId?:  string;
  summary:    string;
  metadata?:  Record<string, unknown>;
  ip?:        string;
  userAgent?: string;
  createdAt:  Date;
}

const ActivityLogSchema = new Schema<IActivityLogDoc>(
  {
    actor:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, enum: ['customer','vendor','admin','system'], required: true },
    actorName: { type: String, required: true },
    action:    { type: String, required: true },
    entity:    { type: String, required: true },
    entityId:  { type: String },
    summary:   { type: String, required: true, maxlength: 500 },
    metadata:  { type: Schema.Types.Mixed },
    ip:        { type: String },
    userAgent: { type: String },
  },
  { timestamps: true, versionKey: false },
);

ActivityLogSchema.index({ actor: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ entity: 1, entityId: 1 });
ActivityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model<IActivityLogDoc>('ActivityLog', ActivityLogSchema);
export default ActivityLog;
