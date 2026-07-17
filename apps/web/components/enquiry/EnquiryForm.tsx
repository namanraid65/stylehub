"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle2, Loader2, ChevronDown } from "lucide-react";

const schema = z.object({
  name:        z.string().min(2, "Name required"),
  email:       z.string().email("Valid email required"),
  phone:       z.string().regex(/^[\d\s\+\-]{7,15}$/, "Valid phone number").optional().or(z.literal("")),
  enquiryType: z.enum(["general", "quote", "bulk_order", "custom"]),
  quantity:    z.coerce.number().int().positive().optional(),
  subject:     z.string().min(3, "Subject required").max(200),
  message:     z.string().min(10, "Message too short").max(2000),
});

type FormData = z.infer<typeof schema>;

const TYPES = [
  { value: "general",    label: "General Enquiry",  desc: "Ask anything about this product" },
  { value: "quote",      label: "Request a Quote",  desc: "Get a custom price for your order" },
  { value: "bulk_order", label: "Bulk Order",       desc: "Order 10+ units at wholesale pricing" },
  { value: "custom",     label: "Custom Request",   desc: "Customise colour, size, or design" },
] as const;

interface Props {
  productId?:   string;
  productName?: string;
  vendorId?:    string;
  onSuccess?:   () => void;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export default function EnquiryForm({ productId, productName, vendorId, onSuccess }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [apiError,  setApiError]  = useState("");

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      enquiryType: "general",
      subject: productName ? `Enquiry about ${productName}` : "",
    },
  });

  const enquiryType = watch("enquiryType");
  const needsQty    = enquiryType === "quote" || enquiryType === "bulk_order";

  const onSubmit = async (data: FormData) => {
    setApiError("");
    try {
      const res = await fetch(`${API}/enquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          productId,
          vendorId,
          productName,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to submit enquiry.");
      }

      setSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      setApiError(err.message || "Failed to send enquiry. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-10 text-center gap-4">
        <div className="h-16 w-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="font-display text-xl font-medium text-[var(--charcoal)]">Enquiry Sent!</h3>
        <p className="text-sm font-body text-[var(--muted)] max-w-xs">
          We've received your {enquiryType === "quote" ? "quote request" : "enquiry"}.
          The vendor will respond within 24–48 hours.
        </p>
      </div>
    );
  }

  const inputCls = (err?: { message?: string }) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm font-body bg-white focus:outline-none focus:border-[var(--rose)] transition-colors ${
      err ? "border-red-400 bg-red-50/30" : "border-[var(--border)]"
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Enquiry type selector */}
      <div>
        <label className="block text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wider mb-2">
          Enquiry Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <label
              key={t.value}
              className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                enquiryType === t.value
                  ? "border-[var(--rose)] bg-[var(--rose)]/5"
                  : "border-[var(--border)] hover:border-[var(--rose)]/40"
              }`}
            >
              <input type="radio" value={t.value} {...register("enquiryType")} className="sr-only" />
              <span className="text-xs font-body font-semibold text-[var(--charcoal)]">{t.label}</span>
              <span className="text-[10px] font-body text-[var(--muted)] mt-0.5">{t.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Name + Email */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-body font-medium text-[var(--charcoal)] mb-1">Full Name *</label>
          <input {...register("name")} placeholder="Priya Sharma" className={inputCls(errors.name)} />
          {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-body font-medium text-[var(--charcoal)] mb-1">Email *</label>
          <input {...register("email")} type="email" placeholder="you@email.com" className={inputCls(errors.email)} />
          {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email.message}</p>}
        </div>
      </div>

      {/* Phone + Qty (conditional) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-body font-medium text-[var(--charcoal)] mb-1">Phone (optional)</label>
          <input {...register("phone")} type="tel" placeholder="+91 9876543210" className={inputCls(errors.phone)} />
          {errors.phone && <p className="text-xs text-red-500 mt-0.5">{errors.phone.message}</p>}
        </div>
        {needsQty && (
          <div>
            <label className="block text-xs font-body font-medium text-[var(--charcoal)] mb-1">Quantity Needed</label>
            <input {...register("quantity")} type="number" min="1" placeholder="25" className={inputCls(errors.quantity)} />
          </div>
        )}
      </div>

      {/* Subject */}
      <div>
        <label className="block text-xs font-body font-medium text-[var(--charcoal)] mb-1">Subject *</label>
        <input {...register("subject")} placeholder="Brief subject line" className={inputCls(errors.subject)} />
        {errors.subject && <p className="text-xs text-red-500 mt-0.5">{errors.subject.message}</p>}
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-body font-medium text-[var(--charcoal)] mb-1">Message *</label>
        <textarea
          {...register("message")}
          rows={4}
          placeholder={
            enquiryType === "quote"
              ? "Please describe the product you want quoted, including any specific requirements…"
              : "Your enquiry…"
          }
          className={inputCls(errors.message) + " resize-none"}
        />
        {errors.message && <p className="text-xs text-red-500 mt-0.5">{errors.message.message}</p>}
      </div>

      {apiError && (
        <p className="text-sm font-body text-red-500 text-center">{apiError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 rounded-xl bg-[var(--charcoal)] text-white text-sm font-body font-semibold hover:bg-[var(--rose)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
        ) : (
          <><Send className="h-4 w-4" /> Send Enquiry</>
        )}
      </button>
    </form>
  );
}
