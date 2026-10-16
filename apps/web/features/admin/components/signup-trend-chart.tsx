'use client';

import { useMemo, useState } from 'react';
import type { SignupTrendPoint } from '../types';

const WIDTH = 600;
const HEIGHT = 220;
const PAD_X = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

function formatShortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Signup trend — two series (tutors, guardians) as thin lines with a shared hover crosshair. */
export function SignupTrendChart({ data }: { data: SignupTrendPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxValue = useMemo(() => Math.max(1, ...data.flatMap((d) => [d.tutors, d.guardians])), [data]);

  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xFor = (i: number) => PAD_X + (data.length <= 1 ? 0 : (i / (data.length - 1)) * plotWidth);
  const yFor = (v: number) => PAD_TOP + plotHeight - (v / maxValue) * plotHeight;

  const tutorPoints = data.map((d, i) => [xFor(i), yFor(d.tutors)] as const);
  const guardianPoints = data.map((d, i) => [xFor(i), yFor(d.guardians)] as const);
  const toPath = (points: readonly (readonly [number, number])[]) => points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');

  const gridLines = [0, 0.5, 1].map((f) => PAD_TOP + plotHeight * f);
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div
      className="viz-root"
      style={
        {
          '--series-tutor': '#1baf7a',
          '--series-guardian': '#2a78d6',
        } as React.CSSProperties
      }
    >
      <div className="mb-3 flex items-center gap-4 text-xs text-ink-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: 'var(--series-tutor)' }} aria-hidden="true" />
          Tutors
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: 'var(--series-guardian)' }} aria-hidden="true" />
          Guardians
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Signups over time by role">
          {gridLines.map((y, i) => (
            <line key={i} x1={PAD_X} x2={WIDTH - PAD_X} y1={y} y2={y} stroke="var(--color-border)" strokeWidth={1} />
          ))}

          <path d={toPath(guardianPoints)} fill="none" stroke="var(--series-guardian)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={toPath(tutorPoints)} fill="none" stroke="var(--series-tutor)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {hoverIndex !== null && (
            <line x1={xFor(hoverIndex)} x2={xFor(hoverIndex)} y1={PAD_TOP} y2={PAD_TOP + plotHeight} stroke="var(--color-ink-secondary)" strokeWidth={1} strokeDasharray="3 3" />
          )}

          {guardianPoints.map(([x, y], i) => (
            <circle key={`g-${i}`} cx={x} cy={y} r={hoverIndex === i ? 5 : 3} fill="var(--series-guardian)" stroke="var(--color-surface)" strokeWidth={2} />
          ))}
          {tutorPoints.map(([x, y], i) => (
            <circle key={`t-${i}`} cx={x} cy={y} r={hoverIndex === i ? 5 : 3} fill="var(--series-tutor)" stroke="var(--color-surface)" strokeWidth={2} />
          ))}

          {data.map((_, i) => (
            <rect
              key={i}
              x={xFor(i) - plotWidth / Math.max(1, data.length) / 2}
              y={0}
              width={plotWidth / Math.max(1, data.length)}
              height={HEIGHT}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex((prev) => (prev === i ? null : prev))}
            />
          ))}
        </svg>

        {hovered && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute top-0 flex -translate-x-1/2 flex-col gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-elevated"
            style={{ left: `${(xFor(hoverIndex) / WIDTH) * 100}%` }}
          >
            <span className="font-medium text-ink">{formatShortDate(hovered.date)}</span>
            <span className="flex items-center gap-1.5 text-ink-secondary">
              <span className="inline-block size-2 rounded-full" style={{ backgroundColor: 'var(--series-tutor)' }} />
              {hovered.tutors} tutor{hovered.tutors === 1 ? '' : 's'}
            </span>
            <span className="flex items-center gap-1.5 text-ink-secondary">
              <span className="inline-block size-2 rounded-full" style={{ backgroundColor: 'var(--series-guardian)' }} />
              {hovered.guardians} guardian{hovered.guardians === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      <div className="mt-1 flex justify-between text-[11px] text-ink-secondary">
        <span>{data[0] ? formatShortDate(data[0].date) : ''}</span>
        <span>{data[data.length - 1] ? formatShortDate(data[data.length - 1]!.date) : ''}</span>
      </div>
    </div>
  );
}
