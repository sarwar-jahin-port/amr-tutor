/**
 * Centralized image asset map for the landing-v2 page. Every entry starts
 * empty so <ImagePlaceholder /> renders a polished placeholder until real
 * photography is dropped in — set a `src` here (and nowhere else) to swap it.
 */
export const LANDING_V2_IMAGES = {
  hero: {
    src: '/images/hero2.png',
    alt: 'A university tutor shaking hands with a guardian while the guardian’s son looks on',
  },
} as const;
