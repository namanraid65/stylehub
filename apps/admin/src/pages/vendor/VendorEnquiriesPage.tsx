import React, { useState } from 'react';
import {
  MessageSquare, Search, Send, Clock, CheckCircle2,
  AlertCircle, ChevronRight, Plus, Loader2, User,
  IndianRupee, Trash2,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from '../../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Separator } from '../../components/ui/separator';
import type { Enquiry } from '../../api/enquiry.api';
import { cn } from '../../lib/utils';

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ENQUIRIES: Enquiry[] = [
  {
    _id: 'e1', ticketId: 'TKT-001',
    user: { _id: 'u1', name: 'Priya Sharma', email: 'priya@example.com' },
    type: 'product', subject: 'Does this shirt run true to size?',
    message: 'Hi, I normally wear a M in most brands. Do your Oxford shirts run true to size or should I size up?',
    status: 'open', priority: 'medium',
    replies: [],
    createdAt: '2026-07-15T10:00:00Z', updatedAt: '2026-07-15T10:00:00Z',
  },
  {
    _id: 'e2', ticketId: 'TKT-002',
    user: { _id: 'u2', name: 'Rahul Verma', email: 'rahul@example.com' },
    type: 'custom_quote', subject: 'Bulk order for corporate gifting — 50 polo shirts',
    message: 'We need 50 polo shirts with our company logo embroidered. Can you share pricing for this bulk order? Delivery by Aug 15.',
    status: 'in_progress', priority: 'high',
    replies: [
      { _id: 'r1', message: 'Thank you for reaching out! I\'ll prepare a quote shortly.', author: 'v1', authorRole: 'vendor', createdAt: '2026-07-14T11:00:00Z' },
    ],
    quoteItems: [
      { description: '50× Polo Shirt (Embroidered Logo)', quantity: 50, unitPrice: 799 },
      { description: 'Logo Embroidery Setup', quantity: 1, unitPrice: 2000 },
    ],
    quoteTotal: 41950,
    createdAt: '2026-07-14T09:00:00Z', updatedAt: '2026-07-14T11:00:00Z',
  },
  {
    _id: 'e3', ticketId: 'TKT-003',
    user: { _id: 'u3', name: 'Ananya Singh', email: 'ananya@example.com' },
    type: 'order', subject: 'Return request — wrong colour delivered',
    message: 'I ordered Navy Blue but received Black. Please help me with the return process.',
    status: 'resolved', priority: 'high',
    replies: [
      { _id: 'r2', message: 'Apologies for the error! We\'ve initiated a pickup. Your replacement will ship in 2 business days.', author: 'v1', authorRole: 'vendor', createdAt: '2026-07-13T14:00:00Z' },
    ],
    createdAt: '2026-07-13T12:00:00Z', updatedAt: '2026-07-13T14:00:00Z',
  },
];

// ─── Config maps ──────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'secondary' | 'destructive'; icon: React.ElementType }> = {
  open:        { label: 'Open',        variant: 'warning',   icon: AlertCircle },
  in_progress: { label: 'In Progress', variant: 'info',      icon: Clock },
  resolved:    { label: 'Resolved',    variant: 'success',   icon: CheckCircle2 },
  closed:      { label: 'Closed',      variant: 'secondary', icon: CheckCircle2 },
};

