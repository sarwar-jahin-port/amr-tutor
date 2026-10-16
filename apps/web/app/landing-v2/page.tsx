import type { Metadata } from 'next';
import { HeroSection } from '@/components/landing-v2/hero-section';
import { ValuePropositionStrip } from '@/components/landing-v2/value-proposition-strip';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'TutorConnect — The No-Cut Tuition Platform',
  description:
    'Connect directly with guardians or tutors in Bangladesh. No agents, no commissions, no hidden fees.',
};

/**
 * Visual-direction exploration ("v2") of the marketing homepage, kept on its
 * own route so it can be compared against the live homepage before either
 * one is promoted to "/". See the design brief for the full spec this
 * section-by-section layout follows.
 */
export default function LandingV2Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <ValuePropositionStrip />
      </main>
    </>
  );
}
