import React from "react";

interface PriceProps {
  amount: number;
  className?: string;
}

export function Price({ amount, className = "" }: PriceProps) {
  if (amount == null || isNaN(amount)) return null;
  const numStr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);

  return (
    <span className={`inline-block ${className}`}>
      <span className="font-sans font-normal text-[0.85em] inline-block mr-[2px] align-baseline relative top-[0.08em] select-none">
        ₹
      </span>
      <span className="inline-block align-baseline">{numStr}</span>
    </span>
  );
}

export default Price;
