import Link from 'next/link';
import { Annotation } from '@/components/annotation';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';

export function AudienceSections() {
  return (
    <div className="border-b border-border">
      <Container className="grid grid-cols-1 lg:grid-cols-2">
        {/* For tutors */}
        <section className="flex flex-col gap-6 py-16 lg:border-r lg:border-border lg:pr-12">
          <span className="text-xs font-bold uppercase tracking-wide text-primary">
            ✳ For Tutors
          </span>
          <h2 className="text-[clamp(1.6rem,2.4vw+1rem,2.1rem)] font-bold leading-[1.15] tracking-tight text-ink">
            Find the right <span className="text-primary">tuition opportunities</span> without the
            hassle.
          </h2>
          <p className="max-w-md text-base leading-relaxed text-ink-secondary">
            Create your profile, verify your credentials, and apply to listings that match your
            skills, schedule and location.
          </p>
          <div>
            <Button asChild className="rounded-full px-6">
              <Link href="/register">Start as a Tutor →</Link>
            </Button>
          </div>

          <div className="mt-4 max-w-sm">
            <ImagePlaceholder
              alt="A university student tutor, with a panel noting university student status, subject expertise, and verification status"
              src="/images/tutor1.png"
              aspectRatio="754 / 750"
            />
          </div>
        </section>

        {/* For parents and guardians */}
        <section className="flex flex-col gap-6 py-16 lg:pl-12">
          <span className="text-xs font-bold uppercase tracking-wide text-primary">
            ✳ For Parents &amp; Guardians
          </span>
          <h2 className="text-[clamp(1.6rem,2.4vw+1rem,2.1rem)] font-bold leading-[1.15] tracking-tight text-ink">
            Find the <span className="text-primary">perfect tutor</span> for your child {' '}
            <span className="text-primary">directly</span>.
          </h2>
          <p className="max-w-md text-base leading-relaxed text-ink-secondary">
            Post your tuition requirements, review applicants, compare profiles, and connect with
            the right tutor. No agents. No hassle.
          </p>
          <div>
            <Button asChild className="rounded-full px-6">
              <Link href="/register">Post a Tuition Need →</Link>
            </Button>
          </div>

          <div className="relative mt-4 ml-auto w-full max-w-sm">
            <ImagePlaceholder
              alt="A father helping his son study at home on a laptop"
              src="/images/guardian1.png"
              aspectRatio="1339 / 1175"
            />
            <Annotation rotate="rotate-2" className="absolute -top-10 right-0 text-lg">
              Better learning
              <br />
              starts with the
              <br />
              right connection.
            </Annotation>
          </div>
        </section>
      </Container>
    </div>
  );
}
