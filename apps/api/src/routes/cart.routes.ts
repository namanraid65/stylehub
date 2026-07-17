import { Router } from 'express';
import * as cartController from '../controllers/cart.controller';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { addToCartSchema, updateCartItemSchema } from '@stylehub/validators';

const router = Router();

// All cart routes require authentication
router.use(protect);

router.get('/',                  cartController.getCart);
router.delete('/',               cartController.clearCart);

router.post('/items',            validate(addToCartSchema), cartController.addToCart);
router.put('/items/:itemId',     validate(updateCartItemSchema), cartController.updateCartItem);
router.delete('/items/:itemId',  cartController.removeCartItem);

router.post('/coupon',           cartController.applyCoupon);
router.delete('/coupon',         cartController.removeCoupon);

export default router;
