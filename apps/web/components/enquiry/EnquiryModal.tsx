"use client";
import { useState, useRef, useEffect } from "react";
import { X, MessageSquare } from "lucide-react";
import EnquiryForm from "./EnquiryForm";

interface Props {
  productId?:   string;
  productName?: string;
  vendorId?:    string;
  children:     React.ReactNode; // trigger element
}

export default function EnquiryModal({ productId, productName, vendorId, children }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Trigger */}
      <div onClick={() => setOpen(true)}>{children}</div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Slide-up panel */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div
          ref={panelRef}
          className="bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[var(--rose)]/10 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-[var(--rose)]" />
              </div>
              <div>
                <h2 className="font-display text-lg font-medium text-[var(--charcoal)]">Send an Enquiry</h2>
                {productName && (
                  <p className="text-xs font-body text-[var(--muted)] line-clamp-1">{productName}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-full hover:bg-[var(--cream-dark)] transition-colors"
            >
              <X className="h-5 w-5 text-[var(--charcoal-mid)]" />
            </button>
          </div>

          {/* Form */}
          <div className="px-6 py-5">
            <EnquiryForm
              productId={productId}
              productName={productName}
              vendorId={vendorId}
              onSuccess={() => setTimeout(() => setOpen(false), 2000)}
            />
          </div>

          {/* Safe area padding for mobile */}
          <div className="h-6" />
        </div>
      </div>
    </>
  );
}
