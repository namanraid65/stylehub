"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, MapPin, ClipboardList, CreditCard } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart.store";
import AddressStep from "./AddressStep";
import ReviewStep from "./ReviewStep";
import PaymentStep from "./PaymentStep";
import OrderConfirmation from "./OrderConfirmation";
import type { Address } from "@/lib/stores/address.store";

export type OrderResult = {
  orderNumber:   string;
  orderId:       string;
  placedAt:      string;
  address:       Address;
  paymentMethod: string;
};

const STEPS = [
  { id: 1, label: "Address",  icon: MapPin },
  { id: 2, label: "Review",   icon: ClipboardList },
  { id: 3, label: "Payment",  icon: CreditCard },
];

export default function CheckoutClient() {
  const [mounted,  setMounted]  = useState(false);
  const [step,     setStep]     = useState(1);
  const [address,  setAddress]  = useState<Address | null>(null);
  const [payment,  setPayment]  = useState<"cod" | "card">("cod");


  const [result,   setResult]   = useState<OrderResult | null>(null);
  const { items }  = useCartStore();

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (items.length === 0 && !result) {
    if (typeof window !== "undefined") window.location.href = "/cart";
    return null;
  }

  if (result) return <OrderConfirmation result={result} />;

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <h1 className="font-display text-2xl font-medium text-[var(--charcoal)] text-center mb-6">
            Secure Checkout
          </h1>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-0">
            {STEPS.map((s, idx) => {
              const Icon    = s.icon;
              const done    = step > s.id;
              const active  = step === s.id;
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                        done    ? "bg-emerald-500 text-white"
                        : active ? "bg-[var(--charcoal)] text-white"
                        :          "bg-[var(--cream-dark)] text-[var(--muted)]"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className={`text-[10px] font-body mt-1 font-medium uppercase tracking-wider ${
                      active ? "text-[var(--charcoal)]" : "text-[var(--muted)]"
                    }`}>{s.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-0.5 w-16 sm:w-24 mx-2 mb-4 transition-colors ${
                      step > s.id ? "bg-emerald-400" : "bg-[var(--border)]"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {step === 1 && (
          <AddressStep
            selected={address}
            onNext={(addr) => { setAddress(addr); setStep(2); }}
          />
        )}
        {step === 2 && address && (
          <ReviewStep
            address={address}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && address && (
          <PaymentStep
            address={address}
            payment={payment}
            onPaymentChange={setPayment}
            onBack={() => setStep(2)}
            onSuccess={(r) => setResult(r)}
          />
        )}
      </div>
    </div>
  );
}
