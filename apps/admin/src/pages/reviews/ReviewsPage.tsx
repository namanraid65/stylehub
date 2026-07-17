import React, { useState, useEffect } from 'react';
import {
  Star, Search, CheckCircle2, XCircle, Trash2, Loader2, RefreshCw, MessageSquare, AlertTriangle, Clock,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import reviewApi, { Review } from '../../api/review.api';
import { cn } from '../../lib/utils';

const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'approved'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Query parameters: approved: undefined (all), false (pending), true (approved)
      const params: { approved?: boolean; page?: number; limit?: number } = {};
      if (filterType !== 'all') {
        params.approved = filterType === 'approved';
      }
      const res = await reviewApi.listAll(params);
      const data = res.data?.reviews || (res as any).data || [];
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filterType]);

  const handleApprove = async (id: string, approved: boolean) => {
    setUpdating(id);
    try {
      await reviewApi.approve(id, approved);
      await fetchReviews();
    } catch (err) {
      console.error('Failed to update review approval status:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    setUpdating(id);
    try {
      await reviewApi.delete(id);
      await fetchReviews();
    } catch (err) {
      console.error('Failed to delete review:', err);
    } finally {
      setUpdating(null);
    }
  };

  const getProductName = (r: Review) => {
    if (!r.product) return 'Unknown Product';
    return typeof r.product === 'string' ? r.product : r.product.name;
  };

  const getCustomerName = (r: Review) => {
    if (!r.customer) return 'Guest Customer';
    return typeof r.customer === 'string' ? r.customer : r.customer.name;
  };

  const getCustomerEmail = (r: Review) => {
    if (!r.customer || typeof r.customer === 'string') return '';
    return r.customer.email;
  };

  const filtered = reviews.filter((r) => {
    const name = getCustomerName(r).toLowerCase();
    const email = getCustomerEmail(r).toLowerCase();
    const product = getProductName(r).toLowerCase();
    const title = r.title.toLowerCase();
    const body = r.body.toLowerCase();
    const query = search.toLowerCase();

    return name.includes(query) || email.includes(query) || product.includes(query) || title.includes(query) || body.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Reviews</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Moderate customer product reviews across the platform</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchReviews} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'All Reviews' },
          { id: 'pending', label: 'Pending Approval' },
          { id: 'approved', label: 'Approved' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterType(t.id as any)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium border transition-all',
              filterType === t.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by product, customer, or content…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="max-w-[200px]">Review</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No reviews found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((review) => (
                  <TableRow key={review._id}>
                    <TableCell className="font-semibold text-sm">
                      {getProductName(review)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{getCustomerName(review)}</p>
                      <p className="text-xs text-muted-foreground">{getCustomerEmail(review)}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5 text-amber-500 font-bold text-sm">
                        <Star className="h-4 w-4 fill-amber-500 shrink-0" />
                        {review.rating}/5
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px] space-y-1 py-3">
                      <p className="text-sm font-semibold truncate">{review.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed" title={review.body}>
                        {review.body}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={review.isApproved ? 'success' : 'warning'} className="gap-1">
                        {review.isApproved ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Approved
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" /> Pending
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {updating === review._id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            {review.isApproved ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-warning"
                                onClick={() => handleApprove(review._id, false)}
                                title="Disapprove/Hold"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-success"
                                onClick={() => handleApprove(review._id, true)}
                                title="Approve"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(review._id)}
                              title="Delete permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default ReviewsPage;
