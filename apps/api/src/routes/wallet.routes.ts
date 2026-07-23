import { Router } from 'express';
import { getWalletBalance, redeemWallet } from '../controllers/wallet.controller';
import { protect } from '../middleware/auth';

const router = Router();

// All wallet endpoints require authentication
router.use(protect);

router.get('/balance', getWalletBalance);
router.post('/redeem', redeemWallet);

export default router;
