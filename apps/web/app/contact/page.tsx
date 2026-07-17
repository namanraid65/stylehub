import type { Metadata } from 'next';
import { fetchCmsPage, getActiveBlocks } from '@/lib/cms-data';
import CMSRenderer from '@/components/cms/CMSRenderer';
import ContactFormClient from '@/components/cms/ContactFormClient';

export const metadata: Metadata = {
  title: 'Contact Us — StyleHub',
  description: 'Get in touch with the StyleHub customer support team.',
};

export default async function ContactPage() {
  const page = await fetchCmsPage('contact');
  const activeBlocks = page ? getActiveBlocks(page) : [];

  if (activeBlocks.length > 0) {
    return <CMSRenderer blocks={activeBlocks} />;
  }

  return <ContactFormClient />;
}
