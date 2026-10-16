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
  createVerificationRequest,
  getEvidenceDownloadUrl,
  getMyVerifications,
  requestEvidenceUpload,
  submitVerification,
  uploadEvidenceFile,
} from '@/features/verifications/api';
import { formatFileSize, VERIFICATION_STATUS_BADGE, VERIFICATION_STATUS_LABEL, VERIFICATION_TYPE_LABEL } from '@/features/verifications/format';
import {
  ALLOWED_EVIDENCE_CONTENT_TYPES,
  MAX_EVIDENCE_FILE_SIZE_BYTES,
  type EvidenceType,
  type VerificationRequestDetail,
  type VerificationType,
} from '@/features/verifications/types';
import { AuthedApiError } from '@/lib/authed-api';

const VERIFICATION_TYPES: VerificationType[] = ['UNIVERSITY_AFFILIATION', 'ACADEMIC_CREDENTIAL'];
const EVIDENCE_TYPE_OPTIONS: { value: EvidenceType; label: string }[] = [
  { value: 'STUDENT_ID', label: 'Student ID card' },
  { value: 'UNIVERSITY_DOCUMENT', label: 'University document (enrollment letter, etc.)' },
  { value: 'ACADEMIC_TRANSCRIPT', label: 'Academic transcript' },
  { value: 'OTHER', label: 'Other' },
];
const ACTIVE_STATUSES = new Set(['PENDING', 'IN_REVIEW', 'NEEDS_INFORMATION']);
const EVIDENCE_UPLOAD_STATUSES = new Set(['PENDING', 'NEEDS_INFORMATION']);

function errorMessage(error: unknown): string {
  return error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
}

function EvidenceRow({ requestId, evidence }: { requestId: string; evidence: VerificationRequestDetail['evidence'][number] }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleView() {
    setIsLoading(true);
    try {
      const url = await getEvidenceDownloadUrl(requestId, evidence.id);
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
  request: VerificationRequestDetail;
  onChanged: (updated: VerificationRequestDetail) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('STUDENT_ID');
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
      const { uploadUrl } = await requestEvidenceUpload(request.id, {
        evidenceType,
        contentType: file.type,
        fileSizeBytes: file.size,
        originalFileName: file.name,
      });
      await uploadEvidenceFile(uploadUrl, file);
      onChanged({ ...request, evidence: [...request.evidence, { id: crypto.randomUUID(), type: evidenceType, originalFileName: file.name, mimeType: file.type, sizeBytes: file.size, uploadedAt: new Date().toISOString() }] });
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
      const updated = await submitVerification(request.id);
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
        <p className="font-semibold text-ink">{VERIFICATION_TYPE_LABEL[request.type]}</p>
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
            <Select value={evidenceType} onValueChange={(v) => setEvidenceType(v as EvidenceType)}>
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

export default function VerificationPage() {
  const { status, user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<VerificationRequestDetail[] | undefined>(undefined);
  const [isCreating, setIsCreating] = useState<VerificationType | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !user?.roles.includes('TUTOR')) return;
    let cancelled = false;
    getMyVerifications().then((rows) => {
      if (!cancelled) setRequests(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [status, user]);

  async function handleCreate(type: VerificationType) {
    setIsCreating(type);
    try {
      const created = await createVerificationRequest(type);
      setRequests((rows) => [created, ...(rows ?? [])]);
    } catch (error) {
      toast({ title: "Couldn't start verification", description: errorMessage(error), variant: 'danger' });
    } finally {
      setIsCreating(null);
    }
  }

  if (status === 'loading' || (status === 'authenticated' && user?.roles.includes('TUTOR') && requests === undefined)) {
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

  if (!user.roles.includes('TUTOR')) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Verification</h1>
          <p className="text-ink-secondary">Only tutor accounts can request verification.</p>
        </Container>
      </>
    );
  }

  const activeTypes = new Set((requests ?? []).filter((r) => ACTIVE_STATUSES.has(r.status)).map((r) => r.type));
  const availableTypes = VERIFICATION_TYPES.filter((t) => !activeTypes.has(t));

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex flex-col gap-6 py-16">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Verification</h1>
          <p className="text-ink-secondary">
            Verification is optional. Confirming your university affiliation adds a verified badge to
            your public profile — it doesn&apos;t affect your ability to apply or message guardians.
          </p>
        </div>

        {requests && requests.length > 0 && (
          <div className="flex flex-col gap-4">
            {requests.map((request) => (
              <VerificationCard
                key={request.id}
                request={request}
                onChanged={(updated) =>
                  setRequests((rows) => rows?.map((r) => (r.id === updated.id ? updated : r)))
                }
              />
            ))}
          </div>
        )}

        {availableTypes.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-surface p-5">
            <p className="font-semibold text-ink">Request verification</p>
            <div className="flex flex-wrap gap-2">
              {availableTypes.map((type) => (
                <Button
                  key={type}
                  variant="secondary"
                  size="sm"
                  isLoading={isCreating === type}
                  onClick={() => void handleCreate(type)}
                >
                  {VERIFICATION_TYPE_LABEL[type]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
