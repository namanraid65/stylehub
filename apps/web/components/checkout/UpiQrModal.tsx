"use client";
import { useState, useEffect } from "react";
import { X, CheckCircle2, QrCode, Smartphone, ShieldCheck } from "lucide-react";

interface UpiQrProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  totalAmount: number;
}

export default function UpiQrModal({ isOpen, onClose, onPaymentSuccess, totalAmount }: UpiQrProps) {
  const [seconds, setSeconds] = useState(180);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSeconds(180);
    const interval = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onPaymentSuccess();
    }, 1500);
  };

  const fmtMin = Math.floor(seconds / 60);
  const fmtSec = String(seconds % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center space-y-4 border border-neutral-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 p-1.5 rounded-full hover:bg-neutral-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-600">
          <QrCode className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-neutral-900">Scan & Pay via UPI</h3>
          <p className="text-xs text-neutral-500 mt-1">Open Google Pay, PhonePe, Paytm, or BHIM</p>
        </div>

        {/* Amount Card */}
        <div className="bg-neutral-50 py-3 rounded-xl border border-neutral-200/60">
          <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Total Payable</span>
          <div className="text-2xl font-bold text-rose-600 font-serif">₹{totalAmount.toLocaleString("en-IN")}</div>
        </div>

        {/* QR Code Container */}
        <div className="relative mx-auto w-48 h-48 bg-white p-3 border-2 border-dashed border-rose-300 rounded-2xl flex items-center justify-center shadow-inner">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=stylehub@icici%26pn=StyleHub%20Marketplace%26am=${totalAmount}%26cu=INR`}
            alt="UPI QR Code"
            className="w-full h-full object-contain rounded-lg"
          />
        </div>

        {/* Timer & Security */}
        <div className="flex items-center justify-between text-xs text-neutral-500 px-2">
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <ShieldCheck className="w-4 h-4" /> 256-Bit Encrypted
          </span>
          <span className="font-mono text-amber-600 font-semibold">
            Expires in: {fmtMin}:{fmtSec}
          </span>
        </div>

        {/* Simulate Payment Trigger */}
        <button
          onClick={handleSimulatePayment}
          disabled={isVerifying}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm"
        >
          {isVerifying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verifying Payment...
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4" /> Confirm UPI Payment Received
            </>
          )}
        </button>
      </div>
    </div>
  );
}
