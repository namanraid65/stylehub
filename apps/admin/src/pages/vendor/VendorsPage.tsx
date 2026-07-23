import React, { useState, useEffect } from 'react';
import {
  Store, Search, Filter, CheckCircle2, Clock, XCircle, AlertTriangle,
  ChevronRight, Loader2, Mail, Phone, MapPin, BadgePercent, ShieldAlert,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from '../../components/ui/dialog';
import { Separator } from '../../components/ui/separator';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import vendorApi, { VendorProfile } from '../../api/vendor.api';
import { cn } from '../../lib/utils';

const STATUS_CONFIG: Record<string, {
  label: string;
  variant: 'success' | 'warning' | 'info' | 'destructive' | 'secondary';
  icon: React.ElementType;
}> = {
  pending:   { label: 'Pending',   variant: 'warning',     icon: Clock },
  approved:  { label: 'Approved',  variant: 'success',     icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  variant: 'destructive', icon: XCircle },
  suspended: { label: 'Suspended', variant: 'destructive', icon: ShieldAlert },
};

const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [updating, setUpdating] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Add Vendor states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [newVendorPassword, setNewVendorPassword] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreDesc, setNewStoreDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName || !newVendorEmail || !newVendorPassword || !newStoreName) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    setIsAdding(true);
    setErrorMsg('');
    try {
      await vendorApi.createVendor({
        name: newVendorName,
        email: newVendorEmail,
        password: newVendorPassword,
        storeName: newStoreName,
        storeDescription: newStoreDesc,
        autoApprove: 'true',
      });
      await fetchVendors();
      setNewVendorName('');
      setNewVendorEmail('');
      setNewVendorPassword('');
      setNewStoreName('');
      setNewStoreDesc('');
      setShowAddDialog(false);
    } catch (err: any) {
      console.error('Failed to create vendor:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to create vendor. Email might be in use.');
    } finally {
      setIsAdding(false);
    }
  };

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getAllVendors();
      // Handle possible different response shapes
      const data = (res as any).data?.data || (res as any).data || [];
      setVendors(data);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleUpdateStatus = async (vendorId: string, newStatus: string, reason?: string) => {
    setUpdating(true);
    try {
      await vendorApi.updateVendorStatus(vendorId, newStatus, reason);
      await fetchVendors();
      setSelectedVendor(null);
      setShowRejectDialog(false);
      setRejectReason('');
    } catch (err) {
      console.error('Failed to update vendor status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!window.confirm("Are you sure you want to delete this vendor? This will permanently delete the vendor, their user account, and ALL of their products and enquiries. This action cannot be undone!")) {
      return;
    }
    setUpdating(true);
    try {
      await vendorApi.deleteVendor(vendorId);
      await fetchVendors();
      setSelectedVendor(null);
    } catch (err) {
      console.error('Failed to delete vendor:', err);
      alert('Failed to delete vendor.');
    } finally {
      setUpdating(false);
    }
  };

  const getVendorName = (v: VendorProfile) => {
    return v.storeName;
  };

  const filtered = vendors.filter((v) => {
    const matchSearch = v.storeName.toLowerCase().includes(search.toLowerCase()) ||
      v.storeSlug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Vendors</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage vendor registration requests and profiles</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary chips */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'rejected', 'suspended'].map((s) => {
              const count = s === 'all' ? vendors.length : vendors.filter((v) => v.status === s).length;
              const cfg = s !== 'all' ? STATUS_CONFIG[s] : null;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium border transition-all',
                    statusFilter === s
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50',
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
            <Input
              placeholder="Store name or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No vendors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((vendor) => {
                    const cfg = STATUS_CONFIG[vendor.status] || { label: vendor.status, variant: 'secondary', icon: Store };
                    const StatusIcon = cfg.icon;

                    return (
                      <TableRow key={vendor._id}>
                        <TableCell className="font-semibold text-sm">{vendor.storeName}</TableCell>
                        <TableCell className="font-mono text-xs">{vendor.storeSlug}</TableCell>
                        <TableCell className="text-sm">⭐ {vendor.storeRating || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{vendor.totalProducts ?? 0}</TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant} className="gap-1.5">
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedVendor(vendor)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* ── Vendor Detail Dialog ────────────────────────────────────────────────── */}
      <Dialog open={!!selectedVendor && !showRejectDialog} onOpenChange={() => setSelectedVendor(null)}>
        {selectedVendor && (() => {
          const cfg = STATUS_CONFIG[selectedVendor.status] || { label: selectedVendor.status, variant: 'secondary', icon: Store };
          return (
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-base font-bold">{selectedVendor.storeName}</span>
                  <Badge variant={cfg.variant} className="gap-1">
                    <cfg.icon className="h-3 w-3" />
                    {cfg.label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <DialogBody className="space-y-5">
                {/* Store Profile details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Store Slug</p>
                    <p className="text-sm font-mono">{selectedVendor.storeSlug}</p>
                  </div>
                  {selectedVendor.storeLocation && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Location</p>
                      <p className="text-sm flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {selectedVendor.storeLocation}</p>
                    </div>
                  )}
                </div>

                {selectedVendor.storeDescription && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Description</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{selectedVendor.storeDescription}</p>
                  </div>
                )}

                <Separator />

                {/* Contact Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {selectedVendor.businessEmail && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Business Email</p>
                      <p className="text-sm flex items-center gap-1.5"><Mail className="h-4 w-4 text-muted-foreground" /> {selectedVendor.businessEmail}</p>
                    </div>
                  )}
                  {selectedVendor.businessPhone && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Business Phone</p>
                      <p className="text-sm flex items-center gap-1.5"><Phone className="h-4 w-4 text-muted-foreground" /> {selectedVendor.businessPhone}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Rating & sales info */}
                <div className="grid gap-4 sm:grid-cols-3 text-center">
                  <div className="p-3 bg-muted/40 rounded-xl">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Rating</p>
                    <p className="text-lg font-bold">⭐ {selectedVendor.storeRating || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Products</p>
                    <p className="text-lg font-bold">{selectedVendor.totalProducts ?? 0}</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Sales</p>
                    <p className="text-lg font-bold">₹{(selectedVendor.totalSales ?? 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </DialogBody>

              <DialogFooter className="gap-2 sm:gap-0 flex justify-between items-center w-full">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteVendor(selectedVendor._id)}
                  disabled={updating}
                  className="gap-1.5"
                >
                  Delete Store
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedVendor(null)}>Close</Button>
                  {/* Approve button: visible if vendor is pending, rejected, or suspended */}
                  {(selectedVendor.status === 'pending' || selectedVendor.status === 'rejected' || selectedVendor.status === 'suspended') && (
                    <Button
                      onClick={() => handleUpdateStatus(selectedVendor._id, 'approved')}
                      disabled={updating}
                      className="gap-1.5"
                    >
                      {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve
                    </Button>
                  )}

                  {/* Reject button: visible if vendor is pending */}
                  {selectedVendor.status === 'pending' && (
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectDialog(true)}
                      disabled={updating}
                    >
                      Reject
                    </Button>
                  )}

                  {/* Suspend button: visible if vendor is approved */}
                  {selectedVendor.status === 'approved' && (
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateStatus(selectedVendor._id, 'suspended')}
                      disabled={updating}
                      className="gap-1.5"
                    >
                      {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                      Suspend
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          );
        })()}
      </Dialog>

      {/* ── Reject Reason Dialog ────────────────────────────────────────────────── */}
      <Dialog open={showRejectDialog} onOpenChange={() => setShowRejectDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Vendor Application</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rejectReason">Reason for Rejection</Label>
              <Textarea
                id="rejectReason"
                rows={3}
                placeholder="Specify the reason why this vendor application is being rejected…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedVendor && handleUpdateStatus(selectedVendor._id, 'rejected', rejectReason)}
              disabled={updating || !rejectReason.trim()}
              className="gap-1.5"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Vendor Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showAddDialog} onOpenChange={() => setShowAddDialog(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateVendor}>
            <DialogBody className="space-y-4">
              {errorMsg && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vendorName">Owner Name *</Label>
                  <Input
                    id="vendorName"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newVendorName}
                    onChange={(e) => setNewVendorName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="storeName">Store Name *</Label>
                  <Input
                    id="storeName"
                    required
                    placeholder="e.g. Royal Silks"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vendorEmail">Email Address *</Label>
                  <Input
                    id="vendorEmail"
                    type="email"
                    required
                    placeholder="e.g. rahul@royalsilks.in"
                    value={newVendorEmail}
                    onChange={(e) => setNewVendorEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendorPassword">Password *</Label>
                  <Input
                    id="vendorPassword"
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newVendorPassword}
                    onChange={(e) => setNewVendorPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="storeDesc">Store Description</Label>
                <Textarea
                  id="storeDesc"
                  rows={3}
                  placeholder="Tell us about the store's catalogue, specialties, and brand..."
                  value={newStoreDesc}
                  onChange={(e) => setNewStoreDesc(e.target.value)}
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={isAdding}
                className="gap-1.5"
              >
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
                Create Vendor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorsPage;
