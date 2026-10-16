'use client';

import { BookOpen } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox, CheckboxLabel } from '@/components/ui/checkbox';
import { Container } from '@/components/ui/container';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorSummary } from '@/components/ui/error-summary';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { FilterChip } from '@/components/ui/filter-chip';
import { Input, PasswordInput, PhoneInput } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { RadioGroup, RadioGroupItem, RadioGroupLabel } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

const palette = [
  { name: 'Canvas', token: 'bg-canvas', textOn: 'text-ink' },
  { name: 'Surface', token: 'bg-surface', textOn: 'text-ink' },
  { name: 'Ink', token: 'bg-ink', textOn: 'text-white' },
  { name: 'Secondary ink', token: 'bg-ink-secondary', textOn: 'text-white' },
  { name: 'Primary', token: 'bg-primary', textOn: 'text-white' },
  { name: 'Primary hover', token: 'bg-primary-hover', textOn: 'text-white' },
  { name: 'Soft green', token: 'bg-soft-green', textOn: 'text-ink' },
  { name: 'Border', token: 'bg-border', textOn: 'text-ink' },
  { name: 'Warm accent', token: 'bg-warm-accent', textOn: 'text-ink' },
  { name: 'Danger', token: 'bg-danger', textOn: 'text-white' },
  { name: 'Danger surface', token: 'bg-danger-surface', textOn: 'text-ink' },
  { name: 'Success', token: 'bg-success', textOn: 'text-white' },
  { name: 'Information', token: 'bg-information', textOn: 'text-white' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-border py-10 first:pt-0 last:border-none">
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export default function StyleGuidePage() {
  const [page, setPage] = useState(1);
  const [chipSelected, setChipSelected] = useState(true);
  const [showErrors, setShowErrors] = useState(false);

  return (
    <Container as="main" className="py-10">
      <header className="mb-10 flex flex-col gap-2">
        <p className="text-sm font-medium text-ink-secondary">Phase 4 — Design system and UI foundation</p>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">The Learning Commons</h1>
        <p className="max-w-2xl text-ink-secondary">
          Internal reference for every token and component defined in docs/ui-ux.md and
          docs/master_implementation_blueprint.md §10. Not linked from product navigation.
        </p>
      </header>

      <Section title="Color">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {palette.map((c) => (
            <div key={c.name} className="rounded-xl border border-border overflow-hidden">
              <div className={`flex h-16 items-end p-2 ${c.token} ${c.textOn}`}>
                <span className="text-xs font-medium">{c.name}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <p className="text-5xl font-semibold text-ink">Display heading</p>
        <p className="text-4xl font-semibold text-ink">Page heading</p>
        <p className="text-2xl font-semibold text-ink">Section heading</p>
        <p className="text-lg font-semibold text-ink">Card heading</p>
        <p className="text-base text-ink">
          Body text — Good teaching starts with the right connection. Find a home tutor or discover
          tuition opportunities.
        </p>
        <p className="text-sm text-ink-secondary">Supporting text — explains a field or a secondary detail.</p>
        <p className="text-[13px] font-medium text-ink-secondary">Small metadata · 3 days/week · Dhaka</p>
        <p className="text-2xl font-semibold text-ink" lang="bn">
          বাংলা টেক্সট — এই প্ল্যাটফর্ম বাংলাদেশের অভিভাবক ও শিক্ষকদের সংযুক্ত করে।
        </p>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary action</Button>
          <Button variant="secondary">Secondary action</Button>
          <Button variant="tertiary">Tertiary action</Button>
          <Button variant="destructive">Delete listing</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button isLoading>Submitting…</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Form fields">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="sg-text" required>
              Email address
            </FieldLabel>
            <Input id="sg-text" type="email" placeholder="you@example.com" />
            <FieldDescription>We&apos;ll never share this with anyone else.</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="sg-text-error" required>
              Email address
            </FieldLabel>
            <Input id="sg-text-error" type="email" defaultValue="not-an-email" aria-invalid aria-describedby="sg-text-error-msg" />
            <FieldError id="sg-text-error-msg">Enter a valid email address.</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="sg-password">Password</FieldLabel>
            <PasswordInput id="sg-password" autoComplete="new-password" />
          </Field>

          <Field>
            <FieldLabel htmlFor="sg-phone">Phone number</FieldLabel>
            <PhoneInput id="sg-phone" />
          </Field>

          <Field>
            <FieldLabel htmlFor="sg-select">Preferred area</FieldLabel>
            <Select>
              <SelectTrigger id="sg-select">
                <SelectValue placeholder="Select an area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dhanmondi">Dhanmondi</SelectItem>
                <SelectItem value="gulshan">Gulshan</SelectItem>
                <SelectItem value="mirpur">Mirpur</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="sg-textarea">Additional requirements</FieldLabel>
            <Textarea id="sg-textarea" placeholder="Anything else the tutor should know?" />
          </Field>

          <Field>
            <FieldLabel>Disabled field</FieldLabel>
            <Input disabled value="Cannot be edited right now" readOnly />
          </Field>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Checkbox id="sg-checkbox" defaultChecked />
            <CheckboxLabel htmlFor="sg-checkbox">I am a tutor</CheckboxLabel>
          </div>
          <RadioGroup defaultValue="tutor" className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <RadioGroupItem id="sg-radio-tutor" value="tutor" />
              <RadioGroupLabel htmlFor="sg-radio-tutor">Tutor</RadioGroupLabel>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="sg-radio-guardian" value="guardian" />
              <RadioGroupLabel htmlFor="sg-radio-guardian">Guardian</RadioGroupLabel>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Button variant="secondary" onClick={() => setShowErrors((v) => !v)}>
            Toggle error summary
          </Button>
          <div className="mt-4">
            <ErrorSummary
              errors={
                showErrors
                  ? [
                      { fieldId: 'sg-text-error', message: 'Enter a valid email address.' },
                      { fieldId: 'sg-phone', message: 'Enter a valid Bangladesh mobile number.' },
                    ]
                  : []
              }
            />
          </div>
        </div>
      </Section>

      <Section title="Overlays">
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw application?</DialogTitle>
                <DialogDescription>
                  You can apply again later, but the parent will no longer see this application.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="secondary">Cancel</Button>
                <Button variant="destructive">Withdraw</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Open filter sheet</Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle>Filters</SheetTitle>
              <p className="mt-4 text-sm text-ink-secondary">
                Full-height mobile filter sheet per docs/ui-ux.md §6.
              </p>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">Open menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit profile</DropdownMenuItem>
              <DropdownMenuItem>Share link</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>Delete account</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="secondary"
            onClick={() =>
              toast({ title: 'Tuition published', description: 'Your listing is now available to tutors.', variant: 'success' })
            }
          >
            Show success toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast({ title: "We couldn't load this page", description: 'Your internet connection may be interrupted.', variant: 'danger' })}
          >
            Show error toast
          </Button>
        </div>
      </Section>

      <Section title="Feedback & status">
        <div className="flex flex-col gap-3">
          <Alert variant="default" title="Heads up">
            Password reset is not available yet; contact support if you&apos;re locked out.
          </Alert>
          <Alert variant="success" title="Tuition published">
            Your listing is now available to tutors.
          </Alert>
          <Alert variant="danger" title="We couldn't load this page">
            Your internet connection may be interrupted. Try again.
          </Alert>
          <Alert variant="information" title="Verification pending">
            We&apos;re reviewing your university ID. This usually takes 1-2 business days.
          </Alert>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral">Draft</Badge>
          <Badge variant="success">Verified</Badge>
          <Badge variant="information">Pending</Badge>
          <Badge variant="warning">Expiring soon</Badge>
          <Badge variant="danger">Rejected</Badge>
        </div>

        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="h-24 w-full max-w-md" />
        </div>

        <EmptyState
          icon={BookOpen}
          title="No matching tuition found"
          description="Try a nearby area, adjust the budget, or remove a filter."
          action={<Button variant="secondary">Clear filters</Button>}
        />
      </Section>

      <Section title="Search, filters & pagination">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip selected={chipSelected} onClick={() => setChipSelected((v) => !v)}>
            Mathematics
          </FilterChip>
          <FilterChip onRemove={() => {}}>Dhanmondi</FilterChip>
          <FilterChip>Class 9</FilterChip>
        </div>

        <Pagination page={page} totalPages={12} onPageChange={setPage} />
      </Section>

      <Section title="Motion">
        <p className="text-sm text-ink-secondary">
          Overlays animate in over ~{200}ms via the <code>animate-content-show</code> /{' '}
          <code>animate-sheet-right</code> utilities, and every transition collapses to near-zero
          under <code>prefers-reduced-motion: reduce</code> (see app/globals.css).
        </p>
        <Button isLoading>Loading state uses the same spinner token everywhere</Button>
      </Section>
    </Container>
  );
}
