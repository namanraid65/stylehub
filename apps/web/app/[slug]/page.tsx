import type { Metadata } from 'next';
import { fetchCmsPage, getActiveBlocks } from '@/lib/cms-data';
import { NotFoundState } from '@/components/ui/states';
import CMSRenderer from '@/components/cms/CMSRenderer';

const PAGE_META: Record<string, { title: string; description: string }> = {
  'returns':          { title: 'Returns & Refunds Policy',  description: 'StyleHub 15-day hassle-free returns and refund policy.' },
  'privacy-policy':   { title: 'Privacy Policy',            description: 'How StyleHub collects, uses and protects your personal data.' },
  'terms-of-service': { title: 'Terms of Service',          description: 'Terms and conditions for using the StyleHub platform.' },
  'shipping-policy':  { title: 'Shipping Policy',           description: 'Delivery timelines, charges, and shipping partners for StyleHub orders.' },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = PAGE_META[slug];
  return {
    title: meta?.title ?? 'Policy — StyleHub',
    description: meta?.description ?? 'StyleHub policy page.',
  };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchCmsPage(slug);

  if (!page) {
    return <NotFoundState entity="page" />;
  }

  const activeBlocks = getActiveBlocks(page);

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <p className="text-xs font-body tracking-widest text-[var(--muted)] uppercase mb-2">Legal</p>
          <h1 className="font-display text-3xl font-semibold text-[var(--charcoal)]">{page.title}</h1>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto py-8">
        {activeBlocks.length > 0 ? (
          <CMSRenderer blocks={activeBlocks} />
        ) : (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[var(--border)] p-8 shadow-sm">
            <p className="font-body text-sm text-[var(--muted)] text-center">No content has been published for this page yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

