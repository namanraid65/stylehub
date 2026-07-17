import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type { LucideIcon } from 'lucide-react';
import {
  MessageSquare, Search, Filter, Clock, CheckCircle2,
  AlertCircle, XCircle, Send, ChevronDown, X, User, Mail, Phone,
} from 'lucide-react';
import { cn } from '../../lib/utils';


// ─── Types ────────────────────────────────────────────────────────────────────
type EnquiryStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type EnquiryType   = 'general' | 'quote' | 'bulk_order' | 'custom';

interface Reply { from: string; message: string; isAdmin: boolean; createdAt: string; }
interface Enquiry {
  id:           string;
  name:         string;
  email:        string;
  phone?:       string;
  subject:      string;
  message:      string;
  enquiryType:  EnquiryType;
  productName?: string;
  status:       EnquiryStatus;
  replies:      Reply[];
  createdAt:    string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK: Enquiry[] = [
  {
    id: 'enq-001', name: 'Rahul Verma', email: 'rahul@email.com', phone: '+91 9876543210',
    subject: 'Bulk Order — Ivory Anarkali Kurta', message: 'Hi, I am looking to order 50 pieces of the Ivory Anarkali Kurta for a corporate gifting event. Can you provide a bulk discount and estimated lead time?',
    enquiryType: 'bulk_order', productName: 'Ivory Embroidered Anarkali Kurta',
    status: 'open', replies: [], createdAt: new Date(Date.now() - 30*60000).toISOString(),
  },
  {
    id: 'enq-002', name: 'Priya Sharma', email: 'priya@gmail.com',
    subject: 'Custom embroidery request',
    message: 'I love the Anarkali collection. Is it possible to get the embroidery in gold thread instead of white for a wedding order? We need 5 pieces.',
    enquiryType: 'custom', productName: 'Ivory Embroidered Anarkali Kurta',
    status: 'in_progress',
    replies: [
      { from: 'DesiCouture', message: 'Thank you for your enquiry! Yes, we can do custom gold thread embroidery. The lead time would be 3–4 weeks. Can you share the event date?', isAdmin: false, createdAt: new Date(Date.now() - 2*3600000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 5*3600000).toISOString(),
  },
  {
    id: 'enq-003', name: 'Ananya Singh', email: 'ananya@corp.in', phone: '+91 9988776655',
    subject: 'Quote Request — Midnight Floral Maxi', message: 'Please provide pricing for 15 pieces of the Midnight Floral Maxi in sizes S, M, L for a boutique store.',
    enquiryType: 'quote', productName: 'Midnight Floral Maxi Dress',
    status: 'resolved',
    replies: [
      { from: 'UrbanThreads', message: 'Quote attached: 15 pcs at ₹2,400/unit (bulk rate). Includes free delivery for orders above ₹30,000. Valid for 7 days.', isAdmin: false, createdAt: new Date(Date.now() - 24*3600000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 2*86400000).toISOString(),
  },
  {
    id: 'enq-004', name: 'Meera Patel', email: 'meera@gmail.com',
    subject: 'General question about care instructions',
    message: 'Can the Camel Ribbed Co-ord Set be machine washed? The tag says hand wash but I want to confirm.',
    enquiryType: 'general', productName: 'Camel Ribbed Knit Co-ord Set',
    status: 'closed',
    replies: [
      { from: 'Admin', message: 'Hi Meera! The fabric is delicate — we recommend hand wash cold with mild detergent. Machine wash on delicate cycle (cold) is acceptable but may reduce longevity.', isAdmin: true, createdAt: new Date(Date.now() - 3*86400000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 4*86400000).toISOString(),
  },
];

const STATUS_CONFIG: Record<EnquiryStatus, { label: string; color: string; Icon: LucideIcon }> = {
  open:        { label: 'Open',        color: 'bg-blue-100 text-blue-700 border-blue-200',    Icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 border-amber-200', Icon: Clock },
  resolved:    { label: 'Resolved',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  closed:      { label: 'Closed',      color: 'bg-slate-100 text-slate-600 border-slate-200', Icon: XCircle },
};


const TYPE_LABELS: Record<EnquiryType, string> = {
  general: 'General', quote: 'Quote', bulk_order: 'Bulk Order', custom: 'Custom',
};

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─── Reply Thread ─────────────────────────────────────────────────────────────
function ReplyThread({ enquiry, onClose }: { enquiry: Enquiry; onClose: () => void }) {
  const [reply, setReply] = useState('');
  const [replies, setReplies] = useState(enquiry.replies);
  const { label: statusLabel, color: statusColor } = STATUS_CONFIG[enquiry.status];

  const sendReply = () => {
    if (!reply.trim()) return;
    setReplies((r) => [...r, {
      from: 'Admin', message: reply.trim(), isAdmin: true,
      createdAt: new Date().toISOString(),
    }]);
    setReply('');
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', statusColor)}>{statusLabel}</span>
              <span className="text-xs text-muted-foreground">{TYPE_LABELS[enquiry.enquiryType]}</span>
            </div>
            <h3 className="font-semibold text-base line-clamp-1">{enquiry.subject}</h3>
            {enquiry.productName && (
              <p className="text-xs text-muted-foreground mt-0.5">Product: {enquiry.productName}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
        </div>

        {/* Customer info */}
        <div className="p-4 bg-muted/20 border-b space-y-1.5">
          <div className="flex items-center gap-2 text-xs"><User className="h-3.5 w-3.5 text-muted-foreground" />{enquiry.name}</div>
          <div className="flex items-center gap-2 text-xs"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{enquiry.email}</div>
          {enquiry.phone && <div className="flex items-center gap-2 text-xs"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{enquiry.phone}</div>}
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Original message */}
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-semibold shrink-0">
              {enquiry.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold">{enquiry.name}</p>
                <p className="text-[10px] text-muted-foreground">{fmtTime(enquiry.createdAt)}</p>
              </div>
              <div className="bg-muted/40 rounded-2xl rounded-tl-sm p-3">
                <p className="text-sm leading-relaxed">{enquiry.message}</p>
              </div>
            </div>
          </div>

          {/* Replies */}
          {replies.map((r, i) => (
            <div key={i} className={cn('flex gap-3', r.isAdmin && 'flex-row-reverse')}>
              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0',
                r.isAdmin ? 'bg-violet-600 text-white' : 'bg-blue-100 text-blue-600')}>
                {r.from.charAt(0)}
              </div>
              <div className={cn('flex-1', r.isAdmin && 'flex flex-col items-end')}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold">{r.from}</p>
                  <p className="text-[10px] text-muted-foreground">{fmtTime(r.createdAt)}</p>
                </div>
                <div className={cn('rounded-2xl p-3 max-w-[85%]',
                  r.isAdmin ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-muted/40 rounded-tl-sm')}>
                  <p className="text-sm leading-relaxed">{r.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply input */}
        {enquiry.status !== 'closed' && (
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply…"
                rows={3}
                className="flex-1 px-3 py-2 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) sendReply(); }}
              />
              <button
                onClick={sendReply}
                disabled={!reply.trim()}
                className="self-end px-4 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">⌘ + Enter to send</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main EnquiriesPage ───────────────────────────────────────────────────────
export default function EnquiriesPage() {
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatus]   = useState<EnquiryStatus | 'all'>('all');
  const [selected,   setSelected]   = useState<Enquiry | null>(null);

  const counts = {
    all:         MOCK.length,
    open:        MOCK.filter((e) => e.status === 'open').length,
    in_progress: MOCK.filter((e) => e.status === 'in_progress').length,
    resolved:    MOCK.filter((e) => e.status === 'resolved').length,
    closed:      MOCK.filter((e) => e.status === 'closed').length,
  };

  const filtered = MOCK.filter((e) => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      {selected && <ReplyThread enquiry={selected} onClose={() => setSelected(null)} />}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Enquiries</h1>
          <p className="text-sm text-muted-foreground">Customer questions, quote requests, and vendor conversations</p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 border-b">
          {([['all','All'], ['open','Open'], ['in_progress','In Progress'], ['resolved','Resolved'], ['closed','Closed']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                statusFilter === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                statusFilter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search enquiries…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Replies</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((enq) => {
                  const { label, color, Icon } = STATUS_CONFIG[enq.status];
                  return (
                    <tr
                      key={enq.id}
                      onClick={() => setSelected(enq)}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium">{enq.name}</p>
                        <p className="text-xs text-muted-foreground">{enq.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="line-clamp-1 font-medium">{enq.subject}</p>
                        {enq.productName && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{enq.productName}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[enq.enquiryType]}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border', color)}>
                          <Icon className="h-3 w-3" />{label}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" />{enq.replies.length}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-xs text-muted-foreground">{fmtTime(enq.createdAt)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No enquiries found</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
