import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AdminStatsQueryDto {
  /** Trend window in days; also defines the "this period vs. last period" comparison. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(180)
  days: number = 30;
}
