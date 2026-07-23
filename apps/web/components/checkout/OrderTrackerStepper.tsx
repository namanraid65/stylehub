"use client";
import React from "react";
import { CheckCircle2, Clock, Truck, Package, Home } from "lucide-react";

interface StepperProps {
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  orderNumber: string;
  trackingId?: string;
  carrier?: string;
}

export default function OrderTrackerStepper({
  status = "processing",
  orderNumber,
  trackingId = "STHL-99214820",
  carrier = "Bluedart Express",
}: StepperProps) {
  const steps = [
    { key: "pending", label: "Order Placed", icon: CheckCircle2, desc: "Payment Verified" },
    { key: "processing", label: "Vendor Packing", icon: Package, desc: "Quality Checked" },
    { key: "shipped", label: "Shipped", icon: Truck, desc: `${carrier}` },
    { key: "delivered", label: "Out for Delivery", icon: Home, desc: "Estimated Today" },
  ];

  const getStepIndex = (currentStatus: string) => {
    switch (currentStatus.toLowerCase()) {
      case "pending":
        return 0;
      case "processing":
        return 1;
      case "shipped":
        return 2;
      case "delivered":
        return 3;
      default:
        return 1;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
        <div>
          <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Live Package Tracking</span>
          <h4 className="text-base font-bold text-neutral-900">Order #{orderNumber}</h4>
        </div>
        <div className="text-xs text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200/60 font-mono">
          Awb: <span className="font-semibold text-neutral-900">{trackingId}</span> ({carrier})
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="relative pt-2">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center text-center space-y-2 relative group">
                {/* Connecting Line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute top-4 left-[50%] right-[-50%] h-[3px] z-0 transition-colors ${
                      idx < currentIndex ? "bg-emerald-500" : "bg-neutral-200"
                    }`}
                  />
                )}

                {/* Node Circle */}
                <div
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "bg-neutral-100 text-neutral-400 border border-neutral-300"
                  } ${isCurrent ? "ring-4 ring-emerald-100 scale-110" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Label */}
                <div>
                  <p className={`text-xs font-semibold ${isCompleted ? "text-neutral-900" : "text-neutral-400"}`}>
                    {step.label}
                  </p>
                  <p className="text-[11px] text-neutral-500 hidden sm:block">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