const PRIORITY_BADGE: Record<string, { label: string; class: string }> = {
  low:    { label: 'Low',    class: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  medium: { label: 'Medium', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  high:   { label: 'High',   class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  urgent: { label: 'Urgent', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const TYPE_LABEL: Record<string, string> = {
  general:      'General',
  product:      'Product Query',
  order:        'Order Issue',
  return:       'Return/Refund',
  custom_quote: 'Custom Quote',
};

// ─── Quote item row ───────────────────────────────────────────────────────────
interface QuoteItem { description: string; quantity: number; unitPrice: number; }

// ─── Page ─────────────────────────────────────────────────────────────────────
const VendorEnquiriesPage: React.FC = () => {
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [selected, setSelected]   = useState<Enquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending]     = useState(false);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [activeTab, setActiveTab] = useState('reply');

  const filtered = MOCK_ENQUIRIES.filter((e) => {
    const matchSearch = e.subject.toLowerCase().includes(search.toLowerCase()) ||
      e.ticketId.includes(search) ||
      (typeof e.user !== 'string' && e.user.name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 800)); // mock
    selected.replies.push({
      _id: Date.now().toString(), message: replyText, author: 'vendor',
      authorRole: 'vendor', createdAt: new Date().toISOString(),
    });
    setReplyText('');
    setSending(false);
  };

  const quoteTotal = quoteItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const updateQuoteItem = (idx: number, patch: Partial<QuoteItem>) =>
    setQuoteItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const user = (e: Enquiry) => typeof e.user === 'string' ? e.user : e.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Enquiries & Quotes</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Respond to customer queries and submit custom quotes.
        </p>
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map((s) => {
          const count = s === 'all' ? MOCK_ENQUIRIES.length : MOCK_ENQUIRIES.filter((e) => e.status === s).length;
          const cfg   = s !== 'all' ? STATUS_BADGE[s] : null;
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-all',
                statusFilter === s ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50',
              )}
            >
              {s === 'all' ? `All (${count})` : `${cfg?.label} (${count})`}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Ticket ID, subject, or customer…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Enquiry cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No enquiries found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((enquiry) => {
            const statusCfg   = STATUS_BADGE[enquiry.status]!;
            const priorityCfg = PRIORITY_BADGE[enquiry.priority]!;
            const u           = user(enquiry);
            const hasQuote    = enquiry.type === 'custom_quote';

            return (
              <Card
                key={enquiry._id}
                className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                onClick={() => { setSelected(enquiry); setActiveTab('reply'); setQuoteItems(enquiry.quoteItems?.map(i => ({...i})) ?? [{ description: '', quantity: 1, unitPrice: 0 }]); }}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  {/* Left: icon */}
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5',
                    hasQuote ? 'gradient-violet' : 'bg-muted',
                  )}>
                    {hasQuote
                      ? <IndianRupee className="h-5 w-5 text-white" />
                      : <MessageSquare className="h-5 w-5 text-muted-foreground" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{enquiry.ticketId}</span>
                      <span className="text-xs rounded-full bg-secondary px-2 py-0.5">{TYPE_LABEL[enquiry.type]}</span>
                      <span className={cn('text-[10px] rounded-full px-2 py-0.5 font-semibold', priorityCfg.class)}>
                        {priorityCfg.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mt-1 line-clamp-1">{enquiry.subject}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{enquiry.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-2.5 w-2.5 text-primary" />
                        </div>
                        <span className="text-xs">{typeof u === 'string' ? u : u.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {enquiry.replies.length} {enquiry.replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                      {enquiry.quoteTotal && (
                        <span className="text-xs font-semibold text-primary">
                          Quote: ₹{enquiry.quoteTotal.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: status + arrow */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={statusCfg.variant} className="gap-1 text-[10px]">
                      <statusCfg.icon className="h-2.5 w-2.5" />
                      {statusCfg.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(enquiry.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ── Enquiry Detail Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        {selected && (() => {
          const statusCfg = STATUS_BADGE[selected.status]!;
          const u = user(selected);

          return (
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-muted-foreground">{selected.ticketId}</span>
                  <span className="text-base">{selected.subject}</span>
                  <Badge variant={statusCfg.variant} className="gap-1 text-[10px]">
                    <statusCfg.icon className="h-2.5 w-2.5" />
                    {statusCfg.label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <DialogBody className="space-y-4">
                {/* Original message */}
                <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full gradient-blue flex items-center justify-center text-white text-[10px] font-bold">
                      {typeof u !== 'string' ? u.name.charAt(0) : '?'}
                    </div>
                    <p className="text-xs font-semibold">{typeof u !== 'string' ? u.name : u}</p>
                    <p className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(selected.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed">{selected.message}</p>
                </div>

                {/* Reply thread */}
                {selected.replies.length > 0 && (
                  <div className="space-y-2">
                    {selected.replies.map((reply) => (
                      <div
                        key={reply._id}
                        className={cn(
                          'rounded-xl p-4',
                          reply.authorRole === 'vendor'
                            ? 'bg-primary/10 border border-primary/20 ml-4'
                            : 'bg-muted/50',
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={cn(
                            'h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold',
                            reply.authorRole === 'vendor' ? 'gradient-violet' : 'gradient-blue',
                          )}>
                            {reply.authorRole === 'vendor' ? 'V' : 'C'}
                          </div>
                          <p className="text-xs font-semibold capitalize">{reply.authorRole}</p>
                          <p className="text-[10px] text-muted-foreground ml-auto">
                            {new Date(reply.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                        <p className="text-sm leading-relaxed">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Action tabs */}
                {selected.status !== 'closed' && (
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full">
                      <TabsTrigger value="reply" className="flex-1 gap-1.5">
                        <Send className="h-3.5 w-3.5" /> Reply
                      </TabsTrigger>
                      {selected.type === 'custom_quote' && (
                        <TabsTrigger value="quote" className="flex-1 gap-1.5">
                          <IndianRupee className="h-3.5 w-3.5" /> Quote Builder
                        </TabsTrigger>
                      )}
                    </TabsList>

                    {/* Reply tab */}
                    <TabsContent value="reply" className="space-y-3">
                      <Textarea
                        rows={4}
                        placeholder="Type your reply…"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        {selected.status === 'open' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { selected.status = 'resolved'; setSelected({ ...selected }); }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Mark Resolved
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={handleReply}
                          disabled={!replyText.trim() || sending}
                          className="gap-2"
                        >
                          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          Send Reply
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Quote builder tab */}
                    <TabsContent value="quote" className="space-y-4">
                      <div className="space-y-2">
                        {quoteItems.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                            <Input
                              placeholder="Item description"
                              value={item.description}
                              onChange={(e) => updateQuoteItem(idx, { description: e.target.value })}
                              className="text-sm"
                            />
                            <div className="w-16">
                              <Input
                                type="number"
                                min={1}
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={(e) => updateQuoteItem(idx, { quantity: Number(e.target.value) })}
                                className="text-sm text-center"
                              />
                            </div>
                            <div className="relative w-24">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                              <Input
                                type="number"
                                placeholder="Price"
                                value={item.unitPrice}
                                onChange={(e) => updateQuoteItem(idx, { unitPrice: Number(e.target.value) })}
                                className="text-sm pl-6"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setQuoteItems((p) => p.filter((_, i) => i !== idx))}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuoteItems((p) => [...p, { description: '', quantity: 1, unitPrice: 0 }])}
                        className="gap-2 w-full border-dashed"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Line Item
                      </Button>

                      {/* Quote total */}
                      <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
                        <span className="text-sm font-semibold">Quote Total</span>
                        <span className="text-lg font-bold font-display text-primary">
                          ₹{quoteTotal.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        className="w-full gap-2"
                        disabled={quoteTotal === 0}
                        onClick={() => {
                          selected.quoteItems = quoteItems;
                          selected.quoteTotal = quoteTotal;
                          setActiveTab('reply');
                          setReplyText(`Please find our custom quote attached:\nTotal: ₹${quoteTotal.toLocaleString('en-IN')}\n\nItems:\n${quoteItems.map((i) => `• ${i.description} × ${i.quantity} @ ₹${i.unitPrice}`).join('\n')}`);
                        }}
                      >
                        <IndianRupee className="h-3.5 w-3.5" />
                        Insert Quote into Reply
                      </Button>
                    </TabsContent>
                  </Tabs>
                )}
              </DialogBody>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          );
        })()}
      </Dialog>
    </div>
  );
};

export default VendorEnquiriesPage;
