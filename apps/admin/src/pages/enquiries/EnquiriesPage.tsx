import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type { LucideIcon } from 'lucide-react';
import {
  MessageSquare, Search, Filter, Clock, CheckCircle2,
  AlertCircle, XCircle, Send, ChevronDown, X, User, Mail, Phone, Loader2, RefreshCw,
} from 'lucide-react';
import enquiryApi, { Enquiry as ApiEnquiry, EnquiryStatus } from '../../api/enquiry.api';
import { cn } from '../../lib/utils';

// Local normalized interface for UI
interface LocalReply {
  from: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

interface LocalEnquiry {
  id: string;
  ticketId?: string | undefined;
  name: string;
  email: string;
  phone?: string | undefined;
  subject: string;
  message: string;
  enquiryType: string;
  productName?: string | undefined;
  status: EnquiryStatus;
  replies: LocalReply[];
  createdAt: string;
  rawApiObject: ApiEnquiry;
}

const STATUS_CONFIG: Record<EnquiryStatus, { label: string; color: string; Icon: LucideIcon }> = {
  open:        { label: 'Open',        color: 'bg-blue-100 text-blue-700 border-blue-200',    Icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 border-amber-200', Icon: Clock },
  resolved:    { label: 'Resolved',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  closed:      { label: 'Closed',      color: 'bg-slate-100 text-slate-600 border-slate-200', Icon: XCircle },
};

const fmtTime = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const normalizeEnquiry = (e: ApiEnquiry): LocalEnquiry => {
  const userName = typeof e.user === 'object' && e.user ? e.user.name : 'Customer';
  const userEmail = typeof e.user === 'object' && e.user ? e.user.email : '';
  const prodName = typeof e.product === 'object' && e.product ? e.product.name : undefined;

  const replies: LocalReply[] = (e.replies || []).map((r) => ({
    from: r.authorRole === 'admin' ? 'Admin' : (r.authorRole === 'vendor' ? 'Vendor' : 'Customer'),
    message: r.message,
    isAdmin: r.authorRole === 'admin',
    createdAt: r.createdAt,
  }));

  return {
    id: e._id,
    ticketId: e.ticketId,
    name: userName,
    email: userEmail,
    subject: e.subject,
    message: e.message,
    enquiryType: e.type,
    productName: prodName,
    status: e.status,
    replies,
    createdAt: e.createdAt,
    rawApiObject: e,
  };
};

// ─── Reply Thread ─────────────────────────────────────────────────────────────
function ReplyThread({
  enquiry,
  onClose,
  onRefresh,
}: {
  enquiry: LocalEnquiry;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { label: statusLabel, color: statusColor } = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG.open;

  const sendReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      await enquiryApi.reply(enquiry.id, replyText.trim());
      setReplyText('');
      onRefresh();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: EnquiryStatus) => {
    setUpdatingStatus(true);
    try {
      await enquiryApi.updateStatus(enquiry.id, newStatus);
      onRefresh();
    } catch (err) {
      console.error('Failed to update enquiry status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', statusColor)}>{statusLabel}</span>
              <span className="text-xs text-muted-foreground uppercase">{enquiry.enquiryType}</span>
            </div>
            <h3 className="font-semibold text-base line-clamp-1">{enquiry.subject}</h3>
            {enquiry.productName && (
              <p className="text-xs text-muted-foreground mt-0.5">Product: {enquiry.productName}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Customer info & status picker */}
        <div className="p-4 bg-muted/20 border-b dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs"><User className="h-3.5 w-3.5 text-muted-foreground" />{enquiry.name}</div>
            <div className="flex items-center gap-2 text-xs"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{enquiry.email}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status:</label>
            <select
              disabled={updatingStatus}
              value={enquiry.status}
              onChange={(e) => handleStatusChange(e.target.value as EnquiryStatus)}
              className="text-xs border rounded-lg px-2 py-1 bg-white dark:bg-slate-800 font-medium focus:outline-none"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
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
          {enquiry.replies.map((r, i) => (
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
          <div className="p-4 border-t dark:border-slate-800">
            <div className="flex gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply…"
                rows={3}
                className="flex-1 px-3 py-2 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-800"
                onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) sendReply(); }}
              />
              <button
                onClick={sendReply}
                disabled={!replyText.trim() || sending}
                className="self-end px-4 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
  const [enquiries, setEnquiries] = useState<LocalEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState<EnquiryStatus | 'all'>('all');
  const [selected, setSelected] = useState<LocalEnquiry | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await enquiryApi.allEnquiries();
      const rawList = res.data?.data || (res as any).data || [];
      const normalized = rawList.map(normalizeEnquiry);
      setEnquiries(normalized);

      if (selected) {
        const updatedSelected = normalized.find((e: LocalEnquiry) => e.id === selected.id);
        if (updatedSelected) setSelected(updatedSelected);
      }
    } catch (err) {
      console.error('Failed to fetch enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const counts = {
    all:         enquiries.length,
    open:        enquiries.filter((e) => e.status === 'open').length,
    in_progress: enquiries.filter((e) => e.status === 'in_progress').length,
    resolved:    enquiries.filter((e) => e.status === 'resolved').length,
    closed:      enquiries.filter((e) => e.status === 'closed').length,
  };

  const filtered = enquiries.filter((e) => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      {selected && (
        <ReplyThread
          enquiry={selected}
          onClose={() => setSelected(null)}
          onRefresh={fetchEnquiries}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Enquiries</h1>
            <p className="text-sm text-muted-foreground">Customer questions, quote requests, and support tickets</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEnquiries} disabled={loading} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
          </Button>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 border-b overflow-x-auto">
          {(
            [
              ['all', 'All'],
              ['open', 'Open'],
              ['in_progress', 'In Progress'],
              ['resolved', 'Resolved'],
              ['closed', 'Closed'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatus(key as any)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0',
                statusFilter === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                  statusFilter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-sm">No enquiries found</p>
              <p className="text-xs text-muted-foreground mt-0.5">Try clearing filters or search criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map((e) => {
              const cfg = STATUS_CONFIG[e.status] || STATUS_CONFIG.open;
              const StatusIcon = cfg.Icon;
              return (
                <Card
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="hover:shadow-md transition-all cursor-pointer border hover:border-violet-300 dark:hover:border-violet-800"
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5">
                        {e.name.charAt(0)}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', cfg.color)}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium uppercase">{e.enquiryType}</span>
                          <span className="text-[10px] text-muted-foreground">• {fmtTime(e.createdAt)}</span>
                        </div>
                        <h3 className="font-semibold text-sm truncate">{e.subject}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{e.message}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {e.replies.length > 0 && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          {e.replies.length} {e.replies.length === 1 ? 'reply' : 'replies'}
                        </span>
                      )}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
