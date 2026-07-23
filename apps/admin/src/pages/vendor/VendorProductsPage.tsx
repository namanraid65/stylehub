import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, Pencil, Trash2, Package, TrendingUp, Archive, Loader2, RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import productApi, { Product } from '../../api/product.api';
import { cn } from '../../lib/utils';

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'secondary' | 'destructive' }> = {
  active:   { label: 'Active',   variant: 'success' },
  draft:    { label: 'Draft',    variant: 'warning' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  archived: { label: 'Archived', variant: 'destructive' },
};

import BulkProductCsvModal from '../../components/products/BulkProductCsvModal';

const VendorProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]  = useState('');
  const [status, setStatus]  = useState('all');
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.myProducts({ limit: 100 });
      const data = res.data?.data || (res as any).data || [];
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch vendor products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleArchive = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this product?')) return;
    try {
      await productApi.archive(id);
      fetchProducts();
    } catch (err) {
      console.error('Failed to archive product:', err);
    }
  };

  const getCategoryName = (p: Product) => {
    if (!p.category) return 'Uncategorized';
    return typeof p.category === 'string' ? p.category : p.category.name;
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === 'all' || p.status === status;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:   products.length,
    active:  products.filter((p) => p.status === 'active').length,
    draft:   products.filter((p) => p.status === 'draft').length,
    revenue: products.reduce((s, p) => s + p.basePrice * (p.soldCount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">My Products</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your product catalogue</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchProducts} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
          <Button variant="outline" onClick={() => setCsvModalOpen(true)} className="gap-2">
            Import CSV
          </Button>
          <Button onClick={() => navigate('/vendor/products/new')} className="gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <BulkProductCsvModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSuccess={fetchProducts}
      />


      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Products', value: stats.total, icon: Package, color: 'text-primary' },
              { label: 'Active',         value: stats.active, icon: TrendingUp, color: 'text-green-500' },
              { label: 'Drafts',         value: stats.draft, icon: Archive, color: 'text-amber-500' },
              { label: 'Revenue',        value: `₹${(stats.revenue / 1000).toFixed(1)}k`, icon: TrendingUp, color: 'text-violet-500' },
            ].map((s) => (
              <Card key={s.label} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('rounded-lg p-2 bg-muted', s.color)}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold font-display">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by name or SKU…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product) => {
                    const cfg = STATUS_MAP[product.status] || { label: product.status, variant: 'secondary' };

                    return (
                      <TableRow key={product._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-muted shrink-0 flex items-center justify-center overflow-hidden border border-border/50">
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate max-w-[200px]" title={product.name}>
                                {product.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">{product._id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{getCategoryName(product)}</TableCell>
                        <TableCell className="text-sm font-semibold">₹{product.basePrice.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-sm font-medium">{product.totalStock ?? 0}</TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                              onClick={() => navigate(`/vendor/products/${product._id}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleArchive(product._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
    </div>
  );
};

export default VendorProductsPage;
