import { VerificationStatus } from '@prisma/client';
import { IsIn, IsOptional } from 'class-validator';

/** The queue defaults to IN_REVIEW — the actionable set a reviewer needs to act on (see VerificationsService.listQueue). */
export class VerificationQueueQueryDto {
  @IsOptional()
  @IsIn(Object.values(VerificationStatus))
  status: VerificationStatus = 'IN_REVIEW';
}
