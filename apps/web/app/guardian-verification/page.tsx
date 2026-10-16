'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Field, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import {
  createGuardianVerificationRequest,
  getGuardianEvidenceDownloadUrl,
  getMyGuardianVerifications,
  requestGuardianEvidenceUpload,
  submitGuardianVerification,
  uploadGuardianEvidenceFile,
} from '@/features/guardian-verifications/api';
import { formatFileSize, VERIFICATION_STATUS_BADGE, VERIFICATION_STATUS_LABEL } from '@/features/guardian-verifications/format';
import {
  ALLOWED_EVIDENCE_CONTENT_TYPES,
  MAX_EVIDENCE_FILE_SIZE_BYTES,
  type GuardianEvidenceType,
  type GuardianVerificationRequestDetail,
} from '@/features/guardian-verifications/types';
import { AuthedApiError } from '@/lib/authed-api';

const EVIDENCE_TYPE_OPTIONS: { value: GuardianEvidenceType; label: string }[] = [
  { value: 'NATIONAL_ID_CARD', label: 'National ID card' },
  { value: 'OTHER', label: 'Other government-issued ID' },
];
const ACTIVE_STATUSES = new Set(['PENDING', 'IN_REVIEW', 'NEEDS_INFORMATION']);
const EVIDENCE_UPLOAD_STATUSES = new Set(['PENDING', 'NEEDS_INFORMATION']);

function errorMessage(error: unknown): string {
  return error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
}

