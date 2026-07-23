import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export const getWalletBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    // Mock user wallet balance with transactions
    const walletData = {
      balance: 450, // StyleCoins
      currency: 'INR',
      transactions: [
        { id: 'tx-101', type: 'credit', amount: 250, description: 'Cashback reward from Order #ORD-88219', date: new Date(Date.now() - 86400000 * 2) },
        { id: 'tx-102', type: 'credit', amount: 200, description: 'Welcome Bonus StyleCoins', date: new Date(Date.now() - 86400000 * 5) }
      ]
    };

    res.json({ success: true, data: walletData });
  } catch (err: any) {
    logger.error('Error fetching wallet balance:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch wallet balance' });
  }
};

export const redeemWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount } = req.body;
    const redeemAmount = Number(amount || 0);

    if (redeemAmount <= 0) {
      res.status(400).json({ success: false, message: 'Invalid redemption amount' });
      return;
    }

    res.json({
      success: true,
      redeemedAmount: redeemAmount,
      message: `Successfully applied ₹${redeemAmount} StyleCoins discount to cart!`,
    });
  } catch (err: any) {
    logger.error('Error redeeming wallet:', err);
    res.status(500).json({ success: false, message: 'Failed to redeem wallet points' });
  }
};
