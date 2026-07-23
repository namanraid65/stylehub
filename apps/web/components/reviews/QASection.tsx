"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThumbsUp, ChevronDown, ChevronUp, Loader2, CheckCircle2, HelpCircle, MessageSquare } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface QAItem {
  id:           string;
  question:     string;
  askedByName:  string;
  createdAt:    string;
  answer?:      string;
  answeredBy?:  string;
  answeredAt?:  string;
  helpfulCount: number;
}

// ─── Mock data (replace with fetch from /api/qa?productId=) ──────────────────
const MOCK_QA: QAItem[] = [
  {
    id: "qa-1",
    question: "Is this available in plus sizes?",
    askedByName: "Riya M.", createdAt: "8 Jul 2026",
    answer: "Yes! This kurta is available in sizes XS to 3XL. Please refer to our size guide for exact measurements.",
    answeredBy: "DesiCouture Store", answeredAt: "9 Jul 2026",
    helpfulCount: 12,
  },
  {
    id: "qa-2",
    question: "Can I get this in a custom colour?",
    askedByName: "Ananya K.", createdAt: "5 Jul 2026",
    answer: "We do offer custom colour requests for bulk orders (10+ pieces). Please use the enquiry form and select 'Custom Request'.",
    answeredBy: "DesiCouture Store", answeredAt: "6 Jul 2026",
    helpfulCount: 7,
  },
  {
    id: "qa-3",
    question: "How long does delivery take?",
    askedByName: "Priya S.", createdAt: "1 Jul 2026",
    helpfulCount: 3,
  },
];

// ─── Ask a Question form ──────────────────────────────────────────────────────
const questionSchema = z.object({
  askedByName:  z.string().min(2, "Name required"),
  askedByEmail: z.string().email("Valid email required"),
  question:     z.string().min(5, "Question too short").max(300),
});
type QuestionForm = z.infer<typeof questionSchema>;

