import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  ids:       string[];
  toggle:    (productId: string) => void;
  isWished:  (productId: string) => boolean;
  clear:     () => void;
  setIds:    (ids: string[]) => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
      isWished: (id) => get().ids.includes(id),
      clear:    ()   => set({ ids: [] }),
      setIds:   (ids) => set({ ids }),
    }),
    { name: "stylehub-wishlist" },
  ),
);
