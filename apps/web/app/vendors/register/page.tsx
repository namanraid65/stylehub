"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Store, User, Mail, Lock, FileText, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";

export default function VendorRegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name || !email || !password || !storeName) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/auth/vendor/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          storeName,
          storeDescription,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setStoreName("");
      setStoreDescription("");
    } catch (err: any) {
      console.error("Vendor registration error:", err);
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cream)] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-body">
      <div className="max-w-4xl w-full grid md:grid-cols-12 bg-white rounded-3xl overflow-hidden shadow-xl border border-[var(--border)]">
        
        {/* Left column — Information & Marketing */}
        <div className="md:col-span-5 bg-[var(--charcoal)] text-white p-8 sm:p-12 flex flex-col justify-between">
          <div className="space-y-6">
            <span className="font-display text-2xl font-semibold">
              Style<span className="text-[var(--rose-light)]">Hub</span>
            </span>
            
            <div className="space-y-4 pt-8">
              <h2 className="font-display text-3xl font-medium leading-tight">
                Partner with us. <br />
                <span className="text-[var(--rose-light)]">Grow your brand.</span>
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                Connect with thousands of discerning shoppers across India who appreciate artisan craftsmanship, premium quality, and designer boutique fashion.
              </p>
            </div>

            <div className="space-y-4 pt-6">
              {[
                { title: "Zero Setup Cost", text: "Register and set up your online boutique storefront for free." },
                { title: "Flat Commission", text: "Only pay when you sell. Standard, transparent platform fees." },
                { title: "Dedicated Support", text: "Get access to vendor tools, sales analytics, and order management." }
              ].map((benefit, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-[var(--rose)] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider">{benefit.title}</h4>
                    <p className="text-white/50 text-xs mt-0.5">{benefit.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-white/40 pt-8 border-t border-white/10">
            Need help? Contact our merchant relations team at <span className="text-white/70">partners@stylehub.in</span>
          </div>
        </div>

        {/* Right column — The Form */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          {success ? (
            <div className="space-y-6 text-center py-8">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-2xl font-semibold text-[var(--charcoal)]">Application Submitted!</h3>
                <p className="text-sm text-[var(--charcoal-mid)] px-4 leading-relaxed">
                  Thank you for applying to sell on StyleHub. Your vendor profile is currently **Pending Approval**. Our curation team will review your application and get back to you via email within 24-48 hours.
                </p>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => setSuccess(false)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--rose)] hover:bg-[var(--rose-dark)] text-white text-sm font-medium transition-colors font-body"
                >
                  Register Another Store <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-2xl font-semibold text-[var(--charcoal)]">Vendor Registration</h3>
                <p className="text-sm text-[var(--charcoal-mid)] mt-1">Start selling your premium boutique collections.</p>
              </div>

              {errorMsg && (
                <div className="rounded-2xl bg-destructive/10 p-4 text-sm font-medium text-destructive flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Owner details */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--charcoal-mid)]" htmlFor="name">Owner Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                      <input
                        id="name"
                        type="text"
                        required
                        placeholder="e.g. Aditi Roy"
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--cream)]/35 focus:outline-none focus:border-[var(--rose)] text-[var(--charcoal)]"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--charcoal-mid)]" htmlFor="email">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                      <input
                        id="email"
                        type="email"
                        required
                        placeholder="e.g. aditi@roy.in"
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--cream)]/35 focus:outline-none focus:border-[var(--rose)] text-[var(--charcoal)]"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Password details */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--charcoal-mid)]" htmlFor="password">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                      <input
                        id="password"
                        type="password"
                        required
                        placeholder="Min 6 characters"
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--cream)]/35 focus:outline-none focus:border-[var(--rose)] text-[var(--charcoal)]"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--charcoal-mid)]" htmlFor="confirmPassword">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                      <input
                        id="confirmPassword"
                        type="password"
                        required
                        placeholder="Re-type password"
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--cream)]/35 focus:outline-none focus:border-[var(--rose)] text-[var(--charcoal)]"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Store Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--charcoal-mid)]" htmlFor="storeName">Store / Brand Name *</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                    <input
                      id="storeName"
                      type="text"
                      required
                      placeholder="e.g. Aditi Couture"
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--cream)]/35 focus:outline-none focus:border-[var(--rose)] text-[var(--charcoal)]"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Store Description */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--charcoal-mid)]" htmlFor="storeDescription">Store Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-[var(--muted)]" />
                    <textarea
                      id="storeDescription"
                      rows={3}
                      placeholder="Briefly describe your design aesthetic, clothing types, and fabrics..."
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--cream)]/35 focus:outline-none focus:border-[var(--rose)] text-[var(--charcoal)] resize-none"
                      value={storeDescription}
                      onChange={(e) => setStoreDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[var(--rose)] hover:bg-[var(--rose-dark)] text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-body"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting Application...
                      </>
                    ) : (
                      <>
                        Submit Onboarding Request <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
