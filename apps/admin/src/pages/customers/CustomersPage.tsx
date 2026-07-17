import React, { useState, useEffect } from 'react';
import {
  Users, Search, UserCheck, UserMinus, Loader2, DollarSign,
  ShoppingBag, Calendar, Mail, Phone, ShieldAlert,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '../../components/ui/dialog';
import customerApi, { Customer } from '../../api/customer.api';
import { cn } from '../../lib/utils';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getAllCustomers();
      const data = res.data?.data || (res as any).data || [];
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleStatus = async (customer: Customer) => {
    setStatusUpdating(customer._id);
    try {
      await customerApi.updateStatus(customer._id, !customer.isActive);
      setCustomers((prev) =>
        prev.map((c) =>
          c._id === customer._id ? { ...c, isActive: !c.isActive } : c
        )
      );
      if (selectedCustomer?._id === customer._id) {
        setSelectedCustomer((prev) => prev ? { ...prev, isActive: !prev.isActive } : null);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdating(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const totalSpentAll = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const activeCount = customers.filter((c) => c.isActive).length;
  const suspendedCount = customers.filter((c) => !c.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Customers</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage platform customer accounts and user status</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Customers</p>
              <h3 className="text-2xl font-bold font-display mt-0.5">{customers.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active</p>
              <h3 className="text-2xl font-bold font-display mt-0.5">{activeCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-500">
              <UserMinus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Suspended</p>
              <h3 className="text-2xl font-bold font-display mt-0.5">{suspendedCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Spent</p>
              <h3 className="text-2xl font-bold font-display mt-0.5">₹{totalSpentAll.toLocaleString('en-IN')}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by customer name or email..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="overflow-hidden border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Customer</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[180px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c._id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm font-mono border border-primary/20 shrink-0">
                          {c.avatar ? (
                            <img src={c.avatar} alt={c.name} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            getInitials(c.name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.orderCount || 0}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">
                      ₹{(c.totalSpent || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.isActive ? 'success' : 'destructive'} className="gap-1 px-2.5 py-0.5">
                        <span className={cn('h-1.5 w-1.5 rounded-full', c.isActive ? 'bg-green-500' : 'bg-rose-500')} />
                        {c.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 font-medium text-xs hover:bg-muted"
                          onClick={() => setSelectedCustomer(c)}
                        >
                          View Info
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 font-medium text-xs gap-1.5 min-w-[96px] justify-center",
                            c.isActive
                              ? "text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              : "text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          )}
                          disabled={statusUpdating === c._id}
                          onClick={() => handleToggleStatus(c)}
                        >
                          {statusUpdating === c._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : c.isActive ? (
                            <>
                              <UserMinus className="h-3 w-3" /> Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3" /> Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Customer Info Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-md">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm font-mono border border-primary/20 shrink-0">
                    {selectedCustomer.avatar ? (
                      <img src={selectedCustomer.avatar} alt={selectedCustomer.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      getInitials(selectedCustomer.name)
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="font-semibold text-base">{selectedCustomer.name}</p>
                    <p className="text-xs text-muted-foreground font-normal">Customer Details</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <DialogBody className="space-y-4">
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5 text-muted-foreground py-1 border-b border-border/40">
                    <Mail className="h-4 w-4 text-muted-foreground/80" />
                    <span className="text-[var(--charcoal)] font-medium truncate">{selectedCustomer.email}</span>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2.5 text-muted-foreground py-1 border-b border-border/40">
                      <Phone className="h-4 w-4 text-muted-foreground/80" />
                      <span className="text-[var(--charcoal)] font-medium">{selectedCustomer.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-muted-foreground py-1 border-b border-border/40">
                    <Calendar className="h-4 w-4 text-muted-foreground/80" />
                    <span className="text-[var(--charcoal)]">
                      Joined: <span className="font-medium">{new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-muted-foreground py-1">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground/80" />
                    <span>
                      Account Status:{' '}
                      <Badge variant={selectedCustomer.isActive ? 'success' : 'destructive'} className="ml-1 px-2 py-0.5">
                        {selectedCustomer.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div className="rounded-xl bg-muted/40 p-3 text-center border border-border/40">
                    <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Orders Placed</p>
                    <p className="text-lg font-bold font-display mt-0.5">{selectedCustomer.orderCount || 0}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3 text-center border border-border/40">
                    <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Total Spent</p>
                    <p className="text-lg font-bold font-display mt-0.5 text-emerald-600 dark:text-emerald-400">
                      ₹{(selectedCustomer.totalSpent || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4">
                  <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                    Close
                  </Button>
                  <Button
                    variant={selectedCustomer.isActive ? 'destructive' : 'default'}
                    size="sm"
                    className={cn(
                      "min-w-[110px]",
                      !selectedCustomer.isActive && "bg-emerald-600 hover:bg-emerald-700 text-white"
                    )}
                    disabled={statusUpdating === selectedCustomer._id}
                    onClick={() => handleToggleStatus(selectedCustomer)}
                  >
                    {statusUpdating === selectedCustomer._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : selectedCustomer.isActive ? (
                      'Suspend User'
                    ) : (
                      'Activate User'
                    )}
                  </Button>
                </div>
              </DialogBody>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage;
