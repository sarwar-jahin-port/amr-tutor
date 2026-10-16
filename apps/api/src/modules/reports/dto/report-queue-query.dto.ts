import { ReportStatus } from '@prisma/client';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ReportQueueQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(ReportStatus))
  status?: ReportStatus;
}
