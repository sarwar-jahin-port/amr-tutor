'use client';

import { BadgeCheck, Clock, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  getCertificateDownloadUrl,
  requestCertificateUpload,
  uploadCertificateFile,
} from '@/features/tutor-profile/education-api';
import {
  ALLOWED_CERTIFICATE_CONTENT_TYPES,
  MAX_CERTIFICATE_FILE_SIZE_BYTES,
  type EducationRecord,
} from '@/features/tutor-profile/education-types';
import { AuthedApiError } from '@/lib/authed-api';

function errorMessage(error: unknown): string {
  if (error instanceof AuthedApiError || error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

/**
 * The certificate upload + verified/pending badge for one education record.
 * Shared by the SSC/HSC and University sections. `record` may be undefined
 * when the institution/GPA fields haven't been saved yet — in that case
 * `ensureRecord` (required whenever `record` is undefined) is called on
 * Upload to silently save whatever is currently typed first, so a tutor
 * doesn't have to click the page's main Save button before they can attach
 * a certificate.
 */
export function CertificateUploader({
  record,
  onChanged,
  ensureRecord,
  label = 'Certificate',
}: {
  record: EducationRecord | undefined;
  onChanged: (updated: EducationRecord) => void;
  ensureRecord?: () => Promise<EducationRecord>;
  /** Overrides the "Certificate" wording — e.g. "Certificate or student ID" for the University section, which can't rely on a certificate alone the way SSC/HSC can. */
  label?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    if (!ALLOWED_CERTIFICATE_CONTENT_TYPES.includes(file.type as (typeof ALLOWED_CERTIFICATE_CONTENT_TYPES)[number])) {
      toast({ title: 'Unsupported file type', description: 'Upload a JPEG, PNG, WebP, or PDF file.', variant: 'danger' });
      return;
    }
    if (file.size > MAX_CERTIFICATE_FILE_SIZE_BYTES) {
      toast({ title: 'File too large', description: 'Certificates must be 10 MB or smaller.', variant: 'danger' });
      return;
    }

    setIsUploading(true);
    try {
      let activeRecord = record;
      if (!activeRecord) {
        if (!ensureRecord) return;
        activeRecord = await ensureRecord();
        onChanged(activeRecord);
      }

      const { uploadUrl } = await requestCertificateUpload(activeRecord.level, {
        contentType: file.type,
        fileSizeBytes: file.size,
        originalFileName: file.name,
      });
      await uploadCertificateFile(uploadUrl, file);
      onChanged({ ...activeRecord, hasCertificate: true, certificateFileName: file.name, isVerified: false });
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast({ title: `${label} uploaded`, description: "It's private until an admin reviews it.", variant: 'success' });
    } catch (error) {
      toast({ title: `Couldn't upload ${label.toLowerCase()}`, description: errorMessage(error), variant: 'danger' });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleView() {
    if (!record) return;
    setIsViewing(true);
    try {
      const url = await getCertificateDownloadUrl(record.level);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast({ title: "Couldn't open file", description: errorMessage(error), variant: 'danger' });
    } finally {
      setIsViewing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">{label} (optional)</p>
        {record?.hasCertificate &&
          (record.isVerified ? (
            <Badge variant="success">
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              Verified
            </Badge>
          ) : (
            <Badge variant="neutral">
              <Clock className="size-3.5" aria-hidden="true" />
              Pending review
            </Badge>
          ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="max-w-full text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-soft-green file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
        />
        <Button type="button" variant="secondary" size="sm" isLoading={isUploading} onClick={() => void handleUpload()}>
          <Upload className="size-4" aria-hidden="true" />
          {record?.hasCertificate ? 'Replace' : 'Upload'}
        </Button>
        {record?.hasCertificate && (
          <Button type="button" variant="tertiary" size="sm" isLoading={isViewing} onClick={() => void handleView()}>
            View
          </Button>
        )}
      </div>
    </div>
  );
}