function AskQuestionForm({ productId, vendorId, onDone }: { productId: string; vendorId: string; onDone: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
  });

  const onSubmit = async (data: QuestionForm) => {
    try {
      const res = await fetch(`${API}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          vendorId,
          question: data.question,
          askedByName: data.askedByName,
          askedByEmail: data.askedByEmail,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit question.');
      }
      onDone();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      alert(errorObj.message || 'Failed to post question.');
    }
  };

  const inp = (err?: { message?: string }) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm font-body focus:outline-none focus:border-[var(--rose)] transition-colors ${
      err ? "border-red-400" : "border-[var(--border)]"
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-body font-medium mb-1">Your Name *</label>
          <input {...register("askedByName")} placeholder="Priya S." className={inp(errors.askedByName)} />
          {errors.askedByName && <p className="text-xs text-red-500 mt-0.5">{errors.askedByName.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-body font-medium mb-1">Email *</label>
          <input {...register("askedByEmail")} type="email" placeholder="you@email.com" className={inp(errors.askedByEmail)} />
          {errors.askedByEmail && <p className="text-xs text-red-500 mt-0.5">{errors.askedByEmail.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-xs font-body font-medium mb-1">Your Question *</label>
        <textarea {...register("question")} rows={3} placeholder="Ask about sizing, material, availability…" className={inp(errors.question) + " resize-none"} />
        {errors.question && <p className="text-xs text-red-500 mt-0.5">{errors.question.message}</p>}
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--charcoal)] text-white text-sm font-body font-semibold hover:bg-[var(--rose)] disabled:opacity-60 transition-colors"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
          Post Question
        </button>
      </div>
    </form>
  );
}

// ─── Single Q&A card ──────────────────────────────────────────────────────────
function QACard({ item }: { item: QAItem }) {
  const [expanded, setExpanded] = useState(!!item.answer);
  const [helpful,  setHelpful]  = useState(item.helpfulCount);
  const [voted,    setVoted]    = useState(false);

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Question */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-3 px-4 py-4 text-left hover:bg-[var(--cream)] transition-colors"
      >
        <div className="flex items-start gap-3">
          <HelpCircle className="h-4 w-4 text-[var(--rose)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-body font-medium text-[var(--charcoal)]">{item.question}</p>
            <p className="text-xs font-body text-[var(--muted)] mt-0.5">
              Asked by {item.askedByName} · {item.createdAt}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          {item.answer
            ? (expanded ? <ChevronUp className="h-4 w-4 text-[var(--muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--muted)]" />)
            : <span className="text-[10px] font-body px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Awaiting answer</span>
          }
        </div>
      </button>

      {/* Answer */}
      {expanded && item.answer && (
        <div className="border-t border-[var(--border)] px-4 py-4 bg-[var(--cream)]/50">
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-full bg-[var(--charcoal)] flex items-center justify-center shrink-0">
              <MessageSquare className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-body font-semibold text-[var(--charcoal)] mb-1">
                {item.answeredBy} <span className="text-[var(--muted)] font-normal">· {item.answeredAt}</span>
              </p>
              <p className="text-sm font-body text-[var(--charcoal-mid)] leading-relaxed">{item.answer}</p>
              <button
                onClick={() => { if (voted) setHelpful((h) => h - 1); else setHelpful((h) => h + 1); setVoted(!voted); }}
                className={`flex items-center gap-1.5 mt-3 text-xs font-body transition-colors ${voted ? "text-[var(--rose)]" : "text-[var(--muted)] hover:text-[var(--charcoal)]"}`}
              >
                <ThumbsUp className={`h-3.5 w-3.5 ${voted ? "fill-current" : ""}`} />
                Helpful ({helpful})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Q&A Section ─────────────────────────────────────────────────────────
interface Props {
  productId: string;
  vendorId:  string;
}

export default function QASection({ productId, vendorId }: Props) {
  const [showForm,    setShowForm]    = useState(false);
  const [submitted,  setSubmitted]   = useState(false);
  const [filterMode, setFilterMode]  = useState<"all" | "answered" | "pending">("all");
  const [qaItems,    setQaItems]     = useState<QAItem[]>([]);
  const [_loading,   setLoading]     = useState(true);

  useEffect(() => {
    let active = true;
    const fetchQA = async () => {
      try {
        const res = await fetch(`${API}/qa?productId=${productId}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.items && active) {
          const mapped: QAItem[] = json.items.map((item: Record<string, unknown>) => ({
            id: String(item._id),
            question: String(item.question),
            askedByName: String(item.askedByName),
            createdAt: new Date(String(item.createdAt)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            answer: item.answer ? String(item.answer) : undefined,
            answeredBy: typeof item.answeredBy === 'object' && item.answeredBy !== null ? String((item.answeredBy as Record<string, unknown>).name || 'Vendor') : String(item.answeredBy || 'Vendor'),
            answeredAt: item.answeredAt ? new Date(String(item.answeredAt)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : undefined,
            helpfulCount: Number(item.helpfulCount || 0),
          }));
          setQaItems(mapped);
        }
      } catch (err) {
        console.error('Failed to load QA:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchQA();
    return () => { active = false; };
  }, [productId]);

  const itemsToDisplay = qaItems.length > 0 ? qaItems : MOCK_QA;

  const filtered = itemsToDisplay.filter((q) => {
    if (filterMode === "answered") return !!q.answer;
    if (filterMode === "pending")  return !q.answer;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-body font-semibold text-[var(--charcoal)]">{itemsToDisplay.length} Questions &amp; Answers</h3>
          <p className="text-xs font-body text-[var(--muted)] mt-0.5">Real questions answered by the vendor</p>
        </div>
        <div className="flex items-center gap-2">
          {(["all","answered","pending"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMode(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-colors ${
                filterMode === m ? "bg-[var(--charcoal)] text-white" : "border border-[var(--border)] text-[var(--charcoal-mid)] hover:border-[var(--rose)]"
              }`}
            >
              {m === "all" ? "All" : m === "answered" ? "Answered" : "Pending"}
            </button>
          ))}
        </div>
      </div>

      {/* Q&A list */}
      <div className="space-y-3 mb-6">
        {filtered.map((item) => <QACard key={item.id} item={item} />)}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm font-body text-[var(--muted)]">No questions in this category.</p>
        )}
      </div>

      {/* Ask a question */}
      {submitted ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <p className="text-sm font-body text-emerald-700">Question submitted! The vendor will answer soon.</p>
        </div>
      ) : showForm ? (
        <div className="border border-[var(--border)] rounded-xl p-4">
          <p className="text-sm font-body font-semibold text-[var(--charcoal)] mb-4">Ask a Question</p>
          <AskQuestionForm productId={productId} vendorId={vendorId} onDone={() => { setShowForm(false); setSubmitted(true); }} />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--border)] text-sm font-body font-medium text-[var(--charcoal)] hover:border-[var(--rose)] hover:text-[var(--rose)] transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          Ask a Question
        </button>
      )}
    </div>
  );
}
