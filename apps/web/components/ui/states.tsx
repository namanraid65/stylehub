// Skeleton + Loading + Empty + Error state components for StyleHub web

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ShoppingBag, Search, Wifi, RefreshCw, PackageX, AlertTriangle, HeartOff } from 'lucide-react';

// ─── Skeleton primitives ──────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--cream-dark)]',
        className,
      )}
    />
  );
}

// ─── Product Card Skeleton ────────────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-[var(--border)]">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-9 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}

// ─── Product Grid Skeleton ────────────────────────────────────────────────────
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Hero Skeleton ────────────────────────────────────────────────────────────
export function HeroSkeleton() {
  return (
    <div className="relative w-full aspect-[16/7] bg-[var(--cream-dark)] animate-pulse overflow-hidden">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
        <Skeleton className="h-8 w-64 bg-white/30" />
        <Skeleton className="h-5 w-80 bg-white/20" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28 rounded-full bg-white/30" />
          <Skeleton className="h-10 w-28 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}

// ─── Section Skeleton (title + product grid) ──────────────────────────────────
export function SectionSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="py-12 px-4 max-w-7xl mx-auto w-full">
      <div className="flex items-end justify-between mb-8">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <ProductGridSkeleton count={count} />
    </section>
  );
}

// ─── Page Loading Spinner ─────────────────────────────────────────────────────
export function PageLoader({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-[var(--cream-dark)] border-t-[var(--rose)] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <ShoppingBag className="h-5 w-5 text-[var(--rose)]" />
        </div>
      </div>
      <p className="text-sm font-body text-[var(--muted)] animate-pulse">{message}</p>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

export function EmptyState({ icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-20 px-6 text-center', className)}>
      <div className="h-16 w-16 rounded-2xl bg-[var(--cream-dark)] flex items-center justify-center mb-4">
        {icon ?? <PackageX className="h-7 w-7 text-[var(--muted)]" />}
      </div>
      <h3 className="font-display text-lg font-medium text-[var(--charcoal)] mb-2">{title}</h3>
      <p className="text-sm font-body text-[var(--muted)] max-w-xs leading-relaxed">{message}</p>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            onClick={action.onClick}
            className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--rose)] text-white text-sm font-body font-medium hover:bg-[var(--rose-dark)] transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--rose)] text-white text-sm font-body font-medium hover:bg-[var(--rose-dark)] transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

// ─── No Products Empty State ──────────────────────────────────────────────────
export function EmptyProducts({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      icon={<Search className="h-7 w-7 text-[var(--muted)]" />}
      title="No products found"
      message="Try adjusting your filters or search terms. We&apos;re always adding new styles!"
      action={onClear ? { label: 'Clear Filters', onClick: onClear } : { label: 'Browse All', href: '/products' }}
    />
  );
}

// ─── Empty Wishlist ───────────────────────────────────────────────────────────
export function EmptyWishlist() {
  return (
    <EmptyState
      icon={<HeartOff className="h-7 w-7 text-[var(--muted)]" />}
      title="Your wishlist is empty"
      message="Save items you love by tapping the heart icon on any product."
      action={{ label: 'Start Browsing', href: '/products' }}
    />
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isNetworkError?: boolean;
}

export function ErrorState({ title, message, onRetry, isNetworkError }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        {isNetworkError
          ? <Wifi className="h-7 w-7 text-red-400" />
          : <AlertTriangle className="h-7 w-7 text-red-400" />}
      </div>
      <h3 className="font-display text-lg font-medium text-[var(--charcoal)] mb-2">
        {title ?? (isNetworkError ? 'Connection issue' : 'Something went wrong')}
      </h3>
      <p className="text-sm font-body text-[var(--muted)] max-w-xs leading-relaxed">
        {message ?? (isNetworkError
          ? 'Please check your internet connection and try again.'
          : 'We could not load this content. Please try refreshing the page.')}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--charcoal)] text-white text-sm font-body font-medium hover:bg-[var(--charcoal-mid)] transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Try Again
        </button>
      )}
    </div>
  );
}

// ─── Full page 404 ────────────────────────────────────────────────────────────
export function NotFoundState({ entity = 'page' }: { entity?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-8xl font-bold text-[var(--cream-dark)]">404</p>
      <h1 className="font-display text-2xl font-medium text-[var(--charcoal)] mt-2 mb-3">
        {entity.charAt(0).toUpperCase() + entity.slice(1)} not found
      </h1>
      <p className="text-sm font-body text-[var(--muted)] max-w-sm">
        The {entity} you&apos;re looking for may have moved or doesn&apos;t exist. Let&apos;s get you back on track.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--rose)] text-white text-sm font-body font-medium hover:bg-[var(--rose-dark)] transition-colors"
      >
        <ShoppingBag className="h-4 w-4" /> Back to StyleHub
      </Link>
    </div>
  );
}
