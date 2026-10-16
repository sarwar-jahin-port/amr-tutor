import { Ban, Lock, ShieldCheck, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { Container } from '@/components/ui/container';

interface ValueProposition {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false'; strokeWidth?: number }>;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}

const VALUE_PROPOSITIONS: ValueProposition[] = [
  {
    icon: Ban,
    iconBg: 'bg-mint',
    iconColor: 'text-primary',
    title: 'No Commission',
    description: 'Keep 100% of your earnings. No placement fees.',
  },
  {
    icon: ShieldCheck,
    iconBg: 'bg-aqua',
    iconColor: 'text-[#1d6b78]',
    title: 'Verified Profiles',
    description: 'University affiliation reviewed where verification is available.',
  },
  {
    icon: Users,
    iconBg: 'bg-butter',
    iconColor: 'text-[#8a6a1f]',
    title: 'Direct Communication',
    description: 'Talk and decide on your own terms.',
  },
  {
    icon: Lock,
    iconBg: 'bg-coral',
    iconColor: 'text-[#a24a3a]',
    title: 'Your Privacy Matters',
    description: 'Personal information is private by default.',
  },
];

export function ValuePropositionStrip() {
  return (
    <div className="border-y border-border">
      <Container className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {VALUE_PROPOSITIONS.map(({ icon: Icon, iconBg, iconColor, title, description }) => (
          <div key={title} className="flex flex-col gap-3">
            <span className={`flex size-11 items-center justify-center rounded-full ${iconBg}`}>
              <Icon className={`size-5 ${iconColor}`} aria-hidden="true" strokeWidth={1.75} />
            </span>
            <h3 className="text-base font-bold text-ink">{title}</h3>
            <p className="text-sm leading-relaxed text-ink-secondary">{description}</p>
          </div>
        ))}
      </Container>
    </div>
  );
}
