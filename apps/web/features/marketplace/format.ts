/** Displays a BDT salary range per docs/ui-ux.md §5: "৳ 4,000–৳ 6,000 / month". */
export function formatSalaryRange(min: number | null, max: number | null, currency = 'BDT'): string {
  const symbol = currency === 'BDT' ? '৳' : currency;
  const format = (n: number) => `${symbol} ${n.toLocaleString('en-US')}`;

  if (min !== null && max !== null) return `${format(min)}–${format(max)} / month`;
  if (min !== null) return `From ${format(min)} / month`;
  if (max !== null) return `Up to ${format(max)} / month`;
  return 'Budget not specified';
}

export const TEACHING_MODE_LABEL: Record<string, string> = {
  HOME: "At the student's home",
  ONLINE: 'Online',
  BOTH: "At home or online",
};

export const WEEKDAY_LABEL: Record<string, string> = {
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
};

export function formatMinutes(minutes: number): string {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`;
}
