import React, { useState, useEffect } from 'react';
import { Landmark, ArrowUpRight, CheckCircle2, Clock, DollarSign, Wallet, ShieldCheck } from 'lucide-react';

export default function VendorPayoutsPage() {
  const [commRate, setCommRate] = useState(12);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stylehub_platform_commission');
      if (saved) {
        setCommRate(Number(saved));
      }
    }
  }, []);

  const rawGross = 95900;
  const rawPendingGross = 15400;

  const totalFee = Math.round(rawGross * (commRate / 100));
  const pendingNet = Math.round(rawPendingGross * (1 - commRate / 100));

  const basePayouts = [
    { id: 'PAY-8821', amount: 48500, status: 'completed', date: '2026-07-20', bank: 'HDFC Bank (•••• 4921)' },
    { id: 'PAY-8820', amount: 32000, status: 'completed', date: '2026-07-12', bank: 'HDFC Bank (•••• 4921)' },
    { id: 'PAY-8819', amount: 15400, status: 'processing', date: '2026-07-23', bank: 'HDFC Bank (•••• 4921)' },
  ];

  const payouts = basePayouts.map((p) => {
    const fee = Math.round(p.amount * (commRate / 100));
    const net = p.amount - fee;
    return { ...p, fee, net };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 font-serif">
            <Landmark className="w-6 h-6 text-rose-600" />
            Vendor Payouts & Commission Settlement
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Automated split earnings ledger and bank account settlements.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase">
            <span>Total Gross Sales</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{rawGross.toLocaleString('en-IN')}</p>
          <p className="text-xs text-emerald-600 font-medium">Boutique platform orders</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase">
            <span>Platform Commission ({commRate}%)</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{totalFee.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500">Auto-deducted at payout</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase">
            <span>Pending Settlement Balance</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">₹{pendingNet.toLocaleString('en-IN')}</p>
          <p className="text-xs text-amber-600 font-semibold">Transferring to bank in 24h</p>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Settlement Transactions</h3>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Bank Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">Payout Ref</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Gross Sales</th>
                <th className="px-6 py-3">Commission ({commRate}%)</th>
                <th className="px-6 py-3">Net Payout</th>
                <th className="px-6 py-3">Bank Account</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono font-semibold text-gray-900">{p.id}</td>
                  <td className="px-6 py-4 text-gray-600">{p.date}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-rose-600 font-medium">-₹{p.fee.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">₹{p.net.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs font-mono">{p.bank}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {p.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