function EvidenceRow({ requestId, evidence }: { requestId: string; evidence: GuardianVerificationRequestDetail['evidence'][number] }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleView() {
    setIsLoading(true);
    try {
      const url = await getGuardianEvidenceDownloadUrl(requestId, evidence.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast({ title: "Couldn't open file", description: errorMessage(error), variant: 'danger' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-canvas px-3 py-2 text-sm">
      <span className="truncate text-ink">{evidence.originalFileName ?? evidence.type}</span>
      <div className="flex shrink-0 items-center gap-2 text-ink-secondary">
        <span>{formatFileSize(evidence.sizeBytes)}</span>
        <Button variant="tertiary" size="sm" isLoading={isLoading} onClick={() => void handleView()}>
          View
        </Button>
      </div>
    </div>
  );
}

function VerificationCard({
  request,
  onChanged,
}: {
  request: GuardianVerificationRequestDetail;
  onChanged: (updated: GuardianVerificationRequestDetail) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [evidenceType, setEvidenceType] = useState<GuardianEvidenceType>('NATIONAL_ID_CARD');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    if (!ALLOWED_EVIDENCE_CONTENT_TYPES.includes(file.type as (typeof ALLOWED_EVIDENCE_CONTENT_TYPES)[number])) {
      toast({ title: 'Unsupported file type', description: 'Upload a JPEG, PNG, WebP, or PDF file.', variant: 'danger' });
      return;
    }
    if (file.size > MAX_EVIDENCE_FILE_SIZE_BYTES) {
      toast({ title: 'File too large', description: 'Evidence files must be 10 MB or smaller.', variant: 'danger' });
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl } = await requestGuardianEvidenceUpload(request.id, {
        evidenceType,
        contentType: file.type,
        fileSizeBytes: file.size,
        originalFileName: file.name,
      });
      await uploadGuardianEvidenceFile(uploadUrl, file);
      onChanged({
        ...request,
        evidence: [
          ...request.evidence,
          {
            id: crypto.randomUUID(),
            type: evidenceType,
            originalFileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            uploadedAt: new Date().toISOString(),
          },
        ],
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast({ title: 'Evidence uploaded', variant: 'success' });
    } catch (error) {
      toast({ title: "Couldn't upload evidence", description: errorMessage(error), variant: 'danger' });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const updated = await submitGuardianVerification(request.id);
      onChanged(updated);
      toast({ title: 'Submitted for review', variant: 'success' });
    } catch (error) {
      toast({ title: "Couldn't submit", description: errorMessage(error), variant: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const canUploadEvidence = EVIDENCE_UPLOAD_STATUSES.has(request.status);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-ink">Identity verification</p>
        <Badge variant={VERIFICATION_STATUS_BADGE[request.status]}>{VERIFICATION_STATUS_LABEL[request.status]}</Badge>
      </div>

      {request.decisionReason && (request.status === 'NEEDS_INFORMATION' || request.status === 'REJECTED') && (
        <Alert variant={request.status === 'REJECTED' ? 'danger' : 'information'} title="Reviewer note">
          {request.decisionReason}
        </Alert>
      )}

      {request.evidence.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-ink">Evidence</p>
          {request.evidence.map((e) => (
            <EvidenceRow key={e.id} requestId={request.id} evidence={e} />
          ))}
        </div>
      )}

      {canUploadEvidence && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <Field>
            <FieldLabel htmlFor="evidence-type">Document type</FieldLabel>
            <Select value={evidenceType} onValueChange={(v) => setEvidenceType(v as GuardianEvidenceType)}>
              <SelectTrigger id="evidence-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVIDENCE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="evidence-file">File (JPEG, PNG, WebP, or PDF — up to 10 MB)</FieldLabel>
            <input
              id="evidence-file"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-soft-green file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
            />
          </Field>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" isLoading={isUploading} onClick={() => void handleUpload()}>
              Upload evidence
            </Button>
            <Button
              size="sm"
              isLoading={isSubmitting}
              disabled={request.evidence.length === 0}
              onClick={() => void handleSubmit()}
            >
              Submit for review
            </Button>
          </div>
        </div>
      )}

      {request.status === 'IN_REVIEW' && (
        <p className="text-sm text-ink-secondary">A reviewer will check your evidence soon.</p>
      )}
    </div>
  );
}

export default function GuardianVerificationPage() {
  const { status, user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<GuardianVerificationRequestDetail[] | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !user?.roles.includes('GUARDIAN')) return;
    let cancelled = false;
    getMyGuardianVerifications().then((rows) => {
      if (!cancelled) setRequests(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [status, user]);

  async function handleCreate() {
    setIsCreating(true);
    try {
      const created = await createGuardianVerificationRequest();
      setRequests((rows) => [created, ...(rows ?? [])]);
    } catch (error) {
      toast({ title: "Couldn't start verification", description: errorMessage(error), variant: 'danger' });
    } finally {
      setIsCreating(false);
    }
  }

  if (status === 'loading' || (status === 'authenticated' && user?.roles.includes('GUARDIAN') && requests === undefined)) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </Container>
      </>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <Container as="main" className="flex min-h-screen items-center justify-center">
        <p className="text-ink-secondary">Redirecting to log in…</p>
      </Container>
    );
  }

  if (!user.roles.includes('GUARDIAN')) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Identity verification</h1>
          <p className="text-ink-secondary">Only guardian accounts can request identity verification.</p>
        </Container>
      </>
    );
  }

  const hasActiveRequest = (requests ?? []).some((r) => ACTIVE_STATUSES.has(r.status));

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex flex-col gap-6 py-16">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Identity verification</h1>
          <p className="text-ink-secondary">
            Verification is optional. Confirming your identity with a government ID helps tutors trust your
            listings — it doesn&apos;t affect your ability to post or message tutors.
          </p>
        </div>

        {requests && requests.length > 0 && (
          <div className="flex flex-col gap-4">
            {requests.map((request) => (
              <VerificationCard
                key={request.id}
                request={request}
                onChanged={(updated) => setRequests((rows) => rows?.map((r) => (r.id === updated.id ? updated : r)))}
              />
            ))}
          </div>
        )}

        {!hasActiveRequest && (
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-surface p-5">
            <p className="font-semibold text-ink">Request verification</p>
            <Button variant="secondary" size="sm" className="self-start" isLoading={isCreating} onClick={() => void handleCreate()}>
              Start identity verification
            </Button>
          </div>
        )}
      </Container>
    </>
  );
}
