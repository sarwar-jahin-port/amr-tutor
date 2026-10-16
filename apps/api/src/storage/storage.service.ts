import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { EvidenceStorageMode } from '../config/env.validation';

const UPLOAD_URL_TTL_SECONDS = 300;
const DOWNLOAD_URL_TTL_SECONDS = 300;

// Only used in 'local-emulator' mode; loopback-only, so these don't need to
// be configurable the way the real S3 endpoint is. Port 0 lets the OS pick
// a free port — a fixed port would collide the moment more than one
// process runs this module at once (e.g. Jest's parallel e2e workers, each
// booting its own full Nest app). The directory is likewise namespaced per
// process so concurrent workers don't share (and corrupt) the same
// s3rver-managed files on disk.
const EMULATOR_DIRECTORY = `.data/evidence-storage/${process.env.NODE_ENV ?? 'local'}-${process.pid}`;
const EMULATOR_CREDENTIALS = { accessKeyId: 'S3RVER', secretAccessKey: 'S3RVER' };
const LOCAL_EMULATOR_CORS_CONFIG = `<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <MaxAgeSeconds>3000</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>`;

export interface ObjectMetadata {
  contentType: string | undefined;
  contentLength: number | undefined;
}

/**
 * Thin wrapper around the S3 API for verification-evidence storage
 * (blueprint Phase 10 / TRD §7.1: private object storage, random object
 * keys, short-lived signed URLs — never the application filesystem or a
 * client-supplied public URL). In 'local-emulator' mode this talks to an
 * in-process S3-compatible server (s3rver) instead of a real bucket, so
 * running this project doesn't require provisioning external storage —
 * every other line of code is identical to the 's3' (production) path.
 */
@Injectable()
export class StorageService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StorageService.name);
  private client!: S3Client;
  private bucket!: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emulator: any;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const mode = this.config.getOrThrow<EvidenceStorageMode>('EVIDENCE_STORAGE_MODE');
    this.bucket = this.config.getOrThrow<string>('EVIDENCE_S3_BUCKET');

    if (mode === 'local-emulator') {
      await this.startEmulator();
      return;
    }

    this.client = new S3Client({
      region: this.config.getOrThrow<string>('EVIDENCE_S3_REGION'),
      endpoint: this.config.getOrThrow<string>('EVIDENCE_S3_ENDPOINT'),
      forcePathStyle: this.config.get<boolean>('EVIDENCE_S3_FORCE_PATH_STYLE') ?? true,
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('EVIDENCE_S3_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('EVIDENCE_S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.client?.destroy();
    if (this.emulator) {
      await new Promise<void>((resolve) => this.emulator.close(() => resolve()));
    }
  }

  /** `prefix` groups objects per verification request without being guessable (random UUID, not the request id alone). */
  generateObjectKey(prefix: string, originalFileName: string | undefined): string {
    const extension = this.safeExtension(originalFileName);
    return `${prefix}/${randomUUID()}${extension}`;
  }

  async generateUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
    return getSignedUrl(this.client, command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
  }

  async generateDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
  }

  /** Null if the object was never actually uploaded — a presigned URL being issued doesn't guarantee the client used it. */
  async headObject(key: string): Promise<ObjectMetadata | null> {
    try {
      const result = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { contentType: result.ContentType, contentLength: result.ContentLength };
    } catch (error) {
      if (error instanceof NotFound) return null;
      throw error;
    }
  }

  /** Reads only the first `maxBytes` — enough for a magic-byte signature check without downloading the whole file. */
  async readLeadingBytes(key: string, maxBytes: number): Promise<Buffer> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key, Range: `bytes=0-${maxBytes - 1}` }),
    );
    const bytes = await result.Body?.transformToByteArray();
    return Buffer.from(bytes ?? []);
  }

  private safeExtension(originalFileName: string | undefined): string {
    if (!originalFileName) return '';
    const match = /\.[a-zA-Z0-9]{1,8}$/.exec(originalFileName);
    return match ? match[0].toLowerCase() : '';
  }

  private async startEmulator(): Promise<void> {
    // Dynamic import keeps s3rver (a devDependency) out of the production
    // bundle's module graph — this branch never runs when EVIDENCE_STORAGE_MODE=s3.
    const { default: S3rver } = await import('s3rver');
    this.emulator = new S3rver({
      address: '127.0.0.1',
      port: 0,
      directory: EMULATOR_DIRECTORY,
      silent: true,
      vhostBuckets: false,
      // The browser PUTs/GETs evidence directly against this bucket using
      // the signed URLs below, so it needs CORS allowed — permissive here
      // is fine since this only ever binds to loopback in dev/test. A real
      // S3-compatible bucket in 's3' mode needs its own CORS policy set by
      // infra, which this code doesn't (and shouldn't) configure.
      configureBuckets: [{ name: this.bucket, configs: [LOCAL_EMULATOR_CORS_CONFIG] }],
    });
    const { port } = await this.emulator.run();
    this.logger.log(`Local evidence-storage emulator listening on 127.0.0.1:${port} (bucket: ${this.bucket})`);

    this.client = new S3Client({
      region: 'us-east-1',
      endpoint: `http://127.0.0.1:${port}`,
      forcePathStyle: true,
      credentials: EMULATOR_CREDENTIALS,
    });

    // configureBuckets above usually covers this, but a stale data
    // directory from a previous run (bucket already on disk, Node restarted)
    // takes a different startup path in s3rver that can skip it — make
    // bucket creation idempotent here too rather than depend on that.
    try {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    } catch {
      // Already exists — fine.
    }
  }
}
