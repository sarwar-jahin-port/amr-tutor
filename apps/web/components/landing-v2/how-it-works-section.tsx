import { ClipboardList, MessageCircle, Search, UserPlus } from 'lucide-react';
import type { ComponentType } from 'react';
import { Container } from '@/components/ui/container';

interface ProcessStep {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false'; strokeWidth?: number }>;
  iconBg: string;
  title: string;
  description: string;
}

const STEPS: ProcessStep[] = [
  {
    icon: UserPlus,
    iconBg: 'bg-mint',
    title: 'Create Your Account',
    description: 'Sign up as a tutor or guardian in minutes.',
  },
  {
    icon: ClipboardList,
    iconBg: 'bg-butter',
    title: 'Build Your Profile / Post Requirement',
    description: 'Share your details or tuition needs with clear information.',
  },
  {
    icon: Search,
    iconBg: 'bg-aqua',
    title: 'Search, Apply or Review',
    description: 'Find the right match, compare profiles, and apply or review applications.',
  },
  {
    icon: MessageCircle,
    iconBg: 'bg-coral',
    title: 'Connect Directly',
    description: 'Start a conversation and share contact details — your terms, your decision.',
  },
];

export function HowItWorksSection() {
  return (
    <Container className="flex flex-col items-center gap-3 py-20 text-center">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">
        — Simple steps. Real connections. —
      </span>
      <h2 className="text-[clamp(1.75rem,2.6vw+1rem,2.4rem)] font-bold tracking-tight text-ink">
        How It <span className="text-primary">Works</span>
      </h2>

      <div className="mt-10 grid w-full grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
        {STEPS.map(({ icon: Icon, iconBg, title, description }, index) => (
          <div key={title} className="relative flex flex-col items-center gap-3 px-2">
            {index < STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute left-[calc(50%+2.75rem)] top-6 hidden h-px w-[calc(100%-5.5rem)] bg-border lg:block"
              />
            ) : null}
            <span className={`relative flex size-14 items-center justify-center rounded-full ${iconBg}`}>
              <Icon className="size-6 text-ink" aria-hidden="true" strokeWidth={1.75} />
              <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {index + 1}
              </span>
            </span>
            <h3 className="text-sm font-bold text-ink">{title}</h3>
            <p className="max-w-[15rem] text-sm leading-relaxed text-ink-secondary">{description}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
