import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  balance: number; // In StyleCoins (1 Coin = ₹1)
  isApplied: boolean;
  appliedAmount: number;
  setBalance: (balance: number) => void;
  toggleApply: (subtotal: number) => void;
  resetWallet: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 450, // Default welcome reward points
      isApplied: false,
      appliedAmount: 0,
      setBalance: (balance) => set({ balance }),
      toggleApply: (subtotal) => {
        const { isApplied, balance } = get();
        if (!isApplied) {
          // Calculate max usable wallet balance (up to subtotal or current balance)
          const usable = Math.min(balance, subtotal);
          set({ isApplied: true, appliedAmount: usable });
        } else {
          set({ isApplied: false, appliedAmount: 0 });
        }
      },
      resetWallet: () => set({ isApplied: false, appliedAmount: 0 }),
    }),
    {
      name: 'stylehub-wallet',
    }
  )
);
