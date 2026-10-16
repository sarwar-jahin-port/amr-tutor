import { Transform } from 'class-transformer';
import { Role, UserStatus } from '@prisma/client';
import { IsArray, IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { SearchQueryDto } from '../../../common/dto/pagination-query.dto';

const SORT_FIELDS = ['createdAt', 'email'] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;
export type AdminUserSortField = (typeof SORT_FIELDS)[number];
export type AdminUserSortOrder = (typeof SORT_ORDERS)[number];

function toArray({ value }: { value: unknown }): unknown {
  if (value === undefined) return value;
  return Array.isArray(value) ? value : [value];
}

export class AdminUserSearchQueryDto extends SearchQueryDto {
  /** Any of the given roles matches (OR) — repeat `role=` or pass a comma-free array via query string. */
  @IsOptional()
  @IsArray()
  @IsIn(Object.values(Role), { each: true })
  @Transform(toArray)
  role?: Role[];

  @IsOptional()
  @IsArray()
  @IsIn(Object.values(UserStatus), { each: true })
  @Transform(toArray)
  status?: UserStatus[];

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: AdminUserSortField;

  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: AdminUserSortOrder;
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
