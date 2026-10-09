import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export const EVIDENCE_STORAGE_MODES = ['local-emulator', 's3'] as const;
export type EvidenceStorageMode = (typeof EVIDENCE_STORAGE_MODES)[number];

class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  API_PREFIX!: string;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_ACCESS_SECRET must be at least 32 characters' })
  JWT_ACCESS_SECRET!: string;

  @IsInt()
  @Min(60)
  ACCESS_TOKEN_TTL_SECONDS!: number;

  @IsInt()
  @Min(1)
  REFRESH_TOKEN_TTL_DAYS!: number;

  /**
   * 'local-emulator' runs an in-process S3-compatible server for dev/test
   * (no external object-storage dependency needed to run this project);
   * 's3' talks to a real S3-compatible endpoint (AWS S3, DigitalOcean
   * Spaces, MinIO, ...). Same S3Client/StorageService code path either way
   * — blueprint Phase 10 / TRD §7.1.
   */
  @IsIn(EVIDENCE_STORAGE_MODES)
  EVIDENCE_STORAGE_MODE!: EvidenceStorageMode;

  @IsString()
  @IsNotEmpty()
  EVIDENCE_S3_BUCKET!: string;

  @IsString()
  @IsNotEmpty()
  EVIDENCE_S3_REGION!: string;

  // Required only in 's3' mode — see the cross-field check in validateEnv.
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  EVIDENCE_S3_ENDPOINT?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  EVIDENCE_S3_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  EVIDENCE_S3_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsBoolean()
  EVIDENCE_S3_FORCE_PATH_STYLE: boolean = true;
}

/**
 * Fails startup with a clear error instead of running with missing/invalid
 * configuration (blueprint Phase 1 + Phase 3: "validate all environment
 * configuration at startup").
 */
export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${messages}`);
  }

  if (validated.EVIDENCE_STORAGE_MODE === 's3') {
    const missing = (['EVIDENCE_S3_ENDPOINT', 'EVIDENCE_S3_ACCESS_KEY_ID', 'EVIDENCE_S3_SECRET_ACCESS_KEY'] as const)
      .filter((key) => !validated[key]);
    if (missing.length > 0) {
      throw new Error(
        `Invalid environment configuration: ${missing.join(', ')} are required when EVIDENCE_STORAGE_MODE=s3`,
      );
    }
  }

  return validated;
}
