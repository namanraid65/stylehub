import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponseBuilder } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

// ─── GET /api/cart ────────────────────────────────────────────────────────────
export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await Cart.findOne({ user: req.user!._id })
    .populate('items.product', 'name slug images status totalStock basePrice')
    .lean();

  res.json(ApiResponseBuilder.success('Cart fetched.', cart ?? { items: [] }));
});

// ─── POST /api/cart/items ─────────────────────────────────────────────────────
export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const { productId, variantId, quantity = 1 } = req.body as {
    productId: string;
    variantId: string;
    quantity: number;
  };

  // Load product and validate variant
  const product = await Product.findById(productId);
  if (!product || product.status !== 'active') throw ApiError.notFound('Product');

  const variant = (product.variants as any).id(new mongoose.Types.ObjectId(variantId));
  if (!variant || !variant.isActive) throw ApiError.notFound('Variant');
  if (variant.stock < quantity) {
    throw ApiError.badRequest(`Only ${variant.stock} item(s) left in stock.`);
  }

  const effectivePrice = variant.price ?? product.basePrice;

  // Upsert cart
  let cart = await Cart.findOne({ user: req.user!._id });

  if (!cart) {
    cart = new Cart({ user: req.user!._id, items: [] });
  }

  // Check if this exact variant is already in cart
  const existingIdx = cart.items.findIndex(
    (i) => i.product.toString() === productId && i.variantId.toString() === variantId,
  );

  if (existingIdx >= 0) {
    const existingItem = cart.items[existingIdx]!;
    const newQty = existingItem.quantity + quantity;
    if (newQty > variant.stock) {
      throw ApiError.badRequest(`Cannot add more. Only ${variant.stock} in stock.`);
    }
    existingItem.quantity = newQty;
  } else {
    cart.items.push({
      product:   new mongoose.Types.ObjectId(productId),
      variantId: new mongoose.Types.ObjectId(variantId),
      variantSnapshot: {
        size:     variant.size,
        color:    variant.color,
        colorHex: variant.colorHex,
        sku:      variant.sku,
        price:    effectivePrice,
        image:    variant.images[0] ?? product.images[0],
      },
      quantity,
      addedAt: new Date(),
    } as never);
  }

  await cart.save();
  res.status(200).json(ApiResponseBuilder.success('Item added to cart.', cart));
});

// ─── PUT /api/cart/items/:itemId ──────────────────────────────────────────────
export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { itemId } = req.params as { itemId: string };
  const { quantity } = req.body as { quantity: number };

  const cart = await Cart.findOne({ user: req.user!._id });
  if (!cart) throw ApiError.notFound('Cart');

  const item = (cart.items as any).id(new mongoose.Types.ObjectId(itemId));
  if (!item) throw ApiError.notFound('Cart item');

  // Validate stock
  const product = await Product.findById(item.product);
  const variant  = (product?.variants as any)?.id(item.variantId);
  if (!variant || variant.stock < quantity) {
    throw ApiError.badRequest(`Only ${variant?.stock ?? 0} item(s) available.`);
  }

  item.quantity = quantity;
  await cart.save();
  res.json(ApiResponseBuilder.success('Cart item updated.', cart));
});

// ─── DELETE /api/cart/items/:itemId ──────────────────────────────────────────
export const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { itemId } = req.params as { itemId: string };

  const cart = await Cart.findOne({ user: req.user!._id });
  if (!cart) throw ApiError.notFound('Cart');

  const item = (cart.items as any).id(new mongoose.Types.ObjectId(itemId));
  if (!item) throw ApiError.notFound('Cart item');

  item.deleteOne();
  await cart.save();
  res.json(ApiResponseBuilder.success('Item removed from cart.', cart));
});

// ─── DELETE /api/cart — clear entire cart ─────────────────────────────────────
export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  await Cart.findOneAndUpdate({ user: req.user!._id }, { $set: { items: [], couponCode: undefined } });
  res.json(ApiResponseBuilder.success('Cart cleared.'));
});

// ─── POST /api/cart/coupon ────────────────────────────────────────────────────
export const applyCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body as { code: string };
  const cart = await Cart.findOne({ user: req.user!._id });
  if (!cart) throw ApiError.notFound('Cart');

  // Coupon validation logic will go in coupon service — placeholder for now
  cart.couponCode = code.trim().toUpperCase();
  await cart.save();
  res.json(ApiResponseBuilder.success('Coupon applied.', { couponCode: cart.couponCode }));
});

// ─── DELETE /api/cart/coupon ──────────────────────────────────────────────────
export const removeCoupon = asyncHandler(async (req: Request, res: Response) => {
  await Cart.findOneAndUpdate({ user: req.user!._id }, { $unset: { couponCode: '' } });
  res.json(ApiResponseBuilder.success('Coupon removed.'));
});

// ─── POST /api/cart/sync ──────────────────────────────────────────────────────
export const syncCart = asyncHandler(async (req: Request, res: Response) => {
  const { items = [] } = req.body as { items: any[] };

  let cart = await Cart.findOne({ user: req.user!._id });
  if (!cart) {
    cart = new Cart({ user: req.user!._id, items: [] });
  }

  for (const localItem of items) {
    if (!mongoose.isValidObjectId(localItem.productId)) continue;

    const product = await Product.findById(localItem.productId);
    if (!product) continue;

    const variant = product.variants.find((v: any) => v.sku === localItem.sku);
    if (!variant) continue;

    const existingIdx = cart.items.findIndex(
      (item) =>
        item.product.toString() === product._id.toString() &&
        item.variantSnapshot.sku === localItem.sku
    );

    const effectivePrice = variant.price ?? product.basePrice;

    if (existingIdx > -1) {
      cart.items[existingIdx]!.quantity = localItem.quantity;
    } else {
      cart.items.push({
        product: product._id,
        variantId: variant._id,
        variantSnapshot: {
          size: variant.size,
          color: variant.color,
          colorHex: variant.colorHex,
          sku: variant.sku,
          price: effectivePrice,
          image: localItem.image ?? variant.images?.[0] ?? product.images?.[0],
        },
        quantity: localItem.quantity,
        addedAt: new Date(),
      } as any);
    }
  }

  await cart.save();
  // Fetch fully populated cart
  const populated = await Cart.findOne({ user: req.user!._id })
    .populate('items.product', 'name slug images status totalStock basePrice')
    .lean();

  res.status(200).json(ApiResponseBuilder.success('Cart synchronized.', populated ?? { items: [] }));
});
