"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, X, Check, CheckCheck, ShoppingBag, Star, MessageSquare, Tag, Info } from "lucide-react";
import { useNotificationStore, type AppNotification } from "@/lib/stores/notification.store";

const fmt = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const ICON_MAP: Record<AppNotification["type"], React.FC<{ className?: string }>> = {
  order_confirmed:  ShoppingBag,
  order_shipped:    ShoppingBag,
  order_delivered:  ShoppingBag,
  order_cancelled:  ShoppingBag,
  review_approved:  Star,
  review_rejected:  Star,
  enquiry_reply:    MessageSquare,
  enquiry_resolved: MessageSquare,
  new_coupon:       Tag,
  system:           Info,
};

const COLOR_MAP: Record<AppNotification["type"], string> = {
  order_confirmed:  "bg-emerald-100 text-emerald-600",
  order_shipped:    "bg-blue-100 text-blue-600",
  order_delivered:  "bg-emerald-100 text-emerald-600",
  order_cancelled:  "bg-red-100 text-red-600",
  review_approved:  "bg-amber-100 text-amber-600",
  review_rejected:  "bg-red-100 text-red-600",
  enquiry_reply:    "bg-purple-100 text-purple-600",
  enquiry_resolved: "bg-emerald-100 text-emerald-600",
  new_coupon:       "bg-rose-100 text-rose-600",
  system:           "bg-slate-100 text-slate-600",
};

function NotifItem({ n }: { n: AppNotification }) {
  const { markRead, removeNotification } = useNotificationStore();
  const Icon  = ICON_MAP[n.type];
  const color = COLOR_MAP[n.type];

  const content = (
    <div
      onClick={() => markRead(n.id)}
      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-[var(--cream)] transition-colors cursor-pointer group relative ${
        !n.isRead ? "bg-[var(--rose)]/[0.03]" : ""
      }`}
    >
      {!n.isRead && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[var(--rose)]" />
      )}
      <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-body leading-snug ${!n.isRead ? "font-semibold text-[var(--charcoal)]" : "text-[var(--charcoal-mid)]"}`}>
          {n.title}
        </p>
        <p className="text-xs font-body text-[var(--muted)] mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-[10px] font-body text-[var(--muted)] mt-1">{fmt(n.createdAt)}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--cream-dark)] transition-all shrink-0"
      >
        <X className="h-3 w-3 text-[var(--muted)]" />
      </button>
    </div>
  );

  return n.link ? <Link href={n.link}>{content}</Link> : content;
}

export default function NotificationBell() {
  const [open,    setOpen]    = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllRead } = useNotificationStore();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-[var(--cream-dark)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-[var(--charcoal)]" />
        {mounted && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[var(--rose)] text-white text-[9px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[var(--border)] z-50 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[var(--rose)]" />
              <span className="text-sm font-body font-semibold text-[var(--charcoal)]">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-body font-bold px-1.5 py-0.5 rounded-full bg-[var(--rose)] text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-body text-[var(--rose)] hover:text-[var(--rose-dark)] transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-[var(--muted)] mx-auto mb-2" />
                <p className="text-sm font-body text-[var(--muted)]">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => <NotifItem key={n.id} n={n} />)
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border)] px-4 py-3 text-center">
            <Link
              href="/account?tab=notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-body text-[var(--rose)] hover:text-[var(--rose-dark)] transition-colors"
            >
              See all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
