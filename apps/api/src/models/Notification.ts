import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'review_approved'
  | 'review_rejected'
  | 'enquiry_reply'
  | 'enquiry_resolved'
  | 'new_coupon'
  | 'system';

export interface INotificationDoc extends Document {
  recipient:  mongoose.Types.ObjectId;
  type:       NotificationType;
  title:      string;
  message:    string;
  link?:      string;
  isRead:     boolean;
  metadata?:  Record<string, unknown>;
  createdAt:  Date;
}

const NotificationSchema = new Schema<INotificationDoc>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:      {
      type: String,
      enum: [
        'order_confirmed','order_shipped','order_delivered','order_cancelled',
        'review_approved','review_rejected',
        'enquiry_reply','enquiry_resolved',
        'new_coupon','system',
      ] as NotificationType[],
      required: true,
    },
    title:    { type: String, required: true, maxlength: 200 },
    message:  { type: String, required: true, maxlength: 500 },
    link:     { type: String },
    isRead:   { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model<INotificationDoc>('Notification', NotificationSchema);
export default Notification;
