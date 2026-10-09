import { Role, UserStatus } from '@prisma/client';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { SearchQueryDto } from '../../../common/dto/pagination-query.dto';

export class AdminUserSearchQueryDto extends SearchQueryDto {
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role;

  @IsOptional()
  @IsIn(Object.values(UserStatus))
  status?: UserStatus;
}

export class UpdateUserStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED'] as const)
  status!: 'ACTIVE' | 'SUSPENDED';

  /** Required for SUSPENDED (checked in the service). */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
