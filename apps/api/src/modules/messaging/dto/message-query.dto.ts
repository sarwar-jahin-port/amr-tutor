import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

/**
 * Reverse-cursor pagination for message history (blueprint Phase 9:
 * "cursor-based message retrieval" / "do not fetch an unlimited
 * conversation history in one request"). Omitting `before` returns the
 * most recent page; passing the previous page's `meta.nextCursor` walks
 * further back in time.
 */
export class MessageQueryDto {
  @IsOptional()
  @IsUUID()
  before?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 30;
}
