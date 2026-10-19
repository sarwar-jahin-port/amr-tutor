import { cn } from '@/lib/cn';

/** Tutors without an uploaded profile photo get a deterministic initials avatar instead. */
const PALETTE = [
  { bg: 'bg-primary/10', text: 'text-primary' },
  { bg: 'bg-warm-accent/15', text: 'text-[#8a5a24]' },
  { bg: 'bg-information/10', text: 'text-information' },
];

function paletteFor(seed: string) {
  const sum = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length] ?? PALETTE[0]!;
}

export interface AvatarProps {
  name: string;
  /** A signed photo URL (e.g. TutorProfile.profilePhotoUrl). Falls back to initials when absent. */
  photoUrl?: string | null;
  className?: string;
}

export function Avatar({ name, photoUrl, className }: AvatarProps) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not worth Next's remote-image config for this
      <img
        src={photoUrl}
        alt=""
        className={cn('inline-block shrink-0 rounded-full object-cover', className)}
      />
    );
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const { bg, text } = paletteFor(name);

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', bg, text, className)}
      aria-hidden="true"
    >
      {initials || '?'}
    </span>
  );
}
