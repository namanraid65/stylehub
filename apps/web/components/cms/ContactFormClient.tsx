"use client";
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, Loader2 } from 'lucide-react';

const CONTACT_INFO = [
  { icon: Mail,  label: 'Email',    value: 'hello@stylehub.in',  sub: 'We reply within 24 hours' },
  { icon: Phone, label: 'Phone',    value: '+91 98765 43210',     sub: 'Mon–Sat, 9 AM–7 PM IST' },
  { icon: MapPin,label: 'Address',  value: 'Mumbai, Maharashtra', sub: 'India' },
  { icon: Clock, label: 'Support',  value: '7 Days a Week',       sub: 'Avg. response: 2 hours' },
];

const SUBJECTS = [
  'Order / Shipping enquiry',
  'Return or refund',
  'Product question',
  'Vendor partnership',
  'Press / Media',
  'Other',
];

export default function ContactFormClient() {
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0]!, message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.message.trim().length < 10) {
      setError('Message must be at least 10 characters long.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
      const token = localStorage.getItem('stylehub-token');
      const userId = localStorage.getItem('stylehub-user-id');
      const res = await fetch(`${apiBase}/enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(userId ? { 'x-user-id': userId } : {}),
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          enquiryType: 'general'
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSent(true);
      } else {
        setError(json.message || 'Failed to submit enquiry. Please try again.');
      }
    } catch (err) {
      console.error('Contact submit error:', err);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--charcoal)] py-16 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-body tracking-widest mb-4">CONTACT</span>
        <h1 className="font-display text-4xl font-semibold text-white">Get in Touch</h1>
        <p className="text-white/60 font-body text-sm mt-3 max-w-md mx-auto">
          Our support team is here to help. Reach out and we'll get back to you as soon as possible.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ── Contact cards ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-medium text-[var(--charcoal)] mb-6">Contact Details</h2>
          {CONTACT_INFO.map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-[var(--border)]">
              <div className="h-10 w-10 rounded-xl bg-[var(--rose)]/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-[var(--rose)]" />
              </div>
              <div>
                <p className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wider">{label}</p>
                <p className="font-body text-sm text-[var(--charcoal-mid)] mt-0.5">{value}</p>
                <p className="text-xs font-body text-[var(--muted)]">{sub}</p>
              </div>
            </div>
          ))}

          {/* FAQ shortcut */}
          <div className="p-4 bg-gradient-to-br from-[var(--rose)]/5 to-[var(--gold)]/5 rounded-2xl border border-[var(--border)] mt-4">
            <p className="text-xs font-body font-semibold text-[var(--charcoal)] mb-1">Looking for quick answers?</p>
            <p className="text-xs font-body text-[var(--muted)] mb-3">Check our FAQ before sending a message.</p>
            <a
              href="/faq"
              className="inline-flex items-center text-xs font-body font-medium text-[var(--rose)] hover:underline"
            >
              Browse FAQ →
            </a>
          </div>
        </div>

        {/* ── Contact form ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-sm">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="font-display text-2xl font-medium text-[var(--charcoal)]">Message Sent!</h3>
                <p className="text-sm font-body text-[var(--muted)] max-w-sm">
                  Thank you, {form.name}! We've received your message and will reply to {form.email} within 24 hours.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', subject: SUBJECTS[0]!, message: '' }); }}
                  className="mt-2 px-6 py-2.5 rounded-full border border-[var(--border)] text-sm font-body hover:border-[var(--rose)] hover:text-[var(--rose)] transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="font-display text-2xl font-medium text-[var(--charcoal)] mb-6">Send a Message</h2>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm font-body text-red-600">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">
                      Full Name <span className="text-[var(--rose)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Priya Sharma"
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20 focus:border-[var(--rose)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">
                      Email Address <span className="text-[var(--rose)]">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20 focus:border-[var(--rose)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20"
                  >
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">
                    Message <span className="text-[var(--rose)]">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={6}
                    placeholder="Tell us how we can help…"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20 focus:border-[var(--rose)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[var(--rose)] text-white font-body font-semibold text-sm hover:bg-[var(--rose-dark)] disabled:opacity-70 transition-colors"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {loading ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
