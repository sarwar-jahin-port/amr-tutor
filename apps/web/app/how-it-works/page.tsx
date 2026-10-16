import type { Metadata } from 'next';
import { HowItWorksSection } from '@/components/landing-v2/how-it-works-section';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'How it works — AMR Tutor',
};

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <h1 className="sr-only">How it works</h1>
        <HowItWorksSection />
      </main>
    </>
  );
}
