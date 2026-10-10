import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, Matches, ValidateNested } from 'class-validator';
import { Weekday } from '@prisma/client';

const WEEKDAYS = Object.values(Weekday);
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class AvailabilitySlotInputDto {
  @IsIn(WEEKDAYS)
  day!: Weekday;

  /** Strict 24-hour "HH:mm", Bangladesh Standard Time (docs/api_spec.md §4). */
  @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm format' })
  startTime!: string;

  @Matches(TIME_PATTERN, { message: 'endTime must be in HH:mm format' })
  endTime!: string;
}

/** Stage D "Availability" (ui-ux.md §14). A complete replacement list, not a diff. */
export class ReplaceAvailabilityDto {
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotInputDto)
  slots!: AvailabilitySlotInputDto[];
}
