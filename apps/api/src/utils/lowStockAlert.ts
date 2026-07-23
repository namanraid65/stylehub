import Notification from '../models/Notification';
import Vendor from '../models/Vendor';
import User from '../models/User';
import { IProductDoc } from '../models/Product';

export const checkAndTriggerLowStockAlert = async (product: IProductDoc) => {
  try {
    const threshold = product.minStockThreshold ?? 5;
    const vendorDoc = await Vendor.findById(product.vendor);
    if (!vendorDoc) return;

    const recipients: string[] = [];

    // 1. Vendor account user
    if (vendorDoc.user) {
      recipients.push(vendorDoc.user.toString());
    }

    // 2. Admins
    const admins = await User.find({ role: 'admin' }).select('_id');
    admins.forEach((a) => {
      const idStr = a._id.toString();
      if (!recipients.includes(idStr)) {
        recipients.push(idStr);
      }
    });

    const lowVariants = (product.variants || []).filter(
      (v) => v.isActive && v.stock <= (v.minStockThreshold ?? threshold),
    );

    if (product.totalStock <= threshold || lowVariants.length > 0) {
      const variantDetails = lowVariants
        .map((v) => `${v.size} (${v.color}): ${v.stock} left`)
        .join(', ');

      const message =
        product.totalStock <= threshold
          ? `⚠️ Low Stock Alert: Product "${product.name}" is running low with ${product.totalStock} total units left.${variantDetails ? ` Details: ${variantDetails}` : ''}`
          : `⚠️ Variant Low Stock Alert: "${product.name}" has low stock for variants: ${variantDetails}.`;

      for (const recipientId of recipients) {
        // Prevent duplicate low_stock notifications for the same product within 1 hour
        const existing = await Notification.findOne({
          recipient: recipientId,
          type: 'low_stock',
          'metadata.productId': product._id.toString(),
          createdAt: { $gte: new Date(Date.now() - 3600000) },
        });

        if (!existing) {
          await Notification.create({
            recipient: recipientId,
            type: 'low_stock',
            title: `Low Stock Alert: ${product.name}`,
            message,
            link: `/vendor/products/${product._id}/edit`,
            metadata: { productId: product._id.toString(), totalStock: product.totalStock },
          });
        }
      }
    }
  } catch (err) {
    console.error('[LowStockAlert] Error triggering low stock alert:', err);
  }
};
