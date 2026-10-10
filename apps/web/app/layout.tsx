import type { Metadata } from 'next';
import { Inter, Noto_Sans_Bengali } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';

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

export const metadata: Metadata = {
  title: 'AMR Tutor — Free Home Tuition Marketplace',
  description: 'Connecting Bangladeshi parents and tutors directly, free of charge.',
  icons: {
    icon: '/images/logo.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansBengali.variable}`}>
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
