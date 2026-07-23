import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppNotification {
  id:        string;
  type:      "order_confirmed" | "order_shipped" | "order_delivered" | "order_cancelled"
           | "review_approved" | "review_rejected"
           | "enquiry_reply"   | "enquiry_resolved"
           | "new_coupon"      | "system";
  title:     string;
  message:   string;
  link?:     string;
  isRead:    boolean;
  createdAt: string; // ISO string
}

interface NotificationStore {
  notifications:  AppNotification[];
  unreadCount:    number;
  addNotification:   (n: Omit<AppNotification, "id" | "isRead" | "createdAt">) => void;
  markRead:          (id: string) => void;
  markAllRead:       () => void;
  removeNotification:(id: string) => void;
  clearAll:          () => void;
}

let _nc = 1;

// Seed with demo notifications
const DEMO: AppNotification[] = [
  {
    id: "demo-1", type: "order_confirmed",
    title: "Order Confirmed!", message: "Your order SH-2026-0047 has been placed.",
    link: "/account?tab=orders", isRead: false, createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-2", type: "new_coupon",
    title: "New Offer 🎉", message: "Use code WELCOME50 for 50% off your next order!",
    isRead: false, createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-3", type: "order_shipped",
    title: "Order Shipped", message: "Your order SH-2026-0041 is on its way.",
    link: "/account?tab=orders", isRead: true, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: DEMO,
      unreadCount:   DEMO.filter((n) => !n.isRead).length,

      addNotification: (n) => {
        const notif: AppNotification = {
          ...n,
          id:        `notif-${Date.now()}-${_nc++}`,
          isRead:    false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          notifications: [notif, ...s.notifications].slice(0, 50),
          unreadCount:   s.unreadCount + 1,
        }));
      },

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
          unreadCount: Math.max(0, s.notifications.filter((n) => n.id !== id && !n.isRead).length),
        })),

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount:   0,
        })),

      removeNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
          unreadCount:   s.notifications.filter((n) => n.id !== id && !n.isRead).length,
        })),

      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    { name: "stylehub-notifications" },
  ),
);
