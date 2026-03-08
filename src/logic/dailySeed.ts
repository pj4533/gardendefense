const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

const TZ = 'America/New_York';

/** Returns the current date parts in Eastern time. */
function easternDateParts(): { year: number; month: number; day: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find(p => p.type === 'year')!.value);
  const month = Number(parts.find(p => p.type === 'month')!.value);
  const day = Number(parts.find(p => p.type === 'day')!.value);
  return { year, month, day };
}

/** Returns YYYYMMDD as an integer in Eastern time, e.g. 20260307. */
export function getDailySeed(): number {
  const { year, month, day } = easternDateParts();
  return year * 10000 + month * 100 + day;
}

/** Returns a short label like "MAR 07" in Eastern time. */
export function getDailySeedLabel(): string {
  const { month, day } = easternDateParts();
  return `${MONTH_NAMES[month - 1]} ${String(day).padStart(2, '0')}`;
}
