"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
import { Star, ThumbsUp, Image as ImageIcon, ChevronDown, Loader2, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Review } from "@/lib/mock-data";

// ─── Write Review Modal ───────────────────────────────────────────────────────
const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  title:  z.string().min(3, "Title required"),
  body:   z.string().min(10, "Review must be at least 10 characters"),
});
type ReviewForm = z.infer<typeof reviewSchema>;

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`h-7 w-7 ${(hover || value) >= s ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--border)]"}`} />
        </button>
      ))}
    </div>
  );
}

const LABEL = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

function WriteReviewModal({ onClose, onSubmit: onDone }: { onClose: () => void; onSubmit: (r: ReviewForm) => void }) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0 },
  });
  const rating = watch("rating");

  const onSubmit = async (data: ReviewForm) => {
    await new Promise((r) => setTimeout(r, 800));
    onDone(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h3 className="font-display text-xl font-medium mb-4 text-[var(--charcoal)]">Write a Review</h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <p className="text-xs font-body font-semibold uppercase tracking-wider text-[var(--charcoal)] mb-2">Overall Rating *</p>
            <StarPicker value={rating} onChange={(v) => setValue("rating", v)} />
            {rating > 0 && <p className="text-sm font-body text-[var(--muted)] mt-1">{LABEL[rating]}</p>}
            {errors.rating && <p className="text-xs text-red-500">{errors.rating.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-body font-medium mb-1">Review Title *</label>
            <input {...register("title")} placeholder="Sum it up in a line…" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm font-body focus:outline-none focus:border-[var(--rose)]" />
            {errors.title && <p className="text-xs text-red-500 mt-0.5">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-body font-medium mb-1">Your Review *</label>
            <textarea {...register("body")} rows={4} placeholder="Tell others what you liked or didn't like…" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm font-body focus:outline-none focus:border-[var(--rose)] resize-none" />
            {errors.body && <p className="text-xs text-red-500 mt-0.5">{errors.body.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-body font-medium text-[var(--charcoal-mid)] hover:bg-[var(--cream)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-[var(--charcoal)] text-white text-sm font-body font-semibold hover:bg-[var(--rose)] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Rating Bar ───────────────────────────────────────────────────────────────
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 group">
      <span className="text-xs font-body text-[var(--charcoal-mid)] w-3 shrink-0">{star}</span>
      <Star className="h-3 w-3 fill-[var(--gold)] text-[var(--gold)] shrink-0" />
      <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
        <div className="h-full rounded-full bg-[var(--gold)] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-body text-[var(--muted)] w-5 text-right shrink-0">{count}</span>
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  const [helpful, setHelpful] = useState(review.helpful);
  const [voted,   setVoted]   = useState(false);

  const handleHelpful = () => {
    if (voted) { setHelpful((v) => v - 1); }
    else       { setHelpful((v) => v + 1); }
    setVoted(!voted);
  };

  return (
    <div className="py-6 border-b border-[var(--border)] last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--rose)]/20 to-[var(--rose)]/40 flex items-center justify-center font-display font-semibold text-[var(--rose)] text-sm shrink-0">
            {review.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-body font-semibold text-[var(--charcoal)]">{review.author}</p>
              {review.verified && (
                <span className="text-[10px] font-body font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-xs font-body text-[var(--muted)]">{review.date}</p>
          </div>
        </div>
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map((s) => (
            <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(review.rating) ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--border)]"}`} />
          ))}
        </div>
      </div>

      <h4 className="font-body font-semibold text-sm text-[var(--charcoal)] mt-3">{review.title}</h4>
      <p className="text-sm font-body text-[var(--charcoal-mid)] mt-1 leading-relaxed">{review.body}</p>

      <button
        onClick={handleHelpful}
        className={`flex items-center gap-1.5 mt-3 text-xs font-body transition-colors ${
          voted ? "text-[var(--rose)]" : "text-[var(--muted)] hover:text-[var(--charcoal)]"
        }`}
      >
        <ThumbsUp className={`h-3.5 w-3.5 ${voted ? "fill-current" : ""}`} />
        Helpful ({helpful})
      </button>
    </div>
  );
}

// ─── Main ReviewsSection ──────────────────────────────────────────────────────
interface Props {
  reviews:     Review[];
  rating:      number;
  reviewCount: number;
  productId:   string;
  vendorId:    string;
}

const SORT_OPTIONS = [
  { value: "recent",   label: "Most Recent" },
  { value: "helpful",  label: "Most Helpful" },
  { value: "highest",  label: "Highest Rated" },
  { value: "lowest",   label: "Lowest Rated" },
];

export default function ReviewsSection({ reviews, rating, reviewCount, productId, vendorId }: Props) {
  const [sort,       setSort]       = useState("recent");
  const [showModal,  setShowModal]  = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [visibleN,   setVisibleN]   = useState(4);
  const [liveReviews, setLiveReviews] = useState<Review[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    let active = true;
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API}/reviews?productId=${productId}&limit=50`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.reviews && active) {
          const mapped: Review[] = json.reviews.map((r: any) => ({
            id: r._id,
            rating: r.rating,
            title: r.title,
            body: r.body,
            author: r.customer?.name || "Customer",
            avatar: r.customer?.name ? r.customer.name.charAt(0).toUpperCase() : "C",
            verified: r.isVerified ?? false,
            date: new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            helpful: r.helpfulVotes ?? 0,
          }));
          setLiveReviews(mapped);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchReviews();
    return () => { active = false; };
  }, [productId]);

  const reviewsToDisplay = liveReviews.length > 0 ? liveReviews : reviews;

  const ratingBreakdown = [5,4,3,2,1].map((star) => ({
    star,
    count: reviewsToDisplay.filter((r) => Math.round(r.rating) === star).length,
  }));

  const sortedReviews = [...reviewsToDisplay].sort((a, b) => {
    if (sort === "helpful") return b.helpful - a.helpful;
    if (sort === "highest") return b.rating  - a.rating;
    if (sort === "lowest")  return a.rating  - b.rating;
    return 0; // default: recent (already sorted from server)
  }).slice(0, visibleN);

  const handleReviewSubmit = async (data: ReviewForm) => {
    try {
      // Find orderId from local storage orders if possible
      let orderId = "60c72b2f9b1d8b2d1c888888"; // default fallback ObjectId
      if (typeof window !== "undefined") {
        const storedOrders = localStorage.getItem("stylehub-placed-orders");
        if (storedOrders) {
          try {
            const orders = JSON.parse(storedOrders);
            // Look for an order containing this product
            const matchingOrder = orders.find((o: any) => 
              o.items?.some((item: any) => item.productId === productId)
            );
            if (matchingOrder) {
              orderId = matchingOrder.orderId;
            } else if (orders.length > 0) {
              orderId = orders[0].orderId || orders[0].id;
            }
          } catch (e) {
            console.error("Failed to parse stored orders:", e);
          }
        }
      }

      // Write to API
      const res = await fetch(`${API}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "60c72b2f9b1d8b2d1c999999", // default customer ID
        },
        body: JSON.stringify({
          productId,
          vendorId,
          orderId,
          rating: data.rating,
          title: data.title,
          body: data.body,
        }),
      });

      const json = await res.json();
      if (!res.ok && res.status !== 409) {
        throw new Error(json.message || "Failed to submit review.");
      }

      setShowModal(false);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || "Failed to submit review.");
    }
  };

  return (
    <div>
      {showModal && (
        <WriteReviewModal
          onClose={() => setShowModal(false)}
          onSubmit={handleReviewSubmit}
        />
      )}

      {submitted && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <p className="text-sm font-body text-emerald-700">
            Thank you! Your review has been submitted for approval.
          </p>
        </div>
      )}

      {/* Summary header */}
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 mb-8">
        {/* Big number */}
        <div className="text-center shrink-0">
          <p className="font-display text-5xl font-semibold text-[var(--charcoal)]">{rating.toFixed(1)}</p>
          <div className="flex gap-0.5 justify-center my-2">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} className={`h-4 w-4 ${s <= Math.round(rating) ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--border)]"}`} />
            ))}
          </div>
          <p className="text-xs font-body text-[var(--muted)]">{reviewCount} reviews</p>
        </div>

        {/* Breakdown bars */}
        <div className="flex-1 space-y-1.5 justify-center flex flex-col">
          {ratingBreakdown.map((rb) => (
            <RatingBar key={rb.star} star={rb.star} count={rb.count} total={reviewCount} />
          ))}
        </div>

        {/* Write review CTA */}
        <div className="shrink-0 flex items-center">
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 rounded-xl border-2 border-[var(--charcoal)] text-sm font-body font-semibold text-[var(--charcoal)] hover:bg-[var(--charcoal)] hover:text-white transition-colors whitespace-nowrap"
          >
            Write a Review
          </button>
        </div>
      </div>

      {/* Sort bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-body text-[var(--charcoal-mid)]">{reviewCount} reviews</p>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-xs font-body border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:border-[var(--rose)] text-[var(--charcoal)]"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)] pointer-events-none" />
        </div>
      </div>

      {/* Review list */}
      {sortedReviews.length === 0 ? (
        <p className="py-8 text-center text-sm font-body text-[var(--muted)]">
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div>
          {sortedReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          {visibleN < reviewsToDisplay.length && (
            <button
              onClick={() => setVisibleN((n) => n + 4)}
              className="w-full mt-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body text-[var(--charcoal-mid)] hover:border-[var(--rose)] hover:text-[var(--rose)] transition-colors"
            >
              Load more reviews
            </button>
          )}
        </div>
      )}
    </div>
  );
}
