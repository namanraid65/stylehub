import Notification from '../models/Notification';
import type { NotificationType } from '../models/Notification';
import mongoose from 'mongoose';

interface CreateNotificationInput {
  recipientId: string | mongoose.Types.ObjectId;
  type:        NotificationType;
  title:       string;
  message:     string;
  link?:       string;
  metadata?:   Record<string, unknown>;
}

/**
 * createNotification — call this from any route after a meaningful event.
 *
 * Example:
 *   await createNotification({
 *     recipientId: order.customer,
 *     type: 'order_confirmed',
 *     title: 'Order Confirmed!',
 *     message: `Your order ${orderNumber} has been placed.`,
 *     link: `/account/orders/${orderId}`,
 *   });
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await Notification.create({
      recipient: new mongoose.Types.ObjectId(String(input.recipientId)),
      type:      input.type,
      title:     input.title,
      message:   input.message,
      link:      input.link,
      metadata:  input.metadata,
      isRead:    false,
    });
  } catch (err) {
    // Non-fatal — log but don't throw
    console.error('[NotificationService] Failed to create notification:', err);
  }
}

/**
 * Batch create — send same notification to multiple recipients
 */
export async function broadcastNotification(
  recipientIds: Array<string | mongoose.Types.ObjectId>,
  input: Omit<CreateNotificationInput, 'recipientId'>,
): Promise<void> {
  try {
    const docs = recipientIds.map((id) => ({
      recipient: new mongoose.Types.ObjectId(String(id)),
      type:      input.type,
      title:     input.title,
      message:   input.message,
      link:      input.link,
      metadata:  input.metadata,
      isRead:    false,
    }));
    await Notification.insertMany(docs, { ordered: false });
  } catch (err) {
    console.error('[NotificationService] Failed to broadcast notifications:', err);
  }
}
