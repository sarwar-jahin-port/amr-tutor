/**
 * s3rver ships no types and is a devDependency (dev/test-only S3 emulator —
 * see StorageService), so this declares only the surface this project uses.
 */
declare module 's3rver' {
  export interface S3rverOptions {
    address?: string;
    port?: number;
    directory?: string;
    silent?: boolean;
    vhostBuckets?: boolean;
    resetOnClose?: boolean;
    configureBuckets?: { name: string; configs?: (string | Buffer)[] }[];
  }

  export default class S3rver {
    constructor(options?: S3rverOptions);
    run(): Promise<{ address: string; port: number; family: string }>;
    close(callback: (err?: unknown) => void): void;
  }
}
