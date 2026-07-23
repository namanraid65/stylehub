/**
 * Reset & Re-seed Orders Script
 * Deletes ALL existing orders, then creates fresh ones across multiple vendors
 * with different statuses to test admin/vendor dashboard sync.
 * 
 * Run: cd apps/api && npx ts-node src/scripts/reset-orders.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Order from '../models/Order';
import Product from '../models/Product';
import Vendor from '../models/Vendor';
import User from '../models/User';

const MONGO_URI = process.env.MONGO_URI!;

async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  // ── Step 1: Delete ALL existing orders ────────────────────────────────────
  const deletedCount = await Order.deleteMany({});
  console.log(`🗑️  Deleted ${deletedCount.deletedCount} existing orders\n`);

  // ── Step 2: Reset ALL product soldCounts to 0 ─────────────────────────────
  await Product.updateMany({}, { $set: { soldCount: 0 } });
  console.log('🔄 Reset all product soldCounts to 0');

  // ── Step 3: Reset ALL vendor order stats ──────────────────────────────────
  await Vendor.updateMany({}, { $set: { totalOrders: 0, totalEarnings: 0 } });
  console.log('🔄 Reset all vendor totalOrders & totalEarnings\n');

  // ── Step 4: Fetch vendors & products ──────────────────────────────────────
  const vendors = await Vendor.find({ status: 'approved' }).lean();
  const products = await Product.find({ status: 'active' }).lean();
  const customers = await User.find({ role: 'customer' }).lean();

  console.log(`📦 Found ${vendors.length} vendors, ${products.length} products, ${customers.length} customers\n`);

  if (vendors.length === 0 || products.length === 0) {
    console.log('❌ No vendors or products found. Run the main seed first.');
    await mongoose.disconnect();
    return;
  }

  // Group products by vendor
  const productsByVendor = new Map<string, typeof products>();
  for (const p of products) {
    const vid = p.vendor?.toString() || '';
    if (!productsByVendor.has(vid)) productsByVendor.set(vid, []);
    productsByVendor.get(vid)!.push(p);
  }

  // ── Step 5: Create new orders ─────────────────────────────────────────────
  const now = new Date();
  const yymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  let orderCounter = 0;

  const newOrders: any[] = [];

  // Helper to get next order number
  const nextOrderNum = () => {
    orderCounter++;
    return `SH-${yymm}-${String(orderCounter).padStart(4, '0')}`;
  };

  // Helper to pick a random customer
  const pickCustomer = (idx: number) => {
    if (customers.length === 0) return null;
    return customers[idx % customers.length];
  };

  // For each vendor, create orders in different statuses
  for (const vendor of vendors) {
    const vendorProducts = productsByVendor.get(vendor._id.toString()) || [];
    if (vendorProducts.length === 0) continue;

    const vId = vendor._id.toString();
    const vName = vendor.storeName;

    console.log(`📋 Creating orders for vendor: ${vName} (${vendorProducts.length} products)`);

    // ─── Order 1: PLACED (new, waiting for vendor confirmation) ───────────
    const p1 = vendorProducts[0]!;
    const cust1 = pickCustomer(orderCounter);
    newOrders.push({
      orderNumber: nextOrderNum(),
      customer: cust1?._id,
      guestInfo: { name: cust1?.name || 'Guest Buyer', email: cust1?.email || 'guest@email.com' },
      address: {
        fullName: cust1?.name || 'Guest Buyer',
        phone: '9876543210',
        line1: '42 MG Road, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034',
      },
      fulfillments: [{
        vendorId: vId,
        vendorName: vName,
        status: 'placed',
        createdAt: new Date(now.getTime() - 1 * 3600000),
        items: [{
          productId: p1._id.toString(),
          name: p1.name,
          sku: p1.sku || `SKU-${p1.slug}`,
          price: p1.basePrice,
          quantity: 1,
          size: p1.variants[0]?.size || 'M',
          color: p1.variants[0]?.color || 'Default',
        }],
        subtotal: p1.basePrice,
        delivery: 0,
      }],
      totals: {
        subtotal: p1.basePrice,
        discount: 0,
        tax: Math.round(p1.basePrice * 0.18),
        delivery: 0,
        total: Math.round(p1.basePrice * 1.18),
      },
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      status: 'placed',
      createdAt: new Date(now.getTime() - 1 * 3600000),
    });

    // ─── Order 2: CONFIRMED (vendor accepted, preparing) ─────────────────
    if (vendorProducts.length >= 2) {
      const p2 = vendorProducts[1]!;
      const cust2 = pickCustomer(orderCounter);
      newOrders.push({
        orderNumber: nextOrderNum(),
        customer: cust2?._id,
        guestInfo: { name: cust2?.name || 'Rohit Patel', email: cust2?.email || 'rohit@email.com' },
        address: {
          fullName: cust2?.name || 'Rohit Patel',
          phone: '9822334455',
          line1: 'Flat 301, Sunshine Apartments, Baner',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411045',
        },
        fulfillments: [{
          vendorId: vId,
          vendorName: vName,
          status: 'confirmed',
          createdAt: new Date(now.getTime() - 6 * 3600000),
          items: [{
            productId: p2._id.toString(),
            name: p2.name,
            sku: p2.sku || `SKU-${p2.slug}`,
            price: p2.basePrice,
            quantity: 2,
            size: p2.variants[0]?.size || 'L',
            color: p2.variants[0]?.color || 'Default',
          }],
          subtotal: p2.basePrice * 2,
          delivery: 0,
        }],
        totals: {
          subtotal: p2.basePrice * 2,
          discount: 200,
          tax: Math.round((p2.basePrice * 2 - 200) * 0.18),
          delivery: 0,
          total: Math.round((p2.basePrice * 2 - 200) * 1.18),
        },
        paymentMethod: 'card',
        paymentStatus: 'paid',
        status: 'confirmed',
        createdAt: new Date(now.getTime() - 6 * 3600000),
      });
    }

    // ─── Order 3: SHIPPED (on the way) ───────────────────────────────────
    if (vendorProducts.length >= 3) {
      const p3 = vendorProducts[2]!;
      const cust3 = pickCustomer(orderCounter);
      newOrders.push({
        orderNumber: nextOrderNum(),
        customer: cust3?._id,
        guestInfo: { name: cust3?.name || 'Meera Joshi', email: cust3?.email || 'meera@email.com' },
        address: {
          fullName: cust3?.name || 'Meera Joshi',
          phone: '9811223344',
          line1: 'House 15, Sector 44',
          city: 'Chandigarh',
          state: 'Punjab',
          pincode: '160047',
        },
        fulfillments: [{
          vendorId: vId,
          vendorName: vName,
          status: 'shipped',
          createdAt: new Date(now.getTime() - 24 * 3600000),
          items: [{
            productId: p3._id.toString(),
            name: p3.name,
            sku: p3.sku || `SKU-${p3.slug}`,
            price: p3.basePrice,
            quantity: 1,
            size: p3.variants[0]?.size || 'S',
            color: p3.variants[0]?.color || 'Default',
          }],
          subtotal: p3.basePrice,
          delivery: 99,
        }],
        totals: {
          subtotal: p3.basePrice,
          discount: 0,
          tax: Math.round(p3.basePrice * 0.18),
          delivery: 99,
          total: Math.round(p3.basePrice * 1.18) + 99,
        },
        paymentMethod: 'card',
        paymentStatus: 'paid',
        status: 'shipped',
        createdAt: new Date(now.getTime() - 24 * 3600000),
      });
    }

    // ─── Order 4: DELIVERED (completed) ──────────────────────────────────
    if (vendorProducts.length >= 4) {
      const p4 = vendorProducts[3]!;
      const cust4 = pickCustomer(orderCounter);
      newOrders.push({
        orderNumber: nextOrderNum(),
        customer: cust4?._id,
        guestInfo: { name: cust4?.name || 'Neha Kapoor', email: cust4?.email || 'neha@email.com' },
        address: {
          fullName: cust4?.name || 'Neha Kapoor',
          phone: '9833445566',
          line1: 'B-12, Green Park Extension',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110016',
        },
        fulfillments: [{
          vendorId: vId,
          vendorName: vName,
          status: 'delivered',
          createdAt: new Date(now.getTime() - 72 * 3600000),
          items: [{
            productId: p4._id.toString(),
            name: p4.name,
            sku: p4.sku || `SKU-${p4.slug}`,
            price: p4.basePrice,
            quantity: 1,
            size: p4.variants[0]?.size || 'M',
            color: p4.variants[0]?.color || 'Default',
          }],
          subtotal: p4.basePrice,
          delivery: 0,
        }],
        totals: {
          subtotal: p4.basePrice,
          discount: 0,
          tax: Math.round(p4.basePrice * 0.18),
          delivery: 0,
          total: Math.round(p4.basePrice * 1.18),
        },
        paymentMethod: 'cod',
        paymentStatus: 'paid',
        status: 'delivered',
        createdAt: new Date(now.getTime() - 72 * 3600000),
      });
    }

    // ─── Order 5: CANCELLED ──────────────────────────────────────────────
    const pCancel = vendorProducts[vendorProducts.length - 1]!;
    const custCancel = pickCustomer(orderCounter);
    newOrders.push({
      orderNumber: nextOrderNum(),
      customer: custCancel?._id,
      guestInfo: { name: custCancel?.name || 'Amit Shah', email: custCancel?.email || 'amit@email.com' },
      address: {
        fullName: custCancel?.name || 'Amit Shah',
        phone: '9844556677',
        line1: 'A-7, Satellite Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380015',
      },
      fulfillments: [{
        vendorId: vId,
        vendorName: vName,
        status: 'cancelled',
        createdAt: new Date(now.getTime() - 48 * 3600000),
        items: [{
          productId: pCancel._id.toString(),
          name: pCancel.name,
          sku: pCancel.sku || `SKU-${pCancel.slug}`,
          price: pCancel.basePrice,
          quantity: 1,
          size: pCancel.variants[0]?.size || 'M',
          color: pCancel.variants[0]?.color || 'Default',
        }],
        subtotal: pCancel.basePrice,
        delivery: 0,
      }],
      totals: {
        subtotal: pCancel.basePrice,
        discount: 0,
        tax: Math.round(pCancel.basePrice * 0.18),
        delivery: 0,
        total: Math.round(pCancel.basePrice * 1.18),
      },
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      status: 'cancelled',
      cancelReason: 'Changed my mind',
      createdAt: new Date(now.getTime() - 48 * 3600000),
    });
  }

  // ─── Also create a MULTI-VENDOR order (1 order → 2 vendors) ─────────────
  if (vendors.length >= 2) {
    const v1 = vendors[0]!;
    const v2 = vendors[1]!;
    const v1Products = productsByVendor.get(v1._id.toString()) || [];
    const v2Products = productsByVendor.get(v2._id.toString()) || [];

    if (v1Products.length > 0 && v2Products.length > 0) {
      const p1 = v1Products[0]!;
      const p2 = v2Products[0]!;
      const custMulti = pickCustomer(orderCounter);
      const combinedSubtotal = p1.basePrice + p2.basePrice;

      newOrders.push({
        orderNumber: nextOrderNum(),
        customer: custMulti?._id,
        guestInfo: { name: custMulti?.name || 'Multi Vendor Buyer', email: custMulti?.email || 'multi@email.com' },
        address: {
          fullName: custMulti?.name || 'Multi Vendor Buyer',
          phone: '9855667788',
          line1: 'Plot 22, IT Park, Whitefield',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560066',
        },
        fulfillments: [
          {
            vendorId: v1._id.toString(),
            vendorName: v1.storeName,
            status: 'processing',
            createdAt: new Date(now.getTime() - 8 * 3600000),
            items: [{
              productId: p1._id.toString(),
              name: p1.name,
              sku: p1.sku || `SKU-${p1.slug}`,
              price: p1.basePrice,
              quantity: 1,
              size: p1.variants[0]?.size || 'M',
              color: p1.variants[0]?.color || 'Default',
            }],
            subtotal: p1.basePrice,
            delivery: 0,
          },
          {
            vendorId: v2._id.toString(),
            vendorName: v2.storeName,
            status: 'shipped',
            createdAt: new Date(now.getTime() - 8 * 3600000),
            items: [{
              productId: p2._id.toString(),
              name: p2.name,
              sku: p2.sku || `SKU-${p2.slug}`,
              price: p2.basePrice,
              quantity: 1,
              size: p2.variants[0]?.size || 'M',
              color: p2.variants[0]?.color || 'Default',
            }],
            subtotal: p2.basePrice,
            delivery: 0,
          },
        ],
        totals: {
          subtotal: combinedSubtotal,
          discount: 0,
          tax: Math.round(combinedSubtotal * 0.18),
          delivery: 0,
          total: Math.round(combinedSubtotal * 1.18),
        },
        paymentMethod: 'card',
        paymentStatus: 'paid',
        status: 'processing',
        createdAt: new Date(now.getTime() - 8 * 3600000),
      });
      console.log(`\n📋 Created multi-vendor order (${v1.storeName} + ${v2.storeName})`);
    }
  }

  // ── Insert all orders ──────────────────────────────────────────────────────
  const created = await Order.create(newOrders);
  console.log(`\n✅ Created ${created.length} new orders total`);

  // ── Step 6: Sync product soldCounts ────────────────────────────────────────
  const soldMap: Record<string, number> = {};
  for (const order of created) {
    if (order.status === 'cancelled') continue; // Don't count cancelled orders
    for (const f of order.fulfillments) {
      for (const item of f.items) {
        const pid = item.productId.toString();
        soldMap[pid] = (soldMap[pid] || 0) + item.quantity;
      }
    }
  }
  for (const [pid, count] of Object.entries(soldMap)) {
    await Product.findByIdAndUpdate(pid, { $set: { soldCount: count } });
  }
  console.log(`✅ Synced soldCount for ${Object.keys(soldMap).length} products`);

  // ── Step 7: Sync vendor stats ──────────────────────────────────────────────
  const vendorStats: Record<string, { orders: number; revenue: number }> = {};
  for (const order of created) {
    if (order.status === 'cancelled') continue;
    for (const f of order.fulfillments) {
      const vid = f.vendorId;
      if (!vendorStats[vid]) vendorStats[vid] = { orders: 0, revenue: 0 };
      vendorStats[vid].orders++;
      vendorStats[vid].revenue += f.subtotal + f.delivery;
    }
  }
  for (const [vid, stats] of Object.entries(vendorStats)) {
    await Vendor.findByIdAndUpdate(vid, {
      $set: { totalOrders: stats.orders, totalEarnings: stats.revenue },
    });
  }
  console.log(`✅ Synced stats for ${Object.keys(vendorStats).length} vendors`);

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════');
  console.log('📊 ORDER SUMMARY');
  console.log('════════════════════════════════════════════');

  const statusCounts: Record<string, number> = {};
  for (const o of created) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  }
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`   ${status.padEnd(12)} → ${count} orders`);
  }
  console.log('════════════════════════════════════════════');
  
  for (const [vid, stats] of Object.entries(vendorStats)) {
    const v = vendors.find((v) => v._id.toString() === vid);
    console.log(`   ${(v?.storeName || vid).padEnd(15)} → ${stats.orders} orders, ₹${stats.revenue} revenue`);
  }
  console.log('════════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('🔌 Disconnected. Done!\n');
}

main().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
