import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface StageStepperStep {
  id: number;
  label: string;
}

/** Clickable step indicator shared by every guided wizard (tutor onboarding, listing creation, ...). */
export function StageStepper({
  steps,
  current,
  furthestReached,
  onSelect,
}: {
  steps: StageStepperStep[];
  current: number;
  furthestReached: number;
  onSelect: (id: number) => void;
}) {
  return (
    <ol className="flex flex-wrap gap-2">
      {steps.map((step) => {
        const isCurrent = step.id === current;
        const isDone = step.id < furthestReached;
        const isReachable = step.id <= furthestReached;

        return (
          <li key={step.id}>
            <button
              type="button"
              disabled={!isReachable}
              onClick={() => onSelect(step.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-fast',
                isCurrent
                  ? 'border-primary bg-primary text-primary-foreground'
                  : isReachable
                    ? 'border-border bg-surface text-ink hover:border-primary'
                    : 'cursor-not-allowed border-border bg-canvas text-ink-secondary',
              )}
            >
              {isDone ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : (
                <span className="tabular-nums">{step.id}</span>
              )}
              {step.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
