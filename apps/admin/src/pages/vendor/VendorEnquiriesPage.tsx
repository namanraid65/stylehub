import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Search, Send, Clock, CheckCircle2,
  AlertCircle, ChevronRight, Plus, Loader2, User,
  IndianRupee, Trash2, RefreshCw, X,
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
import enquiryApi, { Enquiry, EnquiryStatus } from '../../api/enquiry.api';
import { cn } from '../../lib/utils';

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

interface QuoteItem { description: string; quantity: number; unitPrice: number; }

const VendorEnquiriesPage: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [selected, setSelected]   = useState<Enquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending]     = useState(false);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [activeTab, setActiveTab] = useState('reply');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await enquiryApi.myEnquiries();
      const list = res.data?.data || (res as any).data || [];
      setEnquiries(list);

      if (selected) {
        const updated = list.find((e: Enquiry) => e._id === selected._id);
        if (updated) setSelected(updated);
      }
    } catch (err) {
      console.error('Failed to fetch vendor enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleSendReply = async () => {
    if (!selected || !replyText.trim() || sending) return;
    setSending(true);
    try {
      await enquiryApi.reply(selected._id, replyText.trim());
      setReplyText('');
      await fetchEnquiries();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: EnquiryStatus) => {
    if (!selected) return;
    setUpdatingStatus(true);
    try {
      await enquiryApi.updateStatus(selected._id, newStatus);
      await fetchEnquiries();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddQuoteItem = () => {
    setQuoteItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveQuoteItem = (index: number) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuoteItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    setQuoteItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const calculateQuoteTotal = () => {
    return quoteItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  };

  const handleSendQuote = async () => {
    if (!selected || sending) return;
    const validItems = quoteItems.filter((i) => i.description.trim() && i.quantity > 0 && i.unitPrice >= 0);
    if (validItems.length === 0) return;

    setSending(true);
    try {
      await enquiryApi.submitQuote(selected._id, validItems);
      await fetchEnquiries();
    } catch (err) {
      console.error('Failed to send quote:', err);
    } finally {
      setSending(false);
    }
  };

  const filtered = enquiries.filter((e) => {
    const userName = typeof e.user === 'object' && e.user ? e.user.name : '';
    const matchSearch =
      e.subject.toLowerCase().includes(search.toLowerCase()) ||
      (e.ticketId && e.ticketId.toLowerCase().includes(search.toLowerCase())) ||
      userName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getUserName = (e: Enquiry) => {
    if (typeof e.user === 'object' && e.user) return e.user.name;
    return 'Customer';
  };

  const getUserEmail = (e: Enquiry) => {
    if (typeof e.user === 'object' && e.user) return e.user.email;
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Customer Enquiries</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage inquiries, support tickets, and custom quote requests for your store.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEnquiries} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ticket ID, subject, or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus(st)}
              className="capitalize whitespace-nowrap text-xs"
            >
              {st.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-semibold text-sm">No enquiries found</p>
            <p className="text-xs text-muted-foreground mt-0.5">Clear filters to view all store inquiries</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((e) => {
            const stCfg = STATUS_BADGE[e.status] ?? STATUS_BADGE['open']!;
            const prCfg = PRIORITY_BADGE[e.priority] ?? PRIORITY_BADGE['medium']!;
            const StIcon = stCfg.icon;

            return (
              <Card
                key={e._id}
                onClick={() => {
                  setSelected(e);
                  if (e.quoteItems && e.quoteItems.length > 0) {
                    setQuoteItems(e.quoteItems);
                  } else {
                    setQuoteItems([{ description: '', quantity: 1, unitPrice: 0 }]);
                  }
                }}
                className="hover:shadow-md transition-all cursor-pointer border hover:border-primary/50"
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0 mt-0.5">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-primary">{e.ticketId || e._id.slice(-6)}</span>
                        <Badge variant={stCfg.variant} className="gap-1 text-[10px] py-0 px-2">
                          <StIcon className="h-3 w-3" /> {stCfg.label}
                        </Badge>
                        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', prCfg.class)}>
                          {prCfg.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">{TYPE_LABEL[e.type] || e.type}</span>
                      </div>
                      <h3 className="font-semibold text-sm truncate">{e.subject}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{e.message}</p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{getUserName(e)}</span>
                        <span>• {new Date(e.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-primary">{selected.ticketId || selected._id.slice(-6)}</span>
                    <Badge variant={STATUS_BADGE[selected.status]?.variant || 'warning'}>
                      {STATUS_BADGE[selected.status]?.label || selected.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground uppercase">{TYPE_LABEL[selected.type] || selected.type}</span>
                  </div>
                  <DialogTitle className="text-lg">{selected.subject}</DialogTitle>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="text-xs font-medium text-muted-foreground">Status:</label>
                  <select
                    disabled={updatingStatus}
                    value={selected.status}
                    onChange={(e) => handleStatusChange(e.target.value as EnquiryStatus)}
                    className="text-xs border rounded-lg px-2 py-1 bg-background font-medium focus:outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </DialogHeader>

            <DialogBody className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer info */}
              <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 text-primary" /> {getUserName(selected)} ({getUserEmail(selected)})
                </div>
                <p className="text-muted-foreground leading-relaxed text-xs pt-1 border-t border-border/50">
                  {selected.message}
                </p>
              </div>

              {/* Existing replies */}
              {selected.replies && selected.replies.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Responses</h4>
                  {selected.replies.map((r, i) => (
                    <div
                      key={r._id || i}
                      className={cn(
                        'p-3.5 rounded-xl text-sm border',
                        r.authorRole === 'vendor' ? 'bg-primary/5 border-primary/20 ml-6' : 'bg-muted/30 mr-6'
                      )}
                    >
                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-1.5 font-medium">
                        <span className="capitalize">{r.authorRole}</span>
                        <span>{new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <p className="leading-relaxed text-xs">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Quote details if present */}
              {selected.quoteTotal !== undefined && selected.quoteTotal > 0 && (
                <div className="rounded-xl border p-4 bg-muted/20 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Submitted Custom Quote</span>
                    <span className="text-emerald-600 font-bold text-sm">₹{selected.quoteTotal.toLocaleString('en-IN')}</span>
                  </h4>
                  <div className="space-y-1 pt-1">
                    {(selected.quoteItems || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 border-b border-border/40 last:border-0">
                        <span>{item.description} ({item.quantity}×)</span>
                        <span className="font-mono">₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs for Reply vs Custom Quote */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="reply">Send Message</TabsTrigger>
                  <TabsTrigger value="quote">Submit Custom Quote</TabsTrigger>
                </TabsList>

                <TabsContent value="reply" className="space-y-3 pt-3">
                  <Textarea
                    placeholder="Type your response to the customer…"
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sending}
                    className="w-full gap-2"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Response
                  </Button>
                </TabsContent>

                <TabsContent value="quote" className="space-y-4 pt-3">
                  <div className="space-y-3">
                    {quoteItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          placeholder="Item description (e.g. 50x Custom Embroidered Kurtas)"
                          value={item.description}
                          onChange={(e) => handleUpdateQuoteItem(idx, 'description', e.target.value)}
                          className="flex-1 text-xs"
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuoteItem(idx, 'quantity', Number(e.target.value))}
                          className="w-20 text-xs"
                        />
                        <Input
                          type="number"
                          placeholder="Unit Price (₹)"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateQuoteItem(idx, 'unitPrice', Number(e.target.value))}
                          className="w-28 text-xs"
                        />
                        {quoteItems.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveQuoteItem(idx)} className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={handleAddQuoteItem} className="gap-1 text-xs">
                      <Plus className="h-3.5 w-3.5" /> Add Quote Item
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted font-semibold text-sm">
                    <span>Total Quote Amount:</span>
                    <span className="font-mono text-primary">₹{calculateQuoteTotal().toLocaleString('en-IN')}</span>
                  </div>

                  <Button
                    onClick={handleSendQuote}
                    disabled={calculateQuoteTotal() <= 0 || sending}
                    className="w-full gap-2"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
                    Submit Official Quote
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VendorEnquiriesPage;
