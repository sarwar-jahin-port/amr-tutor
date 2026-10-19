'use client';

import { Camera } from 'lucide-react';
import { useRef, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { requestProfilePhotoUpload, uploadProfilePhotoFile } from '@/features/tutor-profile/api';
import { AuthedApiError } from '@/lib/authed-api';

const ALLOWED_PHOTO_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function errorMessage(error: unknown): string {
  return error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
}

/** Shown once a tutor profile exists (the upload endpoint needs a profile to attach the photo to). */
export function ProfilePhotoUpload({
  fullName,
  photoUrl,
  onUploaded,
}: {
  fullName: string;
  photoUrl: string | null;
  onUploaded: (previewUrl: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(file: File | undefined) {
    if (!file) return;

    if (!ALLOWED_PHOTO_CONTENT_TYPES.includes(file.type)) {
      toast({ title: 'Unsupported file type', description: 'Upload a JPEG, PNG, or WebP image.', variant: 'danger' });
      return;
    }
    if (file.size > MAX_PHOTO_FILE_SIZE_BYTES) {
      toast({ title: 'File too large', description: 'Profile photos must be 5 MB or smaller.', variant: 'danger' });
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl } = await requestProfilePhotoUpload({
        contentType: file.type,
        fileSizeBytes: file.size,
        originalFileName: file.name,
      });
      await uploadProfilePhotoFile(uploadUrl, file);
      onUploaded(URL.createObjectURL(file));
      toast({ title: 'Profile photo updated', variant: 'success' });
    } catch (error) {
      toast({ title: "Couldn't upload photo", description: errorMessage(error), variant: 'danger' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar name={fullName} photoUrl={photoUrl} className="size-20 text-xl" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label="Upload profile photo"
          className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-elevated transition-colors duration-fast hover:bg-soft-green disabled:pointer-events-none disabled:opacity-50"
        >
          <Camera className="size-4" aria-hidden="true" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => void handleFileChange(e.target.files?.[0])}
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-ink">Profile photo</p>
        <p className="text-sm text-ink-secondary">JPEG, PNG, or WebP — up to 5 MB.</p>
      </div>
    </div>
  );
}
