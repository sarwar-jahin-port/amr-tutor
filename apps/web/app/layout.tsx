import type { Metadata } from 'next';
import { Caveat, Inter, Noto_Sans_Bengali } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';
import { BottomNav } from '@/components/bottom-nav';
import { MarketingFooter } from '@/components/marketing-footer';

// Bangla is architected for from day one (decision record 0001 §1) even though
// launch copy is English-only, so the Bengali font loads as a ready fallback
// for the shared --font-sans stack rather than being added later.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-noto-sans-bengali',
  display: 'swap',
});

// Handwritten accent used for short decorative annotations (e.g. the footer's
// mission statement) — never for body copy.
const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-handwritten',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AMR Tutor — Free Home Tuition Marketplace',
  description: 'Connecting Bangladeshi parents and tutors directly, free of charge.',
  icons: {
    icon: '/images/logo.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansBengali.variable} ${caveat.variable}`}>
      <body className="flex min-h-screen flex-col bg-canvas text-ink antialiased pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <Providers>
          <div className="flex flex-1 flex-col">{children}</div>
          <MarketingFooter />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
