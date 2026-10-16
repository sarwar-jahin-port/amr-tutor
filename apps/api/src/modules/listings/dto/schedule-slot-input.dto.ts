import { IsIn, IsOptional, Matches } from 'class-validator';
import { Weekday } from '@prisma/client';

const WEEKDAYS = Object.values(Weekday);
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * A day can be listed with just a weekday ("available Tuesdays") or with a
 * specific time range — ListingSchedule.startMinute/endMinute are optional
 * columns for exactly this reason. Format is checked here; the "both or
 * neither" rule is a cross-field check, done in the service (the same
 * place salary-range and fee-range cross-field checks already live).
 */
export class ScheduleSlotInputDto {
  @IsIn(WEEKDAYS)
  day!: Weekday;

  @IsOptional()
  @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm format' })
  startTime?: string;

  @IsOptional()
  @Matches(TIME_PATTERN, { message: 'endTime must be in HH:mm format' })
  endTime?: string;
}
