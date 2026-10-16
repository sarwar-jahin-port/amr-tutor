import { ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/cn';

export interface ImagePlaceholderProps {
  /** Meaningful alt text, used once a real photo is supplied. */
  alt: string;
  /** Local image path. Leave empty to render the placeholder state. */
  src?: string;
  className?: string;
  /** e.g. "4 / 3". Defaults to the brief's 1.3:1 landscape target. */
  aspectRatio?: string;
  objectPosition?: string;
  /** Dev-only label shown inside the placeholder; omit for a quieter block. */
  placeholderLabel?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Reserves the final photo's space with the same organic shape and aspect
 * ratio the layout expects, so swapping in `src` later never touches layout.
 */
export function ImagePlaceholder({
  alt,
  src,
  className,
  aspectRatio = '1.3 / 1',
  objectPosition = '50% 50%',
  placeholderLabel,
  sizes = '(min-width: 768px) 50vw, 100vw',
  priority,
}: ImagePlaceholderProps) {
  if (src) {
    return (
      <div className={cn('relative overflow-hidden', className)} style={{ aspectRatio }}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          style={{ objectPosition }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-mint',
        className,
      )}
      style={{ aspectRatio }}
      role="img"
      aria-label={alt}
    >
      <div className="flex flex-col items-center gap-2 text-primary/40">
        <ImageIcon className="size-8" aria-hidden="true" strokeWidth={1.5} />
        {placeholderLabel ? (
          <span className="text-xs font-medium text-primary/50">{placeholderLabel}</span>
        ) : null}
      </div>
    </div>
  );
}
