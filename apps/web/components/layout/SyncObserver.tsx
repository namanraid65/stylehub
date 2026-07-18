"use client";
import { useEffect, useRef } from "react";
import { useCartStore } from "@/lib/stores/cart.store";
import { useWishlistStore } from "@/lib/stores/wishlist.store";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export default function SyncObserver() {
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  
  const initialSynced = useRef(false);
  const prevCartItemsStr = useRef(JSON.stringify(cartStore.items));
  const prevWishlistIdsStr = useRef(JSON.stringify(wishlistStore.ids));

  useEffect(() => {
    // Keep checking for token transitions (e.g. login)
    let lastToken: string | null = null;
    if (typeof window !== "undefined") {
      lastToken = localStorage.getItem("stylehub-token");
    }

    const performSync = async (token: string) => {
      // 1. Sync Wishlist
      try {
        const res = await fetch(`${API}/auth/wishlist/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ ids: wishlistStore.ids })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const serverIds = json.data.map((id: any) => id.toString());
            wishlistStore.setIds(serverIds);
            prevWishlistIdsStr.current = JSON.stringify(serverIds);
          }
        }
      } catch (err) {
        console.error("Failed to sync wishlist to server:", err);
      }

      // 2. Sync Cart
      try {
        const res = await fetch(`${API}/cart/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ items: cartStore.items })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const rawItems = json.data.items || [];
            const mappedItems = rawItems.map((item: any) => ({
              productId:      item.product?._id ?? item.product,
              slug:           item.product?.slug ?? "",
              name:           item.product?.name ?? "",
              image:          item.variantSnapshot.image ?? item.product?.images?.[0] ?? "",
              brand:          item.product?.brand ?? "",
              vendorId:       item.product?.vendor ?? "",
              vendorName:     item.product?.vendorName ?? "",
              vendorSlug:     item.product?.vendorSlug ?? "",
              price:          item.variantSnapshot.price,
              size:           item.variantSnapshot.size,
              color:          item.variantSnapshot.color,
              colorHex:       item.variantSnapshot.colorHex,
              sku:            item.variantSnapshot.sku,
              quantity:       item.quantity,
            }));
            cartStore.setItems(mappedItems);
            prevCartItemsStr.current = JSON.stringify(mappedItems);
          }
        }
      } catch (err) {
        console.error("Failed to sync cart to server:", err);
      }
    };

    // On mount sync
    if (lastToken && !initialSynced.current) {
      initialSynced.current = true;
      performSync(lastToken);
    }

    // Interval to detect logins/logouts
    const interval = setInterval(() => {
      const token = localStorage.getItem("stylehub-token");
      if (token !== lastToken) {
        lastToken = token;
        if (token) {
          performSync(token);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Sync Cart changes to server if logged in
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("stylehub-token") : null;
    if (!token) return;

    const currentCartStr = JSON.stringify(cartStore.items);
    if (currentCartStr === prevCartItemsStr.current) return;

    prevCartItemsStr.current = currentCartStr;

    // Push cart update
    fetch(`${API}/cart/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ items: cartStore.items })
    }).catch(err => console.error("Failed to push cart changes:", err));
  }, [cartStore.items]);

  // Sync Wishlist changes to server if logged in
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("stylehub-token") : null;
    if (!token) return;

    const currentWishlistStr = JSON.stringify(wishlistStore.ids);
    if (currentWishlistStr === prevWishlistIdsStr.current) return;

    prevWishlistIdsStr.current = currentWishlistStr;

    // Push wishlist update
    fetch(`${API}/auth/wishlist/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ids: wishlistStore.ids })
    }).catch(err => console.error("Failed to push wishlist changes:", err));
  }, [wishlistStore.ids]);

  return null;
}
