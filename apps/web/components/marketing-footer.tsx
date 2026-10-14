'use client';

import { usePathname } from 'next/navigation';
import { SiteFooter } from '@/components/site-footer';

// Public, unauthenticated pages only — dashboards, messaging, applications,
// verification flows, onboarding, and admin stay footer-free.
const MARKETING_PATHS = ['/', '/how-it-works', '/landing-v2', '/tutors', '/tuition', '/login', '/register'];

function isMarketingPath(pathname: string) {
  return MARKETING_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Renders the global site footer only on public marketing/browse pages. */
export function MarketingFooter() {
  const pathname = usePathname();
  return isMarketingPath(pathname) ? <SiteFooter /> : null;
}
